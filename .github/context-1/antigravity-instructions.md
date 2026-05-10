# Jhaz-imprints — AI Coding Instructions

## 1. Overview

This file enables AI coding assistants to generate features aligned with the Jhaz-imprints project's architecture and style. All conventions documented here are based on actual, observed patterns from the codebase — not invented practices.

**Jhaz-imprints** is a Nigerian traditional dress e-commerce platform built as a modular monorepo. It serves three user roles (Customer, Tailor, Admin) across two frontend apps and one Express API, backed by dual databases (PostgreSQL + MongoDB).

---

## 2. File Category Reference

### Express Routes (`packages/api/src/routes/`)
Thin route files that compose middleware and delegate to handlers. Use `Router()` instance, export as default.
- **Examples**: `routes/orders.ts`, `routes/auth.ts`
- **Conventions**: Chain `authenticate` → `validateBody(schema)` → `asyncHandler(handler)`. Admin routes apply auth at router level via `router.use(authenticate, authorize("ADMIN"))`. JSDoc block comments document method/path.

### Express Handlers (`packages/api/src/handlers/`)
Named async functions that bridge routes and services.
- **Examples**: `handlers/orders.ts`, `handlers/products.ts`
- **Conventions**: Named `{action}{Domain}Handler`. Check `req.user` first, throw `AppError` on missing auth. Never catch errors — let centralized middleware handle. Import services as namespace: `import * as orderService`.

### Express Middleware (`packages/api/src/middleware/`)
Pure functions for auth, authorization, and validation.
- **Examples**: `middleware/authenticate.ts`, `middleware/validateBody.ts`
- **Conventions**: `authenticate` extracts JWT Bearer token. `authorize(...roles)` is a factory. `validateBody(schema)` replaces `req.body` with parsed data.

### Services (`packages/api/src/services/`)
Business logic layer. Exported async functions (or static class for auth).
- **Examples**: `services/orderService.ts`, `services/pricingEngine.ts`
- **Conventions**: Financial ops in `prisma.$transaction()`. MongoDB reads use `.lean().select("-__v")`. Input types as exported interfaces. Throw `AppError` for business errors. Pricing engine is pure (no DB calls).

### Zod Schemas (`packages/shared/src/schemas/`)
Runtime validation schemas shared between API and clients.
- **Examples**: `schemas/order.schema.ts`, `schemas/auth.schema.ts`
- **Conventions**: `export const XSchema = z.object({...})` + `export type X = z.infer<typeof XSchema>`. Barrel export from `index.ts`. Use `.cuid()` for Prisma IDs, `.positive()` for numbers.

### Mongoose Models (`packages/catalog-db/src/models/`)
MongoDB document models with typed schemas.
- **Examples**: `models/Product.model.ts`, `models/types.ts`
- **Conventions**: File named `{Entity}.model.ts`. Types in `types.ts` with `I` prefix. Sub-schemas use `{ _id: false }`. `mongoose-paginate-v2` plugin. Pre-save hooks for derived fields.

### React Components (`apps/admin/src/components/`, `apps/web/src/components/`)
Reusable UI components for both frontends.
- **Examples**: `ImageUploader.tsx`, `BodyDiagram.tsx`, `MeasurementWizard.tsx`
- **Conventions**: Named exports for reusable, default for page-level. `useQuery`/`useMutation` for data. `useForm` with `zodResolver`. Tailwind utility classes. Loading skeletons with `animate-pulse`. Error alerts with `role="alert"`.

### React Pages (`apps/admin/src/pages/`, `apps/web/src/app/`)
Route-level page components.
- **Examples**: `pages/OrderQueue.tsx`, `app/checkout/page.tsx`
- **Conventions**: Next.js uses default exports. Admin uses named exports. Minimal logic — compose components. Layout: `max-w-4xl mx-auto px-4 py-8`.

### Next.js API Routes (`apps/web/src/app/api/`)
BFF proxy routes forwarding to Express API.
- **Examples**: `api/v1/orders/route.ts`
- **Conventions**: Export named HTTP method functions (`POST`, `GET`). Forward `Authorization` header. Use `NEXT_PUBLIC_API_URL` env var.

### Queue Workers (`packages/api/src/queues/`)
BullMQ job processors.
- **Examples**: `queues/notificationWorker.ts`
- **Conventions**: Queue as module-level singleton. Worker dispatches via switch/case on `job.name`. Each send wrapped in try-catch (non-fatal). Safe defaults for all optional fields.

### Email Templates (`packages/api/src/integrations/email/`)
HTML email generators with inline CSS.
- **Examples**: `email/templates.ts`
- **Conventions**: Pure functions returning `{ subject, html }`. Table-based layout. Gradient headers. Nigerian Naira formatting.

### Error Handling (`packages/api/src/errors/`)
Custom error class and type guard.
- **Examples**: `errors/AppError.ts`
- **Conventions**: `AppError(message, statusCode, code?)`. Error codes in SCREAMING_SNAKE_CASE. `isAppError()` type guard.

### Test Files (`packages/api/src/services/__tests__/`)
Vitest unit tests with global service mocking.
- **Examples**: `__tests__/pricingEngine.test.ts`
- **Conventions**: Named `{module}.test.ts` in `__tests__/` directory. All external services mocked in `test-setup.ts`.

---

## 3. Feature Scaffold Guide

### Adding a New API Feature (e.g., "Customer Reviews")

1. **Zod Schema** — Add `packages/shared/src/schemas/review.schema.ts`:
   ```
   export const ReviewCreateSchema = z.object({ ... });
   export type ReviewCreate = z.infer<typeof ReviewCreateSchema>;
   ```
   Add `export * from "./schemas/review.schema"` to `packages/shared/src/index.ts`.

2. **Database Model** — If flexible data → Mongoose in `packages/catalog-db/src/models/Review.model.ts` + `types.ts`. If transactional → Prisma in `packages/db/prisma/schema.prisma`.

3. **Service** — Create `packages/api/src/services/reviewService.ts`. Export async functions. Throw `AppError` for errors.

4. **Handler** — Create `packages/api/src/handlers/reviews.ts`. Export named async functions following `{action}ReviewHandler` pattern.

5. **Route** — Create `packages/api/src/routes/reviews.ts`. Compose: `authenticate` → `validateBody(ReviewCreateSchema)` → `asyncHandler(handler)`.

6. **Register Route** — Add `app.use("/api/reviews", reviewsRouter)` in `packages/api/src/app.ts`.

7. **Test** — Create `packages/api/src/services/__tests__/reviewService.test.ts`.

8. **Frontend** — If customer-facing: add component in `apps/web/src/components/`. If admin: add in `apps/admin/src/components/`.

### Adding a New Admin UI Feature (e.g., "Review Moderation")

1. **Component** — `apps/admin/src/components/ReviewList.tsx` (named export, `useQuery` for data)
2. **Page** — `apps/admin/src/pages/ReviewModeration.tsx`
3. **Navigation** — Add `?view=reviews` option in `apps/admin/src/main.tsx` nav
4. **API Call** — Fetch from Express API using `fetch()` with `Authorization: Bearer ${token}`

### File Naming Conventions
- Routes: `packages/api/src/routes/{domain}.ts`
- Handlers: `packages/api/src/handlers/{domain}.ts`
- Services: `packages/api/src/services/{domain}Service.ts`
- Schemas: `packages/shared/src/schemas/{domain}.schema.ts`
- Mongoose models: `packages/catalog-db/src/models/{Entity}.model.ts`
- React components: `apps/{app}/src/components/{ComponentName}.tsx`
- React pages: `apps/{app}/src/pages/{PageName}.tsx`
- Tests: `packages/api/src/services/__tests__/{module}.test.ts`

---

## 4. Integration Rules

These constraints **must** be followed to maintain architectural consistency:

### Data Layer
- **Transactional data** (money, identity, orders) → PostgreSQL via Prisma
- **Flexible catalog data** (products, garment attributes) → MongoDB via Mongoose
- **Financial mutations** must use `prisma.$transaction()`
- **Read-only MongoDB queries** must use `.lean().select("-__v")`
- **No cross-database transactions** — coordinate manually

### Authentication & Authorization
- All authenticated routes must use `authenticate` middleware before `authorize`
- Admin routes (`/api/v1/admin/*`) require `authorize("ADMIN")`
- JWT payload shape: `{ id, email, role }` with 7-day expiry
- Never store passwords in plain text — use bcryptjs with 10 salt rounds

### Validation
- All request bodies validated via `validateBody(ZodSchema)` middleware
- Zod schemas are the source of truth — keep in sync with Prisma models
- Frontend forms use `zodResolver(Schema)` from the same shared package

### Error Handling
- Services throw `AppError(message, statusCode, code?)` — never return error objects
- Handlers do not catch errors (centralized middleware handles formatting)
- Error codes use SCREAMING_SNAKE_CASE: `"PRODUCT_NOT_FOUND"`, `"VALIDATION_ERROR"`
- All async handlers wrapped with `asyncHandler()`

### File Uploads
- Upload/delete routes require ADMIN role
- Max 5 MB per file, image/* MIME types only
- Cloudinary auto-converts to WebP
- All images stored in `jhaz-imprints/products/` folder
- Use three separate env vars (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) — never `CLOUDINARY_URL`

### Notifications
- Async via BullMQ — never send emails synchronously in request handlers
- Each send is non-fatal (try-catch per recipient)
- Jobs retried 3× with exponential backoff

### Payments
- Paystack only (Nigerian Naira / kobo conversion)
- Payment references must be globally unique
- Webhook handlers must be idempotent (double-check locking pattern)

### Frontend
- No global state manager — use React Query for server state, localStorage for persistence
- Admin app is Vite SPA (client-only), storefront is Next.js 14 SSR
- All styling via Tailwind CSS utility classes
- Next.js API routes are BFF proxies only — no direct DB access

---

## 5. Example Prompt Usage

> **Prompt**: "Add a customer review feature where customers can rate and review products they've ordered"

The AI should generate the following files following project conventions:

**Shared Schema:**
- `packages/shared/src/schemas/review.schema.ts` — Zod schema with `ReviewCreateSchema`

**Backend:**
- `packages/catalog-db/src/models/Review.model.ts` — Mongoose model (flexible data)
- `packages/catalog-db/src/models/types.ts` — Add `IReview` interface
- `packages/api/src/services/reviewService.ts` — Business logic functions
- `packages/api/src/handlers/reviews.ts` — Handler functions (`createReviewHandler`, `listReviewsHandler`)
- `packages/api/src/routes/reviews.ts` — Route with `authenticate` + `validateBody` + `asyncHandler`
- `packages/api/src/services/__tests__/reviewService.test.ts` — Unit tests

**Frontend (Storefront):**
- `apps/web/src/components/ProductReviews.tsx` — Display reviews on product page
- `apps/web/src/components/ReviewForm.tsx` — Form using `useForm` + `zodResolver(ReviewCreateSchema)`

**Frontend (Admin):**
- `apps/admin/src/components/ReviewModeration.tsx` — Admin review management

**Integration:**
- Update `packages/shared/src/index.ts` — Export review schemas
- Update `packages/catalog-db/src/models/index.ts` — Export Review model
- Update `packages/api/src/app.ts` — Register `reviewsRouter`
