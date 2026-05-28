# Configuration Styleguide

## Unique Patterns
- **Stateless Package Manifest**: `package.json` must be self-contained and list only runtime requirements like Express, rate limiting, and jsonwebtoken. It should avoid bundlers or compilation chains.
- **Dockerignore Exclusions**: `.dockerignore` must prevent environment secrets (`.env`) or local `node_modules` from being baked into the build image.
