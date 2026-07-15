# syntax=docker/dockerfile:1
#
# Build context is the MONOREPO ROOT (same reasoning as apps/api/Dockerfile):
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1 \
#     --build-arg NEXT_PUBLIC_WS_URL=https://api.yourdomain.com \
#     -t sbm-nac-web .
#
# NEXT_PUBLIC_* variables are baked into the client JS bundle at BUILD time, not read at
# container startup — they must be passed as build args, not just runtime env vars.

FROM node:20-bookworm-slim AS build
WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN npm ci

COPY packages/shared-types packages/shared-types
COPY apps/web apps/web
RUN npm run build --workspace=packages/shared-types

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
RUN npm run build --workspace=apps/web

# ---- Runtime stage ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN groupadd -r sbmnac && useradd -r -g sbmnac sbmnac

# `output: 'standalone'` (next.config.ts) traces only the files actually needed to run and
# copies them here — this is a fraction of the full node_modules tree.
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public

USER sbmnac
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "apps/web/server.js"]
