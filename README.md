# Server Buffer Monitoring & Network Access Control (SBM-NAC)

A full-stack application for monitoring server resource usage (CPU, RAM, disk, buffer)
in real time and controlling network access for registered devices (allow/block by
IP/MAC), built with Next.js, Express.js, Prisma, and PostgreSQL.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, Zustand, Recharts |
| Backend | Express.js, Clean Architecture, Socket.io |
| Database | PostgreSQL via Prisma ORM (built for Neon's free tier — see `DEPLOYMENT.md`) |
| Auth | JWT (access + refresh tokens), bcrypt |
| Validation | Zod |
| Logging | Pino |
| Language | TypeScript everywhere, `strict` mode |

## Monorepo layout

```
sbm-nac/
├── apps/
│   ├── web/                 Next.js 15 (App Router) frontend
│   └── api/                 Express.js REST + WebSocket backend, Clean Architecture
├── packages/
│   └── shared-types/        DTOs, enums, and Zod schemas shared by web and api
├── deploy/
│   └── nginx.sbm-nac.conf.example   Reverse proxy config for the self-hosted path
├── docker-compose.yml       Self-hosted deployment (see DEPLOYMENT.md)
├── fly.toml                 Optional low-cost paid alternative to Render
├── tsconfig.base.json       Shared TypeScript compiler options
└── package.json             npm workspaces root
```

## Prerequisites

- **Node.js `>=20.0.0`** (declared in every `package.json`'s `engines` field)
- **npm `>=10`** (bundled with Node 20; required for npm workspaces support)
- **Git**
- A C/C++ build toolchain (`build-essential` on Debian/Ubuntu, Xcode Command Line
  Tools on macOS, or Visual Studio Build Tools on Windows) — required because
  `apps/api` depends on `bcrypt`, which compiles a native addon on install
- A PostgreSQL database — for local development, either run Postgres locally or use a
  free [Neon](https://neon.tech) project (no credit card required); see `DEPLOYMENT.md`

## Getting started

```bash
git clone <your-repository-url> sbm-nac
cd sbm-nac
npm install                                          # installs all workspaces
npm run build --workspace=packages/shared-types       # required before apps/api or apps/web will resolve @sbm-nac/shared-types
cp apps/api/.env.example apps/api/.env                 # then fill in real secrets + DATABASE_URL
cp apps/web/.env.local.example apps/web/.env.local
cd apps/api && npx prisma generate && npx prisma migrate dev --name init && npx prisma db seed
cd ../.. && npm run dev
```

Generate real JWT secrets instead of the placeholders in `.env.example`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

This repository uses npm workspaces, so a single `npm install` at the root installs
dependencies for `apps/api`, `apps/web`, and `packages/shared-types` together, and
links `@sbm-nac/shared-types` between them automatically — never run `npm install`
inside `apps/api` or `apps/web` individually. `packages/shared-types` is a real
workspace, not a path alias, so it must be built (`npm run build --workspace=packages/shared-types`)
at least once, and rebuilt after any change to its `src/`, before either app resolves it.

`apps/api`'s `dev` and `build` scripts run `prisma generate` automatically first
(via `predev`/`prebuild` hooks), so the generated Prisma Client stays in sync with
`prisma/schema.prisma` without a separate manual step on every change.

## Common scripts (run from repo root)

| Script | Description |
| --- | --- |
| `npm install` | Installs all workspace dependencies |
| `npm run dev` | Runs the API and web app concurrently |
| `npm run dev:api` | Runs only the Express API in watch mode |
| `npm run dev:web` | Runs only the Next.js dev server |
| `npm run build` | Builds shared-types, then api, then web, in order |
| `npm run lint` | Lints both apps |
| `npm run format` | Formats the whole repo with Prettier |

## Environment variables

Full variable-by-variable documentation, including which values must change before a
production deploy, lives in [`DEPLOYMENT.md`](./DEPLOYMENT.md#environment-variables---production-checklist).
In short:

- `apps/api/.env` — Postgres `DATABASE_URL`, JWT secrets/expiry, CORS origin, metric
  sample interval, log level, seed admin credentials, optional NAC agent secret.
- `apps/web/.env.local` — `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL` for the
  frontend to reach the API over REST and WebSocket.

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for a full guide to deploying for free without
a credit card (Neon + Render + Vercel), plus a self-hosted Docker Compose path for
running everything on your own machine or VM.

## Project status

All phases complete: architecture, database schema, backend (Clean Architecture,
JWT auth, Socket.io live metrics, NAC device allow/block, Web Drive simulation),
frontend (Next.js App Router, dark/light mode, live charts), API integration,
database seeding, and a verified-where-possible deployment guide. See `DEPLOYMENT.md`
for the handful of things that could only be verified up to the point where this
project's sandboxed build environment couldn't reach the public internet (Prisma's
engine binaries, Google Fonts, Docker Hub) — each is called out explicitly at the
point it applies, with what to check once you run it somewhere unrestricted.
