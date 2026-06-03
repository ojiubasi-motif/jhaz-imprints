import { Schema, model, Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { IProduct, ICategoryRef, IStyleOption, ISeoMeta } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Sub-schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Slim category reference embedded in the product.
 * Data originates from categories.json — NOT a separate DB collection.
 * _id: false — no ObjectId needed; slug is the identifier.
 */
const categoryRefSchema = new Schema<ICategoryRef>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

/**
 * Style option — lightweight enough to embed directly on the product.
 * Unlike fabrics, style options are product-specific (not shared across products).
 * _id: false — referenced by name in order snapshots.
 */
const styleOptionSchema = new Schema<IStyleOption>(
  {
    name: { type: String, required: true },
    priceModifier: { type: Number, required: true, default: 0 },
    description: String,
    imgUrl: { type: String, required: true },
  },
  { _id: false }
);

/** SEO metadata sub-schema. */
const seoMetaSchema = new Schema<ISeoMeta>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    keywords: [String],
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Product schema
// ─────────────────────────────────────────────────────────────────────────────

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
      unique: true,
      lowercase: true,
      trim: true,
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

    productionDays: {
      type: Number,
      required: true,
      min: 1,
    },

    // Category references — slim {name, slug} embedded objects sourced from categories.json
    categories: {
      type: [categoryRefSchema],
      required: true,
      validate: {
        validator: (arr: ICategoryRef[]) => arr.length > 0,
        message: "At least one category is required",
      },
    },

    // Fabric references — ObjectId[] pointing to the Fabric collection
    fabrics: [
      {
        type: Types.ObjectId,
        ref: "Fabric",
      },
    ],

    // Stable enums
    gender: {
      type: String,
      enum: ["men", "women", "unisex", "kids"],
      required: true,
      index: true,
    },
    occasion: {
      type: String,
      enum: [
        "social-events-celebrations",
        "casual",
        "corporate",
        "burial",
        "wedding",
      ],
      required: true,
      index: true,
    },

    // Style options — product-specific, embedded
    styleOptions: {
      type: [styleOptionSchema],
      default: [],
    },

    // Default style option name
    defaultStyle: {
      type: String,
      trim: true,
    },

    seoMeta: {
      type: seoMetaSchema,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes
// ─────────────────────────────────────────────────────────────────────────────

// Most common list query: active products by category slug
productSchema.index({ "categories.slug": 1, isActive: 1 });
// Support filtering by gender + occasion together
productSchema.index({ gender: 1, occasion: 1, isActive: 1 });

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

// Auto-generate slug and defaultStyle
productSchema.pre("save", function (next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]/g, "");
  }

  // Set defaultStyle to first option if not defined or not in the array
  if (this.styleOptions && this.styleOptions.length > 0) {
    const styleNames = this.styleOptions.map((s) => s.name);
    if (!this.defaultStyle || !styleNames.includes(this.defaultStyle)) {
      this.defaultStyle = this.styleOptions[0].name;
    }
  }

  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// Virtuals
// ─────────────────────────────────────────────────────────────────────────────

// Compute images array dynamically based on styleOptions and defaultStyle
productSchema.virtual("images").get(function (this: any) {
  if (!this.styleOptions || this.styleOptions.length === 0) {
    return [];
  }

  const defaultOpt = this.styleOptions.find((s: any) => s.name === this.defaultStyle) || this.styleOptions[0];
  const defaultImg = defaultOpt.imgUrl;

  const imagesSet = new Set<string>();
  if (defaultImg) {
    imagesSet.add(defaultImg);
  }

  for (const style of this.styleOptions) {
    if (style.imgUrl) {
      imagesSet.add(style.imgUrl);
    }
  }

  return Array.from(imagesSet);
});

// ─────────────────────────────────────────────────────────────────────────────
// Plugins & export
// ─────────────────────────────────────────────────────────────────────────────

productSchema.plugin(mongoosePaginate);

export const Product = model<IProduct>("Product", productSchema);