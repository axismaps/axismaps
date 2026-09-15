import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactPage from './page';

describe('Contact Page', () => {
  test('links the main inbox', () => {
    render(<ContactPage />);

    expect(screen.getByRole('link', { name: 'info@axismaps.com' })).toHaveAttribute(
      'href',
      'mailto:info@axismaps.com'
    );
  });

  test('links the UK enquiries inbox', () => {
    render(<ContactPage />);

    expect(screen.getByText(/UK enquiries:/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'info@axismaps.co.uk' })).toHaveAttribute(
      'href',
      'mailto:info@axismaps.co.uk'
    );
  });
});
