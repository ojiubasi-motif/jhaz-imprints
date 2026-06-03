# Services Domain Implementation

The `services` domain encapsulates the core business logic, third-party integrations, and database interactions.

## Consistent Patterns
- **HTTP Agnosticism**: Service functions do not accept `Request` or `Response` objects. They take pure typed arguments and return plain data or throw errors.
- **Custom Error Throwing**: Services throw `AppError` on validation or domain-specific failures.
- **Mongoose Reliance**: Services directly import `Product` and `Fabric` from `@jhaz-imprints/catalog-db` and execute queries using `lean()`.
- **Admin/Public Split**: Read-only public operations live in `{resource}Service.ts`. Admin write operations (create/update/delete) live in `admin{Resource}Service.ts`.
- **File I/O for Categories**: `categoryService.ts` reads/writes `categories.json` using `fs.readFileSync`/`fs.writeFileSync` — an atomic read-modify-write pattern. Categories are NOT stored in MongoDB.
- **Cross-Service Validation**: `adminProductService` validates category slugs against the live `categories.json` (via `categoryService.getCategories()`) and validates fabric ObjectIds before allowing product creation.
- **Lean Document Virtual Mapper**: Since Mongoose `.lean()` queries return plain JavaScript objects and bypass model virtuals, the services layer maps queried documents using helper mappers (such as `addImagesField`) to reconstruct virtual arrays (like `images` from `styleOptions` and `defaultStyle`).

## Code Examples

**Public Service with Populate (`src/services/productService.ts`):**
```typescript
import { Product } from "@jhaz-imprints/catalog-db";
import { getCategories } from "./categoryService";
import { AppError } from "../errors/AppError";

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isActive: true })
    .populate("fabrics", "-__v -deletedAt")
    .lean()
    .select("-__v");
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
  return addImagesField(product);
}
```

**Admin Service with Validation (`src/services/adminProductService.ts`):**
```typescript
import { getCategories } from "./categoryService";

function validateCategoryRefs(categories: ICategoryRef[]): void {
  const validSlugs = new Set(getCategories().map((c) => c.slug));
  const invalidSlugs = categories
    .map((c) => c.slug)
    .filter((slug) => !validSlugs.has(slug));

  if (invalidSlugs.length > 0) {
    throw new AppError(
      `Unknown category slugs: ${invalidSlugs.join(", ")}`,
      400,
      "INVALID_CATEGORY"
    );
  }
}
```

**Category Service — File I/O (`src/services/categoryService.ts`):**
```typescript
import { readFileSync, writeFileSync } from "fs";

export function getCategories(): CategoryEntry[] {
  const raw = readFileSync(CATEGORIES_FILE, "utf-8");
  return JSON.parse(raw).categories;
}

export function addCategory(entry: CategoryEntry): CategoryEntry {
  const categories = getCategories();
  if (categories.some((c) => c.slug === entry.slug)) {
    throw new AppError(`Category slug "${entry.slug}" already exists`, 409, "CATEGORY_SLUG_CONFLICT");
  }
  _persist([...categories, entry]);
  return entry;
}
```

**Fabric Service — Polymorphic Lookup (`src/services/fabricService.ts`):**
```typescript
import { Fabric } from "@jhaz-imprints/catalog-db";

export async function getFabricByIdOrSlug(idOrSlug: string) {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  if (isObjectId) {
    return getFabricById(idOrSlug);
  }
  return getFabricBySlug(idOrSlug);
}
```
