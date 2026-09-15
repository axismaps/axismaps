import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import AboutPage from './page';

describe('About Page', () => {
  test('names both offices', () => {
    render(<AboutPage />);

    expect(
      screen.getByText(/Today we work from two offices, in Lichfield, England and Hewitt,\s+Texas\./)
    ).toBeInTheDocument();
  });

  test('says UK clients contract with Axis Maps Limited in sterling', () => {
    render(<AboutPage />);

    expect(
      screen.getByText(
        'UK clients contract with Axis Maps Limited, registered in England and Wales, in pounds sterling.'
      )
    ).toBeInTheDocument();
  });
});
