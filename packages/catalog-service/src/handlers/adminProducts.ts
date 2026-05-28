/**
 * Admin product route handlers.
 * Thin layer — all logic lives in adminProductService.
 */

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as adminProductService from "../services/adminProductService";
import { AppError } from "../errors/AppError";
import { publishCatalogEvent } from "../redis";

/**
 * POST /api/v1/admin/products
 * Create a new product.
 */
export async function createProductHandler(req: AuthenticatedRequest, res: Response) {
  const product = await adminProductService.createProduct(req.body);
  
  // Publish event
  await publishCatalogEvent("PRODUCT_CREATED", product);
  
  res.status(201).json({
    msg: "product created",
    data: product,
    type: "SUCCESS",
    code: 600
  });
}

/**
 * PUT /api/v1/admin/products/:id
 * Update a product by MongoDB ObjectId.
 */
export async function updateProductHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError("Invalid product ID", 400);
  }
  const product = await adminProductService.updateProduct(id, req.body);
  
  // Publish event
  await publishCatalogEvent("PRODUCT_UPDATED", product);

  res.json({
    msg: "product updated",
    data: product,
    type: "SUCCESS",
    code: 600
  });
}

/**
 * DELETE /api/v1/admin/products/:id
 * Delete a product by MongoDB ObjectId.
 */
export async function deleteProductHandler(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  if (!/^[a-f\d]{24}$/i.test(id)) {
    throw new AppError("Invalid product ID", 400);
  }
  await adminProductService.deleteProduct(id);
  
  // Publish event with just the ID
  await publishCatalogEvent("PRODUCT_DELETED", { id });

  res.status(204).send();
}
