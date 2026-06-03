import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// Category
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A slim category reference embedded in a Product document.
 * Data originates from categories.json — never from a DB collection.
 */
export const CategoryRefSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  slug: z
    .string()
    .min(1, "Category slug is required")
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case"),
});
export type CategoryRef = z.infer<typeof CategoryRefSchema>;

/**
 * Full category entry stored in categories.json.
 * Includes a `desc` field visible to admins only.
 */
export const CategoryEntrySchema = CategoryRefSchema.extend({
  desc: z.string().max(500).optional(),
});
export type CategoryEntry = z.infer<typeof CategoryEntrySchema>;

/**
 * Patch payload for updating an existing category (slug is immutable via this route).
 */
export const UpdateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  desc: z.string().max(500).optional(),
});
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Fabric
// ─────────────────────────────────────────────────────────────────────────────

/** The measurement unit for a fabric variant. */
export const FabricUnitEnum = z.enum(["yard", "trouser-length", "ft", "roll", "pack"]);
export type FabricUnit = z.infer<typeof FabricUnitEnum>;

/**
 * A single color / variant inside a Fabric document.
 */
export const CreateFabricPropertySchema = z.object({
  colorName: z.string().min(1, "Color name is required"),
  colorCode: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Color code must be a valid hex color e.g. #4169E1")
    .optional(),
  imageUrl: z
    .string()
    .url("Image URL must be a valid URL")
    .startsWith("https://", "Image URL must use HTTPS"),
  unit: FabricUnitEnum,
  yardsPerUnit: z
    .number()
    .min(0.1, "Yards per unit must be at least 0.1")
    .default(1.0)
    .optional(),
  priceModifier: z
    .number({ required_error: "Price modifier is required" })
    .min(0, "Price modifier cannot be negative"),
  inStock: z.boolean().default(true),
  stockLevel: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});
export type CreateFabricProperty = z.infer<typeof CreateFabricPropertySchema>;

/**
 * Input for creating a new Fabric document.
 */
export const CreateFabricSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  name: z.string().min(1, "Fabric name is required").max(120),
  description: z.string().max(1000).optional(),
  properties: z
    .array(CreateFabricPropertySchema)
    .min(1, "At least one fabric property/variant is required"),
});
export type CreateFabric = z.infer<typeof CreateFabricSchema>;

/**
 * Partial update for an existing Fabric document.
 */
export const UpdateFabricSchema = CreateFabricSchema.partial();
export type UpdateFabric = z.infer<typeof UpdateFabricSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Product
// ─────────────────────────────────────────────────────────────────────────────

/** Validates a MongoDB ObjectId string (24-char hex). */
const ObjectIdString = z
  .string()
  .regex(/^[a-f\d]{24}$/i, "Must be a valid MongoDB ObjectId");

export const GenderEnum = z.enum(["men", "women", "unisex", "kids"]);
export type Gender = z.infer<typeof GenderEnum>;

export const OccasionEnum = z.enum([
  "social-events-celebrations",
  "casual",
  "corporate",
  "burial",
  "wedding",
]);
export type Occasion = z.infer<typeof OccasionEnum>;

export const SeoMetaSchema = z.object({
  title: z.string().min(1).max(70),
  description: z.string().min(1).max(160),
  keywords: z.array(z.string()).optional().default([]),
});
export type SeoMeta = z.infer<typeof SeoMetaSchema>;

/**
 * Input schema for creating a new Product.
 * Used by the admin panel; validated by the catalog-service admin handler.
 */
export const CreateProductSchema = z.object({
  name: z.string().min(1, "Product name is required").max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case")
    .optional(),
  description: z.string().min(1, "Description is required").max(5000),
  basePrice: z.number().positive("Base price must be positive"),
  defaultStyle: z.string().optional(),
  productionDays: z.number().int().min(1, "Production days must be at least 1"),
  categories: z
    .array(CategoryRefSchema)
    .min(1, "At least one category is required"),
  fabrics: z
    .array(ObjectIdString)
    .min(1, "At least one fabric must be selected"),
  gender: GenderEnum,
  occasion: OccasionEnum,
  styleOptions: z
    .array(
      z.object({
        name: z.string().min(1, "Style name is required"),
        priceModifier: z.number().min(0).default(0),
        description: z.string().optional(),
        imgUrl: z.string().url("Must be a valid URL").startsWith("https://", "Must use HTTPS"),
      })
    )
    .min(1, "At least one style option is required"),
  seoMeta: SeoMetaSchema,
  isActive: z.boolean().optional().default(true),
});
export type CreateProduct = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial();
export type UpdateProduct = z.infer<typeof UpdateProductSchema>;
