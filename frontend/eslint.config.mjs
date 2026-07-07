import { dirname } from 'path'
import { fileURLToPath } from 'url'
import baseConfig from '../eslint.config.mjs'
import nextPlugin from '@next/eslint-plugin-next'
import reactPlugin from 'eslint-plugin-react'
import hooksPlugin from 'eslint-plugin-react-hooks'
import featureSlicedPlugin from '@conarti/eslint-plugin-feature-sliced'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default [
  ...baseConfig,

  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    plugins: {
      '@next/next': nextPlugin,
      react: reactPlugin,
      'react-hooks': hooksPlugin,
      '@conarti/feature-sliced': featureSlicedPlugin,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',

      '@conarti/feature-sliced/layers-slices': 'error',
      '@conarti/feature-sliced/absolute-relative': 'error',
      '@conarti/feature-sliced/public-api': 'error',

      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [
            {
              pattern: '@/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
      'import/no-duplicates': 'error',
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },

  {
    files: ['**/*.test.tsx', '**/*.test.ts'],
    rules: {
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },

  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'build/**',
      'out/**',
      'next-env.d.ts',
      'postcss.config.mjs',
    ],
  },
]
