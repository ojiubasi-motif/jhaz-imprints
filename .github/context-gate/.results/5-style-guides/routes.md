# Routes Styleguide

## Unique Patterns
- **Longest-Prefix Map Registry**: The route configuration manages the `SERVICE_MAP` where all downstream destinations are defined as environment variables.
- **Prefix Matcher Function**: Contains the `resolveService` function inside the routes file to determine matching microservices based on the longest matching path prefix.
- **Express 5 Route Wildcarding**: Captures all endpoints under `/api/*splat` for clean delegation.
