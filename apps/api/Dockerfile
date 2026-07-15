# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT, not apps/api — this is an npm workspace, so `npm ci`
# needs to see every workspace's package.json to resolve @sbm-nac/shared-types correctly.
#   docker build -f apps/api/Dockerfile -t sbm-nac-api .

FROM node:20-bookworm-slim AS build
WORKDIR /repo

# Prisma's query engine needs OpenSSL at both generate-time and runtime on Debian slim.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better layer caching — this layer only invalidates when a
# package.json changes, not on every source edit).
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci

COPY packages/shared-types packages/shared-types
COPY apps/api apps/api
RUN npm run build --workspace=packages/shared-types

WORKDIR /repo/apps/api
# DATABASE_URL only needs to be a resolvable, syntactically valid Postgres URL at
# generate-time — Prisma doesn't actually connect to it during `generate`.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/generate_time_placeholder"
RUN npx prisma generate
RUN npm run build

# ---- Runtime stage: a fresh image with no build tooling, only what's needed to run ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -r sbmnac && useradd -r -g sbmnac -d /repo sbmnac

WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages/shared-types ./packages/shared-types
COPY --from=build /repo/apps/api ./apps/api
RUN chown -R sbmnac:sbmnac /repo

WORKDIR /repo/apps/api
USER sbmnac
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
