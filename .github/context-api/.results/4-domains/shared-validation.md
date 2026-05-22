# Shared Validation Domain Analysis - packages/shared

## Patterns and Conventions

- **Zod Schemas**: All input validation is defined using Zod in `@jhaz-imprints/shared`.
- **Frontend/Backend Parity**: By sharing schemas, the frontend can perform pre-validation while the backend ensures strict enforcement using the same rules.
- **Export Pattern**: Schemas are exported from `src/schemas/` and centralized in the main index.

## Code Examples

### Schema Definition (`packages/shared/src/schemas/auth.schema.ts`)
```typescript
import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginData = z.infer<typeof LoginSchema>;
```

### Usage in API Handler
```typescript
import { LoginSchema } from "@jhaz-imprints/shared";

const validatedData = LoginSchema.parse(req.body);
```
