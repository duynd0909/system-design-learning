# syntax=docker/dockerfile:1
# Build context: repo root (required for npm workspace packages)

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY apps/web/package*.json ./apps/web/

RUN npm ci

# Copy root tsconfig needed by shared-types
COPY tsconfig.base.json ./

# Copy full source
COPY packages/shared-types ./packages/shared-types
COPY apps/web              ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace=@stackdify/shared-types && \
    npm run build --workspace=@stackdify/web

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Root package.json for workspace resolution
COPY --from=builder /app/package.json ./package.json

# Hoisted node_modules (Next.js binary lives here)
COPY --from=builder /app/node_modules ./node_modules

# Workspace shared-types (symlink target)
COPY --from=builder /app/packages/shared-types/dist        ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/package.json

# Built Next.js app
COPY --from=builder /app/apps/web/.next   ./apps/web/.next
COPY --from=builder /app/apps/web/public  ./apps/web/public
COPY --from=builder /app/apps/web/package.json    ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/next.config.mjs

EXPOSE 3000

WORKDIR /app/apps/web

# next reads the runtime port from the PORT environment variable.
CMD ["/app/node_modules/.bin/next", "start"]
