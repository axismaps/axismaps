import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import ProseWrapper from './prose-wrapper';

describe('ProseWrapper', () => {
  test('renders plain prose by default', () => {
    render(<ProseWrapper>Text</ProseWrapper>);

    const article = screen.getByRole('article');
    expect(article).toHaveClass('prose');
    expect(article).not.toHaveClass('prose-guide');
  });

  test('keeps a className passed by the page', () => {
    render(<ProseWrapper className="mb-12">Text</ProseWrapper>);

    expect(screen.getByRole('article')).toHaveClass('prose', 'mb-12');
  });

  test('gives guides a heading scale that global.css actually defines', () => {
    render(<ProseWrapper variant="guide">Text</ProseWrapper>);
    expect(screen.getByRole('article')).toHaveClass('prose', 'prose-guide');

    // No typography plugin is installed, so these rules are the only thing
    // that makes the class do anything.
    const css = fs.readFileSync(path.join(process.cwd(), 'app/global.css'), 'utf8');
    expect(css).toMatch(/\.prose-guide h2\s*{/);
    expect(css).toMatch(/\.prose-guide h3\s*{/);
    expect(css).toMatch(/\.prose-guide h4\s*{/);
  });
});
