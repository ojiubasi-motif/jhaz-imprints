# DB Prisma Style Guide - packages/db

## Core Principles

- **Schema Definition**: Use `schema.prisma` for all relational modeling.
- **Naming Conventions**: Use `camelCase` for fields and `PascalCase` for models.
- **Client Access**: Access Prisma through the centralized client in `@jhaz-imprints/db`.

## Implementation Patterns

### Model Example
```prisma
model Order {
  id          String   @id @default(uuid())
  totalAmount Float
  status      String
  createdAt   DateTime @default(now())
}
```
