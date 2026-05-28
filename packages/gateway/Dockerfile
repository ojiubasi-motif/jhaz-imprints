# ─────────────────────────────────────────────
# Base: node:20-alpine with corepack (pnpm is
# NOT used here — gateway is standalone npm).
# ─────────────────────────────────────────────
FROM node:20-alpine AS base

# ─────────────────────────────────────────────
# Stage 1: Builder
# Install ALL dependencies (including dev) so
# that npm install works in a single layer.
# ─────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Copy package manifest first — layer-cached as long as
# package.json doesn't change.
COPY packages/gateway/package.json ./

# Install all dependencies
RUN npm install

# Copy gateway source files
COPY packages/gateway/server.js     ./
COPY packages/gateway/routes        ./routes
COPY packages/gateway/lib           ./lib
COPY packages/gateway/middleware    ./middleware

# ─────────────────────────────────────────────
# Stage 2: Production image (lean)
# Only production dependencies, no devDeps.
# ─────────────────────────────────────────────
FROM base AS production

WORKDIR /app

# Non-root user for security (follows docker.prompt.md principle)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy source files from builder
COPY --from=builder /app/server.js      ./
COPY --from=builder /app/routes         ./routes
COPY --from=builder /app/lib            ./lib
COPY --from=builder /app/middleware     ./middleware
COPY --from=builder /app/package.json   ./

# Production-only install
RUN npm install --omit=dev

USER appuser

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
