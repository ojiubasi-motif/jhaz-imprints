# Data Layer Domain Implementation

The `data-layer` domain handles persistence and connection management. For `catalog-service`, this is exclusively MongoDB via Mongoose.

## Consistent Patterns
- **Shared Workspace Package**: All models and DB connection logic are abstracted into a shared workspace package (`@jhaz-imprints/catalog-db`).
- **Connection Startup**: The service invokes the `connectMongoDB()` function before listening to the HTTP port.

## Code Examples

**Database Initialization (`src/server.ts`):**
```typescript
import { connectMongoDB } from '@jhaz-imprints/catalog-db';

async function startServer() {
    try {
        await connectMongoDB();
        console.log('✅ Catalog DB connected successfully');
        // ...
    } catch (error) {
        process.exit(1);
    }
}
```

**Querying Data (`src/services/productService.ts`):**
```typescript
import { Product } from "@jhaz-imprints/catalog-db";

export async function getProductById(id: string) {
  const product = await Product.findById(id).lean().select("-__v");
  return product;
}
```
