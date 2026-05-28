# Infrastructure Styleguide

## Unique Patterns
- **Multi-Stage Lean Image**: The Dockerfile uses `node:20-alpine`, installs dependencies in a builder stage, and copies only clean production outputs to the final runner image.
- **Security-First Execution**: Creates a specific Alpine non-root user `appuser` and group `appgroup` to execute the node server process.
- **Embedded Health Check**: Configures a container health check using `wget` to query `/health` every 30 seconds.
