/**
 * Public fabric routes — read-only, no authentication required.
 */

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import * as fabricHandlers from "../handlers/fabrics";

const router = Router();

/**
 * GET /api/v1/fabrics
 * List all active fabrics.
 */
router.get("/", asyncHandler(fabricHandlers.listFabricsHandler));

/**
 * GET /api/v1/fabrics/:idOrSlug
 * Get a single fabric by MongoDB ObjectId or URL slug.
 *
 * Examples:
 *   /api/v1/fabrics/507f1f77bcf86cd799439011
 *   /api/v1/fabrics/premium-aso-oke
 */
router.get("/:idOrSlug", asyncHandler(fabricHandlers.getFabricHandler));

export default router;
