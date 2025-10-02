# Axis Maps

A modern Next.js portfolio and blog website for Axis Maps.

## Project Overview

A modern Next.js portfolio and blog website for Axis Maps, featuring:

- **61 projects** with comprehensive metadata and MDX content
- **24 cartography guide articles** with full-text search
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
- **pnpm 8+** (required - do not use npm or yarn)

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd axismaps

# Install pnpm if you don't have it
npm install -g pnpm

# Install dependencies (MUST use pnpm)
pnpm install

# Start development server
pnpm run dev
```

Visit `http://localhost:3000` to see the application.

### Important: Use pnpm Only

This project uses `pnpm` as its package manager. **Always use `pnpm` commands**, never `npm` or `yarn`:

- ✅ `pnpm install` - Install dependencies
- ✅ `pnpm add <package>` - Add a dependency
- ✅ `pnpm add -D <package>` - Add a dev dependency
- ❌ `npm install` - Do not use
- ❌ `yarn add` - Do not use

## Development Commands

### Core Commands

```bash
pnpm run dev        # Start development server
pnpm run build      # Build for production (includes search index)
pnpm start          # Run production server
pnpm run lint       # Run ESLint
```

### Testing

```bash
pnpm test           # Run tests in watch mode
pnpm test:run       # Run tests once (CI)
pnpm test:coverage  # Generate coverage report
pnpm test:ui        # Interactive test UI
```

## Project Structure

```
/app
  /blog             # Blog functionality
    /posts          # MDX blog posts
  /projects         # Projects portfolio
    /posts          # MDX project files (61 projects)
    /[slug]         # Dynamic project pages
  /guide            # Cartography guide
    /posts          # Guide articles (24 articles)
    /[slug]         # Dynamic guide pages
  /about            # About page
  /contact          # Contact page with form
  /components       # Shared React components
  /api              # API routes (contact form)
/data               # JSON data files
  clients.json      # Client metadata
  categories.json   # Category metadata
/public/images      # Static assets
/bin                # Build scripts (search index generation)
```

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

### Guide Articles

Guide articles are in `/app/guide/posts/` and are indexed for full-text search. The search index is built automatically during the production build process.

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

