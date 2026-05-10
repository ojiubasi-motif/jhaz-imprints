# Style Guide: Express Routes

## Unique Conventions
- Route files create a `Router()` instance and export it as `default`
- Routes compose middleware via chaining: `authenticate` → `validateBody(schema)` → `asyncHandler(handler)`
- All async handlers are wrapped with `asyncHandler()` — never raw async functions on route definitions
- Handler functions are imported as namespace: `import * as orderHandlers from "../handlers/orders"`
- Admin routes apply auth at router level via `router.use(authenticate, authorize("ADMIN"))` before individual routes
- Public routes (products) have no auth middleware
- JSDoc block comments document HTTP method, path, and query params above each route
- Route files are named after their domain: `orders.ts`, `auth.ts`, `products.ts`, `uploads.ts`, `adminProducts.ts`
