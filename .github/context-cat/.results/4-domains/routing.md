# Routing Domain Implementation

The `routing` domain in this project uses standard Express routing conventions. Routes are declared in `src/routes/` and mounted in `src/server.ts`.

## Consistent Patterns
- **Separation from Business Logic**: Routes are defined in isolation and delegate to handlers using `asyncHandler`.
- **Modularity**: Each resource has its own router file. Admin routes are split into separate files (e.g. `adminProducts.ts`, `adminCategories.ts`, `adminFabrics.ts`).
- **Public vs Admin Mounting**: Public routes are mounted at `/api/v1/{resource}`. Admin routes are mounted at `/api/v1/admin/{resource}` and apply `authenticate` + `authorize("ADMIN")` middleware at the router level.

## Code Examples

**Mounting in `src/server.ts`:**
```typescript
import categoryRouter from './routes/categories';
import adminCategoryRouter from './routes/adminCategories';
import fabricRouter from './routes/fabrics';
import adminFabricRouter from './routes/adminFabrics';
import productRouter from './routes/products';
import adminProductRouter from './routes/adminProducts';

// Public routes
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/fabrics', fabricRouter);
app.use('/api/v1/products', productRouter);

// Admin routes
app.use('/api/v1/admin/categories', adminCategoryRouter);
app.use('/api/v1/admin/fabrics', adminFabricRouter);
app.use('/api/v1/admin/products', adminProductRouter);
```

**Admin Route with Router-level Auth (`src/routes/adminFabrics.ts`):**
```typescript
import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../utils/asyncHandler";
import * as fabricHandlers from "../handlers/fabrics";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.post("/", asyncHandler(fabricHandlers.createFabricHandler));
router.put("/:id", asyncHandler(fabricHandlers.updateFabricHandler));
router.delete("/:id", asyncHandler(fabricHandlers.deleteFabricHandler));

export default router;
```
