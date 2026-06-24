import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    css: false,

    setupFiles: [path.resolve(__dirname, './vitest.setup.ts')],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/.next/**'],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/index.ts',
        '**/*.types.ts',
        '**/*.dto.ts',
        '**/types/**',
        '**/assets/**',
        'src/app/providers/**',
        '**/*.d.ts',
        'vitest.config.mts',
        'vitest.setup.ts',
        '**/*.{test,spec}.{ts,tsx}',
      ],
    },

    testTimeout: 10_000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
