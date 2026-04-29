# Jhaz-imprints E-Commerce Platform

A modular monorepo for the Jhaz-imprints E-Commerce Platform — a specialized platform for Nigerian traditional dress tailor services.

## Architecture

**Option B: Modular Monorepo (Decided)**

- `apps/web` — Next.js 14 App Router storefront (SSR, SEO-optimized)
- `apps/admin` — Vite + React admin dashboard
- `packages/api` — Express.js API server
- `packages/db` — Prisma + PostgreSQL database layer
- `packages/catalog-db` — Mongoose + MongoDB flexible catalog
- `packages/shared` — Zod schemas and shared TypeScript types

**Tech Stack:**
- Monorepo tooling: pnpm workspaces + Turborepo
- Frontend: Next.js 14, Tailwind CSS, React Query
- Admin: Vite + React, Tailwind CSS
- API: Express.js with JWT auth
- Databases: PostgreSQL (Neon free tier) + MongoDB (Atlas M0)
- Queue/Cache: BullMQ on Upstash Redis
- Deployment: Vercel (apps/web, apps/admin) + Railway (packages/api)

## Project Structure

```
jhaz-imprints/
├── apps/
│   ├── web/              # Next.js storefront (SSR)
│   └── admin/            # Vite + React admin dashboard
├── packages/
│   ├── api/              # Express.js business logic
│   ├── db/               # Prisma + PostgreSQL
│   ├── catalog-db/       # Mongoose + MongoDB
│   └── shared/           # Zod schemas, types, utilities
├── .github/
│   └── prompts/          # Setup and stage prompts
├── package.json          # Root workspace config
├── turbo.json            # Turborepo cache config
└── tsconfig.base.json    # Base TypeScript config
```

## Getting Started

### Prerequisites
- Node.js ≥ 18.17.0
- pnpm ≥ 9.0.0

### Install Dependencies
```bash
pnpm install
```

### Setup Database
```bash
# Copy environment template
cp .env.example .env.local

# Update .env.local with your PostgreSQL URL
# Then run migrations
pnpm db:migrate
```

### Development
```bash
# Start all dev servers in parallel
pnpm dev

# Or run specific workspace
pnpm --filter @jhaz-imprints/db db:studio
```

## Database Models (Stage 1)

**Core Entities:**
- `User` — Customer and admin accounts (soft-delete support)
- `Measurement` — Customer body measurements (multiple profiles, one default)
- `Order` — Order records (references measurement snapshot)
- `Payment` — 1:1 with Order (unique idempotency key)
- `OrderStatusHistory` — Status transition log with tailor notes

**Enums:**
- `Role` — CUSTOMER, ADMIN, TAILOR
- `OrderStatus` — PENDING, CONFIRMED, IN_PRODUCTION, COMPLETED, CANCELLED
- `PaymentStatus` — PENDING, COMPLETED, FAILED, REFUNDED

## Development Rules

### Database
- **Transactional data** (money, identity) → PostgreSQL + Prisma
- **Flexible catalog data** (garment attributes) → MongoDB + Mongoose

### Type Safety
- All API contracts validated with Zod schemas in `packages/shared`
- Zod schemas are source of truth for request/response shapes
- Client and API must import from `@jhaz-imprints/shared`

### Workspace Dependencies
- `apps/web` and `apps/admin` depend on `@jhaz-imprints/shared`, `@jhaz-imprints/db`
- `packages/api` depends on all `packages/*`
- No circular dependencies allowed

## Stage Progress

- [x] **Stage 1** — Monorepo scaffold + Prisma schema
- [x] **Stage 2** — MongoDB catalog model + product fixtures
- [x] **Stage 3** — Express API + auth + order pipeline
- [x] **Stage 4** — Next.js storefront + measurement wizard
- [x] **Stage 5** — Admin dashboard + Cloudinary image upload
- [ ] **Stage 6** — Order workflow + BullMQ queue
- [ ] **Stage 7** — Payment integration + webhooks

## Admin Dashboard (Stage 5)

The admin dashboard (`apps/admin`) provides role-based interfaces for managing operations and products.

### Architecture
- **Vite + React** — Fast dev server and build, client-side only
- **React Query** — Data fetching and caching with automatic refetch
- **Tailwind CSS** — Utility-first responsive design
- **Role-Based Views** — Different interfaces for tailor vs admin users

### User Roles & Views

**Tailor Role** (staff managing production):
- **Order Queue** — Lists CONFIRMED and IN_PRODUCTION orders
- Sortable by creation date (most urgent first)
- Inline status updates: IN_PRODUCTION → SHIPPED → DELIVERED
- Real-time polling every 30 seconds
- Shows customer name, measurements, order ID, status badge

**Admin Role** (managing catalog and analytics):
- **Analytics** — 4 metric cards (total revenue, orders this month, average order value, pending orders)
- **6-month revenue chart** using Recharts BarChart
- **Product Editor** — Create/edit products with dynamic fabric and style options
- **Image Upload** — Drag-and-drop Cloudinary integration with progress tracking

### Image Upload Feature

The `ImageUploader` component handles uploads to Cloudinary:

- **Drag-and-drop** interface with visual feedback
- **File validation** — JPG, PNG, WebP, max 5 MB per file
- **Progress bars** — Per-file upload progress using XMLHttpRequest
- **Thumbnail grid** — Preview with remove (✕) button
- **Primary toggle** — Mark first image as primary for product gallery
- **Automatic deletion** — DELETE endpoint purges from Cloudinary via public_id

### Cloudinary Integration

**API Routes:**
- `POST /api/v1/admin/uploads` — Upload image (multipart/form-data)
- `DELETE /api/v1/admin/uploads` — Delete image by public_id

**Environment Variables:**
```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Features:**
- Auto-converts images to WebP for web optimization
- Stores in `jhaz-imprints/products/` folder on Cloudinary
- Returns `url`, `publicId`, `width`, `height` on upload
- Validates MIME types before upload (rejects non-images with 422)

### Running the Admin Dashboard
```bash
# Development
pnpm --filter @jhaz-imprints/admin dev

# Production build
pnpm --filter @jhaz-imprints/admin build
pnpm --filter @jhaz-imprints/admin preview
```

The dashboard runs on `http://localhost:3002` by default.

The Next.js 14 storefront (`apps/web`) provides a customer-facing interface for browsing products and placing orders.

### Architecture
- **Next.js 14 App Router** — File-based routing, server components by default
- **React Hook Form + Zod** — Type-safe form validation using shared schemas
- **React Query** — Data fetching and caching
- **Tailwind CSS** — Utility-first styling, mobile-first responsive design

### Measurement Wizard
A 4-step guided workflow for customers to customize and order garments:

1. **Body Measurements** — Input body dimensions (cm) with interactive SVG diagram
2. **Style Choices** — Select from product style options with preview images
3. **Fabric & Colour** — Pick fabric with swatches and colour from palette
4. **Review & Pay** — Confirm selections, see total price, place order

### Key Features
- **localStorage drafts** — Auto-saves progress; refreshing won't lose data
- **Interactive diagram** — Body diagram highlights measurement regions on focus
- **Responsive design** — Single column on mobile, two columns on desktop
- **React Query** — Efficient data fetching with caching and background updates
- **Accessibility** — ARIA labels, roles, semantic HTML
- **Form validation** — Shared Zod schemas ensure API-client consistency

### Running the Storefront
```bash
# Development
pnpm --filter @jhaz-imprints/web dev

# Production build
pnpm --filter @jhaz-imprints/web build
pnpm --filter @jhaz-imprints/web start
```

The app runs on `http://localhost:3001` by default.

## Admin & Tailor Dashboard (Stage 5)

The Vite + React admin dashboard (`apps/admin`) provides role-based interfaces for operations.

### Architecture
- **Vite** — Fast development server and builds
- **React** — UI component library
- **React Query** — Server state management with auto-refetch
- **Tailwind CSS** — Responsive styling
- **Recharts** — Data visualization

### User Roles

**Tailor Role:**
- **Order Queue** — Lists CONFIRMED and IN_PRODUCTION orders
  - Sorted by creation date (most urgent first)
  - Cards show customer name, measurements, current status
  - Inline dropdown to update status: IN_PRODUCTION → SHIPPED → DELIVERED
  - Auto-refetch every 30 seconds with React Query
  - Optimistic UI updates on status change

**Admin Role:**
- **Analytics** — Dashboard with 4 key metrics
  - Total revenue, Orders this month, Average order value, Pending orders
  - 6-month revenue chart using Recharts
  - Graceful loading and error states

- **Product Editor** — Create/edit products with:
  - Basic info: name, category, price, description
  - Product gallery with **drag-and-drop image uploader**
  - Dynamic fabric options with individual swatch upload
  - Dynamic style options with preview image upload
  - SEO metadata panel
  - Form validation with Zod

### Image Upload Feature

The **ImageUploader** component provides:
- Drag-and-drop zone for multiple files
- Per-file progress bars with XMLHttpRequest
- File validation: JPG, PNG, WebP • Max 5 MB per file
- Thumbnail grid with remove (✕) buttons
- **Cloudinary integration** for persistent cloud storage
  - Auto-converts to WebP for web optimization
  - Folder organization: `jhaz-imprints/products`
  - Delete support with Cloudinary public ID tracking

### API Endpoints (New in Stage 5)

**Upload Management:**
- `POST /api/v1/admin/uploads` — Upload image to Cloudinary
  - Auth required (admin role)
  - Returns: `{ url, publicId, width, height }`
- `DELETE /api/v1/admin/uploads` — Remove image from Cloudinary
  - Auth required (admin role)
  - Body: `{ publicId: string }`

**Admin Analytics:**
- `GET /api/v1/admin/analytics` — Fetch dashboard metrics
  - Returns: total revenue, orders this month, average value, pending count, monthly breakdown

**Admin Orders:**
- `GET /api/v1/admin/orders` — List orders (filterable by status)
- `PATCH /api/v1/admin/orders/:id/status` — Update order status

### Running the Admin Dashboard
```bash
# Development
pnpm --filter @jhaz-imprints/admin dev

# Production build
pnpm --filter @jhaz-imprints/admin build
pnpm --filter @jhaz-imprints/admin preview
```

The dashboard runs on `http://localhost:3002` by default.

### Cloudinary Setup

Ensure these environment variables are set in `.env` or `.env.local`:
```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Important:** Never use `CLOUDINARY_URL` — use the three separate variables above.

The Express API (`packages/api`) handles all business logic:

### Architecture
- **Middleware:** JWT authentication, request validation via Zod
- **Services:** Order creation, payment confirmation (idempotent via reference)
- **Routes:** RESTful endpoints for orders and products
- **Queue:** BullMQ notifications (order confirmation, status updates)
- **Error Handling:** Centralized error middleware with typed AppError

### Key Features
- **Transactional consistency:** Order creation and payment wrapped in Prisma $transaction
- **Idempotent payments:** Payment reference uniqueness prevents double-processing
- **Async notifications:** Email + WhatsApp via BullMQ jobs
- **Pricing engine:** Pure function for computing totals with modifiers

### API Routes

**Orders:**
- `POST /api/orders` — Create order (auth required)
- `GET /api/orders` — List user's orders (auth required, paginated)
- `GET /api/orders/:orderId` — Get order details (auth required)
- `POST /api/orders/webhook/paystack` — Payment webhook (idempotent)

### Environment Variables
```bash
# Copy the example
cp .env.example .env.local

# Update with your credentials:
# - DATABASE_URL: PostgreSQL (Neon free tier)
# - MONGODB_URI: MongoDB Atlas M0
# - REDIS_HOST/PORT: Local or Upstash
# - JWT_SECRET: Generate a strong secret
# - PAYSTACK_*: Paystack account keys
# - EMAIL_*: Gmail or SendGrid for notifications
# - WHATSAPP_*: Twilio or WhatsApp Cloud API
```

### Running the API
```bash
# Development
pnpm --filter @jhaz-imprints/api dev

# Production build
pnpm --filter @jhaz-imprints/api build
pnpm --filter @jhaz-imprints/api start
```

### Notification Worker
The notification queue (`packages/api/src/queues/notificationWorker.ts`) automatically handles:
- **order-confirmed:** Sends confirmation email and WhatsApp message
- **status-updated:** Notifies customer of order status changes

Jobs are retried up to 3 times with exponential backoff on failure.

## Contributing

Follow the Turborepo conventions:
- Changes to `packages/db/schema.prisma` trigger `pnpm db:migrate`
- Shared Zod schemas must not drift from Prisma models
- Run `pnpm type-check` before committing
