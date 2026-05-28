# Utils Styleguide

## Unique Patterns
- **`asyncHandler` Wrapper**: Instead of relying on `express-async-errors`, this project uses a tiny custom higher-order function `asyncHandler` to wrap promises and pass rejected errors to `next()`.
- **Custom `AppError`**: `AppError` includes a `type` string property on top of the standard `statusCode`, allowing the global error handler to map business errors to the `{ type, code }` response format used universally in this API.
