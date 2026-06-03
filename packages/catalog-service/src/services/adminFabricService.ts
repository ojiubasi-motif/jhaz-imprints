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
    const fabric = await Fabric.create(input);
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
  const fabric = await Fabric.findByIdAndUpdate(id, input, {
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

  fabric.deletedAt = new Date();
  await fabric.save();
}
