# Types Styleguide

## Unique Patterns
- **Express Request Augmentation**: `src/types/express.d.ts` extends the global Express namespace to inject the authenticated `user` object (consisting of gateway-forwarded user headers) directly onto the standard `Request` object, avoiding the need to manually cast `req as AuthenticatedRequest` in every secured handler.
