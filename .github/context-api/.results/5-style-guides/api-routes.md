# API Routes Style Guide - packages/api

## Core Principles

- **Modularity**: Use `express.Router()` for each domain.
- **Middleware Integration**: Apply `authenticate` and `authorize` middleware at the route level.
- **RESTful naming**: Use plural nouns for resources (e.g., `/products`, `/orders`).
- **Error Handling**: Wrap all route handlers in `asyncHandler` to catch asynchronous errors.
- **Validation**: Use `validateBody` middleware to enforce schema constraints on incoming requests.

## Implementation Patterns

### Route Definition
```typescript
import { Router } from "express";
import { myHandler } from "../handlers/myHandler";
import { authenticate } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middleware/validateBody";
import { MySchema } from "@jhaz-imprints/shared";

const router = Router();

router.post("/", authenticate, validateBody(mySchema), asyncHandler(myHandler));

export default router;
```

## Naming Conventions
- Files: `camelCase.ts` matching the domain (e.g., `adminProducts.ts`).
