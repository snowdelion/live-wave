# LiveWave - Frontend

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

The type-safe frontend application powering **LiveWave**. Built with **Next.js**, it provides a responsive, type-safe dashboard for real-time infrastructure monitoring.

## Table of Contents

- [Stack](#stack)
- [Features](#features)
- [Security, SEO and Metadata](#security-seo-and-metadata)
- [Quick Start](#quick-start)
- [Testing and Quality Assurance](#testing-and-quality-assurance)
- [Structure](#structure)
- [Architecture and Design Decisions](#architecture-and-design-decisions)

## Stack

| Category           | Technologies                                                             |
| ------------------ | :----------------------------------------------------------------------- |
| **Framework**      | Next.js 15 (App Router), React 19                                        |
| **State and Data** | Zustand, TanStack Query (`react-query`), Custom fetch `request` wrapper  |
| **Forms**          | React Hook Form, `@hookform/resolvers`                                   |
| **Validation**     | Zod                                                                      |
| **Styling and UI** | Tailwind CSS v4, `react-responsive`, Headless UI, Lucide React, Recharts |
| **Testing**        | Vitest, React Testing Library, `jsdom`, `jsdom-testing-mocks`            |
| **Tooling**        | ESLint, Prettier, `cross-env`                                            |

## Features

- **Next.js App Router**: leverages Server Components and optimized routing
- **Feature-Sliced Design (FSD)**: strict architectural boundaries (`shared`, `entities`, `features`, `pages-flat`, `app`) without unnecessary `widgets` layer
- **Data Fetching**: custom `request` wrapper with automatic 401 retry (refresh token logic) and graceful fallback to `/auth` on failure
- **Type Safety**: Zod validation for every API request and response, ensuring frontend state perfectly matches backend contracts
- **Secure Routing**: `middleware.ts` handles declarative route protection, seamlessly redirecting unauthenticated users
- **Centralized State**: Zustand store in the `shared` layer for access token management, enabling reuse across React components and pure TypeScript utilities
- **Error Handling**: `AppError` class (extends native `Error`) standardizes error payloads with `code` and `message` for consistent UI feedback
- **Developer Experience (DX)**: comprehensive Vitest + React Testing Library coverage, strict ESLint/Prettier rules, and absolute import paths

## Security, SEO and Metadata

All metadata, security headers and discoverability files are
centralized in `src/shared/config/` and Next.js Metadata API for easy
maintenance.

### Configuration files

| File                            | Purpose                                                         |
| ------------------------------- | --------------------------------------------------------------- |
| `src/shared/config/metadata.ts` | `METADATA` (title template, Open Graph, Twitter) and `VIEWPORT` |
| `src/shared/config/json-ld.ts`  | `JSON_LD` structured data (`WebSite` type)                      |
| `src/shared/config/fonts.ts`    | `fontVariables` for `next/font`                                 |
| `src/app/robots.ts`             | generates `/robots.txt` (allow `/`, disallow `/dashboard/`)     |
| `src/app/sitemap.ts`            | generates `/sitemap.xml`                                        |
| `public/llms.txt`               | machine-readable site summary for AI agents                     |
| `public/dashboard-preview.jpg`  | `1200x630` image used as Open Graph and Twitter card            |

### Middleware and route protection

`src/middleware.ts` declaratively protects private routes:

- Redirects unauthenticated users to `/auth` (no refresh token cookie)
- Redirects authenticated users from `/auth` back to `/dashboard`
- Bypasses auth checks for static assets, `robots.txt`, `sitemap.xml`,
  `llms.txt`, images and API routes via `config.matcher`

### Security headers

Configured via `headers()` in `next.config.ts`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (enforcing in production, report-only in development) with
  Telegram OAuth support
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` in
  production only

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environments and provide your keys
cp .env.example .env.local

# 3. Start development server with Turbopack
pnpm dev
```

## Testing and Quality Assurance

### Vitest

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage report
pnpm test:cov
```

### Code Quality

```bash
# Run TypeScript check, Prettier formatting, and ESLint
pnpm validate
```

## Structure

The project follows an adapted Feature-Sliced Design (FSD), integrated with Next.js App Router.

### Source (`src/`)

- `app/` - Next.js routing entry points (re-exports from `pages-flat/`)
- `pages-flat/` - actual page components (kept flat to avoid deep nesting and legacy Pages router conflicts)
- `shared/` - reusable utilities
- `entities/` - core entities (e.g., monitors, users, auth); contains data models and API hooks and fetchers (uses `request`)
- `features/` - user interactions and actions; combines `entities/` and `shared/`

<details>
<summary><i><code>shared/</code> layer details</i></summary>

- `api/` - custom `request` wrapper, `AppError` class, constants, etc.
- `lib/` - general helpers
- `test-utils/` - reusable mocks
- `ui/` - base UI components

</details>

## Architecture and Design Decisions

1. **Why FSD without the widgets layer?**<br>
   Combining complex UI directly into features or composing them on the `pages-flat/` level keeps the architecture lean and easier to navigate.

2. **Why `pages-flat/` outside `app/`?**<br>
   A flat structure in `pages-flat` prevents deeply nested directories (e.g., `app/dashboard/[id]/page.tsx`) and conflicts with the legacy Pages router (`pages/`).

3. **Why a custom fetcher and Zustand for auth?**<br>
   Storing the token in a shared Zustand store allows the custom request wrapper to seamlessly read the token, attempt a refresh, update the store, and retry the original request without UI flickering.

4. **Why Zod on every request/response?**<br>
   It guarantees type safety. Even if the backend Swagger is correct, runtime validation ensures that malformed data never crashes the UI.

---

For root commands and infrastructure setup, refer to the [Root README](../README.md)
