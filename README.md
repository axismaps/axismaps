# Axis Maps

A modern Next.js portfolio and blog website for Axis Maps, ported from Webflow.

## Project Overview

This project is a complete port of the Axis Maps website from Webflow to a modern Next.js application, featuring:

- **54 imported projects** with comprehensive metadata and MDX content
- **Blog system** with MDX support and dynamic rendering
- **Responsive design** using Tailwind CSS v4
- **SEO optimized** with sitemap, robots, and JSON-LD schema
- **Performance monitoring** via Vercel Analytics & Speed Insights

## Tech Stack

- **Next.js 15** (canary) with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** (alpha) for styling
- **MDX** for content management
- **Vitest** for testing
- **pnpm** as package manager

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd axismaps

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

Visit `http://localhost:3000` to see the application.

## Development Commands

### Core Commands

```bash
pnpm run dev        # Start development server
pnpm run build      # Build for production
pnpm start          # Run production server
```

### Testing

```bash
pnpm test           # Run tests in watch mode
pnpm test:run       # Run tests once (CI)
pnpm test:coverage  # Generate coverage report
pnpm test:ui        # Interactive test UI
```

### Data Import

```bash
node scripts/import-projects.js  # Import projects from Webflow CSV
```

## Project Structure

```
/app
  /blog             # Blog functionality
    /posts          # MDX blog posts
  /projects         # Projects portfolio
    /posts          # MDX project files (54 projects)
    /[slug]         # Dynamic project pages
  /components       # Shared React components
  /guide            # Guide pages
  /about            # About page
  /contact          # Contact page
/data               # JSON data files
  clients.json      # Client metadata
  categories.json   # Category metadata
/public/images      # Static assets
/scripts            # Utility scripts
/webflow-cms        # Source data from Webflow
/axismaps.webflow   # Original Webflow export
```

## Porting Progress

### Completed Pages
- ✅ **Home** - Partially complete with hero, recent projects
- ✅ **Projects** - Fully functional with 54 imported projects
- ✅ **Blog** - Working with MDX support
- ✅ **Guide** - Basic structure in place

### Pending
- ⏳ **About** - To be ported from Webflow
- ⏳ **Contact** - To be ported from Webflow
- ⏳ Additional project detail refinements

## Content Management

### Projects

Projects are stored as MDX files in `/app/projects/posts/` with frontmatter:

```mdx
---
title: "Project Title"
slug: "project-slug"
publishedAt: "2024-01-01"
featured: true
subtitle: "Project subtitle"
teaser: "Brief description"
coverImage: "/images/projects/cover.jpg"
client: "Client Name"
category: "Category"
videoUrl: "https://..."
mapUrl: "https://..."
---
```

### Blog Posts

Blog posts use MDX in `/app/blog/posts/` with YAML frontmatter:

```mdx
---
title: "Post Title"
publishedAt: "2024-01-01"
summary: "Post summary"
image: "/images/blog/post.jpg"
---
```

## Testing

The project uses Vitest with React Testing Library. Tests are co-located with components and run automatically via GitHub Actions on push and pull requests.

### Running Tests

```bash
pnpm test:run      # Run all tests
pnpm test:coverage # Generate coverage report
```

### Test Coverage Goals

- 80%+ for utilities
- 70%+ for components
- 90%+ for critical logic

## Deployment

The application is configured for Vercel deployment with automatic CI/CD:

1. Push to `main` branch triggers deployment
2. Pull requests create preview deployments
3. Tests run automatically before deployment

