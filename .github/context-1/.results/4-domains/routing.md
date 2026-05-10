# Routing Domain — Deep Dive

## Overview
Jhaz-imprints uses a three-tier routing architecture: Express.js for the API, Next.js App Router for the customer storefront, and query-parameter routing for the Vite admin dashboard.

## Express API Routing

### Route Registration Pattern
All routes are defined as `Router()` instances in `packages/api/src/routes/` and mounted on the Express app in `app.ts`:

```typescript
// packages/api/src/app.ts
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/v1/admin/uploads", uploadsRouter);
app.use("/api/v1/admin/products", adminProductsRouter);
```

### Route → Handler → Service Pattern
Routes are **thin**: they compose middleware and delegate to handler functions. Handlers call services. Business logic lives exclusively in services.

```typescript
// packages/api/src/routes/orders.ts
router.post(
  "/",
  authenticate,                      // 1. Auth middleware
  validateBody(OrderCreateSchema),    // 2. Zod validation middleware
  asyncHandler((req: AuthenticatedRequest, res) =>  // 3. Wrapped handler
    orderHandlers.createOrderHandler(req, res)
  )
);
```

### asyncHandler Wrapper
All async route handlers are wrapped with `asyncHandler()` to automatically catch Promise rejections and forward them to Express error middleware:

```typescript
// packages/api/src/utils/asyncHandler.ts
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

### URL Prefix Convention
- `/api/` — Public and customer-authenticated endpoints
- `/api/v1/admin/` — Admin-only endpoints (versioned)

### Admin Route Guard Pattern
Admin routes apply auth middleware at the router level, so all routes on the router are automatically protected:

```typescript
// packages/api/src/routes/adminProducts.ts
router.use(authenticate, authorize("ADMIN"));
router.post("/", asyncHandler(adminProductHandlers.createProductHandler));
router.put("/:id", asyncHandler(adminProductHandlers.updateProductHandler));
router.delete("/:id", asyncHandler(adminProductHandlers.deleteProductHandler));
```

## Next.js App Router (apps/web)

### File-Based Routing
The storefront uses Next.js 14 App Router with file-based routing:

- `src/app/page.tsx` → `/` (homepage)
- `src/app/checkout/page.tsx` → `/checkout`
- `src/app/layout.tsx` → Root layout (wraps all pages)

### BFF Proxy Pattern
Next.js API routes act as Backend-for-Frontend proxies to the Express API:

```typescript
// apps/web/src/app/api/v1/orders/route.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const authHeader = request.headers.get("Authorization");
  const res = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(authHeader && { Authorization: authHeader }) },
    body: JSON.stringify(body),
  });
  // Forward response...
}
```

## Vite Admin Dashboard (apps/admin)

### Query Parameter Routing
The admin dashboard uses URL query parameters for view switching (no router library):

```typescript
// apps/admin/src/main.tsx
const currentView = new URLSearchParams(window.location.search).get("view") || "orders";
// Views: ?view=orders | ?view=analytics | ?view=products
```

Navigation uses plain `<a>` tags with query strings:

```tsx
<a href="?view=orders" className={currentView === "orders" ? "bg-primary text-white" : "..."}>
  Order Queue
</a>
```
