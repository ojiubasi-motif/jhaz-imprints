/**
 * Fabric route handlers.
 * Public:  GET /api/v1/fabrics, GET /api/v1/fabrics/:idOrSlug
 * Admin:   POST / PUT /:id / DELETE /:id on /api/v1/admin/fabrics
 */

import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as fabricService from "../services/fabricService";
import * as adminFabricService from "../services/adminFabricService";
import { AppError } from "../errors/AppError";
import { publishCatalogEvent } from "../redis";

// ─────────────────────────────────────────────────────────────────────────────
// Public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/fabrics
 * List all active fabrics.
 *
 * Query params:
 *   page  — page number (optional)
 *   limit — items per page (optional, max: 50)
 */
export async function listFabricsHandler(req: Request, res: Response) {
  const includeDeleted = req.query.includeDeleted === "true";
  const page = req.query.page ? Math.max(1, parseInt(req.query.page as string, 10)) : undefined;
  const limit = req.query.limit ? Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10))) : undefined;
  const category = req.query.category as string | undefined;

  const result = await fabricService.listFabrics({ includeDeleted, page, limit, category });
  res.json({
    msg: "fabrics list",
    data: result,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * GET /api/v1/fabrics/:idOrSlug
 * Fetch a single fabric by MongoDB ObjectId or URL slug.
 *
 * Examples:
 *   /api/v1/fabrics/507f1f77bcf86cd799439011
 *   /api/v1/fabrics/premium-aso-oke
 */
export async function getFabricHandler(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const fabric = await fabricService.getFabricByIdOrSlug(idOrSlug);
  res.json({
    msg: "fabric details",
    data: fabric,
    type: "SUCCESS",
    code: 600,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/fabrics
 * Create a new fabric.
 */
export async function createFabricHandler(req: AuthenticatedRequest, res: Response) {
  const fabric = await adminFabricService.createFabric(req.body);
  await publishCatalogEvent("FABRIC_CREATED", fabric);
  res.status(201).json({
    msg: "fabric created",
    data: fabric,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * PUT /api/v1/admin/fabrics/:id
 * Update a fabric by MongoDB ObjectId.
 */
export async function updateFabricHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError("Invalid fabric ID", 400, "INVALID_ID");
  }
  const fabric = await adminFabricService.updateFabric(id, req.body);
  await publishCatalogEvent("FABRIC_UPDATED", fabric);
  res.json({
    msg: "fabric updated",
    data: fabric,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * DELETE /api/v1/admin/fabrics/:id
 * Soft-delete a fabric by MongoDB ObjectId.
 * Existing product references are preserved.
 */
export async function deleteFabricHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError("Invalid fabric ID", 400, "INVALID_ID");
  }
  await adminFabricService.deleteFabric(id);
  await publishCatalogEvent("FABRIC_DELETED", { id });
  res.status(204).send();
}
