# Shared Schemas Style Guide - packages/shared

## Core Principles

- **Zod for Validation**: All schemas must be built using Zod.
- **Type Inference**: Export types inferred from schemas using `z.infer`.
- **Modularity**: Group related schemas in separate files within `src/schemas/`.

## Implementation Patterns

### Schema and Type Export
```typescript
export const MySchema = z.object({ ... });
export type MyData = z.infer<typeof MySchema>;
```

## Naming Conventions
- Files: `lowercase.schema.ts` (e.g., `auth.schema.ts`).
