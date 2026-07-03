/**
 * Category service — manages categories in the MongoDB collection.
 */

import { Category } from "@jhaz-imprints/catalog-db";
import { AppError } from "../errors/AppError";

/** Shape of each entry in categories */
export interface CategoryEntry {
  name: string;
  slug: string;
  desc?: string;
}

/**
 * Load and return all categories from database.
 */
export async function getCategories(): Promise<CategoryEntry[]> {
  try {
    const categories = await Category.find().sort({ name: 1 });
    return categories.map((c) => ({
      name: c.name,
      slug: c.slug,
      desc: c.desc,
    }));
  } catch (err) {
    throw new AppError("Failed to load categories", 500, "CATEGORIES_LOAD_ERROR");
  }
}

/**
 * Return true if a category with the given slug already exists.
 */
export async function categoryExists(slug: string): Promise<boolean> {
  const count = await Category.countDocuments({ slug });
  return count > 0;
}

/**
 * Append a new category to the database.
 * Throws if the slug already exists.
 */
export async function addCategory(entry: CategoryEntry): Promise<CategoryEntry> {
  const exists = await categoryExists(entry.slug);
  if (exists) {
    throw new AppError(
      `Category with slug "${entry.slug}" already exists`,
      409,
      "CATEGORY_SLUG_CONFLICT"
    );
  }

  try {
    const doc = await Category.create({
      name: entry.name,
      slug: entry.slug,
      desc: entry.desc,
    });
    return {
      name: doc.name,
      slug: doc.slug,
      desc: doc.desc,
    };
  } catch (err: any) {
    throw new AppError(
      err.message || "Failed to create category",
      500,
      "CATEGORY_CREATE_ERROR"
    );
  }
}

/**
 * Update the name and/or desc of an existing category in the database.
 * The slug is immutable (it is the identifier).
 */
export async function updateCategory(
  slug: string,
  patch: { name?: string; desc?: string }
): Promise<CategoryEntry> {
  try {
    const doc = await Category.findOneAndUpdate(
      { slug },
      { $set: patch },
      { new: true }
    );

    if (!doc) {
      throw new AppError(`Category "${slug}" not found`, 404, "CATEGORY_NOT_FOUND");
    }

    return {
      name: doc.name,
      slug: doc.slug,
      desc: doc.desc,
    };
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      err.message || "Failed to update category",
      500,
      "CATEGORY_UPDATE_ERROR"
    );
  }
}

/**
 * Remove a category from the database by slug.
 */
export async function deleteCategory(slug: string): Promise<void> {
  try {
    const result = await Category.deleteOne({ slug });
    if (result.deletedCount === 0) {
      throw new AppError(`Category "${slug}" not found`, 404, "CATEGORY_NOT_FOUND");
    }
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      err.message || "Failed to delete category",
      500,
      "CATEGORY_DELETE_ERROR"
    );
  }
}
