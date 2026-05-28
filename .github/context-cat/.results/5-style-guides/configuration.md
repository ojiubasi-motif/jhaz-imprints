# Configuration Styleguide

## Unique Patterns
- **Build Output**: `tsup.config.ts` is explicitly configured to bundle the entire Express app into a single ESM file (`dist/server.js`) rather than preserving the source file structure, which optimizes it for production Docker containers.
- **Monorepo Dependency Syntax**: `package.json` relies on `workspace:*` dependencies for internal libraries (`@jhaz-imprints/catalog-db`, `@jhaz-imprints/shared`) instead of specific versions.
