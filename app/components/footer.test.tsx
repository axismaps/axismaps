import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './footer';

describe('Footer', () => {
  test('lists both office locations', () => {
    render(<Footer />);

    expect(screen.getByText('Hewitt, TX | Lichfield, UK')).toBeInTheDocument();
  });

  test('links both the US and UK inboxes', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: 'info@axismaps.com' })).toHaveAttribute(
      'href',
      'mailto:info@axismaps.com'
    );
    expect(screen.getByRole('link', { name: 'info@axismaps.co.uk' })).toHaveAttribute(
      'href',
      'mailto:info@axismaps.co.uk'
    );
  });

  // UK trading disclosure rules require these details on the website, so a
  // typo or accidental deletion should fail CI rather than ship silently.
  test('shows the statutory company details', () => {
    render(<Footer />);

    const legal = screen.getByText(/Axis Maps Limited is registered in England and Wales/);
    expect(legal).toHaveTextContent('Axis Maps LLC is a Texas limited liability company.');
    expect(legal).toHaveTextContent('company number 08157001.');
    expect(legal).toHaveTextContent(
      'Registered office: 19 Woodfields Drive, Lichfield, WS14 9HH.'
    );
    expect(legal).toHaveTextContent('VAT number GB 174 5108 13.');
  });
});
