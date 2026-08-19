# LiveWave - Backend

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)

The scalable backend powering **LiveWave**. Built with `NestJS`, it handles asynchronous monitoring jobs, secure authentication, real-time metrics, and rate limiting.

## Table of Contents

- [Stack](#stack)
- [Features](#features)
- [Quick Start](#quick-start)
- [Database Management](#database-management)
- [Testing and Quality Assurance](#testing-and-quality-assurance)
- [API Documentation](#api-documentation)
- [Structure](#structure)
- [Security and Design Decisions](#security-and-design-decisions)

## Stack

| Category           | Technologies                                             |
| ------------------ | :------------------------------------------------------- |
| **Framework**      | NestJS 11                                                |
| **Database & ORM** | PostgreSQL 16, Prisma 6                                  |
| **Queue & Cache**  | Redis, BullMQ, `nestjs-throttler-storage-redis`          |
| **Authentication** | Passport, JWT, bcrypt, `access`/`refresh` tokens         |
| **Observability**  | Winston, `winston-loki`, Prometheus (`prom-client`)      |
| **Validation**     | `class-validator`, `class-transformer`, Zod (env config) |
| **Testing**        | Vitest, `vitest-mock-extend`                             |
| **Tooling**        | Prettier, ESLint, cross-env                              |

## Features

- **Multi-Protocol Monitoring Engine**: supports 4 check types:
  - **HTTP**: standard web availability checks via native `fetch`
  - **ICMP**: low-level ping checks via `node-ping-rs`
  - **TCP**: port availability checks via `net.Socket`
  - **DNS**: resolution checks for 5 record types (`A`, `AAAA`, `MX`, `TXT`, `CNAME`) via `dns/promises`
- **Flexible Configuration**: configurable check intervals (5-60 min) and timeouts (5-30 sec)
- **Asynchronous Job Processing**: heavy lifting (network checks) is offloaded to `BullMQ` workers, ensuring the main API thread remains responsive
- **Intelligent Rate Limiting**:
  - Global default throttler on all endpoints
  - Custom domain-based rate limiting to prevent abuse (e.g., spamming checks on a single target domain)
- **Notifications**: automated Telegram alerts triggered only on status transitions (_up/down_)
- **Secure Authentication**: JWT-based auth with `access`/`refresh` tokens stored in `httpOnly` cookies; includes manual Telegram account linking for authorized users
- **Enterprise Observability**:
  - Custom Winston logger shipping structured JSON logs to `Loki`
  - Native Prometheus metrics integration (`nestjs-prometheus`) for tracking API performance and queue health
- **Data Retention Policy**: automated cleanup of historical check data; records are kept for exactly 31 days (30 days of active data + 1 day buffer for safety)
- **DX**: 100% Swagger documentation for all requests/responses, strict `TypeScript` typing, and comprehensive `Vitest` coverage

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environments and provide your keys
cp .env.example .env.local

# 3. Setup database
pnpm generate
pnpm db:push

# 4. Start development server
pnpm dev
```

## Database Management

| Command         | Description                                            |
| --------------- | ------------------------------------------------------ |
| `pnpm generate` | Generate Prisma Client based on the schema             |
| `pnpm migrate`  | Create and apply a new Prisma migration                |
| `pnpm db:push`  | Push schema changes directly to the DB (for local dev) |
| `pnpm studio`   | Open Prisma Studio GUI to inspect and edit data        |

## Testing and Quality Assurance

### Vitest

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage report (Statements, Branches, Functions, Lines)
pnpm test:cov
```

### Code Quality

```bash
# Run TypeScript check, Prettier formatting, and ESLint
pnpm validate
```

## API Documentation

Once the server is running, detailed Swagger documentation is available at `http://localhost:8000/docs`

> _Every endpoint includes detailed request payloads, response schemas, and possible HTTP status codes_

## Structure

### Root

- `prisma/` - Prisma schemas and migrations
- `src/` - main code source
- `.env.example` - environment variables template

### Source (`src/`)

- `config/` - environment validation (Zod) and global config
- `modules/v1/` - feature modules
- `shared/` - reusable utilities, guards, decorators, and interceptors
- `types/` - global backend types
- `main.ts` - application entry point, Swagger setup, Helmet

<br>

<details>
<summary><i> <code>modules/v1/</code> details</i></summary>

- `auth/` - JWT authentication, Telegram OAuth
- `monitors/` - monitors CRUD
- `monitor-check/` - monitor BullMQ scheduling
- `analytics/` - aggregated timeline, overview and incidents queries
- `users/` - user management and profile
- `health/` - liveness and readiness health checks
- `notifications/` - send notifications to integrated services
  - `telegram/` - link/unlink, notification settings and webhook

</details>

<details>
<summary><i> <code>shared/</code> details</i></summary>

- `bull/` - keys and names constants, safe shutdown
- `cookie/` - cookie parse decorator, set/clear `refreshToken` from the `httpOnly` cookie
- `decorators/` - custom decorators (`@UserId()`)
- `logger/` - custom Winston setup with Loki transport and JSON formatting
- `metrics/` - Prometheus metric definitions
- `prisma/` - Prisma safe startup and shutdown
- `rate-limit/` - custom domain-based rate limiting logic to prevent target abuse
- `redis/` - Redis connection setup and caching service wrappers
- `throttler/` - custom NestJS guard for cleaner error messages
- `utils/` - general helper functions

</details>

## Security and Design Decisions

1. **Why NestJS?**<br>
   NestJS provides a modular, opinionated architecture out of the box.

2. **Why PostgreSQL and Prisma?**<br>
   PostgreSQL guarantees ACID compliance for analytical queries, while Prisma eliminates boilerplate with auto-generated, type-safe database access.

3. **Why BullMQ?**<br>
   Network checks can be slow or hang. Offloading them to Redis-based workers prevents the main API event loop from blocking.

4. **Why Custom Domain Rate Limiting?**<br>
   A malicious user could abuse the system to DDoS a single victim domain. A custom guard tracks check requests per target domain to prevent this specific vector of abuse.

---

For root commands and infrastructure setup, refer to the [Root README](../README.md)
