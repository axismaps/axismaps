# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## PROJECT GOAL

This project is porting the Axis Maps website from Webflow (located in `/axismaps.webflow/`) to a modern Next.js application.

## Commands

### Development

- `pnpm run dev` - Start the Next.js development server
- `pnpm run build` - Build the production application
- `pnpm start` - Run the production server after build

### Testing

- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once (for CI)
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm test:ui` - Run tests with interactive UI
- `pnpm test:watch` - Run tests in watch mode (alias for `pnpm test`)

### Data Import

- `node scripts/import-projects.js` - Import projects from Webflow CSV to MDX format

## Porting Instructions

### Source Content

The Webflow export is located in `/axismaps.webflow/` and contains:

- **Main Pages**: index.html (home), about.html, projects.html, blog.html, guide.html, contact.html
- **Detail Templates**: Various detail\_\*.html files (templates for dynamic content)
- **Assets**: /images/, /css/, /js/ directories with static assets
- **Additional**: 404.html, style-guide.html, more-projects.html

### Porting Strategy

1. **Analyze Webflow HTML** to extract content structure and styling
2. **Create Next.js pages** in `/app` directory matching the Webflow site structure
3. **Convert Webflow styles** to Tailwind CSS classes
4. **Extract reusable components** from repeated HTML patterns
5. **Migrate images** from `/axismaps.webflow/images/` to `/public/`
6. **Preserve SEO** metadata and Open Graph tags from original pages

### Key Pages Status

- **Home** (index.html) → app/page.tsx ✅ Partially complete
- **About** (about.html) → app/about/page.tsx ⏳ To be ported
- **Projects** (projects.html) → app/projects/page.tsx ✅ Complete with 54 projects
- **Blog** (blog.html) → app/blog/page.tsx ✅ Exists with sample posts
- **Guide** (guide.html) → app/guide/page.tsx ⏳ To be ported
- **Contact** (contact.html) → app/contact/page.tsx ⏳ To be ported

## Architecture Overview

This is a Next.js 14+ portfolio and blog starter template using the App Router architecture.

### Key Technologies

- **Next.js** (canary version) with App Router
- **TypeScript** with relaxed strict mode (`strict: false` but `strictNullChecks: true`)
- **Tailwind CSS v4** (alpha) for styling via PostCSS
- **MDX** for blog and project content with frontmatter parsing
  - `@next/mdx` for MDX configuration
  - `@mdx-js/mdx` for runtime MDX evaluation
  - `next-mdx-remote` for blog post rendering
- **Vercel Analytics & Speed Insights** for monitoring
- **pnpm** as package manager

### Project Structure

- `/app` - Next.js App Router directory
  - `/blog` - Blog functionality
    - `/posts` - MDX blog post files
    - `utils.ts` - MDX parsing and date formatting utilities
  - `/projects` - Projects portfolio section
    - `/posts` - MDX project files (54 imported from Webflow)
    - `/[slug]` - Dynamic project detail pages
    - `utils.ts` - Project parsing and filtering utilities
  - `/components` - Shared React components
    - `mdx.tsx` - Custom MDX components
  - `/og` - Open Graph image generation route
  - `/rss` - RSS feed generation route
- `/data` - JSON data files
  - `clients.json` - Client metadata
  - `categories.json` - Category metadata
- `/public/images/projects` - Project cover images
- `/scripts` - Utility scripts
  - `import-projects.js` - CSV to MDX converter
- `/webflow-cms` - Source CSV data from Webflow export

### Content Systems

#### Blog System

Blog posts are MDX files in `/app/blog/posts/` with YAML frontmatter:

- Required fields: `title`, `publishedAt`, `summary`
- Optional: `image`
- Posts are parsed using custom utilities in `app/blog/utils.ts`
- Rendered using `next-mdx-remote`

#### Projects System

Projects are MDX files in `/app/projects/posts/` with comprehensive frontmatter:

- Core fields: `title`, `slug`, `publishedAt`, `featured`
- Content fields: `subtitle`, `teaser`, `coverImage`
- Relationship fields: `client`, `clientSlug`, `category`, `categorySlug`
- External links: `videoUrl`, `mapUrl`, `githubUrl`, `launchDate`
- Projects imported from CSV using `scripts/import-projects.js`
- Rendered using `@mdx-js/mdx` evaluate function
- Related metadata stored in `/data/*.json` files

### Styling

Uses Tailwind CSS v4 alpha with PostCSS configuration. Global styles in `app/global.css`. The layout uses Geist font family for both sans and mono text.

### Deployment

Configured for Vercel deployment with built-in analytics and speed insights components.

## Testing Infrastructure

### Overview

The project uses **Vitest** as the testing framework with React Testing Library for component testing. Tests are configured to run automatically on push and pull requests via GitHub Actions.

### Test Structure

Tests are co-located with the code they test:
- `app/lib/*.test.ts` - Unit tests for utility functions
- `app/projects/*.test.ts(x)` - Tests for project-related code
- `app/api/*/route.test.ts` - API route tests
- `app/components/*.test.tsx` - Component tests

### Writing Tests

1. **Unit Tests**: Test pure functions and utilities
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { myFunction } from './myModule';

   describe('myFunction', () => {
     it('should do something', () => {
       expect(myFunction(input)).toBe(expected);
     });
   });
   ```

2. **Component Tests**: Test React components
   ```typescript
   import { render, screen } from '@testing-library/react';
   import userEvent from '@testing-library/user-event';
   import MyComponent from './MyComponent';

   it('should handle user interaction', async () => {
     const user = userEvent.setup();
     render(<MyComponent />);
     await user.click(screen.getByRole('button'));
     expect(screen.getByText('Result')).toBeInTheDocument();
   });
   ```

3. **API Tests**: Test Next.js API routes
   ```typescript
   import { POST } from './route';

   it('should handle POST request', async () => {
     const request = createMockRequest(data);
     const response = await POST(request);
     expect(response.status).toBe(200);
   });
   ```

### Coverage

Test coverage reports are generated in the `coverage/` directory. Aim for:
- **80%+ coverage** for utility functions
- **70%+ coverage** for components
- **90%+ coverage** for critical business logic

### CI/CD

Tests run automatically on:
- Every push to `main` branch
- All pull requests

The CI pipeline (`.github/workflows/test.yml`) runs:
1. Unit and integration tests
2. Coverage reporting
3. Linting
4. Build verification

### Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Keep tests isolated and independent**
4. **Mock external dependencies**
5. **Test edge cases and error conditions**
6. **Run tests before committing**: `pnpm test:run`
