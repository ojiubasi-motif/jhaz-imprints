/**
 * Order routes.
 * Thin route layer that delegates to handlers and services.
 */

import { Router } from "express";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { asyncHandler } from "../utils/asyncHandler";
import { validateBody } from "../middleware/validateBody";
import { OrderCreateSchema } from "@jhaz-imprints/shared";
import * as orderHandlers from "../handlers/orders";

const router = Router();

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
 * Get all orders for the authenticated user (paginated).
 */
router.get(
  "/",
  authenticate,
  asyncHandler((req: AuthenticatedRequest, res) =>
    orderHandlers.getUserOrdersHandler(req, res)
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
