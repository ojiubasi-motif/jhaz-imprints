/**
 * Order route handlers.
 * Business logic delegated to services.
 */

import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as orderService from "../services/orderService";
import { AppError, isAppError } from "../errors/AppError";

/**
 * POST /api/orders
 * Create a new order.
 */
export async function createOrderHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const result = await orderService.createOrder(req.user.id, req.body);

  res.status(201).json(result);
}

/**
 * GET /api/orders/:orderId
 * Get order details.
 */
export async function getOrderHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { orderId } = req.params;
  const order = await orderService.getOrderById(req.user.id, orderId);

  res.json(order);
}

/**
 * GET /api/orders
 * Get all orders for authenticated user.
 */
export async function getUserOrdersHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const skip = parseInt(req.query.skip as string) || 0;
  const take = parseInt(req.query.take as string) || 10;

  const result = await orderService.getUserOrders(req.user.id, skip, take);

  res.json(result);
}

/**
 * POST /api/orders/webhook/paystack
 * Paystack webhook handler (idempotent via reference).
 */
export async function paystackWebhookHandler(req: Response, res: Response) {
  const { data } = req.body;

  if (!data?.reference) {
    throw new AppError("Invalid webhook payload", 400);
  }

  // Verify webhook signature (in production)
  // const signature = req.headers['x-paystack-signature'];
  // validatePaystackSignature(req.body, signature);

  const result = await orderService.confirmPayment(data.reference);

  // Always return 200 to acknowledge receipt (idempotency)
  res.status(200).json({
    success: true,
    order: result.order,
    payment: result.payment,
    alreadyProcessed: result.alreadyProcessed,
  });
}
