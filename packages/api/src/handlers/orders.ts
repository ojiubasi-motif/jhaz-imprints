/**
 * Order route handlers.
 * Business logic delegated to services.
 */

import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import * as orderService from "../services/orderService";
import * as paystackService from "../services/paystackService";
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
 * POST /api/orders/:orderId/payment-intent
 * Initialize a Paystack payment for an order.
 * Returns access code and other details for frontend payment modal.
 */
export async function createPaymentIntentHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { orderId } = req.params;

  // Get order details
  const order = await orderService.getOrderById(req.user.id, orderId);

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Check order status - should be PENDING_PAYMENT
  if (order.status !== "PENDING_PAYMENT") {
    throw new AppError(
      `Cannot create payment intent for order with status: ${order.status}`,
      400,
      "INVALID_ORDER_STATUS"
    );
  }

  // Initialize payment with Paystack
  const paymentRef = `order_${order.id}_${Date.now()}`;
  const paymentIntent = await paystackService.initializePayment(
    req.user.email,
    order.totalPrice,
    paymentRef,
    {
      orderId: order.id,
      userId: req.user.id,
      productName: order.productName,
    }
  );

  res.json({
    success: true,
    paymentIntent: {
      paystackAccessCode: paymentIntent.accessCode,
      paystackAuthorizationUrl: paymentIntent.authorizationUrl,
      reference: paymentIntent.reference,
      orderId: order.id,
      amount: order.totalPrice,
    },
  });
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
export async function paystackWebhookHandler(req: Request, res: Response) {
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

/**
 * POST /api/orders/measurements
 * Create a new customer measurement profile.
 */
export async function createMeasurementHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const measurement = await orderService.createMeasurement(req.user.id, req.body);

  res.status(201).json(measurement);
}
