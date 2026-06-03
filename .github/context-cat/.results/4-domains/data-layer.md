# Data Layer Domain Implementation

The `data-layer` domain handles persistence and connection management. The catalog-service uses two data sources: **MongoDB** (via Mongoose) for products and fabrics, and a **static JSON file** for categories.

## Consistent Patterns
- **Shared Workspace Package**: All Mongoose models (`Product`, `Fabric`) and DB connection logic are abstracted into a shared workspace package (`@jhaz-imprints/catalog-db`).
- **Connection Startup**: The service invokes the `connectMongoDB()` function before listening to the HTTP port.
- **Dual-Collection Architecture**: Products and Fabrics are separate Mongoose collections. Products reference fabrics via `ObjectId[]` (not embedded documents).
- **Static Category Data**: Categories are stored in `packages/catalog-db/src/data/categories.json` as a flat array. Products embed slim `{name, slug}` category snapshots. Category CRUD is handled by `categoryService` via file I/O — NOT a MongoDB collection.
- **Product Field Types**: Products use `categories: [{name, slug}]` (embedded refs), `fabrics: [ObjectId ref 'Fabric']`, plus `gender` and `occasion` enum fields, `defaultStyle` string, and `styleOptions: [{ name: string, priceModifier: number, description?: string, imgUrl: string }]`.

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

**Querying Products with Fabric Population (`src/services/productService.ts`):**
```typescript
import { Product } from "@jhaz-imprints/catalog-db";

export async function getProductById(id: string) {
  const product = await Product.findById(id)
    .populate("fabrics", "-__v -deletedAt")
    .lean()
    .select("-__v");
  return product;
}
```

**Querying Fabrics (`src/services/fabricService.ts`):**
```typescript
import { Fabric } from "@jhaz-imprints/catalog-db";

export async function listFabrics() {
  const fabrics = await Fabric.find({ deletedAt: null })
    .lean()
    .sort({ name: 1 })
    .select("-__v");
  return fabrics;
}
```

**Filtering by Category Slug (`src/services/productService.ts`):**
```typescript
// Category filter targets the embedded categories array
filter["categories.slug"] = category;
```
