/**
 * TypeScript interfaces for the product catalog models.
 * These interfaces define the shape of MongoDB documents and sub-documents.
 */

import type { Document } from "mongoose";

export interface IFabricOption {
  name: string;
  priceModifier: number; // e.g., 0 for base, 1500 for premium
  swatchImageUrl: string;
  inStock: boolean;
}

export interface IColorOption {
  name: string;
  hexCode?: string;
  imageUrl?: string;
}

export interface IStyleOption {
  name: string;
  priceModifier: number; // e.g., 0 for standard, 2000 for intricate
  previewImageUrl: string;
  description?: string;
}

export interface ISeoMeta {
  title: string;
  description: string;
  keywords: string[];
}

export interface IProduct extends Document {
  name: string;
  slug: string;
  category: "wedding-aso-oke" | "agbada" | "kente-gown" | "ankara-casual" | "other";
  description: string;
  basePrice: number;
  images: string[];
  fabricOptions: IFabricOption[];
  colorOptions: IColorOption[];
  styleOptions: IStyleOption[];
  productionDays: number;
  isActive: boolean;
  seoMeta: ISeoMeta;
  createdAt: Date;
  updatedAt: Date;
}
