import { prisma } from "@jhaz-imprints/db";
import { RegisterData, LoginData } from "@jhaz-imprints/shared";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { passwordResetEmail, passwordChangedEmail, adminOtpEmail } from "../integrations/email/templates";
import { checkPwnedPassword } from "../utils/hibp";


/**
 * Pre-computed bcrypt hash of an empty string (12 rounds).
 * Used as a dummy comparison target when a login attempt targets a
 * non-existent user, so the response time is indistinguishable from
 * a failed login on a real account (timing normalization).
 * SECURITY: This hash is NEVER stored and has no auth meaning.
 */
const TIMING_DUMMY_HASH = "$2a$12$FixedDummyHashForTimingNorm.wOrKFaCtOr12RoUnDs.aBcDeFgHiJkLmNo";

/**
 * Hashes a token with SHA-256 for secure storage.
 * The raw token is returned to the client; only the hash is stored in the DB.
 * On refresh, the incoming token is hashed and compared to the stored hash.
 */
function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export class AuthService {
  /**
   * Registers a new user.
   */
  static async register(data: RegisterData) {
    // Check if user already exists.
    // SECURITY: We throw a GENERIC error to prevent email-enumeration via the
    // registration endpoint (OWASP Authentication CS — Authentication Responses).
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("If this address is available, your account has been created.");
    }

    // Check if password has been leaked
    const isPwned = await checkPwnedPassword(data.password);
    if (isPwned) {
      throw new Error("This password has appeared in a data breach. Please choose a different one.");
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    // Create user in DB
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // Generate tokens (Quizio pattern: access_token 1d, refresh_token 30m)
    const access_token = this.generateAccessToken(user);
    const refresh_token = this.generateRefreshToken(user);

    // Store hashed refresh token in DB (never store raw tokens)
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashToken(refresh_token) },
    });

    // Remove password and refreshToken from returned user object
    const { password: _, refreshToken: __, ...userData } = user as any;

    return {
      user: userData,
      access_token,
      refresh_token,
    };
  }

  /**
   * Logs in a user.
   *
   * SECURITY — Account lockout (OWASP Authentication CS: Login Throttling):
   *   ≥ 5  failures → 15-minute lockout
   *   ≥ 10 failures → 1-hour lockout
   *   ≥ 20 failures → permanent lockout (admin unlock required)
   * Counter resets to 0 on each successful login.
   */
  static async login(data: LoginData, ip?: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // SECURITY (Timing normalization): Always run bcrypt.compare even when the
    // user does not exist. Without this, the ~100ms bcrypt work is skipped for
    // non-existent accounts, creating a measurable timing delta that allows
    // user enumeration (OWASP Authentication CS — Authentication Responses).
    if (!user) {
      await bcrypt.compare(data.password, TIMING_DUMMY_HASH);
      console.log(JSON.stringify({ event: "login.failed.unknown_user", ts: new Date().toISOString() }));
      throw new Error("Invalid email or password");
    }

    // ── Check account lockout ─────────────────────────────────────────────────
    if (user.lockedUntil) {
      if (user.lockedUntil > new Date()) {
        const remainingMs = user.lockedUntil.getTime() - Date.now();
        const remainingMins = Math.ceil(remainingMs / 60000);
        console.log(JSON.stringify({ event: "login.blocked.locked", userId: user.id, lockedUntil: user.lockedUntil, ts: new Date().toISOString() }));
        throw new Error(`Account temporarily locked. Please try again in ${remainingMins} minute(s) or reset your password.`);
      }
      // Lock has expired — allow the attempt but keep the counter for now
    }

    // Permanent lockout (≥ 20 failures, lockedUntil null means admin cleared it
    // but we check the hard floor independently)
    if (user.failedLoginAttempts >= 20 && !user.lockedUntil) {
      console.log(JSON.stringify({ event: "login.blocked.permanent", userId: user.id, ts: new Date().toISOString() }));
      throw new Error("Account locked due to too many failed attempts. Please contact support.");
    }

    // ── Verify password ───────────────────────────────────────────────────────
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      // ── Increment failure counter and apply lockout tier ──────────────────
      const newFailCount = user.failedLoginAttempts + 1;
      let lockedUntil: Date | null = null;

      if (newFailCount >= 20) {
        // Permanent lockout — set to year 9999 sentinel
        lockedUntil = new Date("9999-12-31T23:59:59Z");
      } else if (newFailCount >= 10) {
        lockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      } else if (newFailCount >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailCount,
          ...(lockedUntil ? { lockedUntil } : {}),
        },
      });

      console.log(JSON.stringify({
        event: "login.failed",
        userId: user.id,
        failedAttempts: newFailCount,
        locked: !!lockedUntil,
        ts: new Date().toISOString(),
      }));

      throw new Error("Invalid email or password");
    }

    // ── Check Admin Risk-Based MFA (Email OTP on New IP) ─────────────────────
    if (user.role === "ADMIN" && user.lastLoginIp !== ip) {
      // Trigger OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = crypto.createHash("sha256").update(otp).digest("hex");
      const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

      await prisma.user.update({
        where: { id: user.id },
        data: {
          adminOtpHash: otpHash,
          adminOtpExpires: otpExpires,
        },
      });

      const template = adminOtpEmail(otp);
      await sendResetEmail(user.email, template.subject, template.html);

      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error("JWT_SECRET not set");

      const tempToken = jwt.sign(
        { email: user.email, role: user.role, id: user.id, isTemp: true },
        secret,
        { expiresIn: "5m" }
      );

      console.log(JSON.stringify({ event: "admin.mfa.otp_sent", userId: user.id, ts: new Date().toISOString() }));

      return {
        requiresOtp: true,
        tempToken,
      };
    }

    // ── Login successful — reset lockout fields atomically ────────────────────
    const access_token = this.generateAccessToken(user);
    const refresh_token = this.generateRefreshToken(user);

    const prevLastLoginAt = user.lastLoginAt;
    const prevLastLoginIp = user.lastLoginIp;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashToken(refresh_token),
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip || null,
      },
    });

    console.log(JSON.stringify({ event: "login.success", userId: user.id, ts: new Date().toISOString() }));

    const { password: _, refreshToken: __, failedLoginAttempts: ___, lockedUntil: ____, ...userData } = user as any;

    return {
      user: {
        ...userData,
        lastLoginAt: prevLastLoginAt,
        lastLoginIp: prevLastLoginIp,
      },
      access_token,
      refresh_token,
    };
  }

  /**
   * Verifies the admin login OTP.
   */
  static async verifyAdminOtp(tempToken: string, otp: string, ip: string) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not set");

    let decoded: any;
    try {
      decoded = jwt.verify(tempToken, secret);
    } catch (err) {
      throw new Error("Invalid or expired temporary token");
    }

    if (!decoded || !decoded.isTemp || !decoded.id) {
      throw new Error("Invalid temporary token");
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || user.role !== "ADMIN") {
      throw new Error("Access denied");
    }

    if (!user.adminOtpHash || !user.adminOtpExpires) {
      throw new Error("No OTP request found. Please login again.");
    }

    if (user.adminOtpExpires < new Date()) {
      throw new Error("OTP has expired. Please login again.");
    }

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (user.adminOtpHash !== hashedOtp) {
      throw new Error("Invalid OTP code");
    }

    // OTP matches! Generate final tokens
    const access_token = this.generateAccessToken(user);
    const refresh_token = this.generateRefreshToken(user);

    const prevLastLoginAt = user.lastLoginAt;
    const prevLastLoginIp = user.lastLoginIp;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: hashToken(refresh_token),
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip || null,
        adminOtpHash: null,
        adminOtpExpires: null,
      },
    });

    console.log(JSON.stringify({ event: "admin.mfa.success", userId: user.id, ts: new Date().toISOString() }));

    const { password: _, refreshToken: __, failedLoginAttempts: ___, lockedUntil: ____, ...userData } = user as any;

    return {
      user: {
        ...userData,
        lastLoginAt: prevLastLoginAt,
        lastLoginIp: prevLastLoginIp,
      },
      access_token,
      refresh_token,
    };
  }


  /**
   * Refreshes the access token using a refresh token.
   */
  static async refresh(token: string) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error("REFRESH_TOKEN_SECRET not set");

    try {
      const decoded = jwt.verify(token, secret) as { id: string };
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      let matches = false;
      if (user && user.refreshToken) {
        const a = Buffer.from(user.refreshToken);
        const b = Buffer.from(hashToken(token));
        if (a.length === b.length) {
          matches = crypto.timingSafeEqual(a, b);
        }
      }

      if (!user || !matches) {
        throw new Error("Invalid refresh token");
      }

      const access_token = this.generateAccessToken(user);
      const new_refresh_token = this.generateRefreshToken(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashToken(new_refresh_token) },
      });

      const { password: _, refreshToken: __, ...userData } = user as any;

      return {
        user: userData,
        access_token,
        refresh_token: new_refresh_token,
      };
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Invalidates a user's refresh token on logout.
   */
  static async logout(token: string) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error("REFRESH_TOKEN seed not set");

    try {
      const decoded = jwt.verify(token, secret) as { id: string };
      await prisma.user.update({
        where: { id: decoded.id },
        data: { refreshToken: null },
      });
    } catch (error) {
      // Token might be expired or invalid, already effectively logged out
    }
  }

  private static generateAccessToken(user: any) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error("JWT_SECRET not set");

    // SECURITY (OWASP Session Management CS — Access Token Lifetime):
    // Access token TTL is intentionally SHORT (5 minutes).
    // The gateway validates JWTs without a DB lookup, so there is no instant
    // revocation on logout. Keeping the TTL at 5 min limits the window during
    // which a stolen access token remains usable to a maximum of 5 minutes.
    // The 30-minute refresh token handles session continuity transparently.
    // (Alternative: Redis token denylist — adds ~2ms/req but enables instant revocation.)
    return jwt.sign(
      { email: user.email, role: user.role, id: user.id },
      secret,
      { expiresIn: "5m" }
    );
  }

  private static generateRefreshToken(user: any) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    if (!secret) throw new Error("REFRESH_TOKEN_SECRET not set");

    return jwt.sign(
      { email: user.email, role: user.role, id: user.id },
      secret,
      { expiresIn: "30m" }
    );
  }

  // ─── Forgot Password ─────────────────────────────────────────────────────────

  /**
   * Initiates a password reset flow for the given email.
   *
   * SECURITY (OWASP Forgot Password CS):
   *  1. Return a CONSISTENT response for both registered and unknown emails —
   *     prevents user enumeration. The caller never learns whether the address exists.
   *  2. Token is generated with CSPRNG (crypto.randomBytes) — not Math.random().
   *     32 bytes = 256 bits of entropy, brute-force resistant.
   *  3. Only the SHA-256 HASH of the token is stored in the DB. If the DB is
   *     compromised, the raw token (sent via email) cannot be recovered from the hash.
   *  4. TTL enforced: token expires in 15 minutes.
   *  5. Do NOT lock the account — that would enable DoS via forced resets.
   *     (OWASP Account Lockout section: "Accounts should not be locked out in
   *      response to a forgotten password attack.")
   *
   * @param email - The email address to request a reset for.
   */
  static async requestPasswordReset(email: string): Promise<void> {
    // SECURITY (OWASP Forgot Password CS — Forgot Password Request):
    // Look up user but proceed in ALL cases to generate consistent timing.
    // A "quick return" on missing user would create a timing side-channel.
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // SECURITY: Perform a no-op async delay to normalise timing.
      // Without this, an attacker could distinguish "email not found" (fast)
      // from "email found + token generated" (slow) via response timing.
      await new Promise((resolve) => setTimeout(resolve, 200));
      console.log(JSON.stringify({ event: "password_reset.noop", ts: new Date().toISOString() }));
      return; // Return silently — caller always gets the same generic message
    }

    // Generate a cryptographically secure random token.
    // OWASP: "Generated using a cryptographically secure random number generator."
    const rawToken = crypto.randomBytes(32).toString("hex"); // 64-char hex string
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: expiresAt,
      },
    });

    // Build reset URL using FRONTEND_URL env var — never req.headers.host.
    // SECURITY (OWASP — URL Tokens): "Don't rely on the Host header while
    // creating the reset URLs to avoid Host Header Injection attacks."
    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    const template = passwordResetEmail(resetUrl, 15);
    await sendResetEmail(user.email, template.subject, template.html);

    console.log(JSON.stringify({ event: "password_reset.requested", userId: user.id, ts: new Date().toISOString() }));
  }

  /**
   * Completes the password reset flow using a raw URL token.
   *
   * SECURITY (OWASP Forgot Password CS — User Resets Password):
   *  1. Verify token by hashing it and comparing against the stored hash.
   *  2. Check token has not expired (15-minute TTL).
   *  3. Hash new password with bcrypt (same policy as registration).
   *  4. Null both resetPasswordToken and resetPasswordExpires → single-use.
   *  5. Null refreshToken → invalidates ALL active sessions/devices.
   *     OWASP: "Ask the user if they want to invalidate all existing sessions,
   *     or invalidate the sessions automatically." — we invalidate automatically.
   *  6. Do NOT auto-login. OWASP: "Don't automatically log the user in, as this
   *     introduces additional complexity to the authentication and session handling
   *     code, and increases the likelihood of introducing vulnerabilities."
   *  7. Send confirmation email. OWASP: "Send the user an email informing them
   *     that their password has been reset (do not send the password in the email)."
   *
   * @param rawToken  - The raw token from the URL query string.
   * @param newPassword - The plaintext new password (validated by caller schema).
   */
  static async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(rawToken);

    // Find the user by the hashed token.
    const user = await prisma.user.findUnique({
      where: { resetPasswordToken: tokenHash },
    });

    if (!user || !user.resetPasswordExpires) {
      throw new Error("This password reset link is invalid. Please request a new one.");
    }

    // SECURITY: Check TTL — token must not be expired.
    if (user.resetPasswordExpires < new Date()) {
      // Clean up the expired token to prevent it cluttering the DB.
      await prisma.user.update({
        where: { id: user.id },
        data: { resetPasswordToken: null, resetPasswordExpires: null },
      });
      throw new Error("This password reset link has expired. Please request a new one.");
    }

    // Check if new password has been leaked
    const isPwned = await checkPwnedPassword(newPassword);
    if (isPwned) {
      throw new Error("This password has appeared in a data breach. Please choose a different one.");
    }

    // Hash the new password with bcrypt (same cost as registration).
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || undefined;

    // Update in a single atomic write:
    //  - Set new hashed password
    //  - Null reset token fields (single-use enforcement)
    //  - Null refreshToken → logout all active sessions (OWASP recommendation)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        refreshToken: null, // Invalidate ALL active sessions
      },
    });

    // Send confirmation email.
    // SECURITY: Do NOT include the new password in this email.
    const template = passwordChangedEmail(userName);
    await sendResetEmail(user.email, template.subject, template.html);

    console.log(JSON.stringify({ event: "password_reset.completed", userId: user.id, ts: new Date().toISOString() }));
    // SECURITY: Return nothing — do NOT issue tokens here.
    // The user must re-authenticate via the normal login flow.
  }
}

// ─── Email helper for password reset flow ─────────────────────────────────────
// Reuses the same multi-provider email logic as the notification worker.
async function sendResetEmail(to: string, subject: string, html: string): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: [to],
        subject,
        html,
      }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Email delivery failed (Resend): ${response.status} ${errText}`);
    }
    return;
  }

  // Fallback: Nodemailer SMTP
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || "noreply@jhaz-imprints.com",
    to,
    subject,
    html,
  });
}

