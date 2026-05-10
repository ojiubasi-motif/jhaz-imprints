# Validation Domain — Deep Dive

## Overview
All API contract validation uses Zod schemas defined in the shared package (`@jhaz-imprints/shared`). These schemas serve as the single source of truth for request/response shapes, used by both the Express API (via `validateBody` middleware) and the React frontends (via `zodResolver`).

## Shared Zod Schemas

### Order Schemas
```typescript
// packages/shared/src/schemas/order.schema.ts
export const OrderCreateSchema = z.object({
  measurementId: z.string().cuid("Invalid measurement ID"),
  productId: z.string().min(1, "Product ID is required"),
  fabricOptionName: z.string().min(1, "Fabric option is required"),
  styleOptionName: z.string().min(1, "Style option is required"),
  notes: z.string().max(1000).optional(),
});
export type OrderCreate = z.infer<typeof OrderCreateSchema>;

export const MeasurementCreateSchema = z.object({
  profileName: z.string().min(1).default("Default"),
  isDefault: z.boolean().default(false),
  chest: z.number().positive().optional(),
  waist: z.number().positive().optional(),
  // ... all body measurements
});
export type MeasurementCreate = z.infer<typeof MeasurementCreateSchema>;
```

### Auth Schemas
```typescript
// packages/shared/src/schemas/auth.schema.ts
export const RegisterSchema = z.object({
  email: z.string().email().min(5).max(255),
  password: z.string().min(8).max(100)
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/[0-9]/, "Must contain number"),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
});
```

## Backend Validation (validateBody middleware)

```typescript
// packages/api/src/middleware/validateBody.ts
export function validateBody(schema: ZodSchema) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      throw new AppError(`Validation failed: ${JSON.stringify(validation.error.flatten())}`, 400, "VALIDATION_ERROR");
    }
    req.body = validation.data;  // Replace body with parsed data (strips unknown fields)
    next();
  };
}
```

Usage in routes:
```typescript
router.post("/", authenticate, validateBody(OrderCreateSchema), asyncHandler(handler));
```

## Frontend Validation (React Hook Form + zodResolver)

```typescript
// apps/web/src/components/checkout/MeasurementWizard.tsx
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderCreateSchema, type OrderCreate } from "@jhaz-imprints/shared";

const methods = useForm<OrderCreate>({
  resolver: zodResolver(OrderCreateSchema),
  mode: "onBlur",
  defaultValues: { measurementId: "", productId, notes: "" },
});
```

## Type Inference Convention
All schemas export both the Zod object and an inferred TypeScript type:
```typescript
export const SomeSchema = z.object({ ... });
export type SomeType = z.infer<typeof SomeSchema>;
```

## Barrel Export
```typescript
// packages/shared/src/index.ts
export * from "./schemas/order.schema";
export * from "./schemas/auth.schema";
```
