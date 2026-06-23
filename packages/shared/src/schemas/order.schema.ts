import { z } from "zod";

/**
 * Zod schema for Order creation.
 * Supports multiple customization items in a single order.
 * Used by both the API and client to validate order requests.
 */

/** Measurement snapshot supplied inline per customization item */
const OrderMeasurementSchema = z.object({
  chest:     z.number().positive("chest must be positive").optional(),
  waist:     z.number().positive("waist must be positive").optional(),
  hip:       z.number().positive("hip must be positive").optional(),
  shoulder:  z.number().positive("shoulder must be positive").optional(),
  armLength: z.number().positive("armLength must be positive").optional(),
  length:    z.number().positive("length must be positive").optional(),
  notes:     z.string().max(500).optional(),
});

/** One customised garment within an order */
const OrderItemSchema = z.object({
  productId: z.string().length(24, "productId must be a 24-character MongoDB ObjectId"),
  /** Complete measurement data for this customization (stored as-is, no DB lookup). */
  measurement: OrderMeasurementSchema,
  /** MongoDB ObjectId of the chosen Fabric document, optionally including ::colorName (omit for standard/ready-to-wear) */
  fabricId: z
    .string()
    .regex(/^[a-f\d]{24}(::.+)?$/i, "Invalid fabricId format")
    .optional(),
  // colorName is NOT accepted from the client — it is resolved from the fabric's
  // properties (DB source of truth) when the fabric document is fetched.
  styleOptionName: z.string().optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
});

export const OrderCreateSchema = z.object({
  items: z
    .array(OrderItemSchema)
    .min(1, "At least one item is required")
    .max(20, "Cannot exceed 20 items per order"),
  promoCode: z.string().optional(),
  /** Frontend-computed grand total for backend verification against pricing drift. */
  expectedTotal: z.number().positive("expectedTotal must be positive").optional(),
  delivery: z
    .object({
      fullName: z.string().min(1, "Full name is required"),
      phoneNumber: z.string().min(1, "Phone number is required"),
      address: z.string().min(1, "Address is required"),
      city: z.string().min(1, "City is required"),
      state: z.string().min(1, "State is required"),
      country: z.string().min(1, "Country is required"),
      deliveryMethod: z.enum(["standard", "express"]),
    })
    .optional(),
});

export type OrderCreate = z.infer<typeof OrderCreateSchema>;
export type OrderItemCreate = z.infer<typeof OrderItemSchema>;
export type OrderMeasurement = z.infer<typeof OrderMeasurementSchema>;


/**
 * Schema for updating order status.
 */
export const OrderStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY", "DISPATCHED", "DELIVERED", "CANCELLED"]),
  note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
  tailorId: z.string().nullable().optional(),
});

export type OrderStatusUpdate = z.infer<typeof OrderStatusUpdateSchema>;

/**
 * Schema for payment creation (idempotent).
 */
export const PaymentCreateSchema = z.object({
  orderId: z.string().cuid("Invalid order ID"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("NGN").optional(),
  reference: z.string().min(1, "Reference is required"),
  provider: z.string().default("STRIPE").optional(),
});

export type PaymentCreate = z.infer<typeof PaymentCreateSchema>;

/**
 * Schema for creating a new measurement profile.
 */
export const MeasurementCreateSchema = z.object({
  profileName: z.string().min(1, "Profile name is required").default("Default"),
  isDefault: z.boolean().default(false),
  chest: z.number().positive("Must be positive").optional(),
  waist: z.number().positive("Must be positive").optional(),
  hip: z.number().positive("Must be positive").optional(),
  shoulder: z.number().positive("Must be positive").optional(),
  armLength: z.number().positive("Must be positive").optional(),
  length: z.number().positive("Must be positive").optional(),
  notes: z.string().max(1000).optional(),
});

export type MeasurementCreate = z.infer<typeof MeasurementCreateSchema>;