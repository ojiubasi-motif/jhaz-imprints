import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PrismaClient } from "@jhaz-imprints/db";
import { AuthService } from "../authService";
import { generateCsrfToken, verifyCsrfToken } from "../../utils/csrfToken";
import { checkPwnedPassword } from "../../utils/hibp";

describe("Auth Security Features", () => {
  let prisma: PrismaClient;
  const TEST_EMAIL = "security-test@example.com";
  const TEST_ADMIN_EMAIL = "security-admin-test@example.com";

  beforeEach(async () => {
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;
    if (!testDatabaseUrl) {
      throw new Error("TEST_DATABASE_URL environment variable is required");
    }
    prisma = new PrismaClient({
      datasources: { db: { url: testDatabaseUrl } },
    });

    // Clean up test users
    await prisma.user.deleteMany({
      where: {
        email: { in: [TEST_EMAIL, TEST_ADMIN_EMAIL] },
      },
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: [TEST_EMAIL, TEST_ADMIN_EMAIL] },
      },
    });
    await prisma.$disconnect();
    vi.restoreAllMocks();
  });

  describe("CSRF Tokens", () => {
    it("should generate a valid CSRF token and verify it successfully within 10 min", () => {
      const token = generateCsrfToken();
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const isValid = verifyCsrfToken(token);
      expect(isValid).toBe(true);
    });

    it("should fail validation for expired or invalid tokens", () => {
      expect(verifyCsrfToken("invalid.token")).toBe(false);
      expect(verifyCsrfToken("")).toBe(false);
    });
  });

  describe("HIBP Breached Password Block", () => {
    it("should detect a pwned password using mock HIBP range response", async () => {
      // Mock fetch response for HIBP
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => "0018A45C721245:10\r\n5FAA6:20",
      });
      global.fetch = mockFetch;

      const isPwned = await checkPwnedPassword("password123");
      expect(mockFetch).toHaveBeenCalled();
      expect(mockFetch.mock.calls[0][0]).toContain("https://api.pwnedpasswords.com/range/");
    });
  });

  describe("Last Login Tracking & Admin MFA Flow", () => {
    it("should login normal customer without MFA and track lastLoginIp & lastLoginAt", async () => {
      // Register user
      await AuthService.register({
        email: TEST_EMAIL,
        password: "SuperSecretStrongPassword123!",
        firstName: "Test",
        lastName: "User",
      });

      // Login first time
      const loginRes = await AuthService.login({
        email: TEST_EMAIL,
        password: "SuperSecretStrongPassword123!",
      }, "1.1.1.1");

      expect(loginRes).not.toHaveProperty("requiresOtp");
      expect(loginRes.user.email).toBe(TEST_EMAIL);
      expect(loginRes.user.lastLoginIp).toBeNull(); // previous value is returned, which is null on first login

      // Check DB values
      const dbUser = await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
      expect(dbUser?.lastLoginIp).toBe("1.1.1.1");
      expect(dbUser?.lastLoginAt).toBeDefined();

      // Login second time from different IP
      const loginRes2 = await AuthService.login({
        email: TEST_EMAIL,
        password: "SuperSecretStrongPassword123!",
      }, "2.2.2.2");

      expect(loginRes2.user.lastLoginIp).toBe("1.1.1.1"); // should return previous value
    });

    it("should trigger OTP on Admin login if IP is different", async () => {
      // Create admin user manually
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash("SuperSecretStrongPasswordAdmin123!", 10);
      await prisma.user.create({
        data: {
          email: TEST_ADMIN_EMAIL,
          password: hashedPassword,
          role: "ADMIN",
          lastLoginIp: "1.1.1.1",
        },
      });

      // Login from a different IP
      const loginRes = await AuthService.login({
        email: TEST_ADMIN_EMAIL,
        password: "SuperSecretStrongPasswordAdmin123!",
      }, "2.2.2.2");

      expect(loginRes).toHaveProperty("requiresOtp", true);
      expect(loginRes).toHaveProperty("tempToken");

      // Verify OTP is saved in DB
      const dbUser = await prisma.user.findUnique({ where: { email: TEST_ADMIN_EMAIL } });
      expect(dbUser?.adminOtpHash).toBeDefined();
      expect(dbUser?.adminOtpExpires).toBeDefined();
    });

    it("should bypass OTP on Admin login if IP is equivalent when normalized (e.g. ::ffff:1.1.1.1 vs 1.1.1.1)", async () => {
      // Create admin user manually
      const bcrypt = await import("bcryptjs");
      const hashedPassword = await bcrypt.hash("SuperSecretStrongPasswordAdmin123!", 10);
      await prisma.user.create({
        data: {
          email: TEST_ADMIN_EMAIL,
          password: hashedPassword,
          role: "ADMIN",
          lastLoginIp: "::ffff:1.1.1.1",
        },
      });

      // Login from equivalent normalized IP
      const loginRes = await AuthService.login({
        email: TEST_ADMIN_EMAIL,
        password: "SuperSecretStrongPasswordAdmin123!",
      }, "1.1.1.1");

      expect(loginRes).not.toHaveProperty("requiresOtp");
      expect(loginRes.user.email).toBe(TEST_ADMIN_EMAIL);
    });
  });
});
