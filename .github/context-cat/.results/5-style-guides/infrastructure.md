# Infrastructure Styleguide

## Unique Patterns
- **Multi-stage Docker Builds**: The `Dockerfile` separates building dependencies, compiling the code via `pnpm`, and generating a minimal production layer running as a non-root `appuser`.
- **Inter-service Dependencies**: The `docker-compose.dev.yml` explicitly ties `catalog-service` to a customized Redis and MongoDB instance instead of reusing a shared monolithic database, reflecting strict microservice boundaries.
