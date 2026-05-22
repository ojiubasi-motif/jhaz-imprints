/**
 * Order Service Integration Tests
 * Tests order creation and payment confirmation with Prisma and mocked externals.
 *
 * External dependencies mocked globally via src/test-setup.ts:
 *   - BullMQ (Queue / Worker) → no Redis needed
 *   - Nodemailer, Twilio, Cloudinary → no real emails/messages/uploads
 *
 * External dependencies mocked here:
 *   - @jhaz-imprints/catalog-db (Product model) → no MongoDB needed
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PrismaClient } from "@jhaz-imprints/db";

// Mock MongoDB Product model so tests don't need a real Atlas connection.
// Must be declared BEFORE importing orderService (which imports catalog-db).
vi.mock("@jhaz-imprints/catalog-db", () => ({
  connectMongoDB: vi.fn().mockResolvedValue(undefined),
  Product: {
    findById: vi.fn().mockReturnValue({
      lean: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: "test-product-id",
          name: "Traditional Wedding Aso-oke",
          basePrice: 50000,
          fabricOptions: [
            { name: "Premium Aso-oke", priceModifier: 10000 },
            { name: "Standard Aso-oke", priceModifier: 0 },
          ],
          styleOptions: [
            { name: "Modern Elegant", priceModifier: 5000 },
            { name: "Classic Cut", priceModifier: 0 },
          ],
        }),
      }),
    }),
    findOne: vi.fn().mockReturnValue({
      lean: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          _id: "test-product-id",
          name: "Traditional Wedding Aso-oke",
          basePrice: 50000,
          fabricOptions: [
            { name: "Premium Aso-oke", priceModifier: 10000 },
            { name: "Standard Aso-oke", priceModifier: 0 },
          ],
          styleOptions: [
            { name: "Modern Elegant", priceModifier: 5000 },
            { name: "Classic Cut", priceModifier: 0 },
          ],
        }),
      }),
    }),
    find: vi.fn().mockReturnValue({
      lean: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      }),
    }),
  },
}));

vi.mock("../paystackService", () => ({
  initializePayment: vi.fn().mockResolvedValue({
    authorizationUrl: "https://mock-payment-url.com",
    accessCode: "mock-access-code",
    reference: "mock-ref",
  }),
  verifyPayment: vi.fn().mockResolvedValue({
    status: "success",
    amount: 50000,
    reference: "mock-ref",
    metadata: { orderId: "test-order-id" },
  }),
}));

// Import after mocks are set up
import { confirmPayment, createOrder } from "../orderService";
import { computeOrderTotal } from "../pricingEngine";

describe("orderService — Integration Tests", () => {
  let prisma: PrismaClient;
  // Track IDs of records created per test so teardown only deletes test data.
  // Using email as the anchor: all test users have a known @example.com address.
  const TEST_EMAILS = [
    "test@example.com",
    "test2@example.com",
    "test3@example.com",
  ];

  beforeEach(async () => {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;
    if (!testDatabaseUrl) {
      throw new Error("TEST_DATABASE_URL environment variable is required");
    }
    prisma = new PrismaClient({
      datasources: { db: { url: testDatabaseUrl } },
    });
    await prisma.$connect();
  });

  afterEach(async () => {
    // Safe targeted cleanup — only deletes records created by these tests.
    // Cascades through Orders → Payments → OrderStatusHistory via FK relations.
    await prisma.user.deleteMany({
      where: { email: { in: TEST_EMAILS } },
    });
    await prisma.$disconnect();
    vi.clearAllMocks();
  });

  describe("confirmPayment — Idempotency", () => {
    it("should process payment only once when called twice with same reference", async () => {
      // FIX: schema has firstName/lastName — not a single "name" field
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          firstName: "Test",
          lastName: "User",
          phone: "+1234567890",
          role: "CUSTOMER",
          password: "hashed_password",
        },
      });

      // FIX: schema fields are chest/armLength/length — not bust/sleeveLen/height
      const measurement = await prisma.measurement.create({
        data: {
          userId: user.id,
          chest: 90,
          waist: 70,
          hip: 95,
          shoulder: 40,
          armLength: 60,
          length: 170,
        },
      });

      // FIX: schema uses totalAmount — not totalPrice.
      // productId, fabricOptionId, styleOptionId, colorOptionId, quantity DO NOT exist in schema.
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          measurementId: measurement.id,
          productId: "test-product-id",
          styleOptionName: "Modern Elegant",
          fabricOptionName: "Premium Aso-oke",
          totalAmount: 50000,
          status: "PENDING",
        },
      });

      const paymentReference = `PAY-${Date.now()}-${Math.random()}`;

      await prisma.payment.create({
        data: {
          orderId: order.id,
          reference: paymentReference,
          amount: 50000,
          status: "PENDING",
          provider: "PAYSTACK",
        },
      });

      // First call
      const result1 = await confirmPayment(paymentReference);
      expect(result1).toBeDefined();

      const orderAfterFirstConfirm = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderAfterFirstConfirm?.status).toBe("CONFIRMED");

      const paymentAfterFirstConfirm = await prisma.payment.findUnique({
        where: { reference: paymentReference },
      });
      expect(paymentAfterFirstConfirm?.status).toBe("COMPLETED");

      // Second call — idempotency check
      const result2 = await confirmPayment(paymentReference);
      expect(result2.alreadyProcessed).toBe(true);

      const orderAfterSecondConfirm = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderAfterSecondConfirm?.status).toBe("CONFIRMED");

      const allPayments = await prisma.payment.findMany({
        where: { reference: paymentReference },
      });
      expect(allPayments).toHaveLength(1);
      expect(allPayments[0].status).toBe("COMPLETED");
    });

    it("should not process payment twice even with rapid concurrent calls", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test2@example.com",
          firstName: "Test",
          lastName: "User2",
          phone: "+1234567891",
          role: "CUSTOMER",
          password: "hashed_password",
        },
      });

      const measurement = await prisma.measurement.create({
        data: {
          userId: user.id,
          chest: 90,
          waist: 70,
          hip: 95,
          shoulder: 40,
          armLength: 60,
          length: 170,
        },
      });

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          measurementId: measurement.id,
          productId: "test-product-id",
          styleOptionName: "Modern Elegant",
          fabricOptionName: "Standard Aso-oke",
          totalAmount: 50000,
          status: "PENDING",
        },
      });

      const paymentReference = `PAY-CONCURRENT-${Date.now()}`;
      await prisma.payment.create({
        data: {
          orderId: order.id,
          reference: paymentReference,
          amount: 50000,
          status: "PENDING",
          provider: "PAYSTACK",
        },
      });

      // Concurrent calls — one wins, the other sees alreadyProcessed
      const [result1, result2] = await Promise.allSettled([
        confirmPayment(paymentReference),
        confirmPayment(paymentReference),
      ]);

      expect(result1.status === "fulfilled" || result2.status === "fulfilled").toBe(true);

      const finalOrder = await prisma.order.findUnique({ where: { id: order.id } });
      expect(finalOrder?.status).toBe("CONFIRMED");

      const payments = await prisma.payment.findMany({
        where: { reference: paymentReference },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0].status).toBe("COMPLETED");

      // FIX: schema field is "status" — not "newStatus"
      const statusHistory = await prisma.orderStatusHistory.findMany({
        where: { orderId: order.id, status: "CONFIRMED" },
      });
      expect(statusHistory.length).toBeLessThanOrEqual(1);
    });

    it("should reject duplicate payments with constraint error", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test3@example.com",
          firstName: "Test",
          lastName: "User3",
          phone: "+1234567892",
          role: "CUSTOMER",
          password: "hashed_password",
        },
      });

      const measurement = await prisma.measurement.create({
        data: {
          userId: user.id,
          chest: 90,
          waist: 70,
          hip: 95,
          shoulder: 40,
          armLength: 60,
          length: 170,
        },
      });

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          measurementId: measurement.id,
          productId: "test-product-id",
          styleOptionName: "Classic Cut",
          fabricOptionName: "Standard Aso-oke",
          totalAmount: 50000,
          status: "PENDING",
        },
      });

      const paymentReference = `PAY-DUPLICATE-${Date.now()}`;

      await prisma.payment.create({
        data: {
          orderId: order.id,
          reference: paymentReference,
          amount: 50000,
          status: "COMPLETED",
          provider: "PAYSTACK",
        },
      });

      // Attempt to insert duplicate — should throw due to @unique on reference
      let constraintError = false;
      try {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            reference: paymentReference,
            amount: 50000,
            status: "COMPLETED",
            provider: "PAYSTACK",
          },
        });
      } catch (err) {
        constraintError = true;
      }

      expect(constraintError).toBe(true);

      const payments = await prisma.payment.findMany({
        where: { reference: paymentReference },
      });
      expect(payments).toHaveLength(1);
    });
  });

  describe("Pricing Engine Integration", () => {
    it("should correctly apply modifiers when creating order", () => {
      const total = computeOrderTotal({
        basePrice: 50000,
        fabricPriceModifier: 10000,
        stylePriceModifier: 5000,
      });
      expect(total).toBe(65000);
    });
  });
});
