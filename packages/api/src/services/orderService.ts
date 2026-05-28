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
  fabricOptionName?: string;
  styleOptionName?: string;
  colorName?: string;
}

async function getCachedProductByIdOrSlug(idOrSlug: string) {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  if (isObjectId) {
    return prisma.cachedProduct.findUnique({ where: { id: idOrSlug } });
  }
  return prisma.cachedProduct.findUnique({ where: { slug: idOrSlug } });
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
  // Fetch product from local cache (Event Replicated from Catalog Service)
  const product = await getCachedProductByIdOrSlug(input.productId);
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

  // Find selected fabric and style options (Defensive: fallback to Standard if missing)
  const inputFabricSafe = (input.fabricOptionName ?? "Standard").trim().toLowerCase();
  const inputStyleSafe = (input.styleOptionName ?? "Standard").trim().toLowerCase();

  // Prisma Json fields are returned as JsonValue. Cast to array of options.
  const fabricOptions = (product.fabricOptions as any[]) || [];
  const styleOptions = (product.styleOptions as any[]) || [];

  let fabricOption = fabricOptions.find(
    (f: any) => (f.name ?? "").trim().toLowerCase() === inputFabricSafe
  );
  
  // Resilient fallback: If no fabric options are configured, allow "Standard" or "Original" with 0 modifier
  if (!fabricOption && fabricOptions.length === 0) {
    if (inputFabricSafe === "standard" || inputFabricSafe === "original" || !input.fabricOptionName) {
      fabricOption = { name: input.fabricOptionName || "Standard", priceModifier: 0 };
    }
  }

  let styleOption = styleOptions.find(
    (s: any) => (s.name ?? "").trim().toLowerCase() === inputStyleSafe
  );

  // Resilient fallback: If no style options are configured, allow "Standard" or "Original" with 0 modifier
  if (!styleOption && styleOptions.length === 0) {
    if (inputStyleSafe === "standard" || inputStyleSafe === "original" || !input.styleOptionName) {
      styleOption = { name: input.styleOptionName || "Standard", priceModifier: 0 };
    }
  }

  if (!fabricOption) {
    const available = fabricOptions.length > 0 
      ? fabricOptions.map((f: any) => f.name).join(', ') 
      : "NONE CONFIGURED (Ready to Wear)";
    throw new AppError(`Invalid fabric option. Received: '${input.fabricOptionName}', Available: [${available}]. If this is a standard item, please ensure 'Standard' is selected.`, 400);
  }

  if (!styleOption) {
    const available = styleOptions.length > 0 
      ? styleOptions.map((s: any) => s.name).join(', ') 
      : "NONE CONFIGURED (Ready to Wear)";
    throw new AppError(`Invalid style option. Received: '${input.styleOptionName}', Available: [${available}]. If this is a standard item, please ensure 'Standard' is selected.`, 400);
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
        productId: input.productId,
        styleOptionName: styleOption.name,
        fabricOptionName: fabricOption.name,
        colorName: input.colorName,
        basePrice: product.basePrice,
        styleModifier: styleOption.priceModifier,
        fabricModifier: fabricOption.priceModifier,
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
    (createdOrder.order as any).user.email,
    totalAmount,
    createdOrder.reference,
    {
      orderId: createdOrder.order.id,
      userId,
      customerEmail: (createdOrder.order as any).user.email,
    }
  );

  return {
    order: createdOrder.order,
    payment: createdOrder.payment,
    paymentUrl: paystackInit.authorizationUrl, // Frontend redirects user to this URL
    accessCode: paystackInit.accessCode,      // For frontend PaystackPop modal
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
  const payment = await prisma.payment.findFirst({
    where: { reference },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // If already completed, return early (idempotency)
  if (payment.status === "COMPLETED") {
    return { alreadyProcessed: true, payment };
  }

  // Fetch order
  console.log(`[orderService] Confirming payment for reference: ${reference}, orderId: ${payment.orderId}`);
  const order = await prisma.order.findFirst({
    where: { id: payment.orderId },
    include: { payment: true },
  });

  if (!order) {
    console.error(`[orderService] Order ${payment.orderId} not found during payment confirmation!`);
    throw new AppError("Order not found", 404);
  }

  // Continue with verification...
  console.log(`[orderService] Verification started for order: ${order.id}`);

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
  if (paystackVerification.amount !== payment.amount) {
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
    console.log(`[orderService] Enqueueing notification for order: ${updated.order.id}`);
    
    // Augment with product data for notification
    let productName = "Custom Outfit";
    try {
      const product = await getCachedProductByIdOrSlug(updated.order.productId);
      if (product) productName = product.name;
    } catch (error) {
      console.warn(`[orderService] Failed to fetch product info for notification:`, error);
    }
    
    try {
      await notificationQueue.add("order-confirmed", {
        orderId: updated.order.id,
        userId: updated.order.userId,
        userEmail: updated.order.user.email,
        userPhone: updated.order.user.phone,
        userName: updated.order.user.firstName,
        totalPrice: updated.order.totalAmount,
        measurement: updated.order.measurement,
        productName,
        fabricOption: updated.order.fabricOptionName,
        colorOption: updated.order.colorName,
        styleOption: updated.order.styleOptionName,
      });
      console.log(`[orderService] ✓ Notification job added to queue`);
    } catch (error) {
      console.error(`[orderService] ✗ Failed to add notification job to queue:`, error);
    }
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
  console.log(`[orderService] Fetching order: ${orderId} for user: ${userId}`);
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      measurement: true,
      statusHistory: true,
      payment: true,
    },
  });

  if (order) {
    console.log(`[orderService] Found order: ${order.id}, owner: ${order.userId}`);
  } else {
    console.log(`[orderService] Order NOT found: ${orderId}`);
  }

  if (!order) {
    throw new AppError(`Order not found: ${orderId}`, 404);
  }

  // Authorization: user can only view their own orders
  if (order.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  let localProduct = null;
  try {
    localProduct = await getCachedProductByIdOrSlug(order.productId);
  } catch (error) {
    console.warn(`[orderService] Product ${order.productId} not found for order ${order.id}`);
  }
  
  return {
    ...order,
    product: localProduct || null,
  };
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

  // Augment all orders with product data from Local Cache
  const augmentedOrders = await Promise.all(
    orders.map(async (order) => {
      let product = null;
      try {
        product = await getCachedProductByIdOrSlug(order.productId);
      } catch (error) {
        console.warn(`[orderService] Product ${order.productId} not found for order ${order.id}`);
      }
      return {
        ...order,
        product: product || null,
      };
    })
  );
  
  return { orders: augmentedOrders, total, skip, take };
}

/**
 * Retrieve all measurement profiles for a user.
 */
export async function getUserMeasurements(userId: string) {
  const measurements = await prisma.measurement.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return measurements;
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