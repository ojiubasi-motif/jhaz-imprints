/**
 * Admin product service — CRUD operations for the MongoDB product catalog.
 * Used by admin routes; all mutations are restricted to ADMIN role.
 */

import { Product } from "@jhaz-imprints/catalog-db";
import { AppError } from "../errors/AppError";

export interface CreateProductInput {
  name: string;
  slug?: string;
  category: string;
  description: string;
  basePrice: number;
  images: string[];
  fabricOptions?: Array<{
    name: string;
    priceModifier: number;
    swatchImageUrl: string;
    inStock?: boolean;
  }>;
  colorOptions?: Array<{
    name: string;
    hexCode?: string;
    imageUrl?: string;
  }>;
  styleOptions?: Array<{
    name: string;
    priceModifier: number;
    previewImageUrl: string;
    description?: string;
  }>;
  productionDays: number;
  isActive?: boolean;
  seoMeta: {
    title: string;
    description: string;
    keywords?: string[];
  };
}

/**
 * Create a new product in the catalog.
 * Requires at least one uploaded image URL.
 */
export async function createProduct(input: CreateProductInput) {
  if (!input.images || input.images.length === 0) {
    throw new AppError(
      "At least one product image is required. Upload images via POST /api/v1/admin/uploads first.",
      400,
      "IMAGES_REQUIRED"
    );
  }

  // Validate that each image looks like a real URL
  const invalidImages = input.images.filter((url) => !url.startsWith("http"));
  if (invalidImages.length > 0) {
    throw new AppError(
      "Invalid image URLs detected. Upload images via POST /api/v1/admin/uploads and use the returned URLs.",
      400,
      "INVALID_IMAGE_URL"
    );
  }

  try {
    const product = await Product.create(input);
    return product.toObject();
  } catch (error: any) {
    // Convert Mongoose validation errors to clear 400 responses
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
export async function updateProduct(id: string, input: Partial<CreateProductInput>) {
  const product = await Product.findByIdAndUpdate(id, input, {
    new: true,
    runValidators: true,
  }).lean();

  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  return product;
}

/**
 * Delete (hard delete) a product by ID.
 */
export async function deleteProduct(id: string) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }
}
