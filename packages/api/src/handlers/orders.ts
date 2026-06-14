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

  const { order, paymentUrl, reference, accessCode, breakdown } = await orderService.createOrder(req.user.id, req.body);

  res.status(201).json({
    msg: "order created successfully",
    data: {
      orderId: order.id,
      totalAmount: order.totalAmount,
      status: order.status,
      reference,
      paymentUrl,
      paystackAccessCode: accessCode,
      breakdown,
    },
    type: "SUCCESS",
    code: 600
  });
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

  const paymentIntent = await orderService.initializeOrderPayment(
    req.user.id,
    orderId,
    req.user.email
  );

  res.json({
    msg: "payment intent created",
    data: paymentIntent,
    type: "SUCCESS",
    code: 600
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

  const sanitizedOrder = order as any;

  res.json({
    msg: "order details",
    data: sanitizedOrder,
    type: "SUCCESS",
    code: 600
  });
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
  const take = parseInt(req.query.take as string) || 20;

  const result = await orderService.getUserOrders(req.user.id, skip, take);

  console.log(`[orderHandler] Successfully returned ${result.orders.length} orders for user ${req.user.id}`);
  res.json({
    msg: "user orders",
    data: {
      items: result.orders,
      total: result.total,
      skip: result.skip,
      take: result.take,
    },
    type: "SUCCESS",
    code: 600
  });
}

/**
 * POST /api/orders/verify/:reference
 * Manually verify a payment reference from the frontend.
 */
export async function verifyPaymentHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { reference } = req.params;

  if (!reference) {
    throw new AppError("Payment reference is required", 400);
  }

  const result = await orderService.confirmPayment(reference);

  res.json({
    msg: "payment verified successfully",
    data: {
      orderId: result.order?.id,
      status: result.order?.status || "PENDING",
      paymentStatus: result.status,
      alreadyProcessed: result.alreadyProcessed
    },
    type: "SUCCESS",
    code: 600
  });
}

/**
 * POST /api/orders/webhook/paystack
 * Paystack webhook handler (idempotent via reference).
 */
export async function paystackWebhookHandler(req: Request, res: Response) {
  // If the body is a raw Buffer (because of the raw parser in app.ts),
  // we must decode and parse it first to access its fields.
  const isRaw = Buffer.isBuffer(req.body);
  const rawBody = isRaw ? req.body.toString("utf-8") : req.body;
  const bodyObj = isRaw ? JSON.parse(rawBody) : req.body;

  const { data } = bodyObj;

  if (!data?.reference) {
    throw new AppError("Invalid webhook payload", 400);
  }

  // Verify webhook signature (Crucial for production security)
  const signature = req.headers["x-paystack-signature"] as string;
  if (!signature || !paystackService.verifyWebhookSignature(rawBody, signature)) {
    throw new AppError("Invalid paystack signature", 401);
  }

  const result = await orderService.confirmPayment(data.reference);

  // Always return 200 to acknowledge receipt (idempotency)
  res.status(200).json({
    msg: "payment confirmed",
    data: {
      orderId: result.order?.id,
      status: result.order?.status || "PENDING",
      paymentStatus: result.status,
      alreadyProcessed: result.alreadyProcessed
    },
    type: "SUCCESS",
    code: 600
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

  const { createdAt: _, updatedAt: __, ...sanitizedMeasurement } = measurement as any;

  res.status(201).json({
    msg: "measurement profile created",
    data: sanitizedMeasurement,
    type: "SUCCESS",
    code: 600
  });
}

/**
 * GET /api/orders/measurements
 * Retrieve all measurement profiles for the authenticated user.
 */
export async function getUserMeasurementsHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const measurements = await orderService.getUserMeasurements(req.user.id);

  const sanitizedMeasurements = measurements.map((m: any) => {
    const sanitized = m;
    return sanitized;
  });

  res.status(200).json({
    msg: "user measurements retrieved",
    data: sanitizedMeasurements,
    type: "SUCCESS",
    code: 600
  });
}

/**
 * PUT /api/orders/measurements/:id
 * Update an existing customer measurement profile.
 */
export async function updateMeasurementHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { id } = req.params;
  const measurement = await orderService.updateMeasurement(req.user.id, id, req.body);

  const { createdAt: _, updatedAt: __, ...sanitizedMeasurement } = measurement as any;

  res.status(200).json({
    msg: "measurement profile updated",
    data: sanitizedMeasurement,
    type: "SUCCESS",
    code: 600
  });
}

/**
 * DELETE /api/orders/:orderId
 * Cancel and delete a pending order.
 */
export async function deleteOrderHandler(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    throw new AppError("User not authenticated", 401);
  }

  const { orderId } = req.params;
  await orderService.deletePendingOrder(req.user.id, orderId);

  res.json({
    msg: "order cancelled successfully",
    data: null,
    type: "SUCCESS",
    code: 600
  });
}
