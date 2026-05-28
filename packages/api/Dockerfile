# ─────────────────────────────────────────────
# Base: pnpm on Alpine
# ─────────────────────────────────────────────
FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# ─────────────────────────────────────────────
# Stage 1: Build
# ─────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Copy lockfile + all package manifests first (layer cache)
COPY pnpm-lock.yaml        ./
COPY pnpm-workspace.yaml   ./
COPY package.json          ./
COPY packages/shared/package.json               ./packages/shared/
COPY packages/catalog-db/package.json           ./packages/catalog-db/
COPY packages/db/package.json                   ./packages/db/
COPY packages/api/package.json                  ./packages/api/

# Install ALL dependencies (dev included) directly in this stage.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source files (node_modules + dist excluded by .dockerignore)
COPY packages/shared/          ./packages/shared/
COPY packages/catalog-db/      ./packages/catalog-db/
COPY packages/db/              ./packages/db/
COPY packages/api/             ./packages/api/
COPY tsconfig*.json            ./

# Generate Prisma Client for builder
RUN pnpm --filter @jhaz-imprints/db run db:generate

# Build workspace dependencies and api service
RUN pnpm --filter @jhaz-imprints/shared          run build
RUN pnpm --filter @jhaz-imprints/catalog-db      run build
RUN pnpm --filter @jhaz-imprints/api             run build

# Deploy to self-contained folder with only production dependencies
RUN pnpm --filter @jhaz-imprints/api --prod deploy /app/out

# Generate prisma client inside the deployed folder for production
RUN cd /app/out && npx prisma@5.22.0 generate --schema=./node_modules/@jhaz-imprints/db/prisma/schema.prisma

# ─────────────────────────────────────────────
# Stage 2: Production image (lean)
# ─────────────────────────────────────────────
FROM base AS production

WORKDIR /app

ENV NODE_ENV=production

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy isolated production package from builder stage and set ownership
COPY --from=builder --chown=appuser:appgroup /app/out .

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server.js"]
