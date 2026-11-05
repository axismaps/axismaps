import { describe, test, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import Page from './page';

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

vi.mock('./data/client-logos.json', () => ({
  default: [
    { name: 'Test Client', shortName: 'Test', logo: '/test-logo.jpg' }
  ]
}));

// The section an h2 heads, for looking inside one part of the page.
function sectionOf(name: string): HTMLElement {
  return screen.getByRole('heading', { level: 2, name }).closest('section') as HTMLElement;
}

describe('Home Page', () => {
  test('leaves the hero as it was', () => {
    render(<Page />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'We bring the traditions of cartography to the Web' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute('href', '/contact');
  });

  test('introduces the team in Who we are and links on to the about page', () => {
    render(<Page />);
    const section = sectionOf('Who we are');

    expect(section.querySelector('p')).toHaveTextContent(
      'Axis Maps is a small team of cartographers and developers in Lichfield, England and Hewitt, Texas. ' +
        'Since 2006 we have designed and built custom interactive maps for public health, the environment, ' +
        'education and history, for clients from national museums to campaigning charities. Every map is ' +
        'designed around the people who will use it, the people who will run it, and the story the data is ' +
        'trying to tell.'
    );
    expect(within(section).getByRole('link', { name: 'Learn More' })).toHaveAttribute('href', '/about');
    expect(section.querySelectorAll('p')).toHaveLength(1);
  });

  test('heads the client logos with the partnered wording', () => {
    render(<Page />);

    expect(screen.getByRole('heading', { name: "We're pleased to have partnered with" })).toBeInTheDocument();
    expect(screen.queryByText("We're pleased to have worked with")).not.toBeInTheDocument();
  });

  test('keeps only the bottom link out of Recent Projects', () => {
    render(<Page />);
    const section = sectionOf('Recent Projects');

    expect(within(section).getByRole('link', { name: 'Explore All Projects' })).toHaveAttribute('href', '/projects');
    expect(within(section).queryByRole('link', { name: 'View All Projects' })).not.toBeInTheDocument();
  });

  test('lists the six How we work points, bold lead-in then body', () => {
    render(<Page />);
    const section = sectionOf('How we work');
    const points = Array.from(section.querySelectorAll('p'));

    expect(screen.queryByRole('heading', { name: 'How we can help' })).not.toBeInTheDocument();
    expect(points.map((point) => point.querySelector('strong')?.textContent)).toEqual([
      'Designed by cartographers.',
      "Interfaces that show what's possible.",
      'Interfaces for every level of expertise.',
      'Maps that work for everyone.',
      'Built around your data.',
      'Built to last.',
    ]);
    expect(points.map((point) => point.textContent)).toEqual([
      'Designed by cartographers. Every decision on the map is made so it reads clearly and the data tells its story.',
      "Interfaces that show what's possible. The controls show what the map can do and what you can ask of it.",
      'Interfaces for every level of expertise. Whether the map is for a first-time visitor, an analyst who comes back every week, or everyone in between, we design for whoever the project requires.',
      'Maps that work for everyone. Keyboard navigation and screen reader support, where the project calls for it.',
      'Built around your data. Deep integration with your existing data pipelines and processes, so when the data changes, the map changes with it.',
      'Built to last. Maps we built years ago are still live and still in use. We use current technology and an architecture each project can sustain.',
    ]);
  });

  test('renames the resources section and drops its intro line', () => {
    render(<Page />);

    expect(screen.getByRole('heading', { name: 'Free tools and resources' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Resources by us, for you' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Explore our collection of tools and guides/)).not.toBeInTheDocument();
  });

  test('rewrites the Contours card and leaves the other three alone', () => {
    render(<Page />);
    const section = sectionOf('Free tools and resources');
    const descriptions = Array.from(section.querySelectorAll('h3')).map((heading) => [
      heading.textContent,
      heading.nextElementSibling?.textContent,
    ]);

    expect(descriptions).toEqual([
      [
        'Cartography Guide',
        'A short, friendly guide to basic principles of map design. Learn important concepts in cartography and flag important decision points in map-making.',
      ],
      ['Contours', 'Draw a contour map of just about anywhere. Pick your area, choose contour lines or illuminated contours, adjust the interval and colors, and export to GeoJSON, PNG, or SVG.'],
      [
        'ColorBrewer',
        'Color advice for cartography. Choose effective color schemes for your maps based on the nature of your data and your design goals.',
      ],
      [
        'Typographic Maps',
        'Twelve city maps drawn entirely in type, with every street, park, and shoreline built from the names of the places themselves. Zoom in and read them.',
      ],
    ]);
  });
});
