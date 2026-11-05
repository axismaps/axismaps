import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProseWrapper from './prose-wrapper';

describe('ProseWrapper', () => {
  test('renders its children as prose', () => {
    render(<ProseWrapper>Text</ProseWrapper>);

    const article = screen.getByRole('article');
    expect(article).toHaveClass('prose');
    expect(article).toHaveTextContent('Text');
  });

  test('keeps a className passed by the page', () => {
    render(<ProseWrapper className="mb-12">Text</ProseWrapper>);

    expect(screen.getByRole('article')).toHaveClass('prose', 'mb-12');
  });
});
