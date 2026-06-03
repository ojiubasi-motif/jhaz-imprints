/**
 * Public category routes — no authentication required.
 * Categories are read-only for end users; creation/update/delete
 * happens via the admin panel (separate protected routes).
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as categoryHandlers from "../handlers/categories";

const router = Router();

/**
 * GET /api/v1/categories
 * Returns the full category list from categories.json.
 *
 * Note: getCategoriesHandler is synchronous so asyncHandler is not strictly
 * required, but included for consistency with the project convention.
 */
router.get("/", asyncHandler(categoryHandlers.getCategoriesHandler));

export default router;
