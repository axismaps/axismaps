import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutPage, { metadata } from './page';
import { siteDescription } from '../lib/metadata';

describe('About Page', () => {
  test('uses the reviewed page description and shared social description', () => {
    const description =
      'Axis Maps has designed custom interactive maps since 2006. Meet the co-founders and find out how we work with clients in the UK, Europe and the US.';

    expect(metadata.description).toBe(description);
    expect(metadata.openGraph?.description).toBe(siteDescription);
    expect(metadata.twitter?.description).toBe(siteDescription);
  });

  test('shows the reviewed story, co-founders, offices, and contact link in order', () => {
    const { container } = render(<AboutPage />);
    const paragraphs = Array.from(container.querySelectorAll('p')).map((p) =>
      p.textContent?.replace(/\s+/g, ' ').trim(),
    );

    expect(screen.getByRole('heading', { name: 'Our story', level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Co-founders', level: 2 })).toBeInTheDocument();
    expect(paragraphs).toEqual([
      'Axis Maps was formed in 2006. Interactive mapping was growing fast and most of the attention was on the technology of delivering maps over the web. The cartography, the part that makes a map clear, was being left behind. We started Axis Maps to bring cartography to what was becoming a purely technical field. While other companies built software for the broadest possible market, we designed each map for its client, its data and its audience.',
      "David Heyman. Co-founder and technical lead. David works closely with clients throughout a project and builds the maps and the systems behind them: the data pipelines, the interfaces and the infrastructure they run on. Based in Lichfield, England.",
      "Ben Sheesley. Co-founder and design lead. Ben leads the cartography and interface design on every project. How a map looks, how it reads and how it feels to use start with him. He also runs the company's operations. Based in Hewitt, Texas.",
      'We work from Lichfield, England and Hewitt, Texas. UK and European clients contract with Axis Maps Limited, registered in England and Wales, in pounds sterling. US clients contract with Axis Maps LLC, a Texas company, in dollars.',
    ]);
    expect(screen.getByText('David Heyman.').tagName).toBe('STRONG');
    expect(screen.getByText('Ben Sheesley.').tagName).toBe('STRONG');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('link', { name: 'Contact Us' })).toHaveAttribute(
      'href',
      '/contact',
    );
  });
});
