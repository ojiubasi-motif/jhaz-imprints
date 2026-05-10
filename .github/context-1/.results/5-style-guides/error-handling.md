# Style Guide: Error Handling

## Unique Conventions
- `AppError` extends `Error` with `statusCode` (number) and `code` (optional string)
- Uses `Object.setPrototypeOf(this, AppError.prototype)` for correct `instanceof` checks
- Type guard: `isAppError(error: unknown): error is AppError`
- Error codes are SCREAMING_SNAKE_CASE strings: `"VALIDATION_ERROR"`, `"PRODUCT_NOT_FOUND"`, `"IMAGES_REQUIRED"`
- HTTP status is part of the error (not determined by middleware)
