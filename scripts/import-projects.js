const fs = require('fs').promises;
const path = require('path');
const { parse } = require('csv-parse/sync');
const TurndownService = require('turndown');
const axios = require('axios');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  hr: '---',
  bulletListMarker: '-'
});

// Remove wrapper p tags if content is already wrapped
turndownService.addRule('removeWrapperParagraphs', {
  filter: function(node) {
    return node.nodeName === 'P' &&
           node.parentNode &&
           node.parentNode.childNodes.length === 1;
  },
  replacement: function(content) {
    return content + '\n\n';
  }
});

// File paths
const PROJECTS_CSV = path.join(__dirname, '../webflow-cms/Axis Maps - Projects.csv');
const CLIENTS_CSV = path.join(__dirname, '../webflow-cms/Axis Maps - Clients.csv');
const CATEGORIES_CSV = path.join(__dirname, '../webflow-cms/Axis Maps - Categories.csv');
const PROJECTS_DIR = path.join(__dirname, '../app/projects/posts');
const IMAGES_DIR = path.join(__dirname, '../public/images/projects');
const DATA_DIR = path.join(__dirname, '../data');

// Helper function to read and parse CSV
async function readCSV(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true
  });
}

// Helper function to clean slug
function cleanSlug(slug) {
  return slug.toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

// Helper function to download image
async function downloadImage(url, filename) {
  if (!url || !url.startsWith('http')) return null;

  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    const extension = path.extname(new URL(url).pathname) || '.jpg';
    const finalFilename = filename.replace(/\.[^/.]+$/, '') + extension;
    const filePath = path.join(IMAGES_DIR, finalFilename);

    const writer = require('fs').createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/images/projects/${finalFilename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Failed to download image ${url}:`, error.message);
    return null;
  }
}

// Main import function
async function importProjects() {
  try {
    // Create necessary directories
    await fs.mkdir(PROJECTS_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.mkdir(DATA_DIR, { recursive: true });

    console.log('Reading CSV files...');

    // Read all CSV files
    const projects = await readCSV(PROJECTS_CSV);
    const clients = await readCSV(CLIENTS_CSV);
    const categories = await readCSV(CATEGORIES_CSV);

    // Create lookup maps
    const clientsMap = {};
    const categoriesMap = {};

    clients.forEach(client => {
      clientsMap[client.Slug] = {
        name: client.Name,
        slug: client.Slug,
        logo: client.Logo,
        shortName: client['Short Name'] || client.Name
      };
    });

    categories.forEach(category => {
      categoriesMap[category.Slug] = {
        name: category.Name,
        slug: category.Slug
      };
    });

    // Save client and category data as JSON
    await fs.writeFile(
      path.join(DATA_DIR, 'clients.json'),
      JSON.stringify(clientsMap, null, 2)
    );

    await fs.writeFile(
      path.join(DATA_DIR, 'categories.json'),
      JSON.stringify(categoriesMap, null, 2)
    );

    console.log(`Processing ${projects.length} projects...`);

    // Process each project
    let processedCount = 0;
    let skippedCount = 0;

    for (const project of projects) {
      // Skip archived or draft projects
      if (project.Archived === 'true' || project.Draft === 'true') {
        skippedCount++;
        continue;
      }

      const slug = project.Slug || cleanSlug(project.Name);
      console.log(`Processing: ${project.Name} (${slug})`);

      // Get client and category info
      const client = clientsMap[project.Client] || null;
      const category = categoriesMap[project.Category] || null;

      // Download cover image if exists
      let coverImagePath = null;
      if (project['Cover Image']) {
        coverImagePath = await downloadImage(
          project['Cover Image'],
          `${slug}-cover`
        );
      }

      // Convert HTML description to Markdown
      let description = '';
      if (project.Description) {
        // Clean up the HTML first
        const cleanedHTML = project.Description
          .replace(/<p><\/p>/g, '') // Remove empty paragraphs
          .replace(/<p>\s*<\/p>/g, '') // Remove paragraphs with only whitespace
          .trim();
        description = turndownService.turndown(cleanedHTML);
      }

      // Process caption separately if it exists
      let caption = '';
      if (project.Caption) {
        const cleanedCaption = project.Caption
          .replace(/<p><\/p>/g, '')
          .replace(/<p>\s*<\/p>/g, '')
          .trim();
        caption = turndownService.turndown(cleanedCaption);
      }

      // Prepare MDX content
      const mdxContent = `---
title: "${project.Name}"
slug: "${slug}"
publishedAt: "${formatDate(project['Published On']) || formatDate(project['Created On'])}"
featured: ${project.Featured === 'true'}
${project.Subtitle ? `subtitle: "${project.Subtitle}"` : ''}
${project.Teaser ? `teaser: "${project.Teaser}"` : ''}
${client ? `client: "${client.name}"
clientSlug: "${client.slug}"` : ''}
${category ? `category: "${category.name}"
categorySlug: "${category.slug}"` : ''}
${coverImagePath ? `coverImage: "${coverImagePath}"` : ''}
${project['Video URL'] ? `videoUrl: "${project['Video URL']}"` : ''}
${project['Map URL'] ? `mapUrl: "${project['Map URL']}"` : ''}
${project['Github URL'] ? `githubUrl: "${project['Github URL']}"` : ''}
${project['Project Launch'] ? `launchDate: "${formatDate(project['Project Launch'])}"` : ''}
---

${description}

${caption ? `## Project Details\n\n${caption}` : ''}
`;

      // Clean up the MDX content (remove empty lines in frontmatter)
      const cleanedMDX = mdxContent.replace(/\n\n+/g, '\n').replace(/---\n+/g, '---\n');

      // Write MDX file
      const mdxPath = path.join(PROJECTS_DIR, `${slug}.mdx`);
      await fs.writeFile(mdxPath, cleanedMDX);

      processedCount++;
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   - Processed: ${processedCount} projects`);
    console.log(`   - Skipped: ${skippedCount} projects (archived/draft)`);
    console.log(`   - Client data saved to: ${path.join(DATA_DIR, 'clients.json')}`);
    console.log(`   - Category data saved to: ${path.join(DATA_DIR, 'categories.json')}`);

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importProjects();