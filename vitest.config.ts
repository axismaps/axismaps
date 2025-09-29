import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '*.config.*',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/*',
        'build/',
        '.next/',
      ],
    },
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'build'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@/components': path.resolve(__dirname, './app/components'),
      '@/lib': path.resolve(__dirname, './app/lib'),
      '@/data': path.resolve(__dirname, './data'),
    },
  },
});