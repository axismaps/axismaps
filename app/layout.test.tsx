import { describe, test, expect, vi } from 'vitest';

// The layout pulls in fonts, analytics and the sitemap, none of which matter
// for the metadata export under test.
vi.mock('geist/font/sans', () => ({ GeistSans: { variable: '' } }));
vi.mock('geist/font/mono', () => ({ GeistMono: { variable: '' } }));
vi.mock('@vercel/analytics/next', () => ({ Analytics: () => null }));
vi.mock('./sitemap', () => ({ baseUrl: 'https://axismaps.com' }));
vi.mock('./components/nav', () => ({ Navbar: () => null }));
vi.mock('./components/footer', () => ({ default: () => null }));

import { metadata } from './layout';

describe('Root layout metadata', () => {
  test('uses British English as the primary Open Graph locale', () => {
    expect(metadata.openGraph).toMatchObject({
      locale: 'en_GB',
      alternateLocale: ['en_US'],
    });
  });
});
