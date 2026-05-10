/**
 * Product routes — public, no authentication required.
 * Products are read-only for end users; creation/update/delete
 * happens via the admin panel (separate protected routes).
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as productHandlers from "../handlers/products";

const router = Router();

/**
 * GET /api/products
 * List all active products (paginated).
 *
 * Query params:
 *   ?category=agbada
 *   ?search=elegant
 *   ?page=2&limit=12
 */
router.get(
  "/",
  asyncHandler(productHandlers.listProductsHandler)
);

/**
 * GET /api/products/:idOrSlug
 * Get a single product by MongoDB ObjectId or slug.
 *
 * Examples:
 *   /api/products/507f1f77bcf86cd799439011
 *   /api/products/traditional-wedding-aso-oke
 */
router.get(
  "/:idOrSlug",
  asyncHandler(productHandlers.getProductHandler)
);

export default router;
