const withMDX = require("@next/mdx")({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  experimental: {
    mdxRs: true,
    outputFileTracingRoot: undefined,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
  outputFileTracingExcludes: {
    '*': [
      // Exclude cache and store directories
      '.next/cache/**',
      // Exclude source files not needed for runtime
      'axismaps.webflow/**',
      'webflow-cms/**',
      'scripts/**',
      'test/**',
      'coverage/**',
      // Exclude test files
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      // Exclude dev dependencies from node_modules/.pnpm
      'node_modules/.pnpm/@vitejs+plugin-react*/**',
      'node_modules/.pnpm/vitest*/**',
      'node_modules/.pnpm/@testing-library*/**',
      'node_modules/.pnpm/@vitest*/**',
      'node_modules/.pnpm/happy-dom*/**',
      'node_modules/.pnpm/msw*/**',
      'node_modules/.pnpm/eslint*/**',
      'node_modules/.pnpm/@eslint*/**',
      'node_modules/.pnpm/@typescript-eslint*/**',
      'node_modules/.pnpm/typescript@*/**',
      // Exclude unused platform binaries
      'node_modules/.pnpm/@next+swc-darwin-x64*/**',
      'node_modules/.pnpm/@next+swc-linux*/**',
      'node_modules/.pnpm/@next+swc-win32*/**',
      'node_modules/.pnpm/@esbuild+darwin-x64*/**',
      'node_modules/.pnpm/@esbuild+linux*/**',
      'node_modules/.pnpm/@esbuild+win32*/**',
      'node_modules/.pnpm/lightningcss-darwin-x64*/**',
      'node_modules/.pnpm/lightningcss-linux*/**',
      'node_modules/.pnpm/lightningcss-win32*/**',
      'node_modules/.pnpm/@img+sharp-*/**',
    ],
  },
  // Optimize production builds
  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,
  // Optimize bundle size
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error on build --> Error: Can't resolve 'fs'
      config.resolve.fallback = {
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
};

module.exports = withMDX(nextConfig);
