import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsClient from './ProjectsClient';

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: any) => (
    <img src={src} alt={alt} className={className} />
  ),
}));

describe('ProjectsClient', () => {
  const mockFeaturedProjects = [
    {
      slug: 'featured-1',
      metadata: {
        title: 'Featured Project 1',
        slug: 'featured-1',
        publishedAt: '2024-01-01',
        featured: true,
        subtitle: 'A great featured project',
        teaser: 'This is a featured teaser',
        category: 'Web Development',
        categorySlug: 'web-dev',
        coverImage: '/images/featured-1.jpg',
      },
      content: 'Featured content 1',
    },
    {
      slug: 'featured-2',
      metadata: {
        title: 'Featured Project 2',
        slug: 'featured-2',
        publishedAt: '2024-01-02',
        featured: true,
        category: 'Mobile',
        categorySlug: 'mobile',
        coverImage: '/images/featured-2.jpg',
      },
      content: 'Featured content 2',
    },
  ];

  const mockAllProjects = [
    ...mockFeaturedProjects,
    {
      slug: 'regular-1',
      metadata: {
        title: 'Regular Project 1',
        slug: 'regular-1',
        publishedAt: '2024-01-03',
        featured: false,
        category: 'Web Development',
        categorySlug: 'web-dev',
        coverImage: '/images/regular-1.jpg',
      },
      content: 'Regular content 1',
    },
    {
      slug: 'regular-2',
      metadata: {
        title: 'Regular Project 2',
        slug: 'regular-2',
        publishedAt: '2024-01-04',
        featured: false,
        category: 'Data Visualization',
        categorySlug: 'data-viz',
      },
      content: 'Regular content 2',
    },
  ];

  const mockCategories = [
    { name: 'Web Development', slug: 'web-dev' },
    { name: 'Mobile', slug: 'mobile' },
    { name: 'Data Visualization', slug: 'data-viz' },
  ];

  describe('Featured Projects Section', () => {
    it('should display featured projects by default', () => {
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Featured Project 1')).toBeInTheDocument();
      expect(screen.getByText('Featured Project 2')).toBeInTheDocument();
    });

    it('should display teaser when available', () => {
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      // Only teaser is displayed, not subtitle
      expect(screen.getByText('This is a featured teaser')).toBeInTheDocument();
    });

    it('should render project images', () => {
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      const image1 = screen.getByAltText('Featured Project 1');
      expect(image1).toBeInTheDocument();
      expect(image1).toHaveAttribute('src', '/images/featured-1.jpg');
    });

    it('should show placeholder when no cover image', () => {
      const projectsWithoutImages = [
        {
          ...mockFeaturedProjects[0],
          metadata: { ...mockFeaturedProjects[0].metadata, coverImage: undefined },
        },
      ];

      render(
        <ProjectsClient
          featuredProjects={projectsWithoutImages}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      // Should show the project but without image
      expect(screen.getByText('Featured Project 1')).toBeInTheDocument();
    });
  });

  describe('All Projects Section', () => {
    it('should not show all projects section initially', () => {
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      expect(screen.queryByText('Regular Project 1')).not.toBeInTheDocument();
    });

    it('should show all projects when "Show All Projects" is clicked', async () => {
      const user = userEvent.setup();
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      const viewAllButton = screen.getByRole('button', { name: /Show All Projects/i });
      await user.click(viewAllButton);

      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Regular Project 1')).toBeInTheDocument();
      expect(screen.getByText('Regular Project 2')).toBeInTheDocument();
    });

    it('should hide the show all button once all projects are shown', async () => {
      const user = userEvent.setup();
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      const toggleButton = screen.getByRole('button', { name: /Show All Projects/i });
      expect(toggleButton).toBeInTheDocument();

      // Show all projects
      await user.click(toggleButton);

      // Button should be hidden after showing all projects
      expect(screen.queryByRole('button', { name: /Show All Projects/i })).not.toBeInTheDocument();
      expect(screen.getByText('Regular Project 1')).toBeInTheDocument();
    });
  });

  describe('Category Filtering', () => {
    it('should show category filter buttons in header', () => {
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      // Category filter should be visible in the header
      // Use more specific selector to avoid matching "Show All Projects"
      const categoryButtons = screen.getAllByRole('button');
      const allButton = categoryButtons.find(btn => btn.textContent === 'All');
      expect(allButton).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Web Development/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mobile/i })).toBeInTheDocument();
    });

    it('should filter projects by category when category is selected', async () => {
      const user = userEvent.setup();
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      // Show all projects first
      const showAllButton = screen.getByRole('button', { name: /Show All Projects/i });
      await user.click(showAllButton);

      // Click on Web Development category
      await user.click(screen.getByRole('button', { name: /Web Development/i }));

      // Should show only Web Development projects
      expect(screen.getByText('Featured Project 1')).toBeInTheDocument();
      expect(screen.getByText('Regular Project 1')).toBeInTheDocument();
      expect(screen.queryByText('Featured Project 2')).not.toBeInTheDocument(); // Mobile category
      expect(screen.queryByText('Regular Project 2')).not.toBeInTheDocument(); // Data Viz category
    });

    it('should show all projects when "All" filter is selected', async () => {
      const user = userEvent.setup();
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      // Show all projects first
      const showAllButton = screen.getByRole('button', { name: /Show All Projects/i });
      await user.click(showAllButton);

      // Select a category first
      await user.click(screen.getByRole('button', { name: /Mobile/i }));
      expect(screen.queryByText('Regular Project 1')).not.toBeInTheDocument();

      // Select "All" to show all projects again
      await user.click(screen.getByRole('button', { name: /All/i }));
      expect(screen.getByText('Regular Project 1')).toBeInTheDocument();
      expect(screen.getByText('Regular Project 2')).toBeInTheDocument();
    });

    it('should highlight active category filter', async () => {
      const user = userEvent.setup();
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      // Check that "All" is initially active
      const categoryButtons = screen.getAllByRole('button');
      const allButton = categoryButtons.find(btn => btn.textContent === 'All') as HTMLElement;
      expect(allButton.className).toContain('bg-blue-500');

      // Click on a category
      const webDevButton = screen.getByRole('button', { name: /Web Development/i });
      await user.click(webDevButton);

      // Check that the selected category is now active
      expect(webDevButton.className).toContain('bg-blue-500');
      expect(allButton.className).not.toContain('bg-blue-500');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty featured projects', () => {
      render(
        <ProjectsClient
          featuredProjects={[]}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      expect(screen.getByText('Projects')).toBeInTheDocument();
      // Should still render the section but with no projects
    });

    it('should handle empty all projects', () => {
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={[]}
          categories={mockCategories}
        />
      );

      expect(screen.getByText('Projects')).toBeInTheDocument();
      // Show All Projects button should not appear when featured == all
      expect(screen.queryByRole('button', { name: /Show All Projects/i })).not.toBeInTheDocument();
    });

    it('should handle no categories', async () => {
      const user = userEvent.setup();
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={[]}
        />
      );

      // Should not show category filter buttons when categories array is empty
      expect(screen.queryByRole('button', { name: /^All$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Web Development/i })).not.toBeInTheDocument();

      // Show all projects button should still work
      const showAllButton = screen.getByRole('button', { name: /Show All Projects/i });
      expect(showAllButton).toBeInTheDocument();

      await user.click(showAllButton);
      expect(screen.getByText('Regular Project 1')).toBeInTheDocument();
    });

    it('should handle projects without categories', async () => {
      const projectsWithoutCategories = mockAllProjects.map(p => ({
        ...p,
        metadata: { ...p.metadata, category: undefined, categorySlug: undefined },
      }));

      const user = userEvent.setup();
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={projectsWithoutCategories}
          categories={mockCategories}
        />
      );

      // Show all projects
      const showAllButton = screen.getByRole('button', { name: /Show All Projects/i });
      await user.click(showAllButton);

      // Select a category - should show no projects
      await user.click(screen.getByRole('button', { name: /Web Development/i }));

      // All projects should be hidden because none match the category
      expect(screen.queryByText('Regular Project 1')).not.toBeInTheDocument();
    });
  });

  describe('Links', () => {
    it('should create proper links to project detail pages', () => {
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      const link = screen.getByRole('link', { name: /Featured Project 1/i });
      expect(link).toHaveAttribute('href', '/projects/featured-1');
    });

    it('should create proper links for images', () => {
      render(
        <ProjectsClient
          featuredProjects={mockFeaturedProjects}
          allProjects={mockAllProjects}
          categories={mockCategories}
        />
      );

      const imageLinks = screen.getAllByRole('link').filter(link =>
        link.querySelector('img')
      );
      expect(imageLinks.length).toBeGreaterThan(0);
      expect(imageLinks[0]).toHaveAttribute('href', '/projects/featured-1');
    });
  });
});