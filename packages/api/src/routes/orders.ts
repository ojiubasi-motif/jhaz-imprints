/**
 * Order routes.
 * Thin route layer that delegates to handlers and services.
 */

import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middleware/validateBody";
import { OrderCreateSchema, MeasurementCreateSchema } from "@jhaz-imprints/shared";
import * as orderHandlers from "../handlers/orders";

const router = Router();

router.get("/test-update", (req, res) => {
  res.json({ msg: "Server is updated!" });
});

/**
 * POST /api/orders
 * Create a new order.
 */
router.post(
  "/",
  authenticate,
  validateBody(OrderCreateSchema),
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.createOrderHandler(req, res)
  )
);

/**
 * POST /api/orders/:orderId/payment-intent
 * Initialize a Paystack payment for an order.
 */
router.post(
  "/:orderId/payment-intent",
  authenticate,
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.createPaymentIntentHandler(req, res)
  )
);

/**
 * POST /api/orders/measurements
 * Create a new customer measurement profile.
 */
router.post(
  "/measurements",
  authenticate,
  validateBody(MeasurementCreateSchema),
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.createMeasurementHandler(req, res)
  )
);

/**
 * GET /api/orders/measurements
 * Get all measurement profiles for the authenticated user.
 */
router.get(
  "/measurements",
  authenticate,
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.getUserMeasurementsHandler(req, res)
  )
);

/**
 * GET /api/orders/my-orders
 * Get all orders for the authenticated user (paginated).
 */
router.get(
  "/my-orders",
  authenticate,
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.getUserOrdersHandler(req, res)
  )
);

/**
 * GET /api/orders/:orderId
 * Get order details.
 */
router.get(
  "/:orderId",
  authenticate,
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.getOrderHandler(req, res)
  )
);

/**
 * GET /api/orders
 * Admin view (optional, currently same as my-orders)
 */
router.get(
  "/",
  authenticate,
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.getUserOrdersHandler(req, res)
  )
);

/**
 * POST /api/orders/verify/:reference
 * Verify payment status after frontend redirect/callback.
 */
router.post(
  "/verify/:reference",
  authenticate,
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.verifyPaymentHandler(req, res)
  )
);

/**
 * POST /api/orders/webhook/paystack
 * Paystack payment webhook (idempotent).
 * No authentication required (verified via signature).
 */
router.post(
  "/webhook/paystack",
  asyncHandler((req, res) => orderHandlers.paystackWebhookHandler(req, res))
);

export default router;