# Tech Stack & Domain Analysis - packages

## Core Technology Analysis

- **Programming Language**: TypeScript
- **Primary Framework**: Express.js (REST API)
- **Database Layers**:
    - **PostgreSQL (via Prisma)**: Managed in `@jhaz-imprints/db`. Used for users, auth, relational data, and local catalog cache (`CachedProduct`).
    - **MongoDB (via Mongoose)**: Directly read at runtime by this package. MongoDB catalog events (products and fabrics) are read from MongoDB using Mongoose models (from `@jhaz-imprints/catalog-db`) during checkout and order validation. Catalog events are also replicated to PostgreSQL's `CachedProduct` table via Redis Streams.
- **Authentication**: Gateway-centric authentication. JWT validation is handled by the API Gateway. The API verifies incoming request origin via `x-internal-secret` and extracts pre-validated user identity from `x-user-id`, `x-user-role`, `x-user-email` headers. (Standard login/register endpoints are still exposed, issuing dual-tokens: 1d access, 30m refresh, with rotation via HTTP-only cookies).
- **Background Tasks**: BullMQ (Redis-backed queue for notification jobs) and Redis stream consumer for Catalog Event Replication (`catalogEventWorker`).
- **External Services**:
    - **Nodemailer**: Transactional email services.
    - **Twilio**: SMS notifications.
    - **Paystack**: Payment processing and webhook verification.
- **Security**: Helmet, Express Rate Limit, Cors.
- **Validation**: Zod (standardized via `@jhaz-imprints/shared`).
- **Response Format**: Standardized Quizio envelope `{ msg, data, type, code }` with automated error mapping.

## Domain Specificity Analysis

- **Problem Domain**: Core transactional backend services for an E-commerce platform (Jhaz-imprints).
- **Core Business Concepts**:
    - **Session & Identity Management**: Secure authentication, password hashing, and token rotation.
    - **Product Catalog Cache**: Querying replicated product data with dynamic fabric and style price modifiers locally from PostgreSQL.
    - **Notification Pipeline**: SMS and Email alerts for orders and account activity.
- **User Interactions (via API)**:
    - User registration/login.
    - Profile management.
    - Order processing, measurement submission, and payment initiation.
- **Primary Data Types**:
    - Users/Auth records (Relational).
    - Cached Product data (Relational JSON).
    - Jobs/Tasks for background processing.
    - Payments and Order Status History (Relational).

## Application Boundaries

- **In-Scope**:
    - RESTful API endpoints for web and mobile clients (User / Orders / Auth).
    - Database migrations and schema management.
    - Event replication worker listening to Redis stream catalog updates to maintain SQL product cache.
    - **Order Snapshotting**: Relational data (Orders) contains inline snapshotted product, fabric, and customization choices in PostgreSQL at checkout.
    - Defensive payload validation and precise schema adherence using strict string matching (e.g., trimming, downcasing) and custom `AppError` logging.
- **Architectural Patterns**:
    - **Resilient Fallback**: Orders default to 'Standard' options if selected modifiers are missing from the catalog configuration.
- **Architectural Inconsistencies**:
    - Unused MongoDB/Mongoose imports in server boot.
- **Specialized Libraries**:
    - `bullmq`: For robust background job processing.
    - `@jhaz-imprints/shared`: Shared validation logic ensuring frontend-backend parity.
