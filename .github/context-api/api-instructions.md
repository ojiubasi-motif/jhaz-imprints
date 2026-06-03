# API Development Instructions - @jhaz-imprints/api & Shared Packages

## 1. Overview
This file provides architectural context, domain understanding, and stylistic guidelines for developing the `packages/api` application and its supporting packages (`db`, `catalog-db`, `shared`). It is based on observed patterns within the codebase to ensure that AI assistants and developers generate consistent, convention-following code.

---

## 2. File Category Reference

### **API Handlers (`api-handlers`)**
- **Purpose**: Request controllers that manage the HTTP interface.
- **Examples**: `packages/api/src/handlers/auth.ts`, `packages/api/src/handlers/orders.ts`.
- **Key Conventions**:
  - Return Quizio-style envelope: `{ msg, data, type, code }`.
  - Delegate all business logic to services.
  - Validate `req.body` using Zod schemas from `@jhaz-imprints/shared`.

### **API Services (`api-services`)**
- **Purpose**: Business logic layer and data orchestration.
- **Examples**: `packages/api/src/services/authService.ts`, `packages/api/src/services/orderService.ts`.
- **Key Conventions**:
  - Stateless static methods or exported functions.
  - Use Prisma transactions for atomic updates.
  - Throw `AppError` with status codes.

### **API Routes (`api-routes`)**
- **Purpose**: URL mapping and middleware application.
- **Examples**: `packages/api/src/routes/auth.ts`, `packages/api/src/routes/orders.ts`.
- **Key Conventions**:
  - Use `express.Router()`.
  - Wrap all async handlers with `asyncHandler()` from `src/utils/asyncHandler.ts`.
  - Apply `validateBody(Schema)` middleware between `authenticate` and the handler for POST/PUT endpoints.
  - Apply `authenticate` middleware to protected routes; chain `authorize("ADMIN")` for admin-only routes.

### **Payment Providers/Webhooks (`api-payments`)**
- **Purpose**: Secure handling of external payment gateways and user-facing payment flows.
- **Examples**: `packages/api/src/services/paystackService.ts`, `packages/api/src/handlers/orders.ts`.
- **Key Conventions**:
  - Enforce strict idempotency using unique reference IDs (`order_<id>_<timestamp>`).
  - Expose `POST /:orderId/payment-intent` for initializing a Paystack transaction (returns `accessCode` for `PaystackPop` and `authorizationUrl` for redirect).
  - Expose `POST /verify/:reference` for frontend-initiated payment verification after redirect.
  - The Paystack webhook endpoint (`POST /webhook/paystack`) must verify `x-paystack-signature` before processing; re-queries payment status inside a Prisma `$transaction` to prevent race conditions.
  - NEVER allow payment intent creation for orders that are not in `PENDING` status.

### **Shared Schemas (`shared-schemas`)**
- **Purpose**: Cross-package validation logic.
- **Examples**: `packages/shared/src/schemas/auth.schema.ts`.
- **Key Conventions**:
  - Built with Zod.
  - Export both schema and inferred TypeScript type.

---

## 3. Feature Scaffold Guide

When implementing a new feature (e.g., "User Addresses"):

1.  **Define Schema**: Create `packages/shared/src/schemas/address.schema.ts`.
2.  **Add Model**: Add `Address` model under Prisma schema `schema.prisma`.
3.  **Create Service**: Implement `packages/api/src/services/addressService.ts`. Ensure all queries use `prisma` client.
4.  **Implement Handler**: Create `packages/api/src/handlers/addresses.ts`.
5.  **Register Route**: Create `packages/api/src/routes/addresses.ts` and mount in `app.ts`.

### **Naming & Placement**
- Handlers: `packages/api/src/handlers/{domain}.ts`.
- Services: `packages/api/src/services/{domain}Service.ts`.
- Schemas: `packages/shared/src/schemas/{domain}.schema.ts`.

---

## 4. Integration Rules

- **Response Format**: **Mandatory Quizio Envelope.** Success code 600, error codes 602/605. Exception: DELETE endpoints return `204 No Content` with no body.
- **Sanitization**: **Strictly sanitize all responses.** Never return `password`, `refreshToken`, `createdAt`, or `updatedAt` to the client.
- **Auth Strategy**: **Gateway-Centric Request Authentication.** Requests to protected API endpoints are authenticated by the gateway, which forwards trusted identity headers (`x-user-id`, `x-user-role`, `x-user-email`). Dual-tokens (1d access, 30m refresh with cookie-based rotation) are issued directly by the auth handlers.
- **Database**:
  - Relational operations use **Prisma** (PostgreSQL) exclusively.
  - Catalog/Product data is read from the local `CachedProduct` PostgreSQL table. MongoDB is not queried directly at runtime.
- **Order Snapshotting**: When creating an order, ALWAYS save snapshots of the product details (Name, selected Option names, and Price Modifiers) in the Prisma `Order` table. This ensures historical accuracy even if the product catalog changes later.
- **Payment Intent Lifecycle**: The order creation flow is: (1) Create order + payment record in Prisma with `PENDING` status → (2) Initialize transaction with Paystack to get `authorizationUrl`/`accessCode` → (3) Frontend redirects user or opens `PaystackPop` → (4) Paystack fires webhook OR frontend calls `POST /verify/:reference` → (5) Service verifies with Paystack API, then updates order to `CONFIRMED` atomically.
- **Augmented Responses**: When returning orders (GET `/orders/:id` or `/orders/my-orders`), the service fetches the order from Prisma and augments it by fetching product details from the local `CachedProduct` table.
- **Validation & Defensive Programming**: 
  - **Always validate inputs** using `@jhaz-imprints/shared` Zod schemas. 
  - **Strict String Matching**: When comparing frontend payloads with database strings (especially CachedProduct fields like `fabricOptions`), ALWAYS use `.trim().toLowerCase()` to prevent invisible character mismatch errors.
  - **Resilient Fallback**: If a selected product option (fabric/style) is missing from the catalog, fallback to "Standard" or "Original" if available, rather than crashing the request.
  - **Explicit Errors**: When throwing an `AppError` due to a mismatch, include the explicitly available DB string options in the error message for faster frontend debugging.
- **Background Notifications**: After confirming a payment, enqueue an `order-confirmed` BullMQ job. The worker sends two emails: one to the customer and one to `ADMIN_EMAIL`. Each email send is isolated in `try/catch` — one failure must not block the other.

---

## 5. Example Prompt Usage

> "Add an endpoint to allow users to update their notification preferences."

**Expected Files to Create/Modify**:
- `packages/shared/src/schemas/user.schema.ts` (Add Preferences schema)
- `packages/api/src/services/userService.ts` (Logic to update DB)
- `packages/api/src/handlers/user.ts` (Handle request/response)
- `packages/api/src/routes/user.ts` (Define endpoint)

---

### Example: Order Data Augmentation

When implementing a feature that displays order history, ensure order and catalog cache data is combined:

- **Relational Data**: Fetch the core order details (status, total, date, snapshots) from Prisma.
- **Document Data**: For each order, fetch the product name, category, and primary image from the local database cache (using `getCachedProductByIdOrSlug`).
- **Merging**: Combine these objects before returning the response. This pattern ensures the frontend has rich, up-to-date visual data without bloating the relational schema.
- **Performance**: Use `Promise.all` when augmenting multiple orders to avoid sequential N+1 query bottlenecks.
- **Safety**: Always handle cases where a product might have been deleted from the catalog cache by using optional chaining and nullish coalescing on augmented fields.
