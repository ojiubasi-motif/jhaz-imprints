# ─────────────────────────────────────────────
# Base: pnpm on Alpine
# ─────────────────────────────────────────────
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Copy lockfile + all package manifests first (layer cache — only
# re-runs pnpm install when these files change)
COPY pnpm-lock.yaml        ./
COPY pnpm-workspace.yaml   ./
COPY package.json          ./
COPY packages/shared/package.json               ./packages/shared/
COPY packages/catalog-db/package.json           ./packages/catalog-db/
COPY packages/catalog-service/package.json      ./packages/catalog-service/

# Install ALL dependencies (dev included) directly in this stage.
# pnpm uses symlinks to a virtual store — copying node_modules between
# stages breaks binary resolution, so we install fresh here instead.
# --ignore-scripts skips mongoose-paginate-v2's missing babel postinstall.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source files (node_modules + dist excluded by .dockerignore)
COPY packages/shared/          ./packages/shared/
COPY packages/catalog-db/      ./packages/catalog-db/
COPY packages/catalog-service/ ./packages/catalog-service/
COPY tsconfig*.json            ./

# Build workspace dependencies first, then the service
RUN pnpm --filter @jhaz-imprints/shared          run build
RUN pnpm --filter @jhaz-imprints/catalog-db      run build
RUN pnpm --filter @jhaz-imprints/catalog-service run build

# ─────────────────────────────────────────────
# Stage 2: Production image (lean)
# ─────────────────────────────────────────────
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy manifests + lockfile for prod-only install.
# All workspace package.json files must be present so
# pnpm can resolve workspace:* dependencies correctly.
COPY pnpm-lock.yaml        ./
COPY pnpm-workspace.yaml   ./
COPY package.json          ./
COPY packages/catalog-service/package.json  ./packages/catalog-service/
COPY packages/shared/package.json           ./packages/shared/
COPY packages/catalog-db/package.json       ./packages/catalog-db/

# Prod-only dependency install (no devDependencies)
RUN pnpm install --frozen-lockfile --ignore-scripts --prod

# Copy compiled service output
COPY --from=builder /app/packages/catalog-service/dist \
                    ./packages/catalog-service/dist

# Copy categories.json data file alongside the compiled output.
# categoryService.ts resolves it relative to the compiled server.js (i.e., dist/),
# so it must live at packages/catalog-service/dist/categories.json at runtime.
COPY --from=builder /app/packages/catalog-db/src/data/categories.json \
                    ./packages/catalog-service/dist/categories.json


# Copy built workspace packages into node_modules so the service can resolve them
COPY --from=builder /app/packages/shared/dist \
                    ./node_modules/@jhaz-imprints/shared/dist
COPY --from=builder /app/packages/shared/package.json \
                    ./node_modules/@jhaz-imprints/shared/package.json
COPY --from=builder /app/packages/catalog-db/dist \
                    ./node_modules/@jhaz-imprints/catalog-db/dist
COPY --from=builder /app/packages/catalog-db/package.json \
                    ./node_modules/@jhaz-imprints/catalog-db/package.json

USER appuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "packages/catalog-service/dist/server.js"]