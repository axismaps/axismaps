import { describe, it, expect } from 'vitest';
import { isReadyMuxAsset, muxPosterSrcSet, toVideoAsset } from './video-asset';

const sidecar = {
  status: 'ready',
  originalFilePath: 'videos/demo.mp4',
  provider: 'mux',
  providerMetadata: { mux: { uploadId: 'u', assetId: 'a', playbackId: 'play-1' } },
  blurDataURL: 'data:image/webp;base64,AAAA',
  size: 99,
  createdAt: 1,
  updatedAt: 2,
};

describe('isReadyMuxAsset', () => {
  it('accepts a finished Mux upload', () => {
    expect(isReadyMuxAsset(sidecar)).toBe(true);
  });

  it('accepts a sidecar that leaves the provider to the config', () => {
    const { provider, ...rest } = sidecar;
    expect(isReadyMuxAsset(rest)).toBe(true);
  });

  it('rejects an unfinished upload, another provider, or no playback id', () => {
    expect(isReadyMuxAsset({ ...sidecar, status: 'processing' })).toBe(false);
    expect(isReadyMuxAsset({ ...sidecar, provider: 'vercel-blob' })).toBe(false);
    expect(isReadyMuxAsset({ ...sidecar, providerMetadata: { mux: {} } })).toBe(false);
    expect(isReadyMuxAsset(null)).toBe(false);
  });
});

describe('toVideoAsset', () => {
  it('keeps only what playback reads', () => {
    expect(toVideoAsset(sidecar)).toEqual({
      status: 'ready',
      provider: 'mux',
      providerMetadata: { mux: { playbackId: 'play-1' } },
      blurDataURL: 'data:image/webp;base64,AAAA',
    });
  });

  it('carries a chosen poster time', () => {
    const timed = {
      ...sidecar,
      providerMetadata: { mux: { ...sidecar.providerMetadata.mux, thumbnailTime: 3.5 } },
    };
    expect(toVideoAsset(timed)?.providerMetadata.mux.thumbnailTime).toBe(3.5);
  });

  it('returns null for anything that cannot play', () => {
    expect(toVideoAsset({ ...sidecar, status: 'uploading' })).toBeNull();
  });
});

describe('muxPosterSrcSet', () => {
  it("matches the widths and addresses next-video's player asks for", () => {
    const asset = toVideoAsset({
      ...sidecar,
      providerMetadata: { mux: { playbackId: 'play-1', thumbnailTime: 3.5 } },
    })!;
    const base = 'https://image.mux.com/play-1/thumbnail.webp';
    expect(muxPosterSrcSet(asset)).toBe(
      [480, 640, 960, 1280, 1600]
        .map((w) => `${base}?time=3.5&width=${w} ${w}w`)
        .concat(`${base}?time=3.5 1920w`)
        .join(','),
    );
  });

  it('leaves the time out when the film uses its midpoint frame', () => {
    const srcSet = muxPosterSrcSet(toVideoAsset(sidecar)!);
    expect(srcSet).not.toContain('time=');
    expect(srcSet.endsWith('https://image.mux.com/play-1/thumbnail.webp 1920w')).toBe(true);
  });
});
