import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomepageFilms from './homepage-films';

// As in project-video.test.tsx: a plain <video> stands in for the player.
vi.mock('next-video', async () => {
  const { forwardRef } = await import('react');
  return {
    default: forwardRef(({ src, muted, autoPlay }: any, ref: any) => (
      <video
        ref={ref}
        data-testid="mux-video"
        data-playback-id={src?.providerMetadata?.mux?.playbackId}
        data-muted={String(Boolean(muted))}
        data-autoplay={String(Boolean(autoPlay))}
      />
    )),
  };
});

const film = (slug: string, title: string, { muted = false, lead = false } = {}) => ({
  slug,
  title,
  muted,
  lead,
  asset: {
    status: 'ready' as const,
    provider: 'mux' as const,
    providerMetadata: { mux: { playbackId: `play-${slug}` } },
  },
});

const films = [film('edge', 'On the Edge', { lead: true }), film('atlas', 'MapMaster 3', { muted: true })];

describe('HomepageFilms', () => {
  it('shows the lead film as a poster with a play button, and no player', () => {
    const { container } = render(<HomepageFilms films={films} />);

    expect(screen.getByRole('button', { name: 'Play On the Edge video' })).toBeInTheDocument();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://image.mux.com/play-edge/thumbnail.webp',
    );
    expect(screen.queryByTestId('mux-video')).not.toBeInTheDocument();
  });

  it('opens on the lead film wherever it sits in the picker', () => {
    render(
      <HomepageFilms films={[film('atlas', 'MapMaster 3'), film('edge', 'On the Edge', { lead: true })]} />,
    );
    const picker = screen.getByRole('group', { name: 'Choose a film' });

    expect(screen.getByRole('button', { name: 'Play On the Edge video' })).toBeInTheDocument();
    expect(within(picker).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'MapMaster 3',
      'On the Edge',
    ]);
    expect(within(picker).getByRole('button', { name: 'On the Edge' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('mounts the player on play, starting it with sound, and moves focus to it', async () => {
    const user = userEvent.setup();
    render(<HomepageFilms films={films} />);

    await user.click(screen.getByRole('button', { name: 'Play On the Edge video' }));

    const video = await screen.findByTestId('mux-video');
    expect(video).toHaveAttribute('data-playback-id', 'play-edge');
    expect(video).toHaveAttribute('data-autoplay', 'true');
    expect(video).toHaveAttribute('data-muted', 'false');
    expect(screen.queryByRole('button', { name: /^Play / })).not.toBeInTheDocument();
    expect(document.activeElement).toContainElement(video);
  });

  it('plays from the keyboard', async () => {
    const user = userEvent.setup();
    render(<HomepageFilms films={films} />);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Play On the Edge video' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(await screen.findByTestId('mux-video')).toBeInTheDocument();
  });

  it('marks the current film in the picker and swaps to another without playing it', async () => {
    const user = userEvent.setup();
    render(<HomepageFilms films={films} />);
    const picker = screen.getByRole('group', { name: 'Choose a film' });

    expect(within(picker).getByRole('button', { name: 'On the Edge' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(picker).getByRole('button', { name: 'MapMaster 3' }));

    expect(within(picker).getByRole('button', { name: 'MapMaster 3' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(picker).getByRole('button', { name: 'On the Edge' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByTestId('mux-video')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Play MapMaster 3 video' }));
    expect(await screen.findByTestId('mux-video')).toHaveAttribute('data-muted', 'true');
  });

  it('goes back to a poster when another film is picked mid-play', async () => {
    const user = userEvent.setup();
    render(<HomepageFilms films={films} />);

    await user.click(screen.getByRole('button', { name: 'Play On the Edge video' }));
    await screen.findByTestId('mux-video');
    await user.click(screen.getByRole('button', { name: 'MapMaster 3' }));

    expect(screen.queryByTestId('mux-video')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play MapMaster 3 video' })).toBeInTheDocument();
  });

  it('has no picker for a single film, and renders nothing for none', () => {
    const { rerender, container } = render(<HomepageFilms films={[films[0]]} />);
    expect(screen.queryByRole('group', { name: 'Choose a film' })).not.toBeInTheDocument();

    rerender(<HomepageFilms films={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
