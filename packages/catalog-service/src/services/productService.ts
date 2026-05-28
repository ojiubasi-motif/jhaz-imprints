/**
 * Product service — query logic for the MongoDB product catalog.
 * All functions return plain JS objects (lean: true) for serialization safety.
 */

import type { PaginateModel } from "mongoose-paginate-v2";
import { Product } from "@jhaz-imprints/catalog-db";
import type { IProduct } from "@jhaz-imprints/catalog-db";
import { AppError } from "../errors/AppError";

const VALID_CATEGORIES = [
  "wedding-aso-oke",
  "agbada",
  "kente-gown",
  "ankara-casual",
  "other",
] as const;

export type ProductCategory = (typeof VALID_CATEGORIES)[number];

export interface ListProductsQuery {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * List all active products with optional category filter and name search.
 * Returns a paginated result using mongoose-paginate-v2.
 *
 * @example
 *   GET /api/products?category=agbada&search=elegant&page=1&limit=12
 */
export async function listProducts(query: ListProductsQuery) {
  const { category, search, page = 1, limit = 12 } = query;

  // Always filter to active products only for public API
  const filter: Record<string, unknown> = { isActive: true };

  if (category) {
    if (!VALID_CATEGORIES.includes(category as ProductCategory)) {
      throw new AppError(
        `Invalid category. Must be one of: ${VALID_CATEGORIES.join(", ")}`,
        400,
        "INVALID_CATEGORY"
      );
    }
    filter.category = category;
  }

  if (search && typeof search === "string") {
    // Case-insensitive partial match on product name
    filter.name = { $regex: search.trim(), $options: "i" };
  }

  // Cast required because model<IProduct>() doesn't expose paginate() in types.
  // The plugin is registered in Product.model.ts via productSchema.plugin(mongoosePaginate).
  const paginatedProduct = Product as unknown as PaginateModel<IProduct>;

  const result = await paginatedProduct.paginate(filter, {
    page,
    limit: Math.min(limit, 50), // Cap at 50 per page
    sort: { createdAt: -1 },
    lean: true,
    select: "-__v",
  });

  return result;
}

/**
 * Get a single product by its MongoDB ObjectId.
 */
export async function getProductById(id: string) {
  const product = await Product.findById(id).lean().select("-__v");
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
  return product;
}

/**
 * Get a single product by its URL slug.
 */
export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isActive: true })
    .lean()
    .select("-__v");
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
  return product;
}

/**
 * Get a product by either its MongoDB ObjectId or slug.
 * Tries ObjectId first (24-char hex string), falls back to slug lookup.
 *
 * @example
 *   GET /api/products/507f1f77bcf86cd799439011   → by ObjectId
 *   GET /api/products/traditional-wedding-aso-oke → by slug
 */
export async function getProductByIdOrSlug(idOrSlug: string) {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  if (isObjectId) {
    return getProductById(idOrSlug);
  }
  return getProductBySlug(idOrSlug);
}
