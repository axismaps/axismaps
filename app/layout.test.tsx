import { describe, test, expect, vi } from 'vitest';

// The layout pulls in fonts, analytics and the sitemap, none of which matter
// for the metadata export under test.
vi.mock('geist/font/sans', () => ({ GeistSans: { variable: '' } }));
vi.mock('geist/font/mono', () => ({ GeistMono: { variable: '' } }));
vi.mock('@vercel/analytics/next', () => ({ Analytics: () => null }));
vi.mock('./sitemap', () => ({ baseUrl: 'https://www.axismaps.com' }));
vi.mock('./components/nav', () => ({ Navbar: () => null }));
vi.mock('./components/footer', () => ({ default: () => null }));

import { metadata } from './layout';

const title = 'Axis Maps | Interactive maps designed by cartographers';
const description =
  'Custom interactive maps, designed and built by Axis Maps since 2006. Offices in Lichfield, England and Hewitt, Texas.';

describe('Root layout metadata', () => {
  test('carries the home page title and description', () => {
    expect(metadata.title).toMatchObject({ default: title });
    expect(metadata.description).toBe(description);
  });

  test('gives the social tags the same title and description', () => {
    expect(metadata.openGraph).toMatchObject({ title, description });
    expect(metadata.twitter).toMatchObject({ title, description });
  });

  test('uses British English as the primary Open Graph locale', () => {
    expect(metadata.openGraph).toMatchObject({
      locale: 'en_GB',
      alternateLocale: ['en_US'],
    });
  });
});
