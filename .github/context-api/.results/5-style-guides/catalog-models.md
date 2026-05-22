# Catalog Models Style Guide - packages/catalog-db

## Core Principles

- **Mongoose Schemas**: Define strict schemas for MongoDB documents.
- **TypeScript Interfaces**: Every model must have a corresponding interface (e.g., `IProduct`).
- **Export Pattern**: Export the model as the default or named export from `src/models/`.

## Implementation Patterns

### Model Definition
```typescript
const MySchema = new Schema<IMyDoc>({ ... });
export const MyModel = model<IMyDoc>("MyModel", MySchema);
```

## Naming Conventions
- Files: `PascalCase.model.ts` (e.g., `Product.model.ts`).
