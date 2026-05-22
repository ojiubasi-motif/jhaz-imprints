# Data Persistence Domain Analysis - packages

## Patterns and Conventions

- **Hybrid Database Strategy**:
  - **Prisma (PostgreSQL)**: Handles all relational data including User accounts, Session tokens, and Order statuses.
  - **Mongoose (MongoDB)**: Handles the Product Catalog, allowing for flexible schemas for traditional dress variants.
- **Client Management**: Clients are instantiated once in their respective packages (`@jhaz-imprints/db`, `@jhaz-imprints/catalog-db`) and exported for use in `api`.
- **Type Safety**: All models are strictly typed. Prisma generates types automatically, while Mongoose models use explicit TypeScript interfaces.

## Code Examples

### Prisma Usage (`@jhaz-imprints/db`)
```typescript
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
```

### Prisma Model Pattern (`schema.prisma`)
```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  refreshToken String?
  // ...
}
```

### Measurement Model

The system includes a `Measurement` model used to persist customer measurement profiles which can be referenced by orders. This model lives in the Prisma schema and is referenced by `Order.measurementId` as a snapshot for order production.

Example (excerpt from `schema.prisma`):
```prisma
model Measurement {
  id          String  @id @default(cuid())
  userId      String
  user        User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  profileName String  @default("Default")
  isDefault   Boolean @default(false)

  chest       Float?
  waist       Float?
  hip         Float?
  shoulder    Float?
  armLength   Float?
  length      Float?

  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  orders      Order[]
}
```

### Order Snapshotting Pattern

To ensure historical accuracy, the system captures a "snapshot" of the product details at the moment of the order. This avoids issues where changing a product's price or options in the MongoDB catalog would retroactively alter the details of past orders.

**Snapshot implementation in `schema.prisma`**:
```prisma
model Order {
  id                  String   @id @default(cuid())
  // ... (auth/relational fields)
  
  // Product Snapshot
  productId           String   // Reference to MongoDB
  styleOptionName     String
  fabricOptionName    String
  colorName           String?
  
  // Price Snapshots
  basePrice           Float    @default(0)
  styleModifier       Float    @default(0)
  fabricModifier      Float    @default(0)
  totalAmount         Float
  // ...
}
```

Guidance:
- **Relational Integrity**: Always store the `productId` and the names of the selected options directly in the `Order` record.
- **Financial History**: Modifiers and base prices must be copied from the catalog into the order record during the `createOrder` transaction.
- **Measurement snapshotting**: Each order MUST be linked to a `measurementId` (CUID) that represents the exact measurements the tailor should use.

### Mongoose Model (`@jhaz-imprints/catalog-db`)
```typescript
const ProductSchema = new Schema<IProduct>({
  name: { type: String, required: true },
  basePrice: { type: Number, required: true },
  fabricOptions: [FabricOptionSchema],
  // ...
});
export const Product = model<IProduct>('Product', ProductSchema);
```
