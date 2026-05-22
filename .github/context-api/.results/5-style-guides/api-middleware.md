# API Middleware Style Guide - packages/api

## Core Principles

- **Function Signature**: Follow standard Express middleware signature `(req, res, next)`.
- **Request Augmentation**: Use custom request types (e.g., `AuthenticatedRequest`) to add data like `req.user`.
- **Error Handling**: Return a JSON error response or call `next(error)` for terminating middleware.
- **Token Source**: `authenticate` reads the access token from the `Authorization: Bearer <token>` header ONLY. The `jwt` cookie is reserved for the refresh token and is NOT used for authenticated API requests.

## Implementation Patterns

### authenticate Middleware
Verifies Bearer JWT and attaches `{ id, email, role }` to `req.user`. Returns a Quizio-style 401 on failure.
```typescript
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ msg: "Unauthorized: No token provided", data: null, type: "AUTHENTICATION_FAILED", code: 602 });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; email: string; role: string };
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role as "CUSTOMER" | "ADMIN" | "TAILOR" };
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Unauthorized: Invalid or expired token", data: null, type: "AUTHENTICATION_FAILED", code: 602 });
  }
}
```

### authorize Middleware
Must be chained AFTER `authenticate`. Accepts one or more role strings as variadic args. Returns 403 for insufficient permissions.
```typescript
export const authorize = (...allowedRoles: Array<"CUSTOMER" | "ADMIN" | "TAILOR">) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
```

### validateBody Middleware
Wraps Zod `safeParse`. Passes a structured `VALIDATION_ERROR` `AppError` (with field-level errors) to the global error handler via `next(error)`. Replaces `req.body` with the coerced validated data on success.
```typescript
export function validateBody(schema: ZodSchema) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      const error: any = new AppError("Validation failed", 400, "VALIDATION_ERROR");
      error.errors = validation.error.flatten().fieldErrors;
      return next(error);
    }
    req.body = validation.data;
    next();
  };
}
```

## Naming Conventions
- Files: `camelCase.ts` (e.g., `authenticate.ts`, `validateBody.ts`, `authorize.ts`).
