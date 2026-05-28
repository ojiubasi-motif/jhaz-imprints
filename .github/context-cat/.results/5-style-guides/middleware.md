# Middleware Styleguide

## Unique Patterns
- **Manual JWT Extraction**: Instead of relying on passport.js or express-jwt, this service manually slices the `"Bearer "` string from the Authorization header and verifies it directly, then manually coerces the decoded role via type casting (`decoded.role as "CUSTOMER" | "ADMIN" | "TAILOR"`).
- **Hardcoded Error Codes**: Middleware authentication failures return custom envelope codes (e.g., `code: 602`) rather than standard HTTP codes in the body payload, which indicates a custom frontend mapping.
