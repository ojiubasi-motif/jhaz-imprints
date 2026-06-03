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
vi.mock("@jhaz-imprints/catalog-db", () => {
  const mockProduct = {
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
  };

  return {
    connectMongoDB: vi.fn().mockResolvedValue(undefined),
    Product: {
      findById: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          ...mockProduct,
          select: vi.fn().mockResolvedValue(mockProduct),
        }),
      }),
      findOne: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          ...mockProduct,
          select: vi.fn().mockResolvedValue(mockProduct),
        }),
      }),
      find: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([]),
      }),
    },
    Fabric: {
      findById: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue({
          _id: "64f123456789abcdef999999",
          name: "Premium Silk",
          slug: "premium-silk",
          properties: [
            {
              colorName: "Gold",
              colorCode: "#D4A017",
              imageUrl: "https://mock.com/gold.jpg",
              unit: "trouser-length",
              yardsPerUnit: 1.5,
              priceModifier: 15000,
              inStock: true,
              isActive: true,
            },
          ],
        }),
      }),
    },
  };
});

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
import { confirmPayment, createOrder, getUserMeasurements, createMeasurement, updateMeasurement } from "../orderService";
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

      // Measurement is now embedded inline in each item — no separate row needed.
      const order = await prisma.order.create({
        data: {
          userId: user.id,
          items: [
            {
              productId: "test-product-id-111111111111",
              productName: "Traditional Wedding Aso-oke",
              measurement: { chest: 90, waist: 70, hip: 95, shoulder: 40, armLength: 60, length: 170 },
              fabricId: null,
              fabricOptionName: "Premium Aso-oke",
              styleOptionName: "Modern Elegant",
              colorName: null,
              basePrice: 50000,
              styleModifier: 5000,
              fabricModifier: 10000,
              totalAmount: 65000,
              notes: null,
            },
          ],
          totalAmount: 65000,
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

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          items: [
            {
              productId: "test-product-id-111111111111",
              productName: "Traditional Wedding Aso-oke",
              measurement: { chest: 90, waist: 70, hip: 95, shoulder: 40, armLength: 60, length: 170 },
              fabricId: null,
              fabricOptionName: "Standard Aso-oke",
              styleOptionName: "Modern Elegant",
              colorName: null,
              basePrice: 50000,
              styleModifier: 5000,
              fabricModifier: 0,
              totalAmount: 55000,
              notes: null,
            },
          ],
          totalAmount: 55000,
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

      const order = await prisma.order.create({
        data: {
          userId: user.id,
          items: [
            {
              productId: "test-product-id-111111111111",
              productName: "Traditional Wedding Aso-oke",
              measurement: { chest: 90, waist: 70, hip: 95, shoulder: 40, armLength: 60, length: 170 },
              fabricId: null,
              fabricOptionName: "Standard Aso-oke",
              styleOptionName: "Classic Cut",
              colorName: null,
              basePrice: 50000,
              styleModifier: 0,
              fabricModifier: 0,
              totalAmount: 50000,
              notes: null,
            },
          ],
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

    it("should calculate grand total correctly with delivery and promoCode JHAZ10", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test3@example.com",
          firstName: "Pricing",
          lastName: "Tester",
          phone: "+1234567800",
          role: "CUSTOMER",
          password: "hashed_password",
        },
      });

      const orderResult = await createOrder(user.id, {
        items: [
          {
            productId: "64f123456789abcdef123456",
            measurement: { chest: 90, waist: 70, hip: 95, shoulder: 40, armLength: 60, length: 170 },
            styleOptionName: "Modern Elegant",
          },
        ],
        promoCode: "JHAZ10",
        delivery: {
          fullName: "Recipient Name",
          phoneNumber: "+12345678",
          address: "123 Street",
          city: "Lagos",
          state: "Lagos",
          country: "Nigeria",
          deliveryMethod: "express",
        },
      });

      // Product base: 50000. Style modifier: 5000. Items subtotal = 55000.
      // Delivery fee: 7500. Sum = 62500.
      // Discount = 62500 * 0.1 = 6250.
      // Expected grand total = 56250.
      expect(orderResult.order.totalAmount).toBe(56250);
      expect(orderResult.payment.amount).toBe(56250);
      expect(orderResult.order.notes).toBeDefined();

      const parsedMeta = JSON.parse(orderResult.order.notes as string);
      expect(parsedMeta.promoCode).toBe("JHAZ10");
      expect(parsedMeta.delivery.deliveryMethod).toBe("express");
    });

    it("should calculate fabric modifier price accounting for quantity needed as calculated by the measurement formula", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test3@example.com",
          firstName: "FabricPricing",
          lastName: "Tester",
          phone: "+1234567801",
          role: "CUSTOMER",
          password: "hashed_password",
        },
      });

      const orderResult = await createOrder(user.id, {
        items: [
          {
            productId: "64f123456789abcdef123456",
            // This measurement layout calculation leads to 4.04 yards:
            // flatWidth = Max(90, 95) / 2 + 15 = 62.5 cm. flatWidth * 2 = 125 > 115 fabricWidth, so numLengths = 2.
            // garmentLength = 170 * 0.85 = 144.5 cm. sleeveLength = 40 * 1.5 = 60 cm.
            // totalLengthCm = 144.5 * 2 + 60 + 20 = 369 cm. yards = 369 / 91.44 = 4.035 -> 4.04 yards.
            measurement: { chest: 90, waist: 70, hip: 95, shoulder: 40, armLength: 60, length: 170 },
            styleOptionName: "Modern Elegant", // +5000 style modifier
            fabricId: "64f123456789abcdef999999::Gold", // priceModifier = 15000, yardsPerUnit = 1.5
          },
        ],
        promoCode: "JHAZ10",
        delivery: {
          fullName: "Recipient Name",
          phoneNumber: "+12345678",
          address: "123 Street",
          city: "Lagos",
          state: "Lagos",
          country: "Nigeria",
          deliveryMethod: "express", // +7500 fee
        },
      });

      // Verification calculations:
      // Product base: 50000.
      // Style modifier: 5000.
      // Fabric yards needed: 4.04 yards.
      // Units needed: Math.ceil(4.04 / 1.5) = 3 units.
      // Fabric modifier: 15000 * 3 = 45000.
      // Items subtotal: 50000 + 5000 + 45000 = 100000.
      // Delivery fee: 7500. Sum = 107500.
      // Discount = 107500 * 0.1 = 10750.
      // Expected grand total = 107500 - 10750 = 96750.
      expect(orderResult.order.totalAmount).toBe(96750);
      expect(orderResult.payment.amount).toBe(96750);
      
      const orderItem = (orderResult.order.items as any[])[0];
      expect(orderItem.fabricModifier).toBe(45000);
      expect(orderItem.fabricQty).toBe(3);
      expect(orderItem.fabricYards).toBe(4.04);
      expect(orderItem.yardsPerUnit).toBe(1.5);
    });
  });

  describe("Measurement Profiles", () => {
    it("should allow a user to save up to 2 profiles and fail on the 3rd, and allow updating existing profiles", async () => {
      const user = await prisma.user.create({
        data: {
          email: "test3@example.com",
          firstName: "Measure",
          lastName: "Tester",
          phone: "+1234567899",
          role: "CUSTOMER",
          password: "hashed_password",
        },
      });

      // 1. Create first profile
      const p1 = await createMeasurement(user.id, {
        profileName: "Profile 1",
        isDefault: true,
        chest: 90,
        waist: 75,
      });
      expect(p1.id).toBeDefined();
      expect(p1.profileName).toBe("Profile 1");

      // 2. Create second profile
      const p2 = await createMeasurement(user.id, {
        profileName: "Profile 2",
        isDefault: false,
        chest: 95,
        waist: 80,
      });
      expect(p2.id).toBeDefined();
      expect(p2.profileName).toBe("Profile 2");

      // 3. Create third profile - should throw AppError
      await expect(
        createMeasurement(user.id, {
          profileName: "Profile 3",
          isDefault: false,
          chest: 100,
        })
      ).rejects.toThrow("You cannot save more than 2 measurement profiles");

      // 4. Get measurements
      const list = await getUserMeasurements(user.id);
      expect(list).toHaveLength(2);

      // 5. Update first profile
      const updated = await updateMeasurement(user.id, p1.id, {
        profileName: "Profile 1 Updated",
        isDefault: true,
        chest: 92,
        waist: 77,
      });
      expect(updated.profileName).toBe("Profile 1 Updated");
      expect(updated.chest).toBe(92);
    });
  });
});
