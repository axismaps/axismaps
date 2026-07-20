import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditionViewer, { type ViewableEdition } from './EditionViewer';

// OpenSeadragon touches browser APIs happy-dom doesn't implement, and this suite is
// about the switcher's logic rather than the viewer's. Stand in for it.
vi.mock('./DeepZoomViewer', () => ({
  default: ({ dzi, label }: { dzi: string; label: string }) => (
    <div data-testid="deep-zoom" data-dzi={dzi} aria-label={label} />
  ),
}));

const tiled = (over: Partial<ViewableEdition> = {}): ViewableEdition => ({
  id: 'poster',
  label: 'Second edition',
  year: 2014,
  orientation: 'portrait',
  printSize: '24 × 36 in',
  letterpress: false,
  primary: true,
  url: 'https://tiles.example.com/boston/poster.dzi',
  photos: [],
  ...over,
});

const photographic = (over: Partial<ViewableEdition> = {}): ViewableEdition => ({
  id: 'letterpress-black',
  label: 'Letterpress edition — black',
  year: 2012,
  orientation: 'portrait',
  printSize: 'two sheets, 18 × 24 in each',
  letterpress: true,
  primary: false,
  url: null,
  photos: [
    { src: '/images/a-1.jpg', width: 2000, height: 1334 },
    { src: '/images/a-2.jpg', width: 2000, height: 1335 },
  ],
  ...over,
});

describe('EditionViewer', () => {
  it('shows no switcher for a city with a single edition', () => {
    render(<EditionViewer city="Austin" editions={[tiled()]} />);

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByTestId('deep-zoom')).toBeInTheDocument();
  });

  it('opens on the primary edition, not merely the first', () => {
    render(
      <EditionViewer
        city="Boston"
        editions={[
          tiled({ id: 'first-edition', label: 'First edition', primary: false }),
          tiled({ id: 'poster', label: 'Second edition', primary: true }),
        ]}
      />,
    );

    expect(
      screen.getByRole('button', { name: /Second edition/ }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /First edition/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('falls back to the first edition when none is marked primary', () => {
    render(
      <EditionViewer
        city="Boston"
        editions={[
          tiled({ id: 'a', label: 'Edition A', primary: false }),
          tiled({ id: 'b', label: 'Edition B', primary: false }),
        ]}
      />,
    );

    expect(screen.getByRole('button', { name: /Edition A/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('swaps the viewer when another edition is chosen', async () => {
    const user = userEvent.setup();
    render(
      <EditionViewer
        city="Boston"
        editions={[
          tiled({ id: 'poster', primary: true }),
          tiled({
            id: 'first-edition',
            label: 'First edition',
            primary: false,
            url: 'https://tiles.example.com/boston/first-edition.dzi',
          }),
        ]}
      />,
    );

    expect(screen.getByTestId('deep-zoom')).toHaveAttribute(
      'data-dzi',
      'https://tiles.example.com/boston/poster.dzi',
    );

    await user.click(screen.getByRole('button', { name: /First edition/ }));

    expect(screen.getByTestId('deep-zoom')).toHaveAttribute(
      'data-dzi',
      'https://tiles.example.com/boston/first-edition.dzi',
    );
  });

  it('renders photographs instead of the zoom viewer for a photo edition', async () => {
    const user = userEvent.setup();
    render(
      <EditionViewer
        city="New York City"
        editions={[tiled({ primary: true }), photographic()]}
      />,
    );

    expect(screen.getByTestId('deep-zoom')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Letterpress/ }));

    expect(screen.queryByTestId('deep-zoom')).not.toBeInTheDocument();
    expect(screen.getByAltText(/photograph 1 of 2/)).toBeInTheDocument();
  });

  it('describes zoom controls for tiled editions and provenance for photographed ones', async () => {
    const user = userEvent.setup();
    render(
      <EditionViewer
        city="New York City"
        editions={[tiled({ primary: true }), photographic()]}
      />,
    );

    expect(screen.getByText(/Drag to pan/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Letterpress/ }));

    expect(screen.getByText(/Photographed from the original print/)).toBeInTheDocument();
    expect(screen.getByText(/Crane’s Lettra/)).toBeInTheDocument();
  });

  it('omits the letterpress provenance for a photo edition that is not letterpress', async () => {
    const user = userEvent.setup();
    render(
      <EditionViewer
        city="Somewhere"
        editions={[
          tiled({ primary: true }),
          photographic({ id: 'photos', label: 'Photographs', letterpress: false }),
        ]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Photographs/ }));

    expect(screen.getByText(/Photographed from the original print/)).toBeInTheDocument();
    // The cotton-stock and edition-of-50 claims only hold for the letterpress prints.
    expect(screen.queryByText(/Crane’s Lettra/)).not.toBeInTheDocument();
  });

  it('reports gracefully when a city has nothing viewable', () => {
    render(<EditionViewer city="London" editions={[]} />);

    expect(screen.getByText(/isn’t available yet/)).toBeInTheDocument();
    expect(screen.queryByTestId('deep-zoom')).not.toBeInTheDocument();
  });
});
