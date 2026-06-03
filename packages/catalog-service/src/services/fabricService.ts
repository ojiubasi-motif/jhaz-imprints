/**
 * Fabric service — read-only queries for the Fabric collection.
 * All functions return plain JS objects (lean: true) for serialization safety.
 */

import { Fabric } from "@jhaz-imprints/catalog-db";
import type { IFabric } from "@jhaz-imprints/catalog-db";
import { AppError } from "../errors/AppError";

export interface ListFabricsQuery {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
}

/**
 * List all active (non-deleted) fabrics.
 * Returns a simple array — no pagination needed since there are typically ≤ 200 fabrics.
 */
export async function listFabrics(query: ListFabricsQuery = {}) {
  const { includeDeleted = false } = query;

  const filter = includeDeleted ? {} : { deletedAt: null };

  const fabrics = await Fabric.find(filter)
    .lean()
    .sort({ name: 1 })
    .select("-__v");

  return fabrics;
}

/**
 * Get a single fabric by MongoDB ObjectId.
 */
export async function getFabricById(id: string) {
  const fabric = await Fabric.findById(id).lean().select("-__v");
  if (!fabric) {
    throw new AppError("Fabric not found", 404, "FABRIC_NOT_FOUND");
  }
  return fabric;
}

/**
 * Get a single fabric by its URL slug.
 */
export async function getFabricBySlug(slug: string) {
  const fabric = await Fabric.findOne({ slug, deletedAt: null })
    .lean()
    .select("-__v");
  if (!fabric) {
    throw new AppError("Fabric not found", 404, "FABRIC_NOT_FOUND");
  }
  return fabric;
}

/**
 * Get a fabric by either its MongoDB ObjectId or slug.
 * Tries ObjectId first (24-char hex string), falls back to slug lookup.
 */
export async function getFabricByIdOrSlug(idOrSlug: string) {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  if (isObjectId) {
    return getFabricById(idOrSlug);
  }
  return getFabricBySlug(idOrSlug);
}
