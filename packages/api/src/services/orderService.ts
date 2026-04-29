/**
 * Order service — business logic for order creation and payment handling.
 * Handles transactional consistency across Postgres and payment webhooks.
 */

import { prisma } from "@jhaz-imprints/db";
import { Product } from "@jhaz-imprints/catalog-db";
import { OrderCreateSchema } from "@jhaz-imprints/shared";
import { computeOrderTotal } from "./pricingEngine";
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
 * @param userId - Customer's user ID
 * @param input - Order creation payload
 * @returns Order object and payment URL
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

  // Create order and payment in a transaction
  const order = await prisma.$transaction(async (tx) => {
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
        statusHistory: true,
      },
    });

    // Initiate payment (placeholder — real Paystack call in production)
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

  // In production: call Paystack API to get actual payment URL
  // For now, return a mock URL
  const paymentUrl = `https://checkout.paystack.com/${order.reference}`;

  return {
    order: order.order,
    payment: order.payment,
    paymentUrl,
  };
}

/**
 * Confirm payment (idempotent webhook handler).
 * Idempotency is guaranteed by the unique constraint on Payment.reference.
 *
 * @param reference - Payment reference from provider
 * @returns Updated order and payment
 */
export async function confirmPayment(reference: string) {
  // Check if payment already processed (idempotency)
  const existingPayment = await prisma.payment.findUnique({
    where: { reference },
  });

  if (existingPayment?.status === "COMPLETED") {
    return { order: null, payment: existingPayment, alreadyProcessed: true };
  }

  if (!existingPayment) {
    throw new AppError("Payment not found", 404);
  }

  // Update payment and order status atomically
  const updated = await prisma.$transaction(async (tx) => {
    // Mark payment as completed
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

    // Log status transition
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: "CONFIRMED",
        note: "Payment confirmed",
      },
    });

    return { order, payment };
  });

  // Enqueue notification job
  if (updated.order) {
    await notificationQueue.add("order-confirmed", {
      orderId: updated.order.id,
      userId: updated.order.userId,
      userEmail: updated.order.user.email,
      userName: updated.order.user.firstName,
    });
  }

  return { order: updated.order, payment: updated.payment, alreadyProcessed: false };
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
