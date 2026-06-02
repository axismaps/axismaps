const fs = require('fs').promises;
const fsSync = require('fs');
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

// Drop <style>/<script> entirely — some posts embed an inline <style> block
// that would otherwise leak into the MDX as visible (escaped) CSS text.
turndownService.remove(['style', 'script', 'noscript']);

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

// Render <figure> contents with surrounding blank lines
turndownService.addRule('figure', {
  filter: 'figure',
  replacement: function(content) {
    return '\n\n' + content.trim() + '\n\n';
  }
});

// Render <figcaption> as an italic line
turndownService.addRule('figcaption', {
  filter: 'figcaption',
  replacement: function(content) {
    const text = content.trim();
    return text ? `\n\n*${text}*\n\n` : '';
  }
});

// True if a DOM node carries the given class
function hasClass(node, className) {
  const cls = node.getAttribute && node.getAttribute('class');
  return cls ? cls.split(/\s+/).includes(className) : false;
}

// Inline code: <span class="inline-code"> / <span class="code-inline">
turndownService.addRule('inlineCode', {
  filter: function(node) {
    return (
      node.nodeName === 'SPAN' &&
      (hasClass(node, 'inline-code') || hasClass(node, 'code-inline'))
    );
  },
  replacement: function(content, node) {
    // Use raw text, not turndown's escaped `content`, so backslash escapes
    // (e.g. `\-e`) don't leak into the code span.
    const text = (node.textContent || '').replace(/`/g, '').trim();
    return text ? '`' + text + '`' : '';
  }
});

// Block code: <div class="code-block"> uses <br> for line breaks and may nest
// <div class="code-block-indent">. Turndown has no native rule for it, so emit a
// fenced code block from the raw inner HTML (preserving line breaks).
turndownService.addRule('codeBlock', {
  filter: function(node) {
    return node.nodeName === 'DIV' && hasClass(node, 'code-block');
  },
  replacement: function(content, node) {
    let text = (node.innerHTML || node.textContent || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '') // strip nested tags (e.g. code-block-indent)
      .replace(/\u00a0/g, " "); // nbsp -> regular space
    text = decodeEntities(text)
      .replace(/[ \t]+\n/g, '\n') // trim trailing whitespace per line
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\n+/, '')
      .replace(/\s+$/, '');
    return '\n\n```\n' + text + '\n```\n\n';
  }
});

// File paths
const BLOGS_CSV = path.join(__dirname, '../webflow-cms/Axis Maps - Blogs.csv');
const TEAM_CSV = path.join(__dirname, '../webflow-cms/Axis Maps - Team Members.csv');
const POSTS_DIR = path.join(__dirname, '../app/blog/posts');
const IMAGES_DIR = path.join(__dirname, '../public/images/blog');

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

// Turn an author slug into a fallback display name
function humanize(slug) {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Helper function to format date to YYYY-MM-DD
function formatDate(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

// Make a value safe for the project's naive line-based frontmatter parser:
// single line, no embedded double-quotes (which would break quote stripping).
function sanitize(value) {
  if (!value) return '';
  return value
    .replace(/\s+/g, ' ')
    .replace(/"/g, "'")
    .trim();
}

// Decode a small set of HTML entities used in the summary text
function decodeEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Derive a ~200 char summary from the first paragraph of the HTML content
function deriveSummary(html) {
  const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const source = match ? match[1] : html;
  let text = decodeEntities(source.replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 200) return text;
  const truncated = text.slice(0, 200);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim() + '…';
}

// Collapse linked images onto a single line. Turndown renders <a href><img></a> with blank
// lines inside the link text (`[\n\n![](img)\n\n](url)`); a link whose text spans a paragraph
// break is invalid in CommonMark/MDX, so it renders literally. Rewrite to `[![](img)](url)`.
function collapseLinkedImages(markdown) {
  return markdown.replace(
    /\[\s*(!\[[^\]]*\]\([^)]*\))\s*\](\([^)]*\))/g,
    "[$1]$2",
  );
}

// Escape characters that MDX would otherwise parse as JSX (`<`) or expressions (`{`/`}`).
// These appear in old code snippets (CSS rules, `${vars}`, `<placeholder>` syntax) that the
// source HTML never wrapped in <pre>/<code>, so turndown left them as plain text. We leave
// fenced code blocks and inline code spans untouched (MDX already treats those literally).
function escapeMdx(markdown) {
  const fenceParts = markdown.split(/(```[\s\S]*?```)/g);
  return fenceParts
    .map((part, fenceIdx) => {
      if (fenceIdx % 2 === 1) return part; // fenced code block — leave as-is
      const codeParts = part.split(/(`[^`]*`)/g);
      return codeParts
        .map((seg, codeIdx) => {
          if (codeIdx % 2 === 1) return seg; // inline code span — leave as-is
          return seg
            .replace(/\{/g, "\\{")
            .replace(/\}/g, "\\}")
            .replace(/</g, "\\<");
        })
        .join("");
    })
    .join("");
}

// Download an image to destDir; returns the public path (returnPrefix + filename) or null on failure
async function downloadImage(url, destDir, returnPrefix, baseName) {
  if (!url || !url.startsWith('http')) return null;

  try {
    const response = await axios({ method: 'GET', url, responseType: 'stream' });

    const extension = path.extname(new URL(url).pathname) || '.jpg';
    const finalFilename = `${baseName}${extension}`;
    const filePath = path.join(destDir, finalFilename);

    await fs.mkdir(destDir, { recursive: true });
    const writer = fsSync.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`${returnPrefix}/${finalFilename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`  ⚠️  Failed to download image ${url}: ${error.message}`);
    return null;
  }
}

// Download all inline body images and rewrite their URLs to local paths in the HTML
async function localizeInlineImages(html, slug) {
  // Handle quoted ("..."/'...') and unquoted (src=https://...) attributes —
  // some Webflow posts emit bare unquoted src values.
  const regex = /<img[^>]+src=(?:"([^"]+)"|'([^']+)'|([^\s">]+))/gi;
  const urls = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    const url = m[1] || m[2] || m[3];
    if (url && url.startsWith('http') && !urls.includes(url)) {
      urls.push(url);
    }
  }

  if (urls.length === 0) return html;

  const destDir = path.join(IMAGES_DIR, slug);
  let rewritten = html;
  let index = 0;

  for (const url of urls) {
    index++;
    const localPath = await downloadImage(
      url,
      destDir,
      `/images/blog/${slug}`,
      String(index)
    );
    if (localPath) {
      // Webflow URLs are unique literals, so global replace is safe
      rewritten = rewritten.split(url).join(localPath);
    }
  }

  return rewritten;
}

// Main import function
async function importBlogs() {
  try {
    // Wipe output dirs so re-runs are reproducible and never leave orphaned
    // posts or images behind (e.g. when slugs or image indexing change).
    await fs.rm(POSTS_DIR, { recursive: true, force: true });
    await fs.rm(IMAGES_DIR, { recursive: true, force: true });
    await fs.mkdir(POSTS_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });

    console.log('Reading CSV files...');
    const posts = await readCSV(BLOGS_CSV);
    const team = await readCSV(TEAM_CSV);

    // Build author slug -> display name map
    const authorMap = {};
    team.forEach((member) => {
      if (member.Slug) authorMap[member.Slug] = member.Name;
    });

    console.log(`Processing ${posts.length} blog posts...`);

    let processedCount = 0;
    let skippedCount = 0;

    for (const post of posts) {
      // Skip archived or draft posts
      if (post.Archived === 'true' || post.Draft === 'true') {
        skippedCount++;
        continue;
      }

      const slug = post.Slug || cleanSlug(post.Title);
      console.log(`Processing: ${post.Title} (${slug})`);

      const publishedAt =
        formatDate(post['Publish Date']) ||
        formatDate(post['Published On']) ||
        formatDate(post['Created On']);

      const authorSlug = post.Author || '';
      const authorName = authorMap[authorSlug] || (authorSlug ? humanize(authorSlug) : '');

      // Download cover image
      let coverImagePath = null;
      if (post['Cover Image']) {
        coverImagePath = await downloadImage(
          post['Cover Image'],
          IMAGES_DIR,
          '/images/blog',
          `${slug}-cover`
        );
      }

      // Localize inline images, then convert HTML -> Markdown
      let body = '';
      let summary = '';
      if (post.Content) {
        const cleanedHTML = post.Content
          .replace(/<p><\/p>/g, '')
          .replace(/<p>\s*<\/p>/g, '')
          .trim();
        summary = deriveSummary(cleanedHTML);
        const localizedHTML = await localizeInlineImages(cleanedHTML, slug);
        body = escapeMdx(
          collapseLinkedImages(turndownService.turndown(localizedHTML)),
        );
      }

      // Build frontmatter from only the present fields (single-line, quote-safe)
      const fm = [];
      fm.push(`title: "${sanitize(post.Title)}"`);
      fm.push(`slug: "${slug}"`);
      fm.push(`publishedAt: "${publishedAt}"`);
      if (authorSlug) fm.push(`author: "${authorSlug}"`);
      if (authorName) fm.push(`authorName: "${sanitize(authorName)}"`);
      if (summary) fm.push(`summary: "${sanitize(summary)}"`);
      if (coverImagePath) fm.push(`coverImage: "${coverImagePath}"`);
      if (post.Category) {
        fm.push(`category: "${sanitize(post.Category)}"`);
        fm.push(`categorySlug: "${cleanSlug(post.Category)}"`);
      }

      const mdxContent = `---\n${fm.join('\n')}\n---\n\n${body}\n`;

      const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
      await fs.writeFile(mdxPath, mdxContent);

      processedCount++;
    }

    console.log(`\n✅ Import complete!`);
    console.log(`   - Processed: ${processedCount} posts`);
    console.log(`   - Skipped: ${skippedCount} posts (archived/draft)`);
    console.log(`   - Posts written to: ${POSTS_DIR}`);
    console.log(`   - Images saved to: ${IMAGES_DIR}`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

importBlogs();
