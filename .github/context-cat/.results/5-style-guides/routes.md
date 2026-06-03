# Routes Styleguide

## Unique Patterns
- **Complete Logic Delegation**: Route files are purely descriptive. They define the HTTP verb, the URL pattern, and chain middleware (like `asyncHandler(handler)`). They do not parse variables or format responses.
- **Param/Query Documentation**: The top of the route or above the route definition includes JSDoc blocks explaining valid query parameters (e.g., `?category=agbada&gender=men`) and URL structures.
- **Admin Route-Level Middleware**: Admin routers apply `authenticate` and `authorize("ADMIN")` at the router level (via `router.use(...)`) rather than per-route, reducing boilerplate.
- **Separate Admin Routers**: Each resource with admin CRUD gets a dedicated admin route file (e.g. `adminCategories.ts`, `adminFabrics.ts`, `adminProducts.ts`) separate from the public route file.
