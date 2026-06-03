/**
 * Admin fabric routes — CRUD operations.
 * All routes require authentication + ADMIN role.
 */

import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { asyncHandler } from "../utils/asyncHandler";
import * as fabricHandlers from "../handlers/fabrics";

const router = Router();

// All admin fabric routes require authentication + ADMIN role
router.use(authenticate, authorize("ADMIN"));

/**
 * POST /api/v1/admin/fabrics
 * Create a new fabric.
 */
router.post("/", asyncHandler(fabricHandlers.createFabricHandler));

/**
 * PUT /api/v1/admin/fabrics/:id
 * Update a fabric by MongoDB ObjectId.
 */
router.put("/:id", asyncHandler(fabricHandlers.updateFabricHandler));

/**
 * DELETE /api/v1/admin/fabrics/:id
 * Soft-delete a fabric by MongoDB ObjectId.
 * Returns 204 No Content on success.
 */
router.delete("/:id", asyncHandler(fabricHandlers.deleteFabricHandler));

export default router;
