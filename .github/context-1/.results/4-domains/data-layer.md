# Data Layer Domain — Deep Dive

## Overview
The codebase uses a dual-database architecture: PostgreSQL via Prisma for transactional/financial data, and MongoDB via Mongoose for the flexible product catalog. This split follows a clear domain boundary: money and identity go to PostgreSQL, product attributes go to MongoDB.

## PostgreSQL (Prisma)

### Prisma Client Singleton
```typescript
// packages/db/src/client.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export * from "@prisma/client";
```

### Schema Models
Key models: `User`, `Measurement`, `Order`, `Payment`, `OrderStatusHistory`. All use `cuid()` for IDs.

- **Soft delete**: `User.deletedAt` field
- **Measurement profiles**: Multiple per user, one marked `isDefault`
- **Order-Payment 1:1**: `Payment.orderId` has `@unique` constraint
- **Idempotency key**: `Payment.reference` has `@unique` constraint

### Transaction Pattern
Financial operations use `prisma.$transaction()`:

```typescript
// packages/api/src/services/orderService.ts
const createdOrder = await prisma.$transaction(async (tx) => {
  const newOrder = await tx.order.create({ data: { userId, measurementId, totalAmount, status: "PENDING" } });
  const payment = await tx.payment.create({ data: { orderId: newOrder.id, amount: totalAmount, reference, provider: "PAYSTACK" } });
  return { order: newOrder, payment, reference };
});
```

### Double-Check Locking for Idempotency
```typescript
// Check outside transaction
const existingPayment = await prisma.payment.findUnique({ where: { reference } });
if (existingPayment?.status === "COMPLETED") return { alreadyProcessed: true };

// Re-check inside transaction to prevent race conditions
const updated = await prisma.$transaction(async (tx) => {
  const lockedPayment = await tx.payment.findUnique({ where: { reference } });
  if (lockedPayment?.status === "COMPLETED") return { alreadyProcessed: true };
  // ... proceed with update
});
```

## MongoDB (Mongoose)

### Connection with Retry
```typescript
// packages/catalog-db/src/connection.ts
export async function connectMongoDB(retryAttempt = 0): Promise<Connection> {
  if (connection && connection.readyState === 1) return connection;
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 10, minPoolSize: 2, socketTimeoutMS: 30000 });
  // Exponential backoff on failure (5 retries, 1s base delay)
}
```

### Typed Mongoose Schemas
Models use TypeScript interfaces for type safety:

```typescript
// packages/catalog-db/src/models/Product.model.ts
const productSchema = new Schema<IProduct>({
  name: { type: String, required: true, trim: true, index: true },
  slug: { type: String, unique: true, lowercase: true },
  category: { type: String, enum: ["wedding-aso-oke", "agbada", "kente-gown", "ankara-casual", "other"] },
  basePrice: { type: Number, required: true, min: 0 },
  fabricOptions: { type: [fabricOptionSchema], default: [] },
  // ...
}, { timestamps: true });
```

### Sub-Schema Pattern
Nested objects use separate sub-schemas with `{ _id: false }`:

```typescript
const fabricOptionSchema = new Schema<IFabricOption>({
  name: { type: String, required: true },
  priceModifier: { type: Number, required: true, default: 0 },
  swatchImageUrl: { type: String, required: true },
  inStock: { type: Boolean, required: true, default: true },
}, { _id: false });
```

### Pagination Plugin
Products use `mongoose-paginate-v2`:

```typescript
productSchema.plugin(mongoosePaginate);
const paginatedProduct = Product as unknown as PaginateModel<IProduct>;
const result = await paginatedProduct.paginate(filter, { page, limit: Math.min(limit, 50), sort: { createdAt: -1 }, lean: true, select: "-__v" });
```

### Auto-Slug Generation
Pre-save hook generates URL slugs from product names:

```typescript
productSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
  }
  next();
});
```

## Export Pattern
Both database packages use barrel exports:

```typescript
// packages/catalog-db/src/index.ts
export { Product } from "./models";
export type { IProduct, IFabricOption, ... } from "./models";
export { connectMongoDB, disconnectMongoDB, getMongoDBConnection } from "./connection";
```
