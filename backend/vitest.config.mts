import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const tsconfigPaths = require('vite-tsconfig-paths').default

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',

    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,js,mts,mjs}'],
    exclude: ['**/node_modules/**', '**/dist/**'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,js}'],
      exclude: [
        '**/node_modules/**',
        '**/*.{test,spec}.{ts,js,mts,mjs}',
        'vitest.config.mts',
        'vitest.setup.ts',
        '**/index.ts',
        '**/*.module.ts',
      ],
    },

    testTimeout: 10_000,
  },

  resolve: {
    alias: {
      '@/backend': resolve(__dirname, './src'),
    },
  },
})
