# Style Guide: Services

## Unique Conventions
- Services export standalone async functions (not classes), except `AuthService` which uses static methods
- Service files named by domain: `orderService.ts`, `productService.ts`, `pricingEngine.ts`
- Each service function has a JSDoc block with description, `@param`, and `@returns`
- Services throw `AppError(message, statusCode, code?)` for business logic errors — never return error objects
- Financial operations wrap mutations in `prisma.$transaction(async (tx) => { ... })`
- MongoDB queries use `.lean()` and `.select("-__v")` for read-only operations
- The pricing engine (`pricingEngine.ts`) is a pure function with no DB calls — designed for unit testing
- Input types are defined as exported interfaces in the same service file
- Services import from workspace packages: `import { prisma } from "@jhaz-imprints/db"`, `import { Product } from "@jhaz-imprints/catalog-db"`
