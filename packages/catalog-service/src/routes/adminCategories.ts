/**
 * Admin category routes — CRUD operations for categories.json.
 * All routes require authentication + ADMIN role.
 */

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../utils/asyncHandler";
import * as categoryHandlers from "../handlers/categories";

const router = Router();

// All admin category routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

/**
 * POST /api/v1/admin/categories
 * Add a new category to categories.json.
 *
 * Body: { name: string; slug: string; desc?: string }
 */
router.post("/", asyncHandler(categoryHandlers.createCategoryHandler));

/**
 * PUT /api/v1/admin/categories/:slug
 * Update the name and/or desc of an existing category.
 * The slug cannot be changed (it is the unique identifier).
 *
 * Body: { name?: string; desc?: string }
 */
router.put("/:slug", asyncHandler(categoryHandlers.updateCategoryHandler));

/**
 * DELETE /api/v1/admin/categories/:slug
 * Remove a category from categories.json.
 * Returns 204 No Content on success.
 */
router.delete("/:slug", asyncHandler(categoryHandlers.deleteCategoryHandler));

export default router;
