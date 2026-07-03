/**
 * Admin product service — CRUD operations for the MongoDB product catalog.
 * Used by admin routes; all mutations are restricted to ADMIN role.
 */

import { Product } from "@jhaz-imprints/catalog-db";
import type { ICategoryRef } from "@jhaz-imprints/catalog-db";
import type { CreateProduct, UpdateProduct } from "@jhaz-imprints/shared";
import { getCategories } from "./categoryService";
import { addImagesField } from "./productService";
import { AppError } from "../errors/AppError";

// ─────────────────────────────────────────────────────────────────────────────
// Validation helpers
// ─────────────────────────────────────────────────────────────────────────────

async function validateCategoryRefs(categories: ICategoryRef[]): Promise<void> {
  const allCats = await getCategories();
  const validSlugs = new Set(allCats.map((c) => c.slug));
  const invalidSlugs = categories
    .map((c) => c.slug)
    .filter((slug) => !validSlugs.has(slug));

  if (invalidSlugs.length > 0) {
    throw new AppError(
      `Unknown category slugs: ${invalidSlugs.join(", ")}. ` +
        `Valid slugs are: ${[...validSlugs].join(", ")}`,
      400,
      "INVALID_CATEGORY"
    );
  }
}

function validateFabricRefs(fabrics: string[]): void {
  const invalid = fabrics.filter((id) => !/^[a-f\d]{24}$/i.test(id));
  if (invalid.length > 0) {
    throw new AppError(
      `Invalid fabric ObjectId(s): ${invalid.join(", ")}`,
      400,
      "INVALID_FABRIC_ID"
    );
  }
}

function validateStyleOptions(styleOptions?: any[], defaultStyle?: string): void {
  if (!styleOptions || styleOptions.length === 0) {
    throw new AppError(
      "At least one style option is required.",
      400,
      "STYLE_OPTIONS_REQUIRED"
    );
  }
  const invalidImages = styleOptions.filter((style) => !style.imgUrl || !style.imgUrl.startsWith("https://"));
  if (invalidImages.length > 0) {
    throw new AppError(
      "All style option image URLs must use HTTPS.",
      400,
      "INVALID_IMAGE_URL"
    );
  }
  if (defaultStyle) {
    const styleNames = styleOptions.map((style) => style.name);
    if (!styleNames.includes(defaultStyle)) {
      throw new AppError(
        `Default style "${defaultStyle}" must be one of the provided style options: ${styleNames.join(", ")}`,
        400,
        "INVALID_DEFAULT_STYLE"
      );
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new product in the catalog.
 */
export async function createProduct(input: CreateProduct) {
  validateStyleOptions(input.styleOptions, input.defaultStyle);
  await validateCategoryRefs(input.categories as ICategoryRef[]);
  validateFabricRefs(input.fabrics);

  try {
    const product = await Product.create(input);
    return addImagesField(product.toObject());
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(
        "A product with this slug already exists",
        409,
        "PRODUCT_SLUG_CONFLICT"
      );
    }
    if (error.name === "ValidationError" && error.errors) {
      const messages = Object.entries(error.errors)
        .map(([field, err]: [string, any]) => `${field}: ${err.message}`)
        .join("; ");
      throw new AppError(messages, 400, "VALIDATION_ERROR");
    }
    throw error;
  }
}

/**
 * Update an existing product by ID.
 */
export async function updateProduct(id: string, input: UpdateProduct) {
  if (input.styleOptions !== undefined || input.defaultStyle !== undefined) {
    const existing = await Product.findById(id).lean();
    if (!existing) {
      throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
    }
    const mergedStyleOptions = input.styleOptions !== undefined ? input.styleOptions : (existing.styleOptions || []);
    const mergedDefaultStyle = input.defaultStyle !== undefined ? input.defaultStyle : existing.defaultStyle;
    validateStyleOptions(mergedStyleOptions as any[], mergedDefaultStyle);
  }
  if (input.categories) await validateCategoryRefs(input.categories as ICategoryRef[]);
  if (input.fabrics) validateFabricRefs(input.fabrics);

  const product = await Product.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  })
    .lean()
    .select("-__v");

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return addImagesField(product);
}

/**
 * Hard-delete a product by ID.
 */
export async function deleteProduct(id: string) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
}
