#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const matter = require('gray-matter');
const MiniSearch = require('minisearch');

const GUIDE_POSTS_DIR = path.join(process.cwd(), 'app', 'guide', 'posts');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'search');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'guide-index.json');

function stripMdx(content) {
  return content
    .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
    .replace(/export\s+default\s+.*;/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_~]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractHeadings(content) {
  const headingRegex = /^#{1,6}\s+(.+)$/gm;
  const headings = [];
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    headings.push(match[1]);
  }
  return headings;
}

async function buildSearchIndex() {
  try {
    const files = await fs.readdir(GUIDE_POSTS_DIR);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));

    const documents = [];

    for (const file of mdxFiles) {
      const filePath = path.join(GUIDE_POSTS_DIR, file);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const { data: frontmatter, content } = matter(fileContent);

      const headings = extractHeadings(content);
      const cleanContent = stripMdx(content);

      const contentWords = cleanContent.split(/\s+/).slice(0, 500).join(' ');

      documents.push({
        id: frontmatter.slug || path.basename(file, '.mdx'),
        title: frontmatter.title || '',
        slug: frontmatter.slug || path.basename(file, '.mdx'),
        category: frontmatter.category || '',
        categorySlug: frontmatter.categorySlug || '',
        summary: frontmatter.summary || '',
        content: contentWords,
        headings: headings.join(' '),
        order: frontmatter.order || 999,
        publishedAt: frontmatter.publishedAt || ''
      });
    }

    const miniSearch = new MiniSearch({
      fields: ['title', 'content', 'category', 'headings', 'summary'],
      storeFields: ['title', 'slug', 'category', 'categorySlug', 'summary', 'order', 'publishedAt'],
      searchOptions: {
        boost: { title: 3, headings: 2, category: 1.5 },
        fuzzy: 0.2,
        prefix: true
      }
    });

    miniSearch.addAll(documents);

    const searchIndex = {
      index: miniSearch.toJSON(),
      documents: documents.map(({ id, title, slug, category, categorySlug, summary, order, publishedAt, content }) => ({
        id,
        title,
        slug,
        category,
        categorySlug,
        summary,
        order,
        publishedAt,
        contentPreview: content.slice(0, 300)
      }))
    };

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(searchIndex));

    console.log(`✅ Search index built successfully!`);
    console.log(`   - Indexed ${documents.length} guide articles`);
    console.log(`   - Output: ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('❌ Error building search index:', error);
    process.exit(1);
  }
}

buildSearchIndex();