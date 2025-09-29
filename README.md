# Axis Maps Website

The Axis Maps company website built with Next.js. This site showcases our portfolio of data-driven cartography and interactive mapping projects.

## About Axis Maps

Axis Maps brings cartography to interactive mapping. We design custom maps that combine intuitive user interfaces with great cartographic and interactive design.

## Features

- **Project Portfolio**: 54+ interactive mapping projects with detailed case studies
- **Blog**: Technical articles and project insights
- **Interactive Guide**: Comprehensive cartography and web mapping resources
- **Contact System**: Client inquiry form with email notifications
- **SEO Optimized**: Sitemap, robots.txt, JSON-LD schema, and Open Graph tags
- **RSS Feed**: Automatic generation for blog posts
- **Dynamic OG Images**: Auto-generated social media preview images

## Technology Stack

- **Next.js 14+** with App Router architecture
- **TypeScript** with relaxed strict mode
- **Tailwind CSS v4** (alpha) for styling
- **MDX** for blog and project content with frontmatter
- **Vercel Analytics & Speed Insights** for monitoring
- **Geist Font** for typography

## Development

### Prerequisites

- Node.js 18+ 
- pnpm package manager

### Getting Started

1. **Clone the repository**

```bash
git clone https://github.com/axismaps/axismaps.git
cd axismaps
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.local.example` to `.env.local` and configure:

```bash
cp .env.local.example .env.local
```

Required environment variables:
- `RESEND_API_KEY` - For contact form email functionality

4. **Run the development server**

```bash
pnpm run dev
```

5. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000) to see the website.

### Available Scripts

- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production (includes search index generation)
- `pnpm run start` - Start production server
- `pnpm run lint` - Run ESLint
- `node scripts/import-projects.js` - Import projects from Webflow CSV data

## Project Structure

This website is being ported from Webflow to Next.js. Key directories:

- `/app` - Next.js App Router pages and components
  - `/projects` - Portfolio project pages (54 imported projects)  
  - `/blog` - Blog posts and functionality
  - `/guide` - Interactive mapping guide and resources
  - `/about` - Company information and team details
  - `/contact` - Contact form and company details
- `/data` - JSON metadata for clients and categories
- `/scripts` - Utility scripts for data import and processing
- `/public` - Static assets including project images
- `/webflow-cms` - Source CSV data from original Webflow export

## Content Management

### Projects

Projects are stored as MDX files in `/app/projects/posts/` with comprehensive frontmatter including client information, categories, external links, and launch dates. Projects can be imported from Webflow CSV data using the import script.

### Blog Posts  

Blog posts are MDX files in `/app/blog/posts/` with YAML frontmatter. Posts support embedded components and syntax highlighting.

### Guide Content

The guide section contains interactive resources for cartography and web mapping, with a searchable index built during the build process.

## Deployment

The site is configured for deployment on Vercel with automatic builds and analytics integration. The build process includes:

1. Search index generation for guide content
2. Static site generation for all pages
3. Optimization of images and assets
