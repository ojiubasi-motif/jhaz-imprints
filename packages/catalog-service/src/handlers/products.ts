/**
 * Product route handlers.
 * Thin layer — all logic lives in productService.
 */

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as productService from "../services/productService";
import { AppError } from "../errors/AppError";

/**
 * GET /api/products
 * List active products with optional filtering and pagination.
 *
 * Query params:
 *   category  — category slug (e.g. agbada, kente-gown)
 *   gender    — one of: men | women | unisex | kids
 *   occasion  — one of: social-events-celebrations | casual | corporate | burial | wedding
 *   search    — partial name search (case-insensitive)
 *   page      — page number (default: 1)
 *   limit     — items per page (default: 12, max: 50)
 */
export async function listProductsHandler(req: AuthenticatedRequest, res: Response) {
  const { category, fabricCategory, gender, occasion, search, page, limit, isActive } = req.query;

  // Restrict access to draft/inactive products to admin/tailor only
  let targetIsActive = isActive as string | undefined;
  
  if (targetIsActive === "all" || targetIsActive === "false") {
    const userRole = req.user?.role;
    if (userRole !== "ADMIN" && userRole !== "TAILOR") {
      targetIsActive = "true";
    }
  }

  const result = await productService.listProducts({
    category: category as string | undefined,
    fabricCategory: fabricCategory as string | undefined,
    gender: gender as string | undefined,
    occasion: occasion as string | undefined,
    search: search as string | undefined,
    page: page ? Math.max(1, parseInt(page as string, 10)) : 1,
    limit: limit ? Math.min(50, Math.max(1, parseInt(limit as string, 10))) : 12,
    isActive: targetIsActive,
  });

  res.json({
    msg: "products list",
    data: result,
    type: "SUCCESS",
    code: 600,
  });
}

/**
 * GET /api/products/:idOrSlug
 * Fetch a single product by MongoDB ObjectId or URL slug.
 * Response includes populated fabric details.
 *
 * Examples:
 *   /api/products/507f1f77bcf86cd799439011
 *   /api/products/traditional-wedding-aso-oke
 */
export async function getProductHandler(req: AuthenticatedRequest, res: Response) {
  const { idOrSlug } = req.params;
  const product = await productService.getProductByIdOrSlug(idOrSlug);

  // If the product is not active, only admin/tailor can view it
  if (product && product.isActive === false) {
    const userRole = req.user?.role;
    if (userRole !== "ADMIN" && userRole !== "TAILOR") {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }
  }

  res.json({
    msg: "product details",
    data: product,
    type: "SUCCESS",
    code: 600,
  });
}
