# Catalog Service Architecture & Conventions

## 1. Overview Section
This document serves as the canonical meta-instruction for AI coding assistants working within the jhaz-imprints codebase.

## 2. Tech Stack
# Tech Stack Summary for `@jhaz-imprints/catalog-service`

## Core Technology Analysis

- **Programming Language(s):** TypeScript / JavaScript (Node.js)
- **Primary Framework:** Express.js (v4.18.2)
- **Secondary Frameworks / Libraries:**
  - `mongoose` (MongoDB object modeling)
  - `ioredis` (Redis client)
  - `zod` (Schema validation)
  - `cloudinary` & `multer` (File/Image uploading)
  - `helmet` & `cors` & `express-rate-limit` (Security & Middleware)
- **State Management Approach:** Stateless REST API backend. State is persisted in MongoDB and Redis (likely used for caching or queues/streams).
- **Other Relevant Technologies/Patterns:** 
  - Monorepo structure using `pnpm` workspaces (depends on local `@jhaz-imprints/catalog-db` and `@jhaz-imprints/shared`).
  - Bundled using `tsup`.
  - Gateway-centric authentication verification (relies on API Gateway to validate JWTs and forward identity/security headers).
  - Microservice architecture (catalog domain is isolated from the main monolithic API).

## Domain Specificity Analysis

- **Specific Problem Domain:** E-commerce platform backend, specifically targeting a "Product Catalog" microservice. It manages product listings, fabric inventory, category taxonomy, administrative product/fabric management, and image uploads.
- **Core Business Concepts:** Product catalogs, fabric variants (with unit-based pricing), category taxonomy (static JSON), inventory/stock management, image asset management (Cloudinary), and event-driven synchronization with other services (via Redis).
- **User Interactions Supported:** Admin workflows (creating/updating/deleting products and fabrics, managing categories, uploading images) and user workflows (browsing products, filtering by category/gender/occasion, viewing fabric options).
- **Primary Data Types & Structures:** Product documents (Mongoose schemas with embedded category refs and ObjectId fabric refs), Fabric documents (Mongoose schemas with variant properties[]), static categories JSON, uploaded image files (Multer/Cloudinary), gateway-forwarded identity headers (x-user-id, x-user-role).

## Application Boundaries

- **In Scope:** Handling product, fabric, and category REST endpoints; connecting to MongoDB for product and fabric data; reading/writing static categories.json; handling Redis for catalog streams/caching; authenticating requests; managing Cloudinary uploads.
- **Out of Scope / Architecturally Inconsistent:** Managing users, handling payments, processing orders. Since this is a separated `catalog-service`, anything outside the pure "product catalog" domain belongs in the main monolithic API or other specialized microservices. It also does not use PostgreSQL/Prisma (which the main API uses).
- **Constraints:** Must use MongoDB (`mongoose`) for products and fabrics. Categories are stored as a static JSON file (not a DB collection). Must interact with the rest of the ecosystem via defined internal network boundaries (Docker) and potentially Redis streams rather than direct database joins.

## 3. File Categorization
```json
{
  "entrypoint": [
    "packages/catalog-service/src/server.ts"
  ],
  "configuration": [
    "packages/catalog-service/.env",
    "packages/catalog-service/package.json",
    "packages/catalog-service/tsconfig.json",
    "packages/catalog-service/tsup.config.ts"
  ],
  "infrastructure": [
    "packages/catalog-service/Dockerfile",
    "packages/catalog-service/docker-compose.dev.yml",
    "packages/catalog-service/src/redis.ts"
  ],
  "routes": [
    "packages/catalog-service/src/routes/products.ts",
    "packages/catalog-service/src/routes/adminProducts.ts",
    "packages/catalog-service/src/routes/categories.ts",
    "packages/catalog-service/src/routes/adminCategories.ts",
    "packages/catalog-service/src/routes/fabrics.ts",
    "packages/catalog-service/src/routes/adminFabrics.ts",
    "packages/catalog-service/src/routes/uploads.ts"
  ],
  "handlers": [
    "packages/catalog-service/src/handlers/products.ts",
    "packages/catalog-service/src/handlers/adminProducts.ts",
    "packages/catalog-service/src/handlers/categories.ts",
    "packages/catalog-service/src/handlers/fabrics.ts"
  ],
  "services": [
    "packages/catalog-service/src/services/productService.ts",
    "packages/catalog-service/src/services/adminProductService.ts",
    "packages/catalog-service/src/services/categoryService.ts",
    "packages/catalog-service/src/services/fabricService.ts",
    "packages/catalog-service/src/services/adminFabricService.ts",
    "packages/catalog-service/src/services/uploadService.ts"
  ],
  "data": [
    "packages/catalog-db/src/data/categories.json"
  ],
  "middleware": [
    "packages/catalog-service/src/middleware/authenticate.ts",
    "packages/catalog-service/src/middleware/validateBody.ts",
    "packages/catalog-service/src/middleware/authorize.ts"
  ],
  "utils": [
    "packages/catalog-service/src/utils/asyncHandler.ts",
    "packages/catalog-service/src/errors/AppError.ts"
  ],
  "types": [
    "packages/catalog-service/src/types/express.d.ts"
  ]
}
```

## 4. Architectural Domains
```json
{
  "routing": {
    "required_patterns": {
      "route-definitions": "Use Express Router. Routes are defined in the `src/routes/` directory."
    },
    "architectural_constraints": {
      "route-mounting": "All routers must be mounted in `src/server.ts` under the `/api/v1/...` path structure. Public routes (e.g. categories, fabrics, products) go under `/api/v1/{resource}`. Admin routes go under `/api/v1/admin/{resource}`."
    }
  },
  "controllers-handlers": {
    "required_patterns": {
      "async-error-handling": "Wrap all asynchronous route handlers in `asyncHandler` (from `src/utils/asyncHandler.ts`) to automatically pass errors to Express.",
      "sync-handlers-allowed": "Synchronous handlers (e.g. `getCategoriesHandler`) may also be wrapped in `asyncHandler` for consistency, even though they do not strictly require it."
    },
    "architectural_constraints": {
      "separation-of-concerns": "Handlers must only extract `req` data, invoke `services`, and format `res` output. No complex business logic.",
      "combined-handler-files": "When a resource has both public and admin handlers (e.g. categories), they may coexist in a single handler file with clear section comments separating public vs admin functions."
    }
  },
  "services": {
    "required_patterns": {
      "business-logic": "Encapsulate core business logic, database queries, and third-party API interactions (e.g., Cloudinary) in `src/services/`.",
      "admin-service-split": "Admin write operations (create/update/delete) live in dedicated `admin*Service.ts` files, separate from public read services.",
      "category-file-io": "Category CRUD is performed via atomic read-modify-write operations on a static JSON file (`categories.json`), NOT a MongoDB collection."
    },
    "architectural_constraints": {
      "http-agnostic": "Services must not directly interact with Express `req` or `res` objects. They should throw custom `AppError` on failure."
    }
  },
  "middleware": {
    "required_patterns": {
      "auth": "Use `authenticate` and `authorize` middleware to protect secured routes.",
      "validation": "Use `validateBody` middleware with Zod schemas (imported from shared package) to validate request payloads."
    },
    "architectural_constraints": {
      "pre-handler-execution": "Middleware must be chained in route definitions before the final handler executes."
    }
  },
  "data-layer": {
    "required_patterns": {
      "mongodb-models": "Import and use Mongoose models (`Product`, `Fabric`) and connection utilities from the workspace package `@jhaz-imprints/catalog-db`.",
      "fabric-collection": "Fabrics are a standalone MongoDB collection. Products reference fabrics via `ObjectId[]` (not embedded documents). Use `.populate('fabrics')` when full fabric detail is needed (e.g. single-product responses).",
      "category-json": "Categories are stored in a static JSON file at `packages/catalog-db/src/data/categories.json`. Products embed slim `{name, slug}` category references. The JSON file is the single source of truth and is managed via the `categoryService`.",
      "product-references": "Products use `categories: [{name, slug}]` (embedded refs from JSON) and `fabrics: [ObjectId]` (DB refs to Fabric collection). Products also have `gender`, `occasion` enum fields, a `defaultStyle` string field, and `styleOptions` (where each style option has an `imgUrl` associated with it)."
    },
    "architectural_constraints": {
      "no-prisma": "This microservice uses MongoDB via Mongoose. Prisma (which is used elsewhere in the monorepo) is strictly forbidden here.",
      "lean-queries": "All MongoDB queries must use `.lean()` for serialization safety."
    }
  },
  "error-handling": {
    "required_patterns": {
      "custom-errors": "Use the custom `AppError` class (from `src/errors/AppError.ts`) to throw operational errors with specific HTTP status codes."
    },
    "architectural_constraints": {
      "global-handling": "Errors must bubble up to the global Express error handler rather than being manually caught and sent as responses in every function."
    }
  }
}
```

## 5. Domain Deep Dives

# Controllers/Handlers Domain Implementation

The `controllers-handlers` domain is responsible for taking Express `Request` objects, extracting data, delegating to services, and formatting the `Response`.

## Consistent Patterns
- **Thin Handlers**: Handlers contain absolutely no core business logic or database queries.
- **Consistent Response Formatting**: All responses follow a standard envelope containing `msg`, `data`, `type`, and `code`.
- **Async Handling**: All handlers are async and are expected to be wrapped in an `asyncHandler` to safely catch unhandled rejections.
- **Combined Handler Files**: When a resource has both public and admin operations (e.g. categories, fabrics), both sets of handlers live in a single file with clear section comments (`// Public` / `// Admin`).
- **Admin Handlers use `AuthenticatedRequest`**: Admin handlers import `AuthenticatedRequest` from the authenticate middleware for the typed `req.user` property.

## Code Examples

**Public Handler (`src/handlers/products.ts`):**
```typescript
import type { Request, Response } from "express";
import * as productService from "../services/productService";

export async function listProductsHandler(req: Request, res: Response) {
  const { category, gender, occasion, search, page, limit } = req.query;

  const result = await productService.listProducts({
    category: category as string | undefined,
    gender: gender as string | undefined,
    occasion: occasion as string | undefined,
    search: search as string | undefined,
    page: page ? Math.max(1, parseInt(page as string, 10)) : 1,
    limit: limit ? parseInt(limit as string, 10) : 12,
  });

  res.json({
    msg: "products list",
    data: result,
    type: "SUCCESS",
    code: 600
  });
}
```

**Admin Handler with Catalog Event (`src/handlers/fabrics.ts`):**
```typescript
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as adminFabricService from "../services/adminFabricService";
import { publishCatalogEvent } from "../redis";

export async function createFabricHandler(req: AuthenticatedRequest, res: Response) {
  const fabric = await adminFabricService.createFabric(req.body);
  await publishCatalogEvent("FABRIC_CREATED", fabric);
  res.status(201).json({
    msg: "fabric created",
    data: fabric,
    type: "SUCCESS",
    code: 600,
  });
}
```

**Synchronous Handler (`src/handlers/categories.ts`):**
```typescript
export function getCategoriesHandler(_req: Request, res: Response) {
  const categories = categoryService.getCategories();
  res.json({
    msg: "categories list",
    data: { categories },
    type: "SUCCESS",
    code: 600,
  });
}
```

# Data Layer Domain Implementation

The `data-layer` domain handles persistence and connection management. The catalog-service uses two data sources: **MongoDB** (via Mongoose) for products and fabrics, and a **static JSON file** for categories.

## Consistent Patterns
- **Shared Workspace Package**: All Mongoose models (`Product`, `Fabric`) and DB connection logic are abstracted into a shared workspace package (`@jhaz-imprints/catalog-db`).
- **Connection Startup**: The service invokes the `connectMongoDB()` function before listening to the HTTP port.
- **Dual-Collection Architecture**: Products and Fabrics are separate Mongoose collections. Products reference fabrics via `ObjectId[]` (not embedded documents).
- **Static Category Data**: Categories are stored in `packages/catalog-db/src/data/categories.json` as a flat array. Products embed slim `{name, slug}` category snapshots. Category CRUD is handled by `categoryService` via file I/O — NOT a MongoDB collection.
- **Product Field Types**: Products use `categories: [{name, slug}]` (embedded refs), `fabrics: [ObjectId ref 'Fabric']`, plus `gender` and `occasion` enum fields, `defaultStyle` string, and `styleOptions: [{ name: string, priceModifier: number, description?: string, imgUrl: string }]`.

## Code Examples

**Database Initialization (`src/server.ts`):**
```typescript
import { connectMongoDB } from '@jhaz-imprints/catalog-db';

async function startServer() {
    try {
        await connectMongoDB();
        console.log('✅ Catalog DB connected successfully');
        // ...
    } catch (error) {
        process.exit(1);
    }
}
```

**Querying Products with Fabric Population (`src/services/productService.ts`):**
```typescript
import { Product } from "@jhaz-imprints/catalog-db";

export async function getProductById(id: string) {
  const product = await Product.findById(id)
    .populate("fabrics", "-__v -deletedAt")
    .lean()
    .select("-__v");
  return product;
}
```

**Querying Fabrics (`src/services/fabricService.ts`):**
```typescript
import { Fabric } from "@jhaz-imprints/catalog-db";

export async function listFabrics() {
  const fabrics = await Fabric.find({ deletedAt: null })
    .lean()
    .sort({ name: 1 })
    .select("-__v");
  return fabrics;
}
```

**Filtering by Category Slug (`src/services/productService.ts`):**
```typescript
// Category filter targets the embedded categories array
filter["categories.slug"] = category;
```

# Error Handling Domain Implementation

The `error-handling` domain ensures predictable HTTP status codes and payloads when application logic fails.

## Consistent Patterns
- **Custom Error Class**: `AppError` is used to throw named errors with specific HTTP status codes.
- **Async Wrapper**: `asyncHandler` wraps route handlers to forward unhandled promise rejections directly to Express' `next()` middleware.

## Code Examples

**Throwing an Error (`src/services/productService.ts`):**
```typescript
import { AppError } from "../errors/AppError";

if (!product) {
  throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
}
```

**Catching Async Errors (`src/routes/products.ts`):**
```typescript
import { asyncHandler } from "../utils/asyncHandler";
import * as productHandlers from "../handlers/products";

router.get(
  "/:idOrSlug",
  asyncHandler(productHandlers.getProductHandler)
);
```

# Middleware Domain Implementation

The `middleware` domain provides reusable Express middleware functions for cross-cutting concerns like authentication, authorization, and validation.

## Consistent Patterns
- **Authentication**: Gateway-centric verification. The `authenticate` middleware verifies that the incoming request has a valid `x-internal-secret` matching `INTERNAL_GATEWAY_SECRET` to prevent direct external bypass, and extracts pre-validated user identity from `x-user-id`, `x-user-role`, and `x-user-email` headers.
- **Gateway Origin Verification**: The `verifyGatewayOrigin` middleware globally validates the incoming `x-internal-secret` header for all requests (bypassing `/health` and `/api/health` endpoints), ensuring clients cannot hit internal catalog service routes directly.
- **Validation**: Zod schema validation is processed via a generic `validateBody` middleware.
- **Failure Responses**: Middleware functions typically intercept the request and return standard JSON failure envelopes directly if conditions aren't met (such as missing/invalid internal secret or missing user headers), rather than throwing to the global handler.

## Code Examples

**Authentication (`src/middleware/authenticate.ts`):**
```typescript
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const incomingSecret = req.headers["x-internal-secret"];

  if (!INTERNAL_SECRET || incomingSecret !== INTERNAL_SECRET) {
    return res.status(403).json({
      msg: "Forbidden: Direct access to internal service is not permitted.",
      data: null,
      type: "GATEWAY_BYPASS_DETECTED",
      code: 403,
    });
  }

  const userId    = req.headers["x-user-id"]    as string | undefined;
  const userRole  = req.headers["x-user-role"]  as string | undefined;
  const userEmail = req.headers["x-user-email"] as string | undefined;

  if (!userId || !userRole) {
    return res.status(401).json({
      msg: "Unauthorized: Missing identity headers. Ensure the gateway is performing authentication.",
      data: null,
      type: "AUTHENTICATION_FAILED",
      code: 401,
    });
  }

  req.user = {
    id:    userId,
    email: userEmail ?? "",
    role:  userRole as "CUSTOMER" | "ADMIN" | "TAILOR",
  };

  next();
}

export function verifyGatewayOrigin(req: Request, res: Response, next: NextFunction) {
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  const incomingSecret = req.headers["x-internal-secret"];

  if (!INTERNAL_SECRET || incomingSecret !== INTERNAL_SECRET) {
    return res.status(403).json({
      msg: "Forbidden: Direct access to internal service is not permitted.",
      data: null,
      type: "GATEWAY_BYPASS_DETECTED",
      code: 403,
    });
  }

  next();
}
```

# Routing Domain Implementation

The `routing` domain in this project uses standard Express routing conventions. Routes are declared in `src/routes/` and mounted in `src/server.ts`.

## Consistent Patterns
- **Separation from Business Logic**: Routes are defined in isolation and delegate to handlers using `asyncHandler`.
- **Modularity**: Each resource has its own router file. Admin routes are split into separate files (e.g. `adminProducts.ts`, `adminCategories.ts`, `adminFabrics.ts`).
- **Public vs Admin Mounting**: Public routes are mounted at `/api/v1/{resource}`. Admin routes are mounted at `/api/v1/admin/{resource}` and apply `authenticate` + `authorize("ADMIN")` middleware at the router level.

## Code Examples

**Mounting in `src/server.ts`:**
```typescript
import categoryRouter from './routes/categories';
import adminCategoryRouter from './routes/adminCategories';
import fabricRouter from './routes/fabrics';
import adminFabricRouter from './routes/adminFabrics';
import productRouter from './routes/products';
import adminProductRouter from './routes/adminProducts';

// Public routes
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/fabrics', fabricRouter);
app.use('/api/v1/products', productRouter);

// Admin routes
app.use('/api/v1/admin/categories', adminCategoryRouter);
app.use('/api/v1/admin/fabrics', adminFabricRouter);
app.use('/api/v1/admin/products', adminProductRouter);
```

**Admin Route with Router-level Auth (`src/routes/adminFabrics.ts`):**
```typescript
import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../utils/asyncHandler";
import * as fabricHandlers from "../handlers/fabrics";

const router = Router();
router.use(authenticate, authorize("ADMIN"));

router.post("/", asyncHandler(fabricHandlers.createFabricHandler));
router.put("/:id", asyncHandler(fabricHandlers.updateFabricHandler));
router.delete("/:id", asyncHandler(fabricHandlers.deleteFabricHandler));

export default router;
```

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

## 6. Style Guides

# Configuration Styleguide

## Unique Patterns
- **Build Output**: `tsup.config.ts` is explicitly configured to bundle the entire Express app into a single ESM file (`dist/server.js`) rather than preserving the source file structure, which optimizes it for production Docker containers.
- **Monorepo Dependency Syntax**: `package.json` relies on `workspace:*` dependencies for internal libraries (`@jhaz-imprints/catalog-db`, `@jhaz-imprints/shared`) instead of specific versions.

# Entrypoint Styleguide

## Unique Patterns
- **Health Check Database Connection Validation**: The `/health` route doesn't just return a 200 OK. It actively checks `getMongoDBConnection().readyState` and throws an HTTP 503 if the database is disconnected.
- **Top-level await prevention**: It uses a named `startServer()` async function that connects to MongoDB before calling `app.listen()`, ensuring the server refuses to accept connections before the database is ready.

# Handlers Styleguide

## Unique Patterns
- **Custom Response Envelopes**: All JSON responses use a specific envelope structure unique to this API: `{ msg: string, data: any, type: "SUCCESS" | string, code: number }`.
- **Query Parameter Casting**: Because Express `req.query` parses values as strings, handlers are responsible for manually casting strings to numbers (e.g. `page: parseInt(page, 10)`) before handing them off to the services layer.

# Infrastructure Styleguide

## Unique Patterns
- **Multi-stage Docker Builds**: The `Dockerfile` separates building dependencies, compiling the code via `pnpm`, and generating a minimal production layer running as a non-root `appuser`.
- **Inter-service Dependencies**: The `docker-compose.dev.yml` explicitly ties `catalog-service` to a customized Redis and MongoDB instance instead of reusing a shared monolithic database, reflecting strict microservice boundaries.

# Middleware Styleguide

## Unique Patterns
- **Internal Gateway Secret Verification**: To protect the internal catalog service from direct access (bypassing the API gateway), the authentication middleware validates that the incoming `x-internal-secret` matches the environment variable `INTERNAL_GATEWAY_SECRET`.
- **Identity Header Forwarding**: Instead of parsing JWTs directly, the service relies on the API gateway to authenticate requests. It extracts `x-user-id`, `x-user-role`, and `x-user-email` headers forwarded by the gateway, manually casting the role via `userRole as "CUSTOMER" | "ADMIN" | "TAILOR"`.
- **Custom Security Envelope Codes**: Direct bypass attempts are met with a `403 Forbidden` response and custom type `GATEWAY_BYPASS_DETECTED` (code: 403). Missing identity headers on a protected route result in a `401 Unauthorized` response with type `AUTHENTICATION_FAILED` (code: 401).

# Routes Styleguide

## Unique Patterns
- **Complete Logic Delegation**: Route files are purely descriptive. They define the HTTP verb, the URL pattern, and chain middleware (like `asyncHandler(handler)`). They do not parse variables or format responses.
- **Param/Query Documentation**: The top of the route or above the route definition includes JSDoc blocks explaining valid query parameters (e.g., `?category=agbada&gender=men`) and URL structures.
- **Admin Route-Level Middleware**: Admin routers apply `authenticate` and `authorize("ADMIN")` at the router level (via `router.use(...)`) rather than per-route, reducing boilerplate.
- **Separate Admin Routers**: Each resource with admin CRUD gets a dedicated admin route file (e.g. `adminCategories.ts`, `adminFabrics.ts`, `adminProducts.ts`) separate from the public route file.

# Services Styleguide

## Unique Patterns
- **Mongoose `lean()` by Default**: Every query made to MongoDB uses `.lean()` to return plain old JavaScript objects instead of heavy Mongoose Documents, ensuring fast serialization and safety when passing data back to Express handlers.
- **ObjectId vs Slug Resolution**: The service layer handles polymorphic lookups. For instance, `getProductByIdOrSlug` dynamically checks if the incoming string matches a 24-character hex regex to determine if it should query by `_id` or `slug`.
- **Dynamic Virtual Mapping for Lean Documents**: Because `.lean()` bypasses Mongoose schema virtuals, the service layer defines and executes mapper utilities (such as `addImagesField`) to reconstruct computed virtual properties (like `images` mapped from `styleOptions` and `defaultStyle`) on the plain JavaScript result objects before returning them.

# Types Styleguide

## Unique Patterns
- **Express Request Augmentation**: `src/types/express.d.ts` extends the global Express namespace to inject the authenticated `user` object (consisting of gateway-forwarded user headers) directly onto the standard `Request` object, avoiding the need to manually cast `req as AuthenticatedRequest` in every secured handler.

# Utils Styleguide

## Unique Patterns
- **`asyncHandler` Wrapper**: Instead of relying on `express-async-errors`, this project uses a tiny custom higher-order function `asyncHandler` to wrap promises and pass rejected errors to `next()`.
- **Custom `AppError`**: `AppError` includes a `type` string property on top of the standard `statusCode`, allowing the global error handler to map business errors to the `{ type, code }` response format used universally in this API.
