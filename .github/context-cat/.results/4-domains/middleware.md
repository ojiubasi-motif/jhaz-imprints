# Middleware Domain Implementation

The `middleware` domain provides reusable Express middleware functions for cross-cutting concerns like authentication, authorization, and validation.

## Consistent Patterns
- **Authentication**: JWT token verification is handled by `authenticate` which populates `req.user`.
- **Validation**: Zod schema validation is processed via a generic `validateBody` middleware.
- **Failure Responses**: Middleware functions typically intercept the request and return standard JSON failure envelopes directly if conditions aren't met, rather than throwing to the global handler.

## Code Examples

**Authentication (`src/middleware/authenticate.ts`):**
```typescript
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    // ... token extraction ...
    
    const decoded = jwt.verify(token, secret);
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    return res.status(401).json({
      msg: "Unauthorized: Invalid or expired token",
      data: null,
      type: "AUTHENTICATION_FAILED",
      code: 602
    });
  }
}
```
