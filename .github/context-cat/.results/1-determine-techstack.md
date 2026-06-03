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
