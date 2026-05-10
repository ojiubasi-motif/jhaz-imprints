/**
 * Admin product routes — CRUD operations.
 * All routes require ADMIN role.
 */

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../utils/asyncHandler";
import * as adminProductHandlers from "../handlers/adminProducts";

const router = Router();

// All admin product routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

/**
 * POST /api/v1/admin/products
 * Create a new product.
 */
router.post("/", asyncHandler(adminProductHandlers.createProductHandler));

/**
 * PUT /api/v1/admin/products/:id
 * Update a product.
 */
router.put("/:id", asyncHandler(adminProductHandlers.updateProductHandler));

/**
 * DELETE /api/v1/admin/products/:id
 * Delete a product.
 */
router.delete("/:id", asyncHandler(adminProductHandlers.deleteProductHandler));

export default router;
