import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as fabricCategoryService from "../services/fabricCategoryService";
import { CreateFabricCategorySchema, UpdateFabricCategorySchema } from "@jhaz-imprints/shared";
import { AppError } from "../errors/AppError";

/**
 * GET /api/v1/fabric-categories
 * List all fabric categories.
 */
export async function listFabricCategoriesHandler(req: Request, res: Response) {
  const categories = await fabricCategoryService.listFabricCategories();
  res.json({
    msg: "fabric categories list",
    data: categories,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * GET /api/v1/fabric-categories/:idOrSlug
 * Get a single fabric category by ID or slug.
 */
export async function getFabricCategoryHandler(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const category = await fabricCategoryService.getFabricCategoryByIdOrSlug(idOrSlug);
  res.json({
    msg: "fabric category details",
    data: category,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * POST /api/v1/admin/fabric-categories
 * Create a new fabric category.
 */
export async function createFabricCategoryHandler(req: AuthenticatedRequest, res: Response) {
  const result = CreateFabricCategorySchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => e.message).join("; ");
    throw new AppError(errorMsg, 400, "VALIDATION_ERROR");
  }

  const category = await fabricCategoryService.createFabricCategory(result.data);
  res.status(201).json({
    msg: "fabric category created",
    data: category,
    type: "SUCCESS",
    code: 601,
  });
}

/**
 * PUT /api/v1/admin/fabric-categories/:id
 * Update an existing fabric category.
 */
export async function updateFabricCategoryHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  if (!isObjectId) {
    throw new AppError("Invalid fabric category ID", 400, "INVALID_ID");
  }

  const result = UpdateFabricCategorySchema.safeParse(req.body);
  if (!result.success) {
    const errorMsg = result.error.errors.map((e) => e.message).join("; ");
    throw new AppError(errorMsg, 400, "VALIDATION_ERROR");
  }

  const category = await fabricCategoryService.updateFabricCategory(id, result.data);
  res.json({
    msg: "fabric category updated",
    data: category,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * DELETE /api/v1/admin/fabric-categories/:id
 * Delete a fabric category.
 */
export async function deleteFabricCategoryHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const isObjectId = /^[a-f\d]{24}$/i.test(id);
  if (!isObjectId) {
    throw new AppError("Invalid fabric category ID", 400, "INVALID_ID");
  }

  await fabricCategoryService.deleteFabricCategory(id);
  res.status(204).end();
}
