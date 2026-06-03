/**
 * Category route handlers.
 * Public: GET /api/v1/categories
 * Admin:  POST / PUT /:slug / DELETE /:slug on /api/v1/admin/categories
 */

import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as categoryService from "../services/categoryService";

// ─────────────────────────────────────────────────────────────────────────────
// Public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/categories
 * Returns the full list of categories from categories.json.
 */
export function getCategoriesHandler(_req: Request, res: Response) {
  const categories = categoryService.getCategories();
  res.json({
    msg: "categories list",
    data: { categories },
    type: "SUCCESS",
    code: 600,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/admin/categories
 * Add a new category entry to categories.json.
 *
 * Body: { name: string; slug: string; desc?: string }
 */
export function createCategoryHandler(req: AuthenticatedRequest, res: Response) {
  const entry = categoryService.addCategory(req.body);
  res.status(201).json({
    msg: "category created",
    data: entry,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * PUT /api/v1/admin/categories/:slug
 * Update the name and/or desc of an existing category.
 * The slug is immutable — it is the unique identifier.
 *
 * Body: { name?: string; desc?: string }
 */
export function updateCategoryHandler(req: AuthenticatedRequest, res: Response) {
  const { slug } = req.params;
  const updated = categoryService.updateCategory(slug, req.body);
  res.json({
    msg: "category updated",
    data: updated,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * DELETE /api/v1/admin/categories/:slug
 * Remove a category from categories.json.
 *
 * Note: Removing a category does NOT retroactively strip it from existing
 * product documents. Products retain their embedded {name, slug} snapshots.
 */
export function deleteCategoryHandler(req: AuthenticatedRequest, res: Response) {
  const { slug } = req.params;
  categoryService.deleteCategory(slug);
  res.status(204).send();
}
