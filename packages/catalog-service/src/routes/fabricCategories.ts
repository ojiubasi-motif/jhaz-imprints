import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as fabricCategoryHandlers from "../handlers/fabricCategories";

const router = Router();

/**
 * GET /api/v1/fabric-categories
 * List all fabric categories.
 */
router.get("/", asyncHandler(fabricCategoryHandlers.listFabricCategoriesHandler));

/**
 * GET /api/v1/fabric-categories/:idOrSlug
 * Get a single fabric category.
 */
router.get("/:idOrSlug", asyncHandler(fabricCategoryHandlers.getFabricCategoryHandler));

export default router;
