/**
 * Order service — business logic for order creation and payment handling.
 * Handles transactional consistency across Postgres and payment webhooks.
 */

import { prisma, OrderStatus } from "@jhaz-imprints/db";
import { Product, Fabric } from "@jhaz-imprints/catalog-db";
import { OrderCreateSchema, type MeasurementCreate } from "@jhaz-imprints/shared";
import { computeOrderTotal } from "./pricingEngine";
import { initializePayment, verifyPayment } from "./paystackService";
import { AppError } from "../errors/AppError";
import { notificationQueue } from "../queues/notificationWorker";

/** Inline measurement snapshot — supplied by the client, stored as-is. */
export interface OrderMeasurementInput {
  chest?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  armLength?: number;
  length?: number;
  notes?: string;
}

/**
 * Calculate required fabric in yards using tailors' layout constraints.
 */
export function calculateFabricYards(measurement: any): number {
  if (!measurement) return 2.0;

  const chest = measurement.chest || 0;
  const hips = measurement.hip || 0;
  const height = measurement.length || 0; // length field holds user height
  const shoulder = measurement.shoulder || 0;

  if (chest <= 0 || hips <= 0 || height <= 0 || shoulder <= 0) {
    return 2.0; // fallback default
  }

  const maxCircumference = Math.max(chest, hips);
  const easeAndSeams = 15.0; // cm
  const flatWidth = (maxCircumference / 2) + easeAndSeams;
  const fabricWidth = 115.0; // cm (45 inches)

  // Layout check: can we fit front and back side-by-side?
  const numLengths = (flatWidth * 2 > fabricWidth) ? 2 : 1;
  const garmentLength = height * 0.85;
  const sleeveLength = shoulder * 1.5;
  const allowance = 20.0;

  const totalLengthCm = (garmentLength * numLengths) + sleeveLength + allowance;
  const fabricYards = totalLengthCm / 91.44;

  return Math.max(2.0, Math.round(fabricYards * 100) / 100);
}

export interface CreateOrderItemInput {
  productId: string;
  /** Inline measurement for this customization — no DB lookup performed. */
  measurement: OrderMeasurementInput;
  /** MongoDB ObjectId of the chosen Fabric document (omit for Standard/RTW). */
  fabricId?: string;
  styleOptionName?: string;
  notes?: string;
}

export interface CreateOrderInput {
  /** Array of customized items — each carries its own measurement snapshot. */
  items: CreateOrderItemInput[];
  promoCode?: string;
  /**
   * Frontend-computed grand total (in Naira). Backend validates that its own
   * calculation matches this value to within ±₦1. If they diverge, the order
   * is rejected with a 409 status so the user can refresh and retry.
   */
  expectedTotal?: number;
  delivery?: {
    fullName: string;
    phoneNumber: string;
    address: string;
    city: string;
    state: string;
    country: string;
    deliveryMethod: "standard" | "express";
  };
}

/**
 * Helper to parse stringified JSON from order.notes and attach delivery details and promo code as objects/fields.
 */
export function parseNotesMetadata(order: any): any {
  if (!order) return order;

  // Set default fields
  order.delivery = null;
  order.promoCode = null;

  if (order.notes) {
    try {
      const parsed = JSON.parse(order.notes);
      if (parsed && typeof parsed === "object") {
        order.delivery = parsed.delivery || null;
        order.promoCode = parsed.promoCode || null;
      }
    } catch (e) {
      // Keep delivery and promoCode as null for legacy plaintext notes
    }
  }
  return order;
}

/**
 * Helper to dynamically batch-query MongoDB and populate missing style & fabric image URLs for order items.
 */
export async function populateOrdersImages(ordersInput: any | any[]): Promise<any> {
  if (!ordersInput) return ordersInput;
  const isArray = Array.isArray(ordersInput);
  const orders = isArray ? ordersInput : [ordersInput];

  // Collect all unique productIds and fabricIds
  const productIds = new Set<string>();
  const fabricIds = new Set<string>();

  for (const o of orders) {
    if (!o.items || !Array.isArray(o.items)) continue;
    for (const item of o.items) {
      if (item.productId) productIds.add(item.productId);
      if (item.fabricId) {
        const [cleanFabricId] = item.fabricId.split("::");
        fabricIds.add(cleanFabricId);
      }
    }
  }

  // Batch query Mongo
  const [products, fabrics] = await Promise.all([
    Product.find({ _id: { $in: Array.from(productIds) } }).lean(),
    Fabric.find({ _id: { $in: Array.from(fabricIds) } }).lean(),
  ]);

  const productMap = new Map(products.map((p: any) => [p._id.toString(), p]));
  const fabricMap = new Map(fabrics.map((f: any) => [f._id.toString(), f]));

  for (const o of orders) {
    if (!o.items || !Array.isArray(o.items)) continue;
    for (const item of o.items) {
      const mongoProduct = productMap.get(item.productId);
      
      // Resolve fabric variant
      let prop: any = null;
      if (item.fabricId) {
        const [cleanFabricId, selectedColorName] = item.fabricId.split("::");
        const fabricDoc = fabricMap.get(cleanFabricId);
        if (fabricDoc && fabricDoc.properties) {
          if (selectedColorName) {
            prop = fabricDoc.properties.find(
              (p: any) => p.colorName.toLowerCase() === selectedColorName.toLowerCase()
            ) ?? null;
          }
          if (!prop && fabricDoc.properties.length > 0) {
            prop = fabricDoc.properties[0];
          }
        }
      }

      // Resolve style option
      let styleOpt: any = null;
      if (
        mongoProduct &&
        item.styleOptionName &&
        item.styleOptionName.toLowerCase() !== "standard" &&
        item.styleOptionName.toLowerCase() !== "original"
      ) {
        styleOpt = mongoProduct.styleOptions?.find(
          (s: any) => s.name.toLowerCase() === item.styleOptionName.toLowerCase()
        );
      }

      const defaultStyleOpt = mongoProduct?.styleOptions?.find(
        (s: any) => s.name === mongoProduct.defaultStyle
      ) || mongoProduct?.styleOptions?.[0];

      // Populate if missing
      item.fabricImgUrl = item.fabricImgUrl || prop?.imageUrl || null;
      item.styleImgUrl = item.styleImgUrl || styleOpt?.imgUrl || defaultStyleOpt?.imgUrl || null;
      item.imgUrl = item.imgUrl || item.styleImgUrl || item.fabricImgUrl || null;
    }
  }

  return isArray ? orders : orders[0];
}

/**
 * Create a new order.
 *
 * Optimised flow:
 * 1. Pre-validate all input options (format checks, presence) — zero DB calls.
 * 2. Fetch measurement and authorise owner.
 * 3. For each item: fetch product (MongoDB source-of-truth), fetch only the
 *    specified fabric (by id), validate style, compute price — push to allOrders.
 * 4. Persist one Order row (items JSON) + one Payment row inside a transaction.
 * 5. Initialise a single Paystack transaction with the combined reference.
 *
 * @param userId - Customer's user ID
 * @param input  - Validated order payload
 */
export async function createOrder(userId: string, input: CreateOrderInput) {
  // ── Step 1: Pre-flight validation — NO database calls yet ──────────────────
  if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
    throw new AppError("No items provided in the order", 400);
  }

  const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
  const FABRIC_ID_RE = /^[a-f\d]{24}(::.+)?$/i;

  for (const item of input.items) {
    // productId must be a valid MongoDB ObjectId
    if (!item.productId || !OBJECT_ID_RE.test(item.productId)) {
      throw new AppError(
        `Invalid or missing productId: "${item.productId ?? ""}"`,
        400
      );
    }

    // fabricId, when supplied, must also be a valid ObjectId (optionally including ::colorName suffix)
    if (item.fabricId !== undefined && !FABRIC_ID_RE.test(item.fabricId)) {
      throw new AppError(
        `Invalid fabricId format for productId=${item.productId}: "${item.fabricId}"`,
        400
      );
    }

    // styleOptionName, when supplied, must be a non-empty string
    if (
      item.styleOptionName !== undefined &&
      typeof item.styleOptionName === "string" &&
      item.styleOptionName.trim() === ""
    ) {
      throw new AppError(
        `styleOptionName cannot be blank for productId=${item.productId}`,
        400
      );
    }
  }

  // ── Step 2 (skipped): Measurement data is supplied inline per item — no DB lookup. ─

  // ── Step 3: Verify each item and accumulate order rows ──────────────────────
  const allOrders: any[] = [];
  let totalOrderAmount = 0;

  for (const item of input.items) {
    // 3a. Fetch product from source of truth (MongoDB)
    const mongoProduct = await Product.findById(item.productId).lean();
    if (!mongoProduct) {
      throw new AppError(`Product not found: productId=${item.productId}`, 404);
    }
    if (mongoProduct.isActive === false) {
      throw new AppError(
        `Product "${mongoProduct.name}" is no longer active and cannot be ordered. Please remove it from your cart.`,
        400
      );
    }

    // 3b. Fabric — fetch only the single fabric document specified in the item
    let fabricPriceModifier = 0;
    let resolvedFabricName = "Standard";
    let resolvedFabricId: string | null = null;
    let yardsPerUnit = 1.0;
    let fabricUnit = "yard";

    if (item.fabricId) {
      const [cleanFabricId, selectedColorName] = item.fabricId.split("::");

      const fabricDoc = await Fabric.findById(cleanFabricId).lean();
      if (!fabricDoc) {
        throw new AppError(
          `Fabric not found: fabricId=${cleanFabricId}`,
          404
        );
      }

      // Find property by colorName (case-insensitive), fallback to the first property if not found/specified.
      let prop = null;
      if (selectedColorName && fabricDoc.properties) {
        prop = fabricDoc.properties.find(
          (p) => p.colorName.toLowerCase() === selectedColorName.toLowerCase()
        ) ?? null;
      }
      if (!prop && fabricDoc.properties && fabricDoc.properties.length > 0) {
        prop = fabricDoc.properties[0];
      }

      // Both price modifiers come strictly from the DB; default to 0 if not set.
      fabricPriceModifier = prop?.priceModifier ?? 0;
      resolvedFabricName = prop
        ? `${fabricDoc.name} — ${prop.colorName}`
        : fabricDoc.name;
      resolvedFabricId = cleanFabricId;
      yardsPerUnit = prop?.yardsPerUnit ?? 1.0;
      fabricUnit = prop?.unit ?? "yard";
    }

    // Calculate required fabric yards and packaging units needed
    const estimatedYards = calculateFabricYards(item.measurement);
    const unitsNeeded = Math.ceil(estimatedYards / yardsPerUnit);
    const totalFabricModifier = fabricPriceModifier * unitsNeeded;

    // 3c. Style option — validate against product's own style list
    const inputStyleSafe = (item.styleOptionName ?? "Standard").trim();
    let stylePriceModifier = 0;
    let resolvedStyleName = inputStyleSafe;
    let resolvedStyleOpt: any = null;

    if (
      inputStyleSafe.toLowerCase() !== "standard" &&
      inputStyleSafe.toLowerCase() !== "original"
    ) {
      const styleOpt = mongoProduct.styleOptions?.find(
        (s) => s.name.toLowerCase() === inputStyleSafe.toLowerCase()
      );
      if (!styleOpt) {
        throw new AppError(
          `Style option "${inputStyleSafe}" not found on productId=${item.productId}`,
          404
        );
      }
      // priceModifier comes strictly from DB; ?? 0 preserves explicit DB zero.
      stylePriceModifier = styleOpt.priceModifier ?? 0;
      resolvedStyleName = styleOpt.name;
      resolvedStyleOpt = styleOpt;
    }

    // 3d. Compute this item's price and push to allOrders
    const itemTotal = computeOrderTotal({
      basePrice: mongoProduct.basePrice,
      fabricPriceModifier: totalFabricModifier,
      stylePriceModifier,
    });

    totalOrderAmount += itemTotal;

    const defaultStyleOpt = mongoProduct.styleOptions?.find(
      (s: any) => s.name === mongoProduct.defaultStyle
    ) || mongoProduct.styleOptions?.[0];

    allOrders.push({
      productId: item.productId,
      productName: mongoProduct.name,
      // Inline measurement snapshot — stored exactly as supplied by the client
      measurement: item.measurement,
      fabricId: resolvedFabricId,
      fabricOptionName: resolvedFabricName,
      styleOptionName: resolvedStyleName,
      // colorName is resolved from the fabric property (DB); null if no fabric selected.
      colorName: resolvedFabricName.includes(" — ")
        ? resolvedFabricName.split(" — ")[1]
        : null,
      fabricImgUrl: prop?.imageUrl ?? null,
      styleImgUrl: resolvedStyleOpt?.imgUrl || defaultStyleOpt?.imgUrl || null,
      imgUrl: resolvedStyleOpt?.imgUrl || prop?.imageUrl || defaultStyleOpt?.imgUrl || null,
      basePrice: mongoProduct.basePrice,
      styleModifier: stylePriceModifier,
      fabricPricePerUnit: fabricPriceModifier,
      fabricQty: unitsNeeded,
      fabricUnit: fabricUnit,
      fabricYards: estimatedYards,
      yardsPerUnit: yardsPerUnit,
      fabricModifier: totalFabricModifier,
      totalAmount: itemTotal,
      notes: item.notes ?? null,
    });
  }

  // Calculate delivery fee and promo discounts
  let deliveryFee = 0;
  if (input.delivery) {
    deliveryFee = input.delivery.deliveryMethod === "express" ? 7500 : 3500;
  }
  let discount = 0;
  if (input.promoCode === "JHAZ10") {
    discount = (totalOrderAmount + deliveryFee) * 0.1;
  }
  const grandTotal = totalOrderAmount + deliveryFee - discount;

  // ── Price integrity check: reject if frontend total diverges from backend ──
  if (
    input.expectedTotal !== undefined &&
    Math.abs(grandTotal - input.expectedTotal) > 1
  ) {
    console.warn(
      `[pricingMismatch] userId=${userId} expectedTotal=${input.expectedTotal} backendTotal=${grandTotal} diff=${Math.abs(grandTotal - input.expectedTotal)}`
    );
    throw new AppError(
      `Price mismatch: your cart shows ₦${input.expectedTotal.toLocaleString()} but the verified total is ₦${grandTotal.toLocaleString()}. Please refresh the page and try again.`,
      409
    );
  }

  const notesMetadata = JSON.stringify({
    delivery: input.delivery,
    promoCode: input.promoCode,
  });

  // ── Step 4: Persist order + payment atomically ──────────────────────────────
  const { order: newOrder, payment, reference } = await prisma.$transaction(
    async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          // measurementId omitted — measurement is stored inline in items JSON
          items: allOrders,
          totalAmount: grandTotal,
          status: "PENDING",
          notes: notesMetadata,
        },
        include: { user: true },
      });

      const reference = `order_${newOrder.id}_${Date.now()}`;
      const payment = await tx.payment.create({
        data: {
          orderId: newOrder.id,
          amount: grandTotal,
          status: "PENDING",
          reference,
          provider: "PAYSTACK",
        },
      });

      return { order: newOrder, payment, reference };
    }
  );

  // ── Step 5: Initiate single Paystack transaction with the combined reference ─
  const paystackInit = await initializePayment(
    (newOrder as any).user.email,
    grandTotal,
    reference,
    {
      orderId: newOrder.id,
      userId,
      customerEmail: (newOrder as any).user.email,
    }
  );

  return {
    order: parseNotesMetadata(newOrder),
    payment,
    paymentUrl: paystackInit.authorizationUrl,
    accessCode: paystackInit.accessCode,
    reference,
    breakdown: {
      itemsSubtotal: totalOrderAmount,
      deliveryFee,
      discount,
      grandTotal,
    },
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
export async function confirmPayment(
  reference: string,
  userId?: string,
  userRole?: "CUSTOMER" | "ADMIN" | "TAILOR"
) {
  // Check if payment already processed (idempotency check #1)
  const payment = await prisma.payment.findFirst({
    where: { reference },
    include: { order: true },
  });

  if (!payment) {
    throw new AppError("Payment not found", 404);
  }

  // Authorization check (only if userId/userRole are passed, i.e., authenticated request, not webhook)
  if (userId && userRole && userRole !== "ADMIN" && userRole !== "TAILOR") {
    if (payment.order.userId !== userId) {
      throw new AppError("Forbidden: You do not own this order/payment", 403);
    }
  }

  // If already completed, return early (idempotency)
  if (payment.status === "COMPLETED") {
    return { alreadyProcessed: true, payment, order: parseNotesMetadata(payment.order) };
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
    if (paystackVerification.status === "failed") {
      const updated = await prisma.$transaction(async (tx) => {
        const lockedPayment = await tx.payment.findUnique({ where: { reference } });
        if (lockedPayment?.status === "COMPLETED") {
          return { order: null, payment: lockedPayment, alreadyProcessed: true };
        }

        const payment = await tx.payment.update({
          where: { reference },
          data: { status: "FAILED" },
        });

        const order = await tx.order.findUnique({
          where: { id: payment.orderId },
        });

        // Insert failed payment history entry
        const existingHistory = await tx.orderStatusHistory.findFirst({
          where: { orderId: order!.id, status: "PENDING", note: { startsWith: "Payment failed" } },
        });
        if (!existingHistory) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: order!.id,
              status: "PENDING",
              note: `Payment failed: reference ${reference}`,
            },
          });
        }

        return { order, payment, alreadyProcessed: false };
      });

      return {
        status: "FAILED",
        order: parseNotesMetadata(updated.order),
        payment: updated.payment,
        alreadyProcessed: updated.alreadyProcessed,
      };
    }

    // For any other status (e.g. "ongoing", "abandoned", "pending")
    return {
      status: "PENDING",
      order: parseNotesMetadata(order),
      payment,
      alreadyProcessed: false,
    };
  }

  // Verify amount matches (only for successful payments)
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
    const orderItems = (updated.order.items as any[]) || [];
    const firstItem = orderItems[0] || {};
    let productName = firstItem.productName || "Custom Outfit";
    if (orderItems.length > 1) {
      productName = `${productName} & ${orderItems.length - 1} other item(s)`;
    }

    // Fire-and-forget: do NOT await the queue add to prevent Redis connection delays/failures from blocking the API response
    notificationQueue.add("order-confirmed", {
      orderId: updated.order.id,
      userId: updated.order.userId,
      userEmail: updated.order.user.email,
      userPhone: updated.order.user.phone,
      userName: updated.order.user.firstName,
      totalPrice: updated.order.totalAmount,
      measurement: firstItem.measurement,
      productName,
      fabricOption: firstItem.fabricOptionName || "Standard",
      colorOption: firstItem.colorName || "Default",
      styleOption: firstItem.styleOptionName || "Standard",
    })
      .then(() => {
        console.log(`[orderService] ✓ Notification job added to queue`);
      })
      .catch((error) => {
        console.error(`[orderService] ✗ Failed to add notification job to queue:`, error);
      });
  }

  return { status: "COMPLETED", order: parseNotesMetadata(updated.order), payment: updated.payment, alreadyProcessed: updated.alreadyProcessed };
}

/**
 * Retrieve an order by ID (with authorization check).
 *
 * @param userId - Customer's user ID (for authorization)
 * @param orderId - Order ID to fetch
 * @returns Order with related data
 */
export async function getOrderById(
  userId: string,
  orderId: string,
  userRole: "CUSTOMER" | "ADMIN" | "TAILOR" = "CUSTOMER"
) {
  console.log(`[orderService] Fetching order: ${orderId} for user: ${userId} (${userRole})`);
  const order = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      measurement: true,
      statusHistory: true,
      payment: true,
      tailor: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      }
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

  // Authorization: user can only view their own orders unless they are ADMIN or TAILOR
  if (userRole !== "ADMIN" && userRole !== "TAILOR" && order.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  // TAILOR role can only view orders assigned to them
  if (userRole === "TAILOR" && order.tailorId !== userId) {
    throw new AppError("Forbidden: You are not assigned to this order", 403);
  }

  let resOrder: any;
  if (order.status === "PENDING") {
    resOrder = await revalidateOrderPricing(order);
  } else {
    resOrder = parseNotesMetadata(order);
  }

  await populateOrdersImages(resOrder);
  return resOrder;
}

/**
 * Revalidate pricing for pending orders.
 * Fetches the latest basePrice, fabricModifier, and styleModifier from MongoDB,
 * recalculates totalAmount, and persists to PostgreSQL if any pricing changed.
 */
export async function revalidateOrderPricing(order: any) {
  if (order.status !== "PENDING") {
    return parseNotesMetadata(order);
  }

  let deliveryFee = 0;
  let promoCode: string | undefined = undefined;
  if (order.notes) {
    try {
      const meta = JSON.parse(order.notes);
      if (meta && typeof meta === "object") {
        const delivery = meta.delivery;
        promoCode = meta.promoCode;
        if (delivery && delivery.deliveryMethod) {
          deliveryFee = delivery.deliveryMethod === "express" ? 7500 : 3500;
        }
      }
    } catch (e) {
      // ignore parsing error for legacy plaintext notes
    }
  }

  const items = order.items as any[];
  if (!Array.isArray(items) || items.length === 0) {
    return parseNotesMetadata(order);
  }

  let updated = false;
  let totalOrderAmount = 0;
  const updatedItems: any[] = [];

  for (const item of items) {
    let basePrice = item.basePrice;
    let fabricModifier = item.fabricModifier;
    let styleModifier = item.styleModifier;

    // 1. Fetch latest product basePrice and styleModifier
    const mongoProduct = await Product.findById(item.productId).lean();
    if (mongoProduct) {
      if (mongoProduct.basePrice !== item.basePrice) {
        console.log(`[pricingSync] Product ${item.productId} basePrice changed: ${item.basePrice} -> ${mongoProduct.basePrice}`);
        basePrice = mongoProduct.basePrice;
        updated = true;
      }

      // Check style modifier
      const styleName = item.styleOptionName || "Standard";
      if (styleName.toLowerCase() !== "standard" && styleName.toLowerCase() !== "original") {
        const styleOpt = mongoProduct.styleOptions?.find(
          (s) => s.name.toLowerCase() === styleName.toLowerCase()
        );
        if (styleOpt) {
          const latestStyleMod = styleOpt.priceModifier ?? 0;
          if (latestStyleMod !== item.styleModifier) {
            console.log(`[pricingSync] Style modifier for ${styleName} changed: ${item.styleModifier} -> ${latestStyleMod}`);
            styleModifier = latestStyleMod;
            updated = true;
          }
        }
      }
    }

    // 2. Fetch latest fabricModifier
    if (item.fabricId) {
      const fabricDoc = await Fabric.findById(item.fabricId).lean();
      if (fabricDoc) {
        let prop = null;
        if (item.colorName && fabricDoc.properties) {
          prop = fabricDoc.properties.find(
            (p) => p.colorName.toLowerCase() === item.colorName.toLowerCase()
          ) ?? null;
        }
        if (!prop && fabricDoc.properties && fabricDoc.properties.length > 0) {
          prop = fabricDoc.properties[0];
        }
        const latestFabricPricePerUnit = prop?.priceModifier ?? 0;
        const currentYardsPerUnit = prop?.yardsPerUnit ?? 1.0;

        const estimatedYards = calculateFabricYards(item.measurement);
        const unitsNeeded = Math.ceil(estimatedYards / currentYardsPerUnit);
        const totalFabricModifier = latestFabricPricePerUnit * unitsNeeded;

        if (
          latestFabricPricePerUnit !== item.fabricPricePerUnit ||
          unitsNeeded !== item.fabricQty ||
          currentYardsPerUnit !== item.yardsPerUnit ||
          totalFabricModifier !== item.fabricModifier
        ) {
          console.log(`[pricingSync] Fabric properties or qty changed for order item`);
          fabricModifier = totalFabricModifier;
          item.fabricPricePerUnit = latestFabricPricePerUnit;
          item.fabricQty = unitsNeeded;
          item.yardsPerUnit = currentYardsPerUnit;
          item.fabricUnit = prop?.unit ?? "yard";
          item.fabricYards = estimatedYards;
          item.fabricModifier = totalFabricModifier;
          updated = true;
        }
      }
    }

    // 3. Compute item total amount
    const latestItemTotal = computeOrderTotal({
      basePrice,
      fabricPriceModifier: fabricModifier,
      stylePriceModifier: styleModifier,
    });

    if (latestItemTotal !== item.totalAmount) {
      updated = true;
    }

    totalOrderAmount += latestItemTotal;

    updatedItems.push({
      ...item,
      basePrice,
      fabricModifier,
      styleModifier,
      totalAmount: latestItemTotal,
    });
  }

  const grandTotal = totalOrderAmount + deliveryFee - (promoCode === "JHAZ10" ? (totalOrderAmount + deliveryFee) * 0.1 : 0);

  // If there are changes, update the PostgreSQL database
  if (updated || grandTotal !== order.totalAmount) {
    console.log(`[pricingSync] Updating order ${order.id} total amount: ${order.totalAmount} -> ${grandTotal}`);

    // Update order and payment records atomically
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const uOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          items: updatedItems,
          totalAmount: grandTotal,
        },
        include: {
          measurement: true,
          statusHistory: true,
          payment: true,
        }
      });

      // Update payment record amount if it exists
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: { amount: grandTotal }
      });

      return uOrder;
    });

    return parseNotesMetadata(updatedOrder);
  }

  return parseNotesMetadata(order);
}

/**
 * Get all orders for a user (paginated).
 */
export async function getUserOrders(userId: string, skip = 0, take = 20) {
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

  const parsedOrders = orders.map((o) => parseNotesMetadata(o));
  await populateOrdersImages(parsedOrders);

  return { orders: parsedOrders, total, skip, take };
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
  const count = await prisma.measurement.count({
    where: { userId }
  });
  if (count >= 2) {
    throw new AppError("You cannot save more than 2 measurement profiles. Please update an existing profile.", 400);
  }

  // If this is set as default, optionally unset others (not implemented for simplicity)
  const measurement = await prisma.measurement.create({
    data: {
      userId,
      ...input,
    },
  });

  return measurement;
}

/**
 * Update an existing measurement profile for a user.
 */
export async function updateMeasurement(userId: string, measurementId: string, input: MeasurementCreate) {
  const existing = await prisma.measurement.findFirst({
    where: { id: measurementId, userId }
  });

  if (!existing) {
    throw new AppError("Measurement profile not found or access denied", 404);
  }

  const updated = await prisma.measurement.update({
    where: { id: measurementId },
    data: {
      ...input,
    }
  });

  return updated;
}

/**
 * Initialize a new Paystack payment and update the payment reference in the database.
 */
export async function initializeOrderPayment(userId: string, orderId: string, email: string) {
  const orderResult = await getOrderById(userId, orderId);

  // Check if there is an existing payment reference and verify its status with Paystack first
  const existingPayment = await prisma.payment.findUnique({
    where: { orderId },
  });

  if (existingPayment && existingPayment.reference) {
    try {
      console.log(`[orderService] Checking Paystack status for reference: ${existingPayment.reference} in payment initialization`);
      const verification = await verifyPayment(existingPayment.reference);
      
      if (verification.status === "success") {
        console.log(`[orderService] Payment was successful for reference: ${existingPayment.reference}. Confirming order.`);
        
        // Confirm payment status
        await confirmPayment(existingPayment.reference);
        
        return {
          alreadyPaid: true,
          orderId: orderResult.id,
          amount: orderResult.totalAmount,
          reference: existingPayment.reference,
          paystackAccessCode: "",
          paystackAuthorizationUrl: "",
        };
      }
    } catch (error: any) {
      console.log(`[orderService] Verification check during payment initialization failed/unpaid (ignoring):`, error.message);
    }
  }

  if (orderResult.status !== "PENDING") {
    throw new AppError(
      `Cannot create payment intent for order with status: ${orderResult.status}`,
      400
    );
  }

  const paymentRef = `order_${orderResult.id}_${Date.now()}`;

  // Initialize payment with Paystack
  const paymentIntent = await initializePayment(
    email,
    orderResult.totalAmount,
    paymentRef,
    {
      orderId: orderResult.id,
      userId,
      customerEmail: email,
    }
  );

  // Update or create the payment record in the database
  await prisma.payment.upsert({
    where: { orderId: orderResult.id },
    update: {
      reference: paymentRef,
      status: "PENDING",
      amount: orderResult.totalAmount,
    },
    create: {
      orderId: orderResult.id,
      reference: paymentRef,
      status: "PENDING",
      amount: orderResult.totalAmount,
      provider: "PAYSTACK",
    },
  });

  return {
    paystackAccessCode: paymentIntent.accessCode,
    paystackAuthorizationUrl: paymentIntent.authorizationUrl,
    reference: paymentIntent.reference,
    orderId: orderResult.id,
    amount: orderResult.totalAmount,
  };
}

/**
 * Cancel and delete a pending order.
 */
export async function deletePendingOrder(
  userId: string,
  orderId: string,
  userRole: "CUSTOMER" | "ADMIN" | "TAILOR" = "CUSTOMER"
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Authorization: user can only cancel their own orders unless they are ADMIN
  if (userRole !== "ADMIN" && order.userId !== userId) {
    throw new AppError("Forbidden", 403);
  }

  if (order.status !== "PENDING") {
    throw new AppError("Only pending orders can be cancelled", 400);
  }

  // Verify payment status with Paystack before cancelling
  const payment = await prisma.payment.findUnique({
    where: { orderId },
  });

  if (payment && payment.reference) {
    try {
      console.log(`[orderService] Verifying payment status on Paystack for reference: ${payment.reference} before cancellation`);
      const verification = await verifyPayment(payment.reference);

      if (verification.status === "success") {
        console.warn(`[orderService] Cancellation aborted: payment already completed for reference: ${payment.reference}`);

        // Auto-heal: Verify/confirm in the background so the database status updates
        confirmPayment(payment.reference).catch((err) => {
          console.error(`[orderService] Auto-confirm failed for reference ${payment.reference}:`, err);
        });

        throw new AppError(
          "This order cannot be cancelled because your payment has already been successfully processed. The order status has been updated to CONFIRMED.",
          400
        );
      }
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      console.log(`[orderService] Paystack verification error during cancellation check (safe to ignore if unpaid):`, error.message);
    }
  }

  await prisma.order.delete({
    where: { id: orderId },
  });

  return { success: true };
}

/**
 * Get all orders in the system (for admins and tailors).
 */
export async function getAllOrders(skip = 0, take = 20, userRole?: string, userId?: string) {
  const where: any = {};
  if (userRole === "TAILOR") {
    where.tailorId = userId;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      },
      payment: true,
      statusHistory: true,
      tailor: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        }
      }
    },
    skip,
    take,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.order.count({ where });

  const parsedOrders = orders.map((o) => parseNotesMetadata(o));
  await populateOrdersImages(parsedOrders);

  return { orders: parsedOrders, total, skip, take };
}

/**
 * Update an order's status and log to history.
 */
export async function updateOrderStatus(
  orderId: string,
  input: { status: OrderStatus; note?: string; tailorId?: string | null },
  userRole: "CUSTOMER" | "ADMIN" | "TAILOR",
  userId?: string
) {
  // Authorization check: Only ADMIN and TAILOR can manually update order status
  if (userRole !== "ADMIN" && userRole !== "TAILOR") {
    throw new AppError("Forbidden: Insufficient permissions to update order status", 403);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  // Tailor authorization check: Tailor can only modify their assigned orders
  if (userRole === "TAILOR" && order.tailorId !== userId) {
    throw new AppError("Forbidden: You are not assigned to this order", 403);
  }

  // Prevent transitions from CANCELLED status for data integrity
  if (order.status === "CANCELLED" && input.status !== "CANCELLED") {
    throw new AppError("Cannot change status of a cancelled order", 400);
  }

  // Tailor transition logic constraints
  if (userRole === "TAILOR") {
    const allowedStatuses: OrderStatus[] = ["IN_PRODUCTION", "READY"];
    if (!allowedStatuses.includes(input.status)) {
      throw new AppError("Forbidden: Tailors can only transition orders to IN_PRODUCTION or READY states", 403);
    }
    const allowedCurrentStatuses: OrderStatus[] = ["PENDING", "CONFIRMED", "IN_PRODUCTION"];
    if (!allowedCurrentStatuses.includes(order.status)) {
      throw new AppError("Forbidden: Tailors cannot transition orders that are ready, dispatched, delivered, or cancelled", 403);
    }
  }

  // Update order status, write history, and assign tailor if provided (and user is ADMIN)
  const updatedOrder = await prisma.$transaction(async (tx) => {
    const updateData: any = { status: input.status };
    if (userRole === "ADMIN" && input.tailorId !== undefined) {
      updateData.tailorId = input.tailorId;
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        payment: true,
        statusHistory: true,
        tailor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        }
      }
    });

    await tx.orderStatusHistory.create({
      data: {
        orderId,
        status: input.status,
        note: input.note || `Status updated manually to ${input.status} by ${userRole.toLowerCase()}`,
      },
    });

    return updated;
  });

  return parseNotesMetadata(updatedOrder);
}