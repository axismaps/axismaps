import { describe, it, expect } from 'vitest';
import { videoEmbed } from './video-embed';

describe('videoEmbed', () => {
  it('embeds a Vimeo video by its id', () => {
    expect(videoEmbed('https://vimeo.com/1249325610')).toMatchObject({
      src: 'https://player.vimeo.com/video/1249325610?title=0&byline=0&portrait=0',
      origin: 'https://player.vimeo.com',
      pauseMessage: '{"method":"pause"}',
    });
  });

  it('ignores the query string on a copied Vimeo share link', () => {
    expect(
      videoEmbed('https://vimeo.com/1249325610?share=copy&fl=sv&fe=ci')?.src,
    ).toBe('https://player.vimeo.com/video/1249325610?title=0&byline=0&portrait=0');
  });

  it('accepts a www Vimeo address', () => {
    expect(videoEmbed('https://www.vimeo.com/164081341')?.src).toBe(
      'https://player.vimeo.com/video/164081341?title=0&byline=0&portrait=0',
    );
  });

  it('embeds a YouTube watch link with the player API enabled', () => {
    expect(
      videoEmbed('https://www.youtube.com/watch?v=gZW-tibhfzM&t=10'),
    ).toMatchObject({
      src: 'https://www.youtube.com/embed/gZW-tibhfzM?enablejsapi=1',
      origin: 'https://www.youtube.com',
    });
  });

  it('embeds a youtu.be short link', () => {
    expect(videoEmbed('https://youtu.be/UdpiWfwJ5nA?si=abc')?.src).toBe(
      'https://www.youtube.com/embed/UdpiWfwJ5nA?enablejsapi=1',
    );
  });

  it('pauses YouTube with a player command', () => {
    expect(
      JSON.parse(videoEmbed('https://youtu.be/UdpiWfwJ5nA')!.pauseMessage),
    ).toEqual({ event: 'command', func: 'pauseVideo', args: [] });
  });

  it('returns null for a host it cannot embed', () => {
    expect(videoEmbed('https://example.com/video.mp4')).toBeNull();
  });
});
