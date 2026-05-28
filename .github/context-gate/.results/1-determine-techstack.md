# Tech Stack Summary for `@jhaz-imprints/gateway`

## Core Technology Analysis

- **Programming Language(s):** JavaScript (Node.js, ECMAScript Modules / ESM)
- **Primary Framework:** Express.js (v5)
- **Secondary Frameworks / Libraries:**
  - `jsonwebtoken` (JWT signature verification and parsing at the edge)
  - `needle` (Lightweight HTTP client for proxy pass-through forwarding)
  - `express-rate-limit` (DDoS / brute force prevention)
  - `cors` (Cross-Origin Resource Sharing configuration)
  - `dotenv` (Environment variable loading)
- **State Management Approach:** Fully stateless. No database connections (PostgreSQL or MongoDB). JWT validation is verified purely in-memory using a shared `JWT_SECRET`.
- **Other Relevant Technologies/Patterns:** 
  - Monorepo package under `@jhaz-imprints/gateway`.
  - Service routing using a longest-prefix matching `SERVICE_MAP` to target internal Docker service names.
  - Multi-stage Docker deployment running under a non-root `appuser`.

## Domain Specificity Analysis

- **Specific Problem Domain:** API Gateway / Reverse Proxy microservice. Enforces global policies (rate limiting, authentication, authorization, logging) and proxies requests to backend microservices.
- **Core Business Concepts:** Route resolution, edge authentication, role-based authorization (RBAC), structured request logging, CORS preflight, rate limiting.
- **User Interactions Supported:** Intercepts all client requests to `/api/*` and public endpoints like `/health` before deciding to authorize and forward.
- **Primary Data Types & Structures:** JWT payloads (roles, IDs), service mapping registry (`SERVICE_MAP`), route matching rules, request timing and logging telemetry.

## Application Boundaries

- **In Scope:** Timing request lifecycles, parsing CORS preflights, limiting IP request rates, validating JWT signatures, checking role permission mappings (CUSTOMER, ADMIN, TAILOR), mapping routes to downstream internal hosts (e.g. `catalog-service`, `core-api`), proxying request bodies and headers.
- **Out of Scope / Architecturally Inconsistent:** Storing persistent user data, direct database querying, processing business logic (order creation, product catalog modification, email delivery).
- **Constraints:** Cannot couple to database clients (Prisma/Mongoose are strictly prohibited). Must use Express 5 wildcard routing (`/api/*splat`) and proxy requests raw/verbatim.
