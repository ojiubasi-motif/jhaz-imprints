/**
 * Admin fabric service — CRUD operations for the Fabric collection.
 * Used only by admin routes (ADMIN role required).
 */

import { Fabric } from "@jhaz-imprints/catalog-db";
import type { CreateFabric, UpdateFabric } from "@jhaz-imprints/shared";
import { AppError } from "../errors/AppError";

/**
 * Create a new Fabric document.
 */
export async function createFabric(input: CreateFabric) {
  try {
    const { FabricCategory } = await import("@jhaz-imprints/catalog-db");
    const category = await FabricCategory.findById(input.categoryId);
    if (!category) {
      throw new AppError("Fabric category not found", 404, "FABRIC_CATEGORY_NOT_FOUND");
    }

    const fabric = await Fabric.create({
      ...input,
      category: input.categoryId,
    });

    category.fabrics.push(fabric._id as any);
    await category.save();

    return fabric.toObject();
  } catch (error: any) {
    // Duplicate slug
    if (error.code === 11000) {
      throw new AppError(
        `A fabric with slug "${input.slug || input.name}" already exists`,
        409,
        "FABRIC_SLUG_CONFLICT"
      );
    }
    // Mongoose validation errors
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
 * Update an existing Fabric document by ID.
 * Supports partial updates — any field from CreateFabric can be updated.
 */
export async function updateFabric(id: string, input: UpdateFabric) {
  const fabricDoc = await Fabric.findById(id);
  if (!fabricDoc) {
    throw new AppError("Fabric not found", 404, "FABRIC_NOT_FOUND");
  }

  const { FabricCategory } = await import("@jhaz-imprints/catalog-db");

  // Move fabric reference to another category if categoryId has changed
  if (input.categoryId && String(input.categoryId) !== String(fabricDoc.category)) {
    if (fabricDoc.category) {
      await FabricCategory.findByIdAndUpdate(fabricDoc.category, {
        $pull: { fabrics: fabricDoc._id },
      });
    }
    const newCategory = await FabricCategory.findById(input.categoryId);
    if (!newCategory) {
      throw new AppError("New Fabric category not found", 404, "FABRIC_CATEGORY_NOT_FOUND");
    }
    await FabricCategory.findByIdAndUpdate(input.categoryId, {
      $addToSet: { fabrics: fabricDoc._id },
    });
  }

  const updatePayload: Record<string, any> = { ...input };
  if (input.categoryId) {
    updatePayload.category = input.categoryId;
  }

  const fabric = await Fabric.findByIdAndUpdate(id, updatePayload, {
    new: true,
    runValidators: true,
  })
    .lean()
    .select("-__v");

  if (!fabric) {
    throw new AppError("Fabric not found", 404, "FABRIC_NOT_FOUND");
  }

  return fabric;
}

/**
 * Soft-delete a fabric by setting deletedAt.
 * Fabric references in existing product documents remain intact.
 */
export async function deleteFabric(id: string) {
  const fabric = await Fabric.findById(id);
  if (!fabric) {
    throw new AppError("Fabric not found", 404, "FABRIC_NOT_FOUND");
  }

  if (fabric.category) {
    const { FabricCategory } = await import("@jhaz-imprints/catalog-db");
    await FabricCategory.findByIdAndUpdate(fabric.category, {
      $pull: { fabrics: fabric._id },
    });
  }

  fabric.deletedAt = new Date();
  await fabric.save();
}
