# Controllers/Handlers Domain Implementation

The `controllers-handlers` domain is responsible for taking Express `Request` objects, extracting data, delegating to services, and formatting the `Response`.

## Consistent Patterns
- **Thin Handlers**: Handlers contain absolutely no core business logic or database queries.
- **Consistent Response Formatting**: All responses follow a standard envelope containing `msg`, `data`, `type`, and `code`.
- **Async Handling**: All handlers are async and are expected to be wrapped in an `asyncHandler` to safely catch unhandled rejections.
- **Combined Handler Files**: When a resource has both public and admin operations (e.g. categories, fabrics), both sets of handlers live in a single file with clear section comments (`// Public` / `// Admin`).
- **Admin Handlers use `AuthenticatedRequest`**: Admin handlers import `AuthenticatedRequest` from the authenticate middleware for the typed `req.user` property.

## Code Examples

**Public Handler (`src/handlers/products.ts`):**
```typescript
import type { Request, Response } from "express";
import * as productService from "../services/productService";

export async function listProductsHandler(req: Request, res: Response) {
  const { category, gender, occasion, search, page, limit } = req.query;

  const result = await productService.listProducts({
    category: category as string | undefined,
    gender: gender as string | undefined,
    occasion: occasion as string | undefined,
    search: search as string | undefined,
    page: page ? Math.max(1, parseInt(page as string, 10)) : 1,
    limit: limit ? parseInt(limit as string, 10) : 12,
  });

  res.json({
    msg: "products list",
    data: result,
    type: "SUCCESS",
    code: 600
  });
}
```

**Admin Handler with Catalog Event (`src/handlers/fabrics.ts`):**
```typescript
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as adminFabricService from "../services/adminFabricService";
import { publishCatalogEvent } from "../redis";

export async function createFabricHandler(req: AuthenticatedRequest, res: Response) {
  const fabric = await adminFabricService.createFabric(req.body);
  await publishCatalogEvent("FABRIC_CREATED", fabric);
  res.status(201).json({
    msg: "fabric created",
    data: fabric,
    type: "SUCCESS",
    code: 600,
  });
}
```

**Synchronous Handler (`src/handlers/categories.ts`):**
```typescript
export function getCategoriesHandler(_req: Request, res: Response) {
  const categories = categoryService.getCategories();
  res.json({
    msg: "categories list",
    data: { categories },
    type: "SUCCESS",
    code: 600,
  });
}
```
