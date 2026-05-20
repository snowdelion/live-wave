import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import importPlugin from 'eslint-plugin-import'
import globals from 'globals'

export default tseslint.config(
  {
    ignores: [
      'build',
      'coverage',
      'dist',
      '.next',
      'node_modules',
      'eslint.config.mjs',
      '**/vitest.config.mts',
      '**/vitest.setup.ts',
      'vitest.workspace.ts',
      'prisma.config.ts',
    ],
  },

  {
    files: ['**/vitest.config.mts', '**/vitest.setup.ts', 'vitest.workspace.ts', '*.config.ts'],
    languageOptions: { parserOptions: { projectService: false } },
  },

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: { parserOptions: { projectService: true } },
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,

  {
    languageOptions: {
      globals: { ...globals.es2021 },
    },
    plugins: { import: importPlugin },

    rules: {
      // typescript
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      // common
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',

      // prettier
      'prettier/prettier': ['error', { endOfLine: 'auto' }],

      // import
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/no-duplicates': 'error',
    },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },
  },
)
