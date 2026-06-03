/**
 * TypeScript interfaces for the product catalog models.
 * These interfaces define the shape of MongoDB documents and sub-documents.
 */

import type { Document, Types } from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// Shared enums (kept in sync with packages/shared/src/schemas/catalog.schema.ts)
// ─────────────────────────────────────────────────────────────────────────────

export type FabricUnit = "yard" | "trouser-length" | "ft" | "roll" | "pack";
export type Gender = "men" | "women" | "unisex" | "kids";
export type Occasion =
  | "social-events-celebrations"
  | "casual"
  | "corporate"
  | "burial"
  | "wedding";

// ─────────────────────────────────────────────────────────────────────────────
// Category
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Slim category reference embedded in Product.categories[].
 * Source of truth is packages/catalog-db/src/data/categories.json.
 */
export interface ICategoryRef {
  name: string;
  slug: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fabric
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single color/variant inside a Fabric document.
 * Each property represents one purchasable variant of the fabric.
 */
export interface IFabricProperty {
  colorName: string;       // e.g. "Royal Blue"
  colorCode?: string;      // Hex e.g. "#4169E1"
  imageUrl: string;        // Cloudinary or CDN URL (HTTPS)
  unit: FabricUnit;        // Measurement unit for ordering
  yardsPerUnit: number;    // Quantity of yards in 1 unit of the fabric (e.g. 1.5 yards = 1 trouser-length)
  priceModifier: number;   // Additional cost in Naira on top of product basePrice
  inStock: boolean;
  stockLevel?: number;     // Optional quantity tracking
  isActive: boolean;
}

/** A Fabric MongoDB document. */
export interface IFabric extends Document {
  slug: string;
  name: string;
  description?: string;
  properties: IFabricProperty[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;        // Soft-delete support
}

// ─────────────────────────────────────────────────────────────────────────────
// Style Option (still embedded in Product — lightweight, product-specific)
// ─────────────────────────────────────────────────────────────────────────────

export interface IStyleOption {
  name: string;
  priceModifier: number;   // e.g. 0 for standard, 2000 for intricate
  description?: string;
  imgUrl: string;          // Image URL associated with this style
}

// ─────────────────────────────────────────────────────────────────────────────
// SEO Metadata
// ─────────────────────────────────────────────────────────────────────────────

export interface ISeoMeta {
  title: string;
  description: string;
  keywords: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Product
// ─────────────────────────────────────────────────────────────────────────────

/** A Product MongoDB document. */
export interface IProduct extends Document {
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  images: string[];        // Computed dynamically via virtual getter
  productionDays: number;

  // Category references — sourced from categories.json, NOT a DB collection
  categories: ICategoryRef[];

  // Fabric references — ObjectId[] pointing to the Fabric collection
  fabrics: Types.ObjectId[];

  // Stable enums — stored directly on the product
  gender: Gender;
  occasion: Occasion;

  // Style options — lightweight enough to embed (product-specific variations)
  styleOptions: IStyleOption[];

  // Selected default style name (optional, defaults to first styleOption's name)
  defaultStyle?: string;

  seoMeta: ISeoMeta;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
