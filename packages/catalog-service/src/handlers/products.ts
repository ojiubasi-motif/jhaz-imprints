/**
 * Product route handlers.
 * Thin layer — all logic lives in productService.
 */

import type { Request, Response } from "express";
import * as productService from "../services/productService";

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
export async function listProductsHandler(req: Request, res: Response) {
  const { category, gender, occasion, search, page, limit } = req.query;

  const result = await productService.listProducts({
    category: category as string | undefined,
    gender: gender as string | undefined,
    occasion: occasion as string | undefined,
    search: search as string | undefined,
    page: page ? Math.max(1, parseInt(page as string, 10)) : 1,
    limit: limit ? parseInt(limit as string, 10) : 12,
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
export async function getProductHandler(req: Request, res: Response) {
  const { idOrSlug } = req.params;
  const product = await productService.getProductByIdOrSlug(idOrSlug);
  res.json({
    msg: "product details",
    data: product,
    type: "SUCCESS",
    code: 600,
  });
}
