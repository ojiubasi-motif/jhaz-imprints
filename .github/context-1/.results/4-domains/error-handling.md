# Error Handling Domain — Deep Dive

## Overview
Error handling follows a centralized middleware pattern with a custom `AppError` class for operational errors. The `asyncHandler` utility ensures all async route handlers forward rejections to the error middleware.

## AppError Class

```typescript
// packages/api/src/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
```

Usage examples:
```typescript
throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
throw new AppError("Validation failed: ...", 400, "VALIDATION_ERROR");
throw new AppError("Forbidden", 403);
```

## Centralized Error Middleware

```typescript
// packages/api/src/app.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[App] Error:", err);
  if (isAppError(err)) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  res.status(500).json({ error: "Internal server error" });
});
```

## 404 Handler
A final catch-all route returns 404 for unmatched requests:
```typescript
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});
```

## asyncHandler Utility
Wraps async route handlers so Promise rejections automatically flow to the error middleware:

```typescript
// packages/api/src/utils/asyncHandler.ts
export function asyncHandler(fn: (...) => Promise<void> | void) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

## Error Response Shapes
- **AppError**: `{ error: string, code?: string }` with appropriate HTTP status
- **Unknown error**: `{ error: "Internal server error" }` with 500 status
- **Validation error**: `{ error: "Validation failed: {details}", code: "VALIDATION_ERROR" }` with 400 status
- **Auth error**: `{ error: "Unauthorized" }` with 401 status or `{ error: "Forbidden: insufficient permissions" }` with 403 status
