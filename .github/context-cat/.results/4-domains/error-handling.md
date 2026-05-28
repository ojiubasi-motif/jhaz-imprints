# Error Handling Domain Implementation

The `error-handling` domain ensures predictable HTTP status codes and payloads when application logic fails.

## Consistent Patterns
- **Custom Error Class**: `AppError` is used to throw named errors with specific HTTP status codes.
- **Async Wrapper**: `asyncHandler` wraps route handlers to forward unhandled promise rejections directly to Express' `next()` middleware.

## Code Examples

**Throwing an Error (`src/services/productService.ts`):**
```typescript
import { AppError } from "../errors/AppError";

if (!product) {
  throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
}
```

**Catching Async Errors (`src/routes/products.ts`):**
```typescript
import { asyncHandler } from "../utils/asyncHandler";
import * as productHandlers from "../handlers/products";

router.get(
  "/:idOrSlug",
  asyncHandler(productHandlers.getProductHandler)
);
```
