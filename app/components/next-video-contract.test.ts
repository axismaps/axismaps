// @vitest-environment node
// Node rather than the DOM the other component tests use: next-video's player
// theme builds Media Chrome elements on import, which happy-dom can't run,
// while Next renders the same module on the server without trouble.
import { describe, it, expect } from 'vitest';
import { getVideoProps } from 'next-video';
// Video passes getVideoProps the transformer for the asset's provider; this
// is that same lookup, done here because Video's default isn't exported.
import * as transformers from 'next-video/dist/providers/transformers.js';
import { toNextVideoAsset } from './project-video';

// toNextVideoAsset hands next-video blanks for the original's path and the
// timestamps, on the strength of next-video reading them only for an upload
// that isn't ready. This runs the real library, pinned at 2.8.3, so an
// upgrade that starts reading them for a ready one fails here.
describe("next-video's reading of a ready asset", () => {
  const src = toNextVideoAsset({
    status: 'ready',
    provider: 'mux',
    providerMetadata: { mux: { playbackId: 'play-1', thumbnailTime: 3.5 } },
  });
  const transform = (transformers as any)[src.provider].transform;

  it('streams from Mux, never from the blanked original path', () => {
    const props = getVideoProps({ src, transform } as any, { asset: src });
    expect(props.src).toBe('https://stream.mux.com/play-1.m3u8');
  });

  it('takes the poster from Mux at the chosen time', () => {
    const props = getVideoProps({ src, transform } as any, { asset: src });
    expect(props.poster).toBe('https://image.mux.com/play-1/thumbnail.webp?time=3.5');
  });

  // ProjectVideo names the film for Mux Data with this attribute, which only
  // reaches mux-video if next-video hands its unknown props to the player.
  it('passes the Mux Data title through to the player', () => {
    const props = getVideoProps(
      { src, transform, 'metadata-video-title': 'Demo' } as any,
      { asset: src },
    );
    expect(props['metadata-video-title']).toBe('Demo');
  });
});
