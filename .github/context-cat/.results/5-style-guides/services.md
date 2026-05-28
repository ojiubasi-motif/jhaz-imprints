# Services Styleguide

## Unique Patterns
- **Mongoose `lean()` by Default**: Every query made to MongoDB uses `.lean()` to return plain old JavaScript objects instead of heavy Mongoose Documents, ensuring fast serialization and safety when passing data back to Express handlers.
- **ObjectId vs Slug Resolution**: The service layer handles polymorphic lookups. For instance, `getProductByIdOrSlug` dynamically checks if the incoming string matches a 24-character hex regex to determine if it should query by `_id` or `slug`.
