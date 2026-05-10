# Style Guide: Zod Schemas

## Unique Conventions
- Schemas defined as `export const XSchema = z.object({ ... })` with PascalCase + "Schema" suffix
- Inferred types exported alongside: `export type X = z.infer<typeof XSchema>`
- Schemas organized by domain in `packages/shared/src/schemas/{domain}.schema.ts`
- All schemas re-exported from barrel `packages/shared/src/index.ts` via `export * from "./schemas/..."`
- String IDs validated with `.cuid()` for Prisma IDs, `.min(1)` for MongoDB ObjectIds
- Numeric fields use `.positive()` for measurements and prices
- Optional fields use `.optional()` — never nullable
- Default values set via `.default()` on the schema (e.g., `profileName: z.string().default("Default")`)
- Password validation uses chained `.regex()` for uppercase, lowercase, and digit requirements
