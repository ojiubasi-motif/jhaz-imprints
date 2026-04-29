import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { IProduct, IFabricOption, IColorOption, IStyleOption, ISeoMeta } from "./types";

// Sub-schema for fabric options
const fabricOptionSchema = new Schema<IFabricOption>(
  {
    name: { type: String, required: true },
    priceModifier: { type: Number, required: true, default: 0 },
    swatchImageUrl: { type: String, required: true },
    inStock: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

// Sub-schema for color options
const colorOptionSchema = new Schema<IColorOption>(
  {
    name: { type: String, required: true },
    hexCode: String,
    imageUrl: String,
  },
  { _id: false }
);

// Sub-schema for style options
const styleOptionSchema = new Schema<IStyleOption>(
  {
    name: { type: String, required: true },
    priceModifier: { type: Number, required: true, default: 0 },
    previewImageUrl: { type: String, required: true },
    description: String,
  },
  { _id: false }
);

// Sub-schema for SEO metadata
const seoMetaSchema = new Schema<ISeoMeta>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    keywords: [String],
  },
  { _id: false }
);

// Main Product schema
const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["wedding-aso-oke", "agbada", "kente-gown", "ankara-casual", "other"],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    fabricOptions: {
      type: [fabricOptionSchema],
      default: [],
    },
    colorOptions: {
      type: [colorOptionSchema],
      default: [],
    },
    styleOptions: {
      type: [styleOptionSchema],
      default: [],
    },
    productionDays: {
      type: Number,
      required: true,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    seoMeta: {
      type: seoMetaSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound indexes for common query patterns
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ slug: 1 });

// Pre-save hook to auto-generate slug from name if not provided
productSchema.pre("save", function (next) {
  if (!this.slug) {
    // Generate slug from name: lowercase, trim whitespace, replace spaces with hyphens
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
  }
  next();
});

// Apply mongoose-paginate-v2 plugin
productSchema.plugin(mongoosePaginate);

// Export the Product model
export const Product = model<IProduct>("Product", productSchema);