# Routes Styleguide

## Unique Patterns
- **Complete Logic Delegation**: Route files are purely descriptive. They define the HTTP verb, the URL pattern, and chain middleware (like `asyncHandler(handler)`). They do not parse variables or format responses.
- **Param/Query Documentation**: The top of the route or above the route definition includes JSDoc blocks explaining valid query parameters (e.g., `?category=agbada`) and URL structures.
