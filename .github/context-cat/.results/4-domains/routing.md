# Routing Domain Implementation

The `routing` domain in this project uses standard Express routing conventions. Routes are declared in `src/routes/` and mounted in `src/server.ts`.

## Consistent Patterns
- **Separation from Business Logic**: Routes are defined in isolation and delegate to handlers using `asyncHandler`.
- **Modularity**: Different concerns have their own router files (e.g. `products.ts`, `adminProducts.ts`, `uploads.ts`).

## Code Examples

**Mounting in `src/server.ts`:**
```typescript
import productRouter from './routes/products';
import adminProductRouter from './routes/adminProducts';

// Mount routes
app.use('/api/v1/products', productRouter);
app.use('/api/v1/admin/products', adminProductRouter);
```

**Defining Routes (`src/routes/products.ts`):**
```typescript
import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as productHandlers from "../handlers/products";

const router = Router();

router.get(
  "/",
  asyncHandler(productHandlers.listProductsHandler)
);

export default router;
```
