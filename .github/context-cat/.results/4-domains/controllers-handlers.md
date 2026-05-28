# Controllers/Handlers Domain Implementation

The `controllers-handlers` domain is responsible for taking Express `Request` objects, extracting data, delegating to services, and formatting the `Response`.

## Consistent Patterns
- **Thin Handlers**: Handlers contain absolutely no core business logic or database queries.
- **Consistent Response Formatting**: All responses follow a standard envelope containing `msg`, `data`, `type`, and `code`.
- **Async Handling**: All handlers are async and are expected to be wrapped in an `asyncHandler` to safely catch unhandled rejections.

## Code Examples

**Example Handler (`src/handlers/products.ts`):**
```typescript
import type { Request, Response } from "express";
import * as productService from "../services/productService";

export async function listProductsHandler(req: Request, res: Response) {
  const { category, search, page, limit } = req.query;

  const result = await productService.listProducts({
    category: category as string | undefined,
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
