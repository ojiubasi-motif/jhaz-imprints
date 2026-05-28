# Middleware Styleguide

## Unique Patterns
- **Independent Modular Interceptors**: Middleware files are completely isolated and focus on one concern (auth verification, rbac validation, request logging).
- **Request State Enrichment**: Modifies the Express `req` object by attaching context properties like `req.user`, `req.userId`, `req.userRole`, and `req.proxyDestination` to pass parameters cleanly down the pipeline.
- **Fail-Fast Error Handling**: Employs early returns that respond immediately with JSON errors and appropriate HTTP status codes (e.g. 401, 403) to prevent request leaks.
