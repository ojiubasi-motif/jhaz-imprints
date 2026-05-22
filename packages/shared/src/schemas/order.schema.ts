import { z } from "zod";

/**
 * Zod schema for Order creation.
 * Used by both the API and client to validate order requests.
 * Ensures type safety and runtime validation across boundaries.
 */

export const OrderCreateSchema = z.object({
  measurementId: z.string().cuid("Invalid measurement ID"),
  productId: z.string().min(1, "Product ID is required"),
  fabricOptionName: z.string().min(1, "Fabric selection is required"),
  styleOptionName: z.string().min(1, "Style selection is required"),
  colorName: z.string().optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  // Bespoke measurements (optional if measurementId is provided, but allowed inline)
  chest: z.number().optional(),
  waist: z.number().optional(),
  hip: z.number().optional(),
  shoulder: z.number().optional(),
  armLength: z.number().optional(),
  length: z.number().optional(),
});

export type OrderCreate = z.infer<typeof OrderCreateSchema>;

/**
 * Schema for updating order status.
 */
export const OrderStatusUpdateSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "COMPLETED", "CANCELLED"]),
  note: z.string().max(500, "Note cannot exceed 500 characters").optional(),
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