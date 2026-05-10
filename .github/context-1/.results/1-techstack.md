# Technology Stack Analysis — Jhaz-imprints

## Core Technology Analysis

### Programming Language(s)
- **TypeScript** — Primary language across all packages and apps. Strict mode enabled via `tsconfig.base.json`. ESM modules (`"type": "module"` in `packages/api`).
- **JavaScript** — Limited to config files only (`postcss.config.js`, `next.config.js`).

### Primary Framework
- **Express.js v4** — API server (`packages/api`). Handles all REST endpoints, middleware, and error handling.
- **Next.js 14 (App Router)** — Customer-facing storefront (`apps/web`). Uses server components by default, file-based routing.
- **React** — UI library used by both `apps/web` (via Next.js) and `apps/admin` (via Vite).

### Secondary/Tertiary Frameworks
- **Vite** — Build tool and dev server for the admin dashboard (`apps/admin`).
- **Prisma v5** — ORM for PostgreSQL (`packages/db`). Schema-driven, type-safe database access.
- **Mongoose** — ODM for MongoDB (`packages/catalog-db`). Used for flexible product catalog data.
- **BullMQ** — Job queue backed by Redis. Handles async notification processing (email).
- **React Query (@tanstack/react-query)** — Server state management in both frontends.
- **React Hook Form** — Form management with Zod resolver integration.
- **Recharts** — Data visualization in the admin analytics dashboard.
- **Tailwind CSS** — Utility-first styling across all frontend apps.

### State Management Approach
- **React Query** — Primary server state management. Caching, background refetch, and optimistic updates.
- **React Hook Form** — Form state management with Zod schema validation.
- **localStorage** — Draft persistence for the measurement wizard; auth token and role storage.
- **No global client-side state manager** (no Redux, Zustand, etc.). State is localized to components.

### Other Relevant Technologies & Patterns
- **Zod** — Runtime schema validation, shared across API and clients via `@jhaz-imprints/shared`.
- **JWT (jsonwebtoken)** — Bearer token authentication with 7-day expiry.
- **bcryptjs** — Password hashing (10 salt rounds).
- **Cloudinary** — Cloud image storage with auto WebP conversion.
- **Multer** — Multipart form-data parsing for file uploads (in-memory storage).
- **Helmet** — HTTP security headers.
- **express-rate-limit** — Rate limiting on auth endpoints (10 req/15 min).
- **Nodemailer** — Email delivery via Gmail SMTP.
- **Paystack API** — Payment processing (Nigerian payment gateway, Naira/kobo conversion).
- **Turborepo** — Monorepo task orchestration and caching.
- **pnpm workspaces** — Package management with workspace protocol (`workspace:*`).

---

## Domain Specificity Analysis

### Problem Domain
**Nigerian traditional dress e-commerce and bespoke tailoring platform.** Jhaz-imprints is a specialized marketplace for ordering custom-made African traditional garments (Aso-oke, Agbada, Kente gowns, Ankara casual) with body measurements, fabric/style customization, and tailor production workflow management.

### Core Business Concepts
- **Bespoke garment ordering** — Customers provide body measurements and select fabric/style/colour options for made-to-order outfits.
- **Measurement profiles** — Multiple measurement sets per customer, with a default profile. Measurements are snapshotted at order time.
- **Pricing engine** — Additive pricing: base price + fabric modifier + style modifier. Pure function, fully deterministic.
- **Payment processing** — Paystack integration with Initialize → Pay → Verify flow. Idempotent webhook handling with double-check locking pattern.
- **Order lifecycle** — PENDING → CONFIRMED → IN_PRODUCTION → COMPLETED/CANCELLED. Status transitions are logged with tailor notes.
- **Role-based workflow** — CUSTOMER (shop + order), TAILOR (production queue), ADMIN (analytics + catalog management).
- **Async notification pipeline** — BullMQ queues for email notifications on order confirmation and status updates.

### User Interactions
- **Customer**: Browse products → customize (measurements, fabric, style, colour) via 4-step wizard → pay via Paystack → track order status.
- **Tailor**: View order queue (CONFIRMED/IN_PRODUCTION) → update status with inline dropdown → auto-poll every 30s.
- **Admin**: View analytics dashboard (revenue, orders, averages) → create/edit products with image upload → manage catalog.

### Primary Data Types & Structures
- **User** (PostgreSQL) — email, password, role, soft-delete.
- **Measurement** (PostgreSQL) — chest, waist, hip, shoulder, armLength, length in cm. Multiple profiles per user.
- **Order** (PostgreSQL) — references user + measurement snapshot. Status enum, currency (NGN), total amount.
- **Payment** (PostgreSQL) — 1:1 with order. Unique reference for idempotency. Paystack provider.
- **OrderStatusHistory** (PostgreSQL) — status transition audit log with tailor notes.
- **Product** (MongoDB) — name, slug, category enum, description, basePrice, images[], fabricOptions[], colorOptions[], styleOptions[], productionDays, isActive, seoMeta.

---

## Application Boundaries

### Features Clearly In Scope
- Customer registration and JWT authentication
- Product catalog browsing with category filter and search (pagination)
- 4-step measurement/customization wizard with draft persistence
- Order creation with Paystack payment initialization
- Idempotent payment webhook processing
- Tailor order queue with status updates and real-time polling
- Admin analytics dashboard with revenue charting
- Admin product CRUD with Cloudinary image upload
- Async email notifications (order confirmation + status updates + admin alerts)
- SEO metadata management for products

### Features Architecturally Inconsistent
- Real-time chat or WebSocket features (no WebSocket infrastructure exists)
- Social login / OAuth (only email+password JWT auth is implemented)
- Multi-tenancy (single-tenant design)
- Internationalization / multi-currency (hardcoded to NGN and Nigerian locale)
- Mobile app backend (no push notification infrastructure, though email-only notification pattern could extend)
- Complex inventory management (products are catalog-only, no stock tracking beyond `inStock` on fabric options)
- User-generated content (reviews, ratings) — no models or routes exist

### Specialized Libraries Suggesting Domain Constraints
- **Paystack** — Locks payment to Nigerian naira (NGN) and kobo conversion. African payment gateway.
- **mongoose-paginate-v2** — Pagination pattern is deeply embedded in product listing.
- **Cloudinary with WebP auto-conversion** — Image pipeline is cloud-dependent.
- **BullMQ + Redis** — Notification architecture requires Redis infrastructure.
- **Product category enum** — Fixed to: `wedding-aso-oke`, `agbada`, `kente-gown`, `ankara-casual`, `other`.
