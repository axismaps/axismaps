# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PROJECT GOAL
This project is porting the Axis Maps website from Webflow (located in `/axismaps.webflow/`) to a modern Next.js application.

## Commands

### Development
- `npm run dev` - Start the Next.js development server
- `npm run build` - Build the production application
- `npm start` - Run the production server after build

## Porting Instructions

### Source Content
The Webflow export is located in `/axismaps.webflow/` and contains:
- **Main Pages**: index.html (home), about.html, projects.html, blog.html, guide.html, contact.html
- **Detail Templates**: Various detail_*.html files (templates for dynamic content)
- **Assets**: /images/, /css/, /js/ directories with static assets
- **Additional**: 404.html, style-guide.html, more-projects.html

### Porting Strategy
1. **Analyze Webflow HTML** to extract content structure and styling
2. **Create Next.js pages** in `/app` directory matching the Webflow site structure
3. **Convert Webflow styles** to Tailwind CSS classes
4. **Extract reusable components** from repeated HTML patterns
5. **Migrate images** from `/axismaps.webflow/images/` to `/public/`
6. **Preserve SEO** metadata and Open Graph tags from original pages

### Key Pages to Port
- **Home** (index.html) → app/page.tsx
- **About** (about.html) → app/about/page.tsx
- **Projects** (projects.html) → app/projects/page.tsx
- **Blog** (blog.html) → app/blog/page.tsx (already exists, needs content update)
- **Guide** (guide.html) → app/guide/page.tsx
- **Contact** (contact.html) → app/contact/page.tsx

## Architecture Overview

This is a Next.js 14+ portfolio and blog starter template using the App Router architecture.

### Key Technologies
- **Next.js** (canary version) with App Router
- **TypeScript** with relaxed strict mode (`strict: false` but `strictNullChecks: true`)
- **Tailwind CSS v4** (alpha) for styling via PostCSS
- **MDX** for blog posts with frontmatter parsing
- **Vercel Analytics & Speed Insights** for monitoring

### Project Structure

- `/app` - Next.js App Router directory
  - `/blog` - Blog functionality
    - `/posts` - MDX blog post files
    - `utils.ts` - MDX parsing and date formatting utilities
  - `/components` - Shared React components
  - `/og` - Open Graph image generation route
  - `/rss` - RSS feed generation route

### Blog System

Blog posts are MDX files in `/app/blog/posts/` with YAML frontmatter:
- Required fields: `title`, `publishedAt`, `summary`
- Optional: `image`
- Posts are parsed using custom utilities in `app/blog/utils.ts`

### Styling

Uses Tailwind CSS v4 alpha with PostCSS configuration. Global styles in `app/global.css`. The layout uses Geist font family for both sans and mono text.

### Deployment

Configured for Vercel deployment with built-in analytics and speed insights components.