import { Schema, model } from "mongoose";
import type { IFabric, IFabricProperty } from "./types";

/**
 * Sub-schema for a single fabric color/variant (property).
 * _id: false — no individual ObjectId needed per variant;
 * clients identify variants by colorName or arrayIndex.
 */
const fabricPropertySchema = new Schema<IFabricProperty>(
  {
    colorName: { type: String, required: true, trim: true },
    colorCode: {
      type: String,
      validate: {
        validator: (v: string) => !v || /^#[0-9A-Fa-f]{6}$/.test(v),
        message: "colorCode must be a valid hex color e.g. #4169E1",
      },
    },
    imageUrl: { type: String, required: true },
    unit: {
      type: String,
      enum: ["yard", "trouser-length", "ft", "roll", "pack"],
      required: true,
    },
    yardsPerUnit: { type: Number, required: true, default: 1.0, min: 0.1 },
    priceModifier: { type: Number, required: true, default: 0, min: 0 },
    inStock: { type: Boolean, required: true, default: true },
    stockLevel: { type: Number, min: 0 },
    isActive: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

/**
 * Main Fabric schema.
 * Each document represents a distinct fabric type (e.g. "Premium Aso-oke").
 * Its properties[] array holds all color/variant configurations for that fabric.
 */
const fabricSchema = new Schema<IFabric>(
  {
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    properties: {
      type: [fabricPropertySchema],
      default: [],
      validate: {
        validator: (arr: IFabricProperty[]) => arr.length > 0,
        message: "A fabric must have at least one property/variant",
      },
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug from name if not explicitly provided
fabricSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
  }
  next();
});

// Only surface non-deleted fabrics in default queries
fabricSchema.index({ deletedAt: 1 });
fabricSchema.index({ name: 1 });

export const Fabric = model<IFabric>("Fabric", fabricSchema);
