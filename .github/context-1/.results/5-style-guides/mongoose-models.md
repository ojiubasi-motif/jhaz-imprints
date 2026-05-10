# Style Guide: Mongoose Models

## Unique Conventions
- Model file named `{Entity}.model.ts` (e.g., `Product.model.ts`)
- Types defined in separate `types.ts` file with `I` prefix interfaces (e.g., `IProduct`, `IFabricOption`)
- Schemas use `new Schema<IType>()` with generic type parameter for type safety
- Sub-schemas for nested objects use `{ _id: false }` option to suppress auto-generated IDs
- Enum-like fields use Mongoose `enum` validator on String type (not TypeScript enum)
- `timestamps: true` option enabled on main schemas
- `mongoose-paginate-v2` plugin applied to schemas that need list queries
- Pre-save hooks used for auto-generating derived fields (e.g., slug from name)
- Compound indexes defined after schema: `schema.index({ field1: 1, field2: 1 })`
- Models exported as named exports: `export const Product = model<IProduct>("Product", productSchema)`
- Barrel export from `models/index.ts` re-exports models and types
