# Tech Stack & Domain Analysis - packages

## Core Technology Analysis

- **Programming Language**: TypeScript
- **Primary Framework**: Express.js (REST API)
- **Database Layers**:
    - **PostgreSQL (via Prisma)**: Managed in `@jhaz-imprints/db`. Used for users, auth, and relational data.
    - **MongoDB (via Mongoose)**: Managed in `@jhaz-imprints/catalog-db`. Used for the product catalog. Employs `mongoose-paginate-v2` for public-facing product listings.
- **Authentication**: JWT with a dual-token strategy (1d access, 30m refresh), `cookie-parser` for HTTP-only cookies, and `bcryptjs` for hashing.
- **Background Tasks**: BullMQ (Redis-backed queue).
- **External Services**:
    - **Cloudinary**: Image hosting and management.
    - **Nodemailer**: Transactional email services.
    - **Twilio**: SMS notifications.
    - **Paystack**: Payment processing and webhook verification.
- **Security**: Helmet, Express Rate Limit, Cors.
- **Validation**: Zod (standardized via `@jhaz-imprints/shared`).
- **Response Format**: Standardized Quizio envelope `{ msg, data, type, code }` with automated error mapping.

## Domain Specificity Analysis

- **Problem Domain**: Backend services for an E-commerce platform (Jhaz-imprints).
- **Core Business Concepts**:
    - **Session & Identity Management**: Secure authentication, password hashing, and token rotation.
    - **Product Catalog**: Flexible schema for traditional African dresses with dynamic fabric and style price modifiers.
    - **Media Management**: Handling high-quality product images via Cloudinary.
    - **Notification Pipeline**: SMS and Email alerts for orders and account activity.
- **User Interactions (via API)**:
    - User registration/login.
    - Profile management.
    - Product browsing and management (Admin).
    - Order processing, measurement submission, and offline/deferred payment initiation.
- **Primary Data Types**:
    - Users/Auth records (Relational).
    - Product/Catalog documents (Document-based).
    - Jobs/Tasks for background processing.
    - Payments and Order Status History (Relational).

## Application Boundaries

- **In-Scope**:
    - RESTful API endpoints for web and mobile clients.
    - Database migrations and schema management.
    - File upload handling and external service orchestration.
    - **Data Augmentation**: Relational data (Orders) enriched with Document data (Products) at runtime.
    - Defensive payload validation and precise schema adherence using strict string matching (e.g., trimming, downcasing) and custom `AppError` logging.
- **Architectural Patterns**:
    - **Resilient Fallback**: Orders default to 'Standard' options if selected modifiers are missing from the catalog configuration.
    - **Lean Queries**: MongoDB queries use `.lean()` for performance and serialization safety.
- **Architectural Inconsistencies**:
    - mixing raw SQL/Mongo queries within handlers (ongoing cleanup).
- **Specialized Libraries**:
    - `bullmq`: For robust background job processing.
    - `mongoose-paginate-v2`: For standardized pagination across catalog endpoints.
    - `@jhaz-imprints/shared`: Shared validation logic ensuring frontend-backend parity.
