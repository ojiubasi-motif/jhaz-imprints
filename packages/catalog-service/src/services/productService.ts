/**
 * Product service — query logic for the MongoDB product catalog.
 * All functions return plain JS objects (lean: true) for serialization safety.
 */

import type { PaginateModel } from "mongoose";
import { Product, FabricCategory } from "@jhaz-imprints/catalog-db";
import type { IProduct } from "@jhaz-imprints/catalog-db";
import { getCategories } from "./categoryService";
import { AppError } from "../errors/AppError";

export interface ListProductsQuery {
  category?: string;   // category slug — filters by categories.slug in the product
  fabricCategory?: string; // fabric category slug or id
  gender?: string;
  occasion?: string;
  search?: string;
  page?: number;
  limit?: number;
  isActive?: boolean | string;
}

export function addImagesField(product: any): any {
  if (!product) return product;
  if (!product.styleOptions || product.styleOptions.length === 0) {
    product.images = [];
    return product;
  }
  
  const defaultOpt = product.styleOptions.find((s: any) => s.name === product.defaultStyle) || product.styleOptions[0];
  const defaultImg = defaultOpt.imgUrl;
  
  const imagesSet = new Set<string>();
  if (defaultImg) {
    imagesSet.add(defaultImg);
  }
  for (const style of product.styleOptions) {
    if (style.imgUrl) {
      imagesSet.add(style.imgUrl);
    }
  }
  
  product.images = Array.from(imagesSet);
  return product;
}

/**
 * Helper to escape special regular expression characters in user search query.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * List all active products with optional filters and name search.
 * Returns a paginated result using mongoose-paginate-v2.
 *
 * @example
 *   GET /api/products?category=agbada&gender=men&search=elegant&page=1&limit=12
 */
export async function listProducts(query: ListProductsQuery) {
  const { category, fabricCategory, gender, occasion, search, page = 1, limit = 12, isActive } = query;

  const filter: Record<string, unknown> = {};

  if (isActive === "all") {
    // Include both active and inactive
  } else if (isActive === false || isActive === "false") {
    filter.isActive = false;
  } else {
    filter.isActive = true;
  }

  if (category) {
    // Validate the slug exists in categories.json
    const validCategories = getCategories().map((c) => c.slug);
    if (!validCategories.includes(category)) {
      throw new AppError(
        `Invalid category. Must be one of: ${validCategories.join(", ")}`,
        400,
        "INVALID_CATEGORY"
      );
    }
    // Filter on the embedded categories array
    filter["categories.slug"] = category;
  }

  if (fabricCategory) {
    const isObjectId = /^[a-f\d]{24}$/i.test(fabricCategory);
    let fcDoc;
    if (isObjectId) {
      fcDoc = await FabricCategory.findById(fabricCategory);
    } else {
      fcDoc = await FabricCategory.findOne({ slug: fabricCategory });
    }
    if (fcDoc) {
      filter.fabrics = { $in: fcDoc.fabrics };
    } else {
      filter.fabrics = { $in: [] };
    }
  }

  if (gender) {
    const validGenders = ["men", "women", "unisex", "kids"];
    if (!validGenders.includes(gender)) {
      throw new AppError(
        `Invalid gender. Must be one of: ${validGenders.join(", ")}`,
        400,
        "INVALID_GENDER"
      );
    }
    filter.gender = gender;
  }

  if (occasion) {
    const validOccasions = [
      "social-events-celebrations",
      "casual",
      "corporate",
      "burial",
      "wedding",
    ];
    if (!validOccasions.includes(occasion)) {
      throw new AppError(
        `Invalid occasion. Must be one of: ${validOccasions.join(", ")}`,
        400,
        "INVALID_OCCASION"
      );
    }
    filter.occasion = occasion;
  }

  if (search && typeof search === "string") {
    // Case-insensitive partial match on product name (sanitized to prevent injection)
    filter.name = { $regex: escapeRegExp(search.trim()), $options: "i" };
  }

  const paginatedProduct = Product as unknown as PaginateModel<IProduct>;

  const result = await paginatedProduct.paginate(filter, {
    page,
    limit: Math.min(limit, 50), // Cap at 50 per page
    sort: { createdAt: -1 },
    lean: true,
    select: "-__v -fabrics",
  });

  result.docs = result.docs.map(addImagesField);
  return result;
}

/**
 * Get a single product by its MongoDB ObjectId.
 * Populates the fabrics field so the caller gets full fabric details.
 */
export async function getProductById(id: string) {
  const product = await Product.findById(id)
    .populate("fabrics", "-__v -deletedAt")
    .lean()
    .select("-__v");
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
  return addImagesField(product);
}

/**
 * Get a single product by its URL slug.
 * Populates the fabrics field.
 */
export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isActive: true })
    .populate("fabrics", "-__v -deletedAt")
    .lean()
    .select("-__v");
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
  return addImagesField(product);
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
