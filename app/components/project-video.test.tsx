import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import ProjectVideo, { MuxPoster, isPlayable, type ProjectVideoHandle } from './project-video';

// next-video's player is custom elements (Media Chrome, mux-video) that the
// test environment does not run, so a plain <video> stands in for it. React
// sets `muted` as a property rather than an attribute, hence data-muted.
vi.mock('next-video', async () => {
  const { forwardRef } = await import('react');
  return {
    default: forwardRef(
      ({ src, muted, 'metadata-video-title': videoTitle }: any, ref: any) => (
        <video
          ref={ref}
          data-testid="mux-video"
          data-playback-id={src?.providerMetadata?.mux?.playbackId}
          data-muted={String(Boolean(muted))}
          metadata-video-title={videoTitle}
        />
      ),
    ),
  };
});

const asset = {
  status: 'ready' as const,
  originalFilePath: 'videos/demo.mp4',
  provider: 'mux',
  providerMetadata: { mux: { assetId: 'asset-1', playbackId: 'play-1' } },
  createdAt: 0,
  updatedAt: 0,
};

describe('ProjectVideo', () => {
  describe('a Mux film', () => {
    it('plays the asset through next-video, named for the project', async () => {
      render(<ProjectVideo video={{ source: 'mux', asset }} title="Demo" />);
      expect(await screen.findByTestId('mux-video')).toHaveAttribute(
        'data-playback-id',
        'play-1',
      );
      expect(screen.getByRole('group', { name: 'Demo video' })).toBeInTheDocument();
    });

    it('names the film for Mux Data with the project title', async () => {
      render(<ProjectVideo video={{ source: 'mux', asset }} title="Demo" />);
      expect(await screen.findByTestId('mux-video')).toHaveAttribute(
        'metadata-video-title',
        'Demo',
      );
    });

    it('starts muted only when asked', async () => {
      const { rerender } = render(
        <ProjectVideo video={{ source: 'mux', asset }} title="Demo" />,
      );
      expect(await screen.findByTestId('mux-video')).toHaveAttribute('data-muted', 'false');
      rerender(<ProjectVideo video={{ source: 'mux', asset }} title="Demo" muted />);
      expect(screen.getByTestId('mux-video')).toHaveAttribute('data-muted', 'true');
    });

    it('pauses the player element', async () => {
      const ref = createRef<ProjectVideoHandle>();
      render(<ProjectVideo ref={ref} video={{ source: 'mux', asset }} title="Demo" />);
      const pause = vi.fn();
      ((await screen.findByTestId('mux-video')) as HTMLVideoElement).pause = pause;
      ref.current?.pause();
      expect(pause).toHaveBeenCalledTimes(1);
    });
  });

  describe('the poster held while the player loads', () => {
    it('shows the poster frame, with the blur behind it', () => {
      const { container } = render(
        <MuxPoster
          asset={{
            status: 'ready',
            provider: 'mux',
            providerMetadata: { mux: { playbackId: 'play-1', thumbnailTime: 3.5 } },
            blurDataURL: 'data:image/webp;base64,AAAA',
          }}
        />,
      );
      const img = container.querySelector('img')!;
      expect(img).toHaveAttribute(
        'src',
        'https://image.mux.com/play-1/thumbnail.webp?time=3.5',
      );
      expect(img.getAttribute('srcset')).toContain('?time=3.5&width=960 960w');
      expect(img).toHaveAttribute('aria-hidden', 'true');
      expect(img.style.backgroundImage).toContain('data:image/webp;base64,AAAA');
    });
  });

  describe('an embed', () => {
    // happy-dom reports each iframe it declines to load as a console error.
    // Only that message is dropped, so any other error still shows.
    let consoleError: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      const original = console.error;
      consoleError = vi.spyOn(console, 'error').mockImplementation((...args) => {
        if (String(args[0]).includes('Iframe page loading is disabled')) return;
        original(...args);
      });
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    const youtube = 'https://www.youtube.com/watch?v=UdpiWfwJ5nA';

    it('frames the player address, titled for the project', () => {
      render(<ProjectVideo video={{ source: 'embed', url: youtube }} title="Demo" />);
      expect(screen.getByTitle('Demo video')).toHaveAttribute(
        'src',
        'https://www.youtube.com/embed/UdpiWfwJ5nA?enablejsapi=1',
      );
    });

    it('pauses the player by message', () => {
      const ref = createRef<ProjectVideoHandle>();
      render(
        <ProjectVideo ref={ref} video={{ source: 'embed', url: youtube }} title="Demo" />,
      );
      // The test environment never loads an iframe's page, so the player has
      // no window of its own: stand one in to catch the message.
      const postMessage = vi.fn();
      Object.defineProperty(screen.getByTitle('Demo video'), 'contentWindow', {
        value: { postMessage },
      });
      ref.current?.pause();
      expect(postMessage).toHaveBeenCalledWith(
        '{"event":"command","func":"pauseVideo","args":[]}',
        'https://www.youtube.com',
      );
    });

    it('renders nothing for an address it cannot embed', () => {
      const { container } = render(
        <ProjectVideo
          video={{ source: 'embed', url: 'https://example.com/clip.mp4' }}
          title="Demo"
        />,
      );
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('isPlayable', () => {
    it('accepts a Mux film', () => {
      expect(isPlayable({ source: 'mux', asset })).toBe(true);
    });

    it('accepts an address the embed can play', () => {
      expect(
        isPlayable({ source: 'embed', url: 'https://www.youtube.com/watch?v=UdpiWfwJ5nA' }),
      ).toBe(true);
    });

    it('rejects an address the embed cannot play, and no video at all', () => {
      expect(isPlayable({ source: 'embed', url: 'https://example.com/clip.mp4' })).toBe(
        false,
      );
      expect(isPlayable(undefined)).toBe(false);
    });
  });
});
