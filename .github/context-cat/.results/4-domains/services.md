# Services Domain Implementation

The `services` domain encapsulates the core business logic, third-party integrations, and database interactions.

## Consistent Patterns
- **HTTP Agnosticism**: Service functions do not accept `Request` or `Response` objects. They take pure typed arguments and return plain data or throw errors.
- **Custom Error Throwing**: Services throw `AppError` on validation or domain-specific failures.
- **Mongoose Reliance**: Services directly import `Product` from `@jhaz-imprints/catalog-db` and execute queries using `lean()`.

## Code Examples

**Example Service (`src/services/productService.ts`):**
```typescript
import { Product } from "@jhaz-imprints/catalog-db";
import { AppError } from "../errors/AppError";

export async function getProductById(id: string) {
  const product = await Product.findById(id).lean().select("-__v");
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
  return product;
}
```
