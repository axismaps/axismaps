import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectGallery from './project-gallery';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...rest }: any) => (
    <img
      src={src}
      alt={alt}
      className={className}
      aria-hidden={rest['aria-hidden']}
    />
  ),
}));

describe('ProjectGallery', () => {
  const images = [
    '/images/projects/demo/01-one.jpg',
    '/images/projects/demo/02-two.jpg',
    '/images/projects/demo/03-three.jpg',
  ];

  const renderGallery = () =>
    render(<ProjectGallery images={images} title="Demo Project" />);

  // The visible slide is the one at full opacity; the rest stay mounted so
  // the browser can cross-fade between them.
  const visibleIndex = () =>
    screen
      .getAllByRole('img', { hidden: true })
      .findIndex((img) => img.className.includes('opacity-100'));

  it('renders every image', () => {
    renderGallery();
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(3);
  });

  it('shows the first image initially', () => {
    renderGallery();
    expect(visibleIndex()).toBe(0);
    expect(screen.getByText('Image 1 of 3')).toBeInTheDocument();
  });

  it('advances with the next control', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Next image'));
    expect(visibleIndex()).toBe(1);
    expect(screen.getByText('Image 2 of 3')).toBeInTheDocument();
  });

  it('wraps backwards from the first image to the last', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Previous image'));
    expect(visibleIndex()).toBe(2);
  });

  it('wraps forwards from the last image to the first', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Go to image 3'));
    await user.click(screen.getByLabelText('Next image'));
    expect(visibleIndex()).toBe(0);
  });

  it('jumps to an image via its indicator', async () => {
    const user = userEvent.setup();
    renderGallery();
    await user.click(screen.getByLabelText('Go to image 3'));
    expect(visibleIndex()).toBe(2);
    expect(screen.getByLabelText('Go to image 3')).toHaveAttribute(
      'aria-current',
      'true',
    );
  });

  it('navigates with arrow keys once focused', async () => {
    const user = userEvent.setup();
    renderGallery();
    const carousel = screen.getByRole('group');
    carousel.focus();
    await user.keyboard('{ArrowRight}');
    expect(visibleIndex()).toBe(1);
    await user.keyboard('{ArrowLeft}');
    expect(visibleIndex()).toBe(0);
  });

  it('hides the off-screen images from assistive technology', () => {
    renderGallery();
    const rendered = screen.getAllByRole('img', { hidden: true });
    expect(rendered[0]).not.toHaveAttribute('aria-hidden', 'true');
    expect(rendered[1]).toHaveAttribute('aria-hidden', 'true');
  });

  it('labels the carousel with the project title', () => {
    renderGallery();
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-label',
      'Demo Project screenshots',
    );
  });
});
