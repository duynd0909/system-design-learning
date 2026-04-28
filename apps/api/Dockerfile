# syntax=docker/dockerfile:1
# Build context: repo root (required for npm workspace packages)

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy manifests first for layer caching
COPY package*.json ./
COPY tsconfig.base.json ./
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/game-engine/package*.json ./packages/game-engine/
COPY apps/api/package*.json ./apps/api/

RUN npm ci

# Copy full source
COPY packages/shared-types ./packages/shared-types
COPY packages/game-engine  ./packages/game-engine
COPY apps/api              ./apps/api

# Build shared packages in dependency order, then the API
RUN npm run build --workspace=@stackdify/shared-types && \
    npm run build --workspace=@stackdify/game-engine  && \
    cd apps/api && npx prisma generate                 && \
    npm run build --workspace=@stackdify/api

# ── Stage 2: Runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
ENV NODE_ENV=production

WORKDIR /app

# Root package.json needed for workspace resolution
COPY --from=builder /app/package.json ./package.json

# Hoisted node_modules (includes workspace symlinks → point into /app/packages/*)
COPY --from=builder /app/node_modules ./node_modules

# Workspace package dirs (symlink targets — must match node_modules symlink paths)
COPY --from=builder /app/packages/shared-types/dist        ./packages/shared-types/dist
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=builder /app/packages/game-engine/dist         ./packages/game-engine/dist
COPY --from=builder /app/packages/game-engine/package.json  ./packages/game-engine/package.json

# API compiled output and Prisma schema/migrations
COPY --from=builder /app/apps/api/dist    ./apps/api/dist
COPY --from=builder /app/apps/api/prisma  ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3001

WORKDIR /app/apps/api

CMD ["node", "dist/main.js"]
