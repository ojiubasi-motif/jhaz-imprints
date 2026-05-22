# API Handlers Style Guide - packages/api

## Core Principles

- **Response Envelope**: Every successful response must follow the Quizio format: `{ msg, data, type, code }`.
- **Validation**: Always use Zod schemas from `@jhaz-imprints/shared` to parse `req.body`.
- **Error Handling**: Use `try/catch` blocks. In the `catch` block, return the appropriate HTTP status code and a Quizio-style error envelope.
- **Dependency Injection**: Call methods from services (e.g., `AuthService.login`) rather than implementing logic in the handler.
- **Response Sanitization**: Remove all internal metadata (createdAt, updatedAt, password, refreshToken) and PII not explicitly required by the UI.

## Implementation Patterns

### Standard Handler Template
```typescript
export const myHandler = async (req: Request, res: Response) => {
  try {
    const validatedData = MySchema.parse(req.body);
    const result = await MyService.process(validatedData);
    
    res.status(200).json({
      msg: "operation success",
      data: result,
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(400).json({
      msg: error.message || "Operation failed",
      type: "FAILED",
      code: 602
    });
  }
};
```

### Measurement Handlers

Measurement endpoints follow the same pattern: validate with `MeasurementCreateSchema` (for creation) and delegate to services. Always sanitize measurement objects before returning them to the client.

Example: `createMeasurementHandler` and `getUserMeasurementsHandler`
```typescript
export async function createMeasurementHandler(req: AuthenticatedRequest, res: Response) {
  const measurement = await orderService.createMeasurement(req.user.id, req.body);
  const { createdAt: _, updatedAt: __, ...sanitized } = measurement as any;
  res.status(201).json({ msg: 'measurement profile created', data: sanitized, type: 'SUCCESS', code: 600 });
}

export async function getUserMeasurementsHandler(req: AuthenticatedRequest, res: Response) {
  const measurements = await orderService.getUserMeasurements(req.user.id);
  // handlers may project/sanitize further if needed
  res.status(200).json({ msg: 'user measurements retrieved', data: measurements, type: 'SUCCESS', code: 600 });
}
```

## Naming Conventions
- Files: `lowercaseDomain.ts` (e.g., `auth.ts`, `products.ts`).
- Functions: `camelCaseHandler` (e.g., `loginHandler`).
