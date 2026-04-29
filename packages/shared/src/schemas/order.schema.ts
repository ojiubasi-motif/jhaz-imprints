import { z } from "zod";

/**
 * Zod schema for Order creation.
 * Used by both the API and client to validate order requests.
 * Ensures type safety and runtime validation across boundaries.
 */

export const OrderCreateSchema = z.object({
  userId: z.string().cuid("Invalid user ID"),
  measurementId: z.string().cuid("Invalid measurement ID"),
  totalAmount: z.number().positive("Amount must be positive"),
  currency: z.string().default("NGN").optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
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
