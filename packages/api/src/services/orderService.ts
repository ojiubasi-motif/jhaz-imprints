/**
 * Order service — business logic for order creation and payment handling.
 * Handles transactional consistency across Postgres and payment webhooks.
 */

import { prisma } from "@jhaz-imprints/db";
import { Product } from "@jhaz-imprints/catalog-db";
import { OrderCreateSchema, type MeasurementCreate } from "@jhaz-imprints/shared";
import { computeOrderTotal } from "./pricingEngine";
import { initializePayment, verifyPayment } from "./paystackService";
import { AppError } from "../errors/AppError";
import { notificationQueue } from "../queues/notificationWorker";

export interface CreateOrderInput {
  measurementId: string;
  productId: string;
  fabricOptionName: string;
  styleOptionName: string;
}

/**
 * Create a new order.
 * Wrapped in a Prisma transaction for atomicity.
 * 
 * Flow:
 * 1. Fetch product and validate measurement
 * 2. Calculate total amount
 * 3. Create order and payment record in database (with PENDING status)
 * 4. Initialize payment with Paystack (Step 1: Initialize Transaction)
 * 5. Return payment authorization URL for frontend redirect
 *
 * @param userId - Customer's user ID
 * @param input - Order creation payload
 * @returns Order object, payment reference, and Paystack authorization URL
 */
export async function createOrder(userId: string, input: CreateOrderInput) {
  // Fetch product from MongoDB
  const product = await Product.findById(input.productId);
  if (!product) {
    throw new AppError("Product not found", 404);
  }

  // Verify measurement exists and belongs to user
  const measurement = await prisma.measurement.findUnique({
    where: { id: input.measurementId },
  });
  if (!measurement || measurement.userId !== userId) {
    throw new AppError("Measurement not found or does not belong to user", 404);
  }

  // Find selected fabric and style options
  const fabricOption = product.fabricOptions.find(
    (f) => f.name === input.fabricOptionName
  );
  const styleOption = product.styleOptions.find(
    (s) => s.name === input.styleOptionName
  );

  if (!fabricOption || !styleOption) {
    throw new AppError("Invalid fabric or style option", 400);
  }

  // Compute total price
  const totalAmount = computeOrderTotal({
    basePrice: product.basePrice,
    fabricPriceModifier: fabricOption.priceModifier,
    stylePriceModifier: styleOption.priceModifier,
  });

  // Create order and payment in database (Step 0: DB setup)
  const createdOrder = await prisma.$transaction(async (tx) => {
    // Create order
    const newOrder = await tx.order.create({
      data: {
        userId,
        measurementId: input.measurementId,
        totalAmount,
        status: "PENDING",
      },
      include: {
        measurement: true,
        user: true,
      },
    });

    // Create payment record with unique reference for idempotency
    const reference = `order_${newOrder.id}_${Date.now()}`;
    const payment = await tx.payment.create({
      data: {
        orderId: newOrder.id,
        amount: totalAmount,
        status: "PENDING",
        reference,
        provider: "PAYSTACK",
      },
    });

    return { order: newOrder, payment, reference };
  });

  // Step 1: Initialize transaction with Paystack
  // This returns the authorization URL that the frontend will redirect to
  const paystackInit = await initializePayment(
    createdOrder.order.user.email,
    totalAmount,
    createdOrder.reference,
    {
      orderId: createdOrder.order.id,
      userId,
      customerEmail: createdOrder.order.user.email,
    }
  );

  return {
    order: createdOrder.order,
    payment: createdOrder.payment,
    paymentUrl: paystackInit.authorizationUrl, // Frontend redirects user to this URL
    reference: createdOrder.reference,
  };
}

/**
 * Confirm payment (idempotent webhook handler).
 * 
 * Flow:
 * 1. Check if payment already processed (idempotency)
 * 2. Verify transaction status with Paystack (Step 3: Verify Transaction)
 * 3. If successful, update order and payment status atomically
 * 4. Notify customer of order confirmation
 * 
 * Idempotency is guaranteed by:
 * - Unique constraint on Payment.reference
 * - Checking if payment is already COMPLETED before processing
 * - Re-checking inside transaction to prevent race conditions
 *
 * @param reference - Payment reference from Paystack
 * @returns Updated order and payment with processing status
 */
export async function confirmPayment(reference: string) {
  // Check if payment already processed (idempotency check #1)
  const existingPayment = await prisma.payment.findUnique({
    where: { reference },
  });

  if (!existingPayment) {
    throw new AppError("Payment not found", 404);
  }

  // If already completed, return early (idempotency)
  if (existingPayment.status === "COMPLETED") {
    return { order: null, payment: existingPayment, alreadyProcessed: true };
  }

  // Step 3: Verify transaction with Paystack
  let paystackVerification;
  try {
    paystackVerification = await verifyPayment(reference);
  } catch (error) {
    console.error("Paystack verification failed:", error);
    throw new AppError("Unable to verify payment with Paystack", 500);
  }

  // Check if Paystack reports payment as successful
  if (paystackVerification.status !== "success") {
    throw new AppError(
      `Payment verification failed with status: ${paystackVerification.status}`,
      400
    );
  }

  // Verify amount matches
  if (paystackVerification.amount !== existingPayment.amount) {
    throw new AppError(
      "Payment amount mismatch with Paystack verification",
      400
    );
  }

  // Update payment and order status atomically
  const updated = await prisma.$transaction(async (tx) => {
    // Re-read payment inside transaction for consistency (prevents race between
    // the outer read and this update — two concurrent calls can both pass the
    // outer check before either writes, so we must re-check here).
    const lockedPayment = await tx.payment.findUnique({ where: { reference } });
    if (lockedPayment?.status === "COMPLETED") {
      // Another concurrent request already processed this payment
      return { order: null, payment: lockedPayment, alreadyProcessed: true };
    }

    // Mark payment as completed (verified with Paystack)
    const payment = await tx.payment.update({
      where: { reference },
      data: { status: "COMPLETED" },
    });

    // Update order status to CONFIRMED
    const order = await tx.order.update({
      where: { id: payment.orderId },
      data: { status: "CONFIRMED" },
      include: {
        user: true,
        measurement: true,
      },
    });

    // Guard: only insert history entry if not already present
    const existingHistory = await tx.orderStatusHistory.findFirst({
      where: { orderId: order.id, status: "CONFIRMED" },
    });
    if (!existingHistory) {
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: "CONFIRMED",
          note: "Payment confirmed via Paystack verification",
        },
      });
    }

    return { order, payment, alreadyProcessed: false };
  });

  // Enqueue notification job only if this call actually processed the payment
  if (updated.order && !updated.alreadyProcessed) {
    await notificationQueue.add("order-confirmed", {
      orderId: updated.order.id,
      userId: updated.order.userId,
      userEmail: updated.order.user.email,
      userPhone: updated.order.user.phone,
      userName: updated.order.user.firstName,
      totalPrice: updated.order.totalAmount,
      measurement: updated.order.measurement,
    });
  }

  return { order: updated.order, payment: updated.payment, alreadyProcessed: updated.alreadyProcessed };
}

/**
 * Retrieve an order by ID (with authorization check).
 *
 * @param userId - Customer's user ID (for authorization)
 * @param orderId - Order ID to fetch
 * @returns Order with related data
 */
export async function getOrderById(userId: string, orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      measurement: true,
      statusHistory: true,
      payment: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Authorization: user can only view their own orders
  if (order.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  return order;
}

/**
 * Get all orders for a user (paginated).
 */
export async function getUserOrders(userId: string, skip = 0, take = 10) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      measurement: true,
      payment: true,
      statusHistory: true,
    },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.order.count({ where: { userId } });

  return { orders, total, skip, take };
}

/**
 * Create a new measurement profile for a user.
 */
export async function createMeasurement(userId: string, input: MeasurementCreate) {
  // If this is set as default, optionally unset others (not implemented for simplicity)
  
  const measurement = await prisma.measurement.create({
    data: {
      userId,
      ...input,
    },
  });

  return measurement;
}