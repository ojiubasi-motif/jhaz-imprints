# API Middleware Style Guide - packages/api

## Core Principles

- **Function Signature**: Follow standard Express middleware signature `(req, res, next)`.
- **Request Augmentation**: Use custom request types (e.g., `AuthenticatedRequest`) to add data like `req.user`.
- **Error Handling**: Return a JSON error response or call `next(error)` for terminating middleware.
- **Gateway-Centric Verification**: The `authenticate` middleware expects requests to be routed through the API Gateway, carrying a valid `x-internal-secret` (matching `INTERNAL_GATEWAY_SECRET`) and forwarded identity headers (`x-user-id`, `x-user-role`, `x-user-email`).

## Implementation Patterns

### authenticate Middleware
Verifies request origin via internal gateway secret and maps pre-validated identity headers to `req.user`. Returns 403 for bypass attempts, or 401 if identity headers are missing.
```typescript
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const incomingSecret = req.headers["x-internal-secret"];

  if (!INTERNAL_SECRET || incomingSecret !== INTERNAL_SECRET) {
    return res.status(403).json({
      msg: "Forbidden: Direct access to internal service is not permitted.",
      data: null,
      type: "GATEWAY_BYPASS_DETECTED",
      code: 403,
    });
  }

  const userId    = req.headers["x-user-id"]    as string | undefined;
  const userRole  = req.headers["x-user-role"]  as string | undefined;
  const userEmail = req.headers["x-user-email"] as string | undefined;

  if (!userId || !userRole) {
    return res.status(401).json({
      msg: "Unauthorized: Missing identity headers. Ensure the gateway is performing authentication.",
      data: null,
      type: "AUTHENTICATION_FAILED",
      code: 401,
    });
  }

  req.user = {
    id:    userId,
    email: userEmail ?? "",
    role:  userRole as "CUSTOMER" | "ADMIN" | "TAILOR",
  };

  next();
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
