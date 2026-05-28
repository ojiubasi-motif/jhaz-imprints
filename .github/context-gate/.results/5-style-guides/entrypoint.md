# Entrypoint Styleguide

## Unique Patterns
- **Pipeline Layout**: The gateway entrypoint (`server.js`) must clearly lay out the entire middleware execution pipeline in a linear sequence.
- **Explanatory Pipeline JSDoc**: Must document the sequence numbering and reasoning for each middleware layer (e.g. why CORS goes before Rate Limiting, etc.).
- **Startup Diagnostics Logs**: Must log the downstream service URLs on boot to standard output to help diagnose DNS or host mapping issues.
