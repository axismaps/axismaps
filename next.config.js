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
  outputFileTracingExcludes: {
    '*': [
      '.pnpm-store',
      'node_modules/.pnpm',
      '.next/cache',
      'axismaps.webflow',
      'webflow-cms',
      'scripts',
      'test',
      'coverage',
      // Exclude development dependencies
      'node_modules/.pnpm/@vitejs*',
      'node_modules/.pnpm/vitest*',
      'node_modules/.pnpm/@testing-library*',
      'node_modules/.pnpm/@types*',
      'node_modules/.pnpm/happy-dom*',
      'node_modules/.pnpm/msw*',
      'node_modules/.pnpm/eslint*',
      'node_modules/.pnpm/typescript*',
      // Exclude platform-specific binaries we don't need
      'node_modules/.pnpm/@next/swc-darwin-x64*',
      'node_modules/.pnpm/@next/swc-linux*',
      'node_modules/.pnpm/@next/swc-win32*',
      'node_modules/.pnpm/@esbuild/darwin-x64*',
      'node_modules/.pnpm/@esbuild/linux*',
      'node_modules/.pnpm/@esbuild/win32*',
      'node_modules/.pnpm/lightningcss-darwin-x64*',
      'node_modules/.pnpm/lightningcss-linux*',
      'node_modules/.pnpm/lightningcss-win32*',
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
