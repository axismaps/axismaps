# GitHub Copilot Instructions

This file provides guidance for GitHub Copilot when working with the Axis Maps Next.js repository.

## Project Context

This is a modern Next.js 15 portfolio and blog website for Axis Maps, ported from Webflow. The project features:

- **54 imported projects** with comprehensive metadata and MDX content
- **Cartography guide** with 24 indexed articles
- **Blog system** with MDX support
- **Responsive design** using Tailwind CSS v4
- **Full test coverage** with Vitest
- **Performance monitoring** via Vercel Analytics

## Architecture Guidelines

### Framework & Structure
- **Next.js 15** (canary) with App Router architecture
- **TypeScript** with relaxed strict mode (`strict: false` but `strictNullChecks: true`)
- **File-based routing** in `/app` directory
- **Server and Client Components** - use "use client" directive only when necessary

### Content Management
- **MDX files** for blog posts (`/app/blog/posts/`) and projects (`/app/projects/posts/`)
- **Frontmatter** with YAML metadata for all content
- **Dynamic imports** using `@mdx-js/mdx` evaluate function for runtime rendering
- **Static metadata** in JSON files (`/data/clients.json`, `/data/categories.json`)

### Styling
- **Tailwind CSS v4** (alpha) via PostCSS - use utility classes
- **Global styles** in `app/global.css` for prose content and custom components
- **Responsive design** - mobile-first approach
- **Design system** - use existing component patterns from `/app/components/`

## Development Patterns

### Component Structure
- **Page components** in `/app/[route]/page.tsx`
- **Shared components** in `/app/components/`
- **Client components** for interactive features (search, forms)
- **Server components** for data fetching and static content

### Data Fetching
- **Utility functions** in `utils.ts` files for content parsing
- **Static generation** - prefer `generateStaticParams` for dynamic routes
- **MDX parsing** using `gray-matter` for frontmatter
- **Search indexing** via MiniSearch for guide content

### Testing
- **Vitest** for unit and integration tests
- **Test files** co-located with source code (`.test.ts/.test.tsx`)
- **Test setup** in `/test/setup.ts`
- **Coverage** for utilities, API routes, and components

## Code Style & Conventions

### TypeScript
- Use interfaces for component props and data structures
- Prefer type inference where possible
- Use `any` sparingly and only when necessary for MDX/dynamic content

### File Naming
- **Kebab-case** for directories and static files
- **PascalCase** for React components
- **camelCase** for utility functions and variables
- **Lowercase** for MDX content files

### Import Organization
```typescript
// 1. React and Next.js imports
import React from 'react'
import Link from 'next/link'

// 2. Third-party libraries
import { evaluate } from '@mdx-js/mdx'

// 3. Internal utilities and components
import { getProjects } from './utils'
import PageSection from '../components/page-section'

// 4. Types (if separate file)
import type { Project } from './types'
```

## Content Guidelines

### MDX Files
- **Required frontmatter** fields: `title`, `publishedAt`, `summary`
- **Consistent formatting** with YAML frontmatter at the top
- **Relative image paths** for project covers and content images
- **External links** with proper `target="_blank"` and `rel` attributes

### SEO & Metadata
- **Dynamic metadata** using `generateMetadata` function
- **Open Graph** images via `/app/og/route.tsx`
- **Structured data** for projects and blog posts
- **Sitemap** generation for all content

## Performance Considerations

### Image Optimization
- Use Next.js `Image` component for all images
- **Responsive images** with appropriate sizes
- **Static imports** for images when possible
- **Alt text** for accessibility

### Build Optimization
- **Static generation** for all possible routes
- **Bundle analysis** - avoid large client-side dependencies
- **Code splitting** - use dynamic imports for heavy components
- **Search indexing** as build step (not runtime)

## Testing Guidelines

### Unit Tests
- **Pure functions** - test utilities and helpers
- **Component behavior** - test props and rendering
- **API routes** - test request/response handling
- **Edge cases** - test error conditions and empty states

### Test Structure
```typescript
// Arrange, Act, Assert pattern
describe('ComponentName', () => {
  test('should render correctly', () => {
    // Arrange
    const props = { title: 'Test' }
    
    // Act
    const result = render(<Component {...props} />)
    
    // Assert
    expect(result).toBeDefined()
  })
})
```

## Common Patterns

### Dynamic Routes
```typescript
export async function generateStaticParams() {
  const items = getItems()
  return items.map(item => ({ slug: item.slug }))
}

export async function generateMetadata({ params }) {
  const item = getItemBySlug(params.slug)
  return {
    title: item.title,
    description: item.summary
  }
}
```

### MDX Rendering
```typescript
const { default: MDXContent } = await evaluate(content, {
  ...(runtime as any),
  development: false,
  baseUrl: import.meta.url,
})

return <MDXContent />
```

### Search Implementation
- **Build-time indexing** for static content
- **Client-side search** using MiniSearch
- **Debounced input** for performance
- **Keyboard navigation** for accessibility

## Build & Deployment

### Scripts
- `pnpm run dev` - Development server
- `pnpm run build` - Production build (includes search index)
- `pnpm run build:search` - Build search index only
- `pnpm run test` - Run test suite
- `pnpm run lint` - ESLint checking

### Environment Variables
- **RESEND_API_KEY** for contact form functionality
- **Optional** email configuration for contact form

### Vercel Deployment
- **Build command**: `pnpm run build`
- **Node version**: 18+
- **Environment variables** configured in Vercel dashboard
- **Analytics** and **Speed Insights** enabled

## Troubleshooting

### Common Issues
- **Build failures** - usually missing environment variables
- **MDX errors** - check frontmatter syntax and file encoding
- **Search not working** - ensure search index is built
- **TypeScript errors** - check MDX types and dynamic imports

### Debug Tools
- **Next.js build analysis** with `ANALYZE=true`
- **Test coverage** with `pnpm run test -- --coverage`
- **Development logs** for API routes and data fetching