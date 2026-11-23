import fs from 'fs';
import path from 'path';
import { describe, it, expect } from 'vitest';
import { videoEmbed } from './video-embed';

const VIMEO_PARAMS = 'title=0&byline=0&portrait=0';
const vimeoPlayer = (id: string, extra = '') =>
  `https://player.vimeo.com/video/${id}?${VIMEO_PARAMS}${extra}`;

describe('videoEmbed', () => {
  describe('Vimeo', () => {
    it('embeds a video by its id', () => {
      expect(videoEmbed('https://vimeo.com/1249325610')).toMatchObject({
        src: vimeoPlayer('1249325610'),
        origin: 'https://player.vimeo.com',
        pauseMessage: '{"method":"pause"}',
      });
    });

    it('ignores the query string on a copied share link', () => {
      expect(
        videoEmbed('https://vimeo.com/1249325610?share=copy&fl=sv&fe=ci')?.src,
      ).toBe(vimeoPlayer('1249325610'));
    });

    it('accepts a www address', () => {
      expect(videoEmbed('https://www.vimeo.com/164081341')?.src).toBe(
        vimeoPlayer('164081341'),
      );
    });

    it('passes on the hash an unlisted video needs to embed', () => {
      expect(videoEmbed('https://vimeo.com/468729910/1b02976866')?.src).toBe(
        vimeoPlayer('468729910', '&h=1b02976866'),
      );
    });

    it('finds the id inside a channel address', () => {
      expect(
        videoEmbed('https://vimeo.com/channels/staffpicks/164081341')?.src,
      ).toBe(vimeoPlayer('164081341'));
    });

    it('accepts an existing player address, keeping its hash', () => {
      expect(
        videoEmbed('https://player.vimeo.com/video/468729910?h=1b02976866')
          ?.src,
      ).toBe(vimeoPlayer('468729910', '&h=1b02976866'));
    });

    it('returns null when the address has no video id', () => {
      expect(videoEmbed('https://vimeo.com/axismaps?tab=videos')).toBeNull();
    });
  });

  describe('YouTube', () => {
    it('embeds a watch link with the player API enabled', () => {
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

    it('accepts an existing embed address', () => {
      expect(videoEmbed('https://www.youtube.com/embed/UdpiWfwJ5nA')?.src).toBe(
        'https://www.youtube.com/embed/UdpiWfwJ5nA?enablejsapi=1',
      );
    });

    it('returns null when a watch link has no video', () => {
      expect(videoEmbed('https://www.youtube.com/watch?list=PL123')).toBeNull();
    });

    it('pauses with a player command', () => {
      expect(
        JSON.parse(videoEmbed('https://youtu.be/UdpiWfwJ5nA')!.pauseMessage),
      ).toEqual({ event: 'command', func: 'pauseVideo', args: [] });
    });
  });

  it('matches hosts exactly rather than by a word in the address', () => {
    expect(videoEmbed('https://notvimeo.example/123')).toBeNull();
    expect(videoEmbed('https://example.com/youtube.com/watch?v=abc')).toBeNull();
  });

  it('returns null for a host it cannot embed', () => {
    expect(videoEmbed('https://example.com/video.mp4')).toBeNull();
  });

  it('returns null for something that is not a URL', () => {
    expect(videoEmbed('vimeo 123')).toBeNull();
  });

  // A project whose videoUrl stopped parsing would quietly lose its video.
  it('embeds the video of every project that has one', () => {
    const postsDir = path.join(__dirname, '..', 'projects', 'posts');
    const urls = fs
      .readdirSync(postsDir)
      .filter((file) => file.endsWith('.mdx'))
      .flatMap((file) => {
        const text = fs.readFileSync(path.join(postsDir, file), 'utf8');
        const match = text.match(/^videoUrl:\s*"([^"]+)"/m);
        return match ? [match[1]] : [];
      });

    expect(urls.length).toBeGreaterThan(0);
    expect(urls.filter((url) => videoEmbed(url) === null)).toEqual([]);
  });
});
