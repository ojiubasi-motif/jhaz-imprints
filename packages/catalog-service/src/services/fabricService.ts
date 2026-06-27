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
  category?: string;
}

/**
 * List all active (non-deleted) fabrics.
 * Returns a simple array — no pagination needed since there are typically ≤ 200 fabrics.
 */
export async function listFabrics(query: ListFabricsQuery = {}) {
  const { includeDeleted = false, page, limit, category } = query;

  const filter: Record<string, any> = includeDeleted ? {} : { deletedAt: null };

  if (category) {
    const isObjectId = /^[a-f\d]{24}$/i.test(category);
    if (isObjectId) {
      filter.category = category;
    } else {
      const { FabricCategory } = await import("@jhaz-imprints/catalog-db");
      const cat = await FabricCategory.findOne({ slug: category });
      if (cat) {
        filter.category = cat._id;
      } else {
        filter.category = null;
      }
    }
  }

  const dbQuery = Fabric.find(filter)
    .populate("category", "-__v -fabrics")
    .lean()
    .sort({ name: 1 })
    .select("-__v");

  if (page !== undefined || limit !== undefined) {
    const p = page ? Math.max(1, page) : 1;
    const l = limit ? Math.min(50, Math.max(1, limit)) : 12;
    const skip = (p - 1) * l;

    const fabrics = await dbQuery.skip(skip).limit(l);
    const total = await Fabric.countDocuments(filter);

    return {
      items: fabrics,
      total,
      page: p,
      limit: l,
    };
  }

  const fabrics = await dbQuery;
  return fabrics;
}

/**
 * Get a single fabric by MongoDB ObjectId.
 */
export async function getFabricById(id: string) {
  const fabric = await Fabric.findById(id).populate("category", "-__v -fabrics").lean().select("-__v");
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
    .populate("category", "-__v -fabrics")
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
