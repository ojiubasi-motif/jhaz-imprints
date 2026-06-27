import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../utils/asyncHandler";
import * as fabricCategoryHandlers from "../handlers/fabricCategories";

const router = Router();

// All admin fabric category routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

/**
 * POST /api/v1/admin/fabric-categories
 * Create a new fabric category.
 */
router.post("/", asyncHandler(fabricCategoryHandlers.createFabricCategoryHandler));

/**
 * PUT /api/v1/admin/fabric-categories/:id
 * Update a fabric category by ID.
 */
router.put("/:id", asyncHandler(fabricCategoryHandlers.updateFabricCategoryHandler));

/**
 * DELETE /api/v1/admin/fabric-categories/:id
 * Delete a fabric category by ID.
 */
router.delete("/:id", asyncHandler(fabricCategoryHandlers.deleteFabricCategoryHandler));

export default router;
