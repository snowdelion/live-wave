import baseConfig from '../eslint.config.mjs'
import globals from 'globals'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { settings } from 'cluster'
import ignores from 'eslint-plugin-prettier/recommended'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default [
  ...baseConfig,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    ignores: [
      'vitest.config.mts',
      'vitest.setup.ts',
      'dist',
      'node_modules',
      'build',
      'coverage',
      'commitlint.config.js',
      'eslint.config.mjs',
      'prisma.config.ts',
    ],
  },

  {
    files: ['vitest.config.mts', 'vitest.setup.ts', 'prisma.config.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },

  // nestjs
  {
    files: ['*.controller.ts', '*.module.ts', '*.service.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },

  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  {
    files: ['vitest.config.mts', 'vitest.setup.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false,
      },
    },
  },
]
