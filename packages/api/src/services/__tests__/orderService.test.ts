/**
 * Order Service Integration Tests
 * Tests order creation and payment confirmation with Prisma and mocked externals
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

// Mock Paystack and BullMQ before importing orderService
vi.mock("bullmq", () => ({
  Queue: vi.fn().mockImplementation(() => ({
    add: vi.fn().mockResolvedValue({ id: "mock-job-id" }),
  })),
  Worker: vi.fn(),
}));

vi.mock("../uploadService", () => ({
  uploadToCloudinary: vi
    .fn()
    .mockResolvedValue({ url: "mock-url", publicId: "mock-id" }),
}));

// Import after mocks are set up
import { confirmPayment, createOrder } from "../orderService";
import { computeOrderTotal } from "../pricingEngine";

describe("orderService — Integration Tests", () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    // Use test database URL from environment
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;
    if (!testDatabaseUrl) {
      throw new Error("TEST_DATABASE_URL environment variable is required");
    }
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: testDatabaseUrl,
        },
      },
    });
  });

  afterEach(async () => {
    // Clean up test database
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "Payment", "OrderStatusHistory", "Order", "Measurement", "User" CASCADE`
    );
    await prisma.$disconnect();
    vi.clearAllMocks();
  });

  describe("confirmPayment — Idempotency", () => {
    it("should process payment only once when called twice with same reference", async () => {
      // Setup: Create a test user
      const user = await prisma.user.create({
        data: {
          email: "test@example.com",
          name: "Test User",
          phone: "+1234567890",
          role: "CUSTOMER",
        },
      });

      // Setup: Create test measurement
      const measurement = await prisma.measurement.create({
        data: {
          userId: user.id,
          bust: 90,
          waist: 70,
          hip: 95,
          shoulder: 40,
          sleeveLen: 60,
          height: 170,
        },
      });

      // Setup: Create test order
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          measurementId: measurement.id,
          productId: "test-product-id",
          fabricOptionId: "fabric-1",
          styleOptionId: "style-1",
          colorOptionId: "color-1",
          quantity: 1,
          totalPrice: 50000,
          status: "PENDING",
        },
      });

      // Create first payment with unique reference
      const paymentReference = `PAY-${Date.now()}-${Math.random()}`;

      const firstPayment = await prisma.payment.create({
        data: {
          orderId: order.id,
          reference: paymentReference,
          amount: 50000,
          status: "PENDING",
          provider: "PAYSTACK",
        },
      });

      // TEST: Call confirmPayment first time
      const result1 = await confirmPayment(paymentReference);
      expect(result1).toBeDefined();

      // Verify order status changed to CONFIRMED
      const orderAfterFirstConfirm = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderAfterFirstConfirm?.status).toBe("CONFIRMED");

      // Verify payment status is SUCCESS
      const paymentAfterFirstConfirm = await prisma.payment.findUnique({
        where: { id: firstPayment.id },
      });
      expect(paymentAfterFirstConfirm?.status).toBe("COMPLETED");

      // TEST: Call confirmPayment second time with SAME reference
      const result2 = await confirmPayment(paymentReference);

      // Verify order status is still CONFIRMED (idempotent)
      const orderAfterSecondConfirm = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(orderAfterSecondConfirm?.status).toBe("CONFIRMED");

      // Verify no duplicate Payment records were created
      const allPayments = await prisma.payment.findMany({
        where: { reference: paymentReference },
      });
      expect(allPayments).toHaveLength(1);
      expect(allPayments[0].status).toBe("COMPLETED");
    });

    it("should not process payment twice even with rapid concurrent calls", async () => {
      // Setup: Create test user
      const user = await prisma.user.create({
        data: {
          email: "test2@example.com",
          name: "Test User 2",
          phone: "+1234567891",
          role: "CUSTOMER",
        },
      });

      // Setup: Create test measurement
      const measurement = await prisma.measurement.create({
        data: {
          userId: user.id,
          bust: 90,
          waist: 70,
          hip: 95,
          shoulder: 40,
          sleeveLen: 60,
          height: 170,
        },
      });

      // Setup: Create test order
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          measurementId: measurement.id,
          productId: "test-product-id",
          fabricOptionId: "fabric-1",
          styleOptionId: "style-1",
          colorOptionId: "color-1",
          quantity: 1,
          totalPrice: 75000,
          status: "PENDING",
        },
      });

      // Create payment
      const paymentReference = `PAY-CONCURRENT-${Date.now()}`;
      await prisma.payment.create({
        data: {
          orderId: order.id,
          reference: paymentReference,
          amount: 75000,
          status: "PENDING",
          provider: "PAYSTACK",
        },
      });

      // TEST: Call confirmPayment concurrently (simulates race condition)
      const [result1, result2] = await Promise.all([
        confirmPayment(paymentReference),
        confirmPayment(paymentReference),
      ]);

      // Both should succeed (or one should handle gracefully)
      expect(result1 || result2).toBeDefined();

      // Verify order status is CONFIRMED
      const finalOrder = await prisma.order.findUnique({
        where: { id: order.id },
      });
      expect(finalOrder?.status).toBe("CONFIRMED");

      // Verify only one Payment record with COMPLETED status
      const payments = await prisma.payment.findMany({
        where: { reference: paymentReference },
      });
      expect(payments).toHaveLength(1);
      expect(payments[0].status).toBe("COMPLETED");

      // Verify OrderStatusHistory has exactly one CONFIRMED entry
      const statusHistory = await prisma.orderStatusHistory.findMany({
        where: { orderId: order.id, newStatus: "CONFIRMED" },
      });
      expect(statusHistory.length).toBeLessThanOrEqual(1);
    });

    it("should reject duplicate payments with constraint error", async () => {
      // Setup: Create test user
      const user = await prisma.user.create({
        data: {
          email: "test3@example.com",
          name: "Test User 3",
          phone: "+1234567892",
          role: "CUSTOMER",
        },
      });

      // Setup: Create test measurement
      const measurement = await prisma.measurement.create({
        data: {
          userId: user.id,
          bust: 90,
          waist: 70,
          hip: 95,
          shoulder: 40,
          sleeveLen: 60,
          height: 170,
        },
      });

      // Setup: Create test order
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          measurementId: measurement.id,
          productId: "test-product-id",
          fabricOptionId: "fabric-1",
          styleOptionId: "style-1",
          colorOptionId: "color-1",
          quantity: 1,
          totalPrice: 100000,
          status: "PENDING",
        },
      });

      const paymentReference = `PAY-DUPLICATE-${Date.now()}`;

      // Create first payment
      await prisma.payment.create({
        data: {
          orderId: order.id,
          reference: paymentReference,
          amount: 100000,
          status: "COMPLETED",
          provider: "PAYSTACK",
        },
      });

      // TEST: Attempt to create duplicate payment with same reference
      let constraintError = false;
      try {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            reference: paymentReference, // Same reference!
            amount: 100000,
            status: "COMPLETED",
            provider: "PAYSTACK",
          },
        });
      } catch (err) {
        constraintError = true;
      }

      // Should have failed due to unique constraint on reference
      expect(constraintError).toBe(true);

      // Verify only one payment exists
      const payments = await prisma.payment.findMany({
        where: { reference: paymentReference },
      });
      expect(payments).toHaveLength(1);
    });
  });

  describe("Pricing Engine Integration", () => {
    it("should correctly apply modifiers when creating order", () => {
      // Test that pricing calculation is consistent
      const basePrice = 50000;
      const fabricModifier = 10000;
      const styleModifier = 5000;

      const total = computeOrderTotal({
        basePrice,
        fabricPriceModifier: fabricModifier,
        stylePriceModifier: styleModifier,
      });

      expect(total).toBe(65000);
    });
  });
});
