# Middleware Domain Implementation

The `middleware` domain provides reusable Express middleware functions for cross-cutting concerns like authentication, authorization, and validation.

## Consistent Patterns
- **Authentication**: Gateway-centric verification. The `authenticate` middleware verifies that the incoming request has a valid `x-internal-secret` matching `INTERNAL_GATEWAY_SECRET` to prevent direct external bypass, and extracts pre-validated user identity from `x-user-id`, `x-user-role`, and `x-user-email` headers.
- **Gateway Origin Verification**: The `verifyGatewayOrigin` middleware globally validates the incoming `x-internal-secret` header for all requests (bypassing `/health` and `/api/health` endpoints), ensuring clients cannot hit internal catalog service routes directly.
- **Validation**: Zod schema validation is processed via a generic `validateBody` middleware.
- **Failure Responses**: Middleware functions typically intercept the request and return standard JSON failure envelopes directly if conditions aren't met (such as missing/invalid internal secret or missing user headers), rather than throwing to the global handler.

## Code Examples

**Authentication (`src/middleware/authenticate.ts`):**
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

export function verifyGatewayOrigin(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  const incomingSecret = req.headers["x-internal-secret"];

  if (!INTERNAL_SECRET || incomingSecret !== INTERNAL_SECRET) {
    return res.status(403).json({
      msg: "Forbidden: Direct access to internal service is not permitted.",
      data: null,
      type: "GATEWAY_BYPASS_DETECTED",
      code: 403,
    });
  }

  next();
}
```
