# Style Guide: Express Middleware

## Unique Conventions
- Middleware are plain functions (not classes). `authenticate` is a named function export. `authorize` is a factory returning a closure.
- `authenticate` extends Express Request via `AuthenticatedRequest` interface (not global augmentation in the middleware itself)
- `authorize` accepts a rest parameter of role strings: `authorize("ADMIN", "TAILOR")`
- `validateBody` accepts any `ZodSchema` and replaces `req.body` with the parsed output (strips unknown fields)
- Validation failures throw `AppError` with code `"VALIDATION_ERROR"` rather than returning a response directly
- Middleware file naming: lowercase descriptive name (`authenticate.ts`, `authorize.ts`, `validateBody.ts`)
