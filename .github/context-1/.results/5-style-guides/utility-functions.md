# Style Guide: Utility Functions

## Unique Conventions
- `asyncHandler` is the only utility. It wraps async Express handlers so rejected promises forward to error middleware.
- Exported as a named function (not arrow)
- Located at `packages/api/src/utils/asyncHandler.ts`
- Uses `Promise.resolve(fn(...)).catch(next)` pattern
