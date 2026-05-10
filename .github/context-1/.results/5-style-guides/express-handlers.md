# Style Guide: Express Handlers

## Unique Conventions
- Handlers are exported as named async functions (not arrow functions)
- Handler function name follows pattern: `{action}{Domain}Handler` (e.g., `createOrderHandler`, `listProductsHandler`)
- Handlers type `req` as `AuthenticatedRequest` when auth is required, or `Request` for public endpoints
- First line checks `if (!req.user)` and throws `AppError("User not authenticated", 401)` for protected routes
- Handlers never catch errors — they throw `AppError` and let centralized middleware format the response
- Exception: auth handlers (`registerHandler`, `loginHandler`) use local try-catch with manual status codes
- Business logic is delegated to service functions: `await orderService.createOrder(req.user.id, req.body)`
- Response status codes: 201 for creation, 200 for reads, 204 for deletes
- Handlers are imported as namespace objects in route files: `import * as handlers from "../handlers/domain"`
