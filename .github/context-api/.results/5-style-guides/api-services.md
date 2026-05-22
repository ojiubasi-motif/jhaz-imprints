# API Services Style Guide - packages/api

## Core Principles

- **Statelessness**: Services should not maintain internal state between calls. Use static methods or exported functions.
- **Transactional Logic**: Wrap multi-step database operations in `prisma.$transaction`.
- **Error Types**: Throw `AppError` from `../errors/AppError.ts` to ensure consistent error handling.
- **Service Responsibility**: Services are responsible for data orchestration (e.g., fetching from MongoDB to populate a PostgreSQL record).
- **Defensive Validation**: Always use `.trim().toLowerCase()` for incoming option strings to prevent mismatch errors.
- **Resilient Fallback**: Implement default fallbacks (e.g., "Standard") for product options when catalog modifiers are missing.
- **Token Rotation**: All refresh token flows must implement rotation (issue new token and invalidate the old one in DB).

## Implementation Patterns

### Transactional Service
```typescript
export async function updateRecord(id: string, data: any) {
  return await prisma.$transaction(async (tx) => {
    // 1. Logic
    // 2. DB update
    // 3. Return result
  });
}
```

## Naming Conventions
- Files: `camelCaseService.ts` (e.g., `authService.ts`).
- Methods: `camelCase` (e.g., `register`).
