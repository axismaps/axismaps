import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from './page';

// Mock the projects utils since we're only testing the years calculation
vi.mock('./projects/utils', () => ({
  getProjects: () => [
    {
      slug: 'test-project',
      metadata: {
        title: 'Test Project',
        featured: true,
        publishedAt: '2024-01-01',
        subtitle: 'Test subtitle',
        teaser: 'Test teaser',
        coverImage: '/test.jpg',
        client: 'Test Client',
        category: 'Test Category'
      }
    }
  ]
}));

// Mock client logos
vi.mock('./data/client-logos.json', () => ({
  default: [
    { name: 'Test Client', shortName: 'Test', logo: '/test-logo.jpg' }
  ]
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('should display correct years of experience based on current year', () => {
    // Mock current year to 2024
    const mockDate = new Date('2024-06-15');
    vi.setSystemTime(mockDate);

    render(<Page />);

    // Should show 18 years for 2024 (2024 - 2006 = 18)
    expect(screen.getByText(/We have 18 years of experience partnering with/)).toBeInTheDocument();
  });

  test('should display correct years of experience for different years', () => {
    // Mock current year to 2025  
    const mockDate = new Date('2025-01-01');
    vi.setSystemTime(mockDate);

    render(<Page />);

    // Should show 19 years for 2025 (2025 - 2006 = 19)
    expect(screen.getByText(/We have 19 years of experience partnering with/)).toBeInTheDocument();
  });

  test('should display other content correctly', () => {
    render(<Page />);

    // Verify other key content is still present
    expect(screen.getByText(/Axis Maps is a creative team of Web designers and developers/)).toBeInTheDocument();
    expect(screen.getByText(/We bring the traditions of cartography to the Web/)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Who we are/i })).toBeInTheDocument();
  });

  test('should not contain hardcoded "15 years" text', () => {
    render(<Page />);

    // Verify the old hardcoded text is not present
    expect(screen.queryByText(/We have 15 years of experience/)).not.toBeInTheDocument();
  });
});