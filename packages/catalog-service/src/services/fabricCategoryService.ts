import { FabricCategory, Fabric } from "@jhaz-imprints/catalog-db";
import type { CreateFabricCategory, UpdateFabricCategory } from "@jhaz-imprints/shared";
import { AppError } from "../errors/AppError";

/**
 * List all fabric categories.
 */
export async function listFabricCategories() {
  const categories = await FabricCategory.find()
    .lean()
    .sort({ name: 1 })
    .select("-__v");
  return categories;
}

/**
 * Get a single fabric category by ID.
 */
export async function getFabricCategoryById(id: string) {
  const category = await FabricCategory.findById(id).lean().select("-__v");
  if (!category) {
    throw new AppError("Fabric category not found", 404, "FABRIC_CATEGORY_NOT_FOUND");
  }
  return category;
}

/**
 * Get a single fabric category by slug.
 */
export async function getFabricCategoryBySlug(slug: string) {
  const category = await FabricCategory.findOne({ slug }).lean().select("-__v");
  if (!category) {
    throw new AppError("Fabric category not found", 404, "FABRIC_CATEGORY_NOT_FOUND");
  }
  return category;
}

/**
 * Get a fabric category by ID or slug.
 */
export async function getFabricCategoryByIdOrSlug(idOrSlug: string) {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  if (isObjectId) {
    return getFabricCategoryById(idOrSlug);
  }
  return getFabricCategoryBySlug(idOrSlug);
}

/**
 * Create a new fabric category.
 */
export async function createFabricCategory(input: CreateFabricCategory) {
  try {
    const category = await FabricCategory.create(input);
    return category.toObject();
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(
        `A fabric category with name or slug "${input.slug || input.name}" already exists`,
        409,
        "FABRIC_CATEGORY_CONFLICT"
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
 * Update an existing fabric category.
 */
export async function updateFabricCategory(id: string, input: UpdateFabricCategory) {
  try {
    const category = await FabricCategory.findByIdAndUpdate(id, input, {
      new: true,
      runValidators: true,
    })
      .lean()
      .select("-__v");

    if (!category) {
      throw new AppError("Fabric category not found", 404, "FABRIC_CATEGORY_NOT_FOUND");
    }

    return category;
  } catch (error: any) {
    if (error.code === 11000) {
      throw new AppError(
        `A fabric category with name or slug already exists`,
        409,
        "FABRIC_CATEGORY_CONFLICT"
      );
    }
    throw error;
  }
}

/**
 * Delete a fabric category and soft-delete all fabrics associated with it.
 */
export async function deleteFabricCategory(id: string) {
  const category = await FabricCategory.findById(id);
  if (!category) {
    throw new AppError("Fabric category not found", 404, "FABRIC_CATEGORY_NOT_FOUND");
  }

  // Soft-delete all fabrics in this category
  if (category.fabrics && category.fabrics.length > 0) {
    await Fabric.updateMany(
      { _id: { $in: category.fabrics } },
      { deletedAt: new Date() }
    );
  }

  await FabricCategory.findByIdAndDelete(id);
}
