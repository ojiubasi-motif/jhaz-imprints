# Style Guide: Type Declarations

## Unique Conventions
- Express Request augmented via `declare global { namespace Express { interface Request { user?: ... } } }` in `express.d.ts`
- Mongoose document types use `I` prefix: `IProduct`, `IFabricOption`, etc.
- Types defined in dedicated `types.ts` file for Mongoose, or inline in middleware for Express
- `AuthenticatedRequest` interface extends `Request` in middleware file (not in type declaration)
