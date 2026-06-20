import type { Request, Response } from "express";
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from "@jhaz-imprints/shared";
import { AuthService } from "../services/authService";
import type { AuthenticatedRequest } from "../middleware/authenticate";
import { generateCsrfToken } from "../utils/csrfToken";

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Secure-sid" : "sid";

/**
 * Cookie configuration helper.
 * SECURITY (OWASP Session Management CS):
 *   - httpOnly: prevents JavaScript access (XSS mitigation).
 *   - secure: HTTPS-only in production.
 *   - sameSite: "none" for cross-origin in prod; false in dev (HTTP).
 *   - path: scoped to /api/auth/refresh ONLY — not "/" — so the refresh token
 *     cookie is not sent on every API request, minimising exposure surface.
 *     (OWASP: Set cookie scope to the minimum necessary path.)
 */
function refreshCookieOptions() {
  return {
    path: "/api/auth/refresh",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: (process.env.NODE_ENV === "production" ? "none" : false) as "none" | false,
    maxAge: 30 * 60 * 1000, // 30m — matches refresh_token JWT expiry
  };
}

/**
 * Handles user registration.
 */
export const registerHandler = async (req: Request, res: Response) => {
  try {
    const validatedData = RegisterSchema.parse(req.body);
    const { user, access_token, refresh_token } = await AuthService.register(validatedData);

    res.cookie(COOKIE_NAME, refresh_token, refreshCookieOptions());

    const full_name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const { password: _, refreshToken: __, createdAt: ___, updatedAt: ____, ...sanitizedUser } = user;

    res.status(201).json({
      msg: "registration success",
      data: {
        user: { ...sanitizedUser, full_name },
        access_token
      },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    // SECURITY: Never expose the raw error.message — it may reveal whether the
    // email already exists (user enumeration). Return a generic message always.
    // OWASP Authentication CS — Authentication Responses / Account creation.
    res.status(400).json({
      msg: "Registration could not be completed. Please check your details and try again.",
      type: "FAILED",
      code: 602
    });
  }
};

/**
 * Handles user login.
 */
export const loginHandler = async (req: Request, res: Response) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    const response = await AuthService.login(validatedData, req.ip);

    if ("requiresOtp" in response && response.requiresOtp) {
      return res.status(200).json({
        msg: "MFA OTP required",
        data: {
          requiresOtp: true,
          tempToken: response.tempToken
        },
        type: "SUCCESS",
        code: 600
      });
    }

    const { user, access_token, refresh_token } = response as { user: any; access_token: string; refresh_token: string };

    res.cookie(COOKIE_NAME, refresh_token, refreshCookieOptions());

    const full_name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const { password: _, refreshToken: __, createdAt: ___, updatedAt: ____, ...sanitizedUser } = user;

    res.status(200).json({
      msg: "login success",
      data: {
        user: { ...sanitizedUser, full_name },
        access_token
      },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(401).json({
      msg: error.message || "wrong login credentials",
      type: "WRONG_OR_MISSING_PAYLOAD",
      code: 605
    });
  }
};

/**
 * Handles verification of admin OTP MFA.
 */
export const verifyAdminOtpHandler = async (req: Request, res: Response) => {
  try {
    const { tempToken, otp } = req.body;
    if (!tempToken || !otp) {
      return res.status(400).json({
        msg: "tempToken and otp are required",
        type: "WRONG_OR_MISSING_PAYLOAD",
        code: 605
      });
    }

    const { user, access_token, refresh_token } = await AuthService.verifyAdminOtp(tempToken, otp, req.ip || "");

    res.cookie(COOKIE_NAME, refresh_token, refreshCookieOptions());

    const full_name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const { password: _, refreshToken: __, createdAt: ___, updatedAt: ____, ...sanitizedUser } = user;

    res.status(200).json({
      msg: "MFA verification success",
      data: {
        user: { ...sanitizedUser, full_name },
        access_token
      },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(401).json({
      msg: error.message || "MFA verification failed",
      type: "FAILED",
      code: 602
    });
  }
};

/**
 * Handles token refresh.
 */
export const refreshHandler = async (req: Request, res: Response) => {
  try {
    const cookies = req.cookies;
    const token = cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ msg: "No refresh token", type: "FAILED", code: 602 });
    }

    const { user, access_token, refresh_token: new_refresh_token } = await AuthService.refresh(token);

    // Rotate the refresh token cookie (scoped path, httpOnly)
    res.cookie(COOKIE_NAME, new_refresh_token, refreshCookieOptions());

    const full_name = `${user.firstName || ""} ${user.lastName || ""}`.trim();
    const { password: _, refreshToken: __, createdAt: ___, updatedAt: ____, ...sanitizedUser } = user;

    res.status(200).json({
      msg: "token refreshed",
      data: {
        user: { ...sanitizedUser, full_name },
        access_token
      },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(401).json({ msg: error.message, type: "FAILED", code: 602 });
  }
};

/**
 * Handles user logout by clearing the cookie.
 */
export const logoutHandler = async (req: Request, res: Response) => {
  const token = req.cookies[COOKIE_NAME];
  if (token) {
    await AuthService.logout(token);
  }

  // SECURITY: Clear cookie with same options it was set with (path must match).
  res.clearCookie(COOKIE_NAME, {
    path: "/api/auth/refresh",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : false,
  });
  res.status(200).json({ msg: "signout success", type: "SUCCESS", code: 600 });
};

/**
 * Returns current authenticated user details.
 */
export const meHandler = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ msg: "Unauthorized", type: "FAILED", code: 602 });
    }

    res.status(200).json({
      msg: "user profile",
      data: { user },
      type: "SUCCESS",
      code: 600
    });
  } catch (error) {
    res.status(500).json({ msg: "Internal server error", type: "FAILED", code: 602 });
  }
};

/**
 * Handles forgot-password requests.
 *
 * SECURITY (OWASP Forgot Password CS — Forgot Password Request):
 *  - Always returns HTTP 200 with a GENERIC message regardless of whether the
 *    email exists in the database. This prevents user enumeration.
 *  - The actual email sending (or no-op) is handled inside the service.
 *  - Zod validation runs first so we don't hit the DB with malformed input.
 */
export const forgotPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);

    // Fire-and-forget: the service normalises timing internally.
    // We intentionally do NOT await success/failure branching here — the
    // response is always the same to prevent timing-based enumeration.
    AuthService.requestPasswordReset(email).catch((err) => {
      // Log internally but never expose to the client.
      console.error(JSON.stringify({ event: "password_reset.error", error: err?.message, ts: new Date().toISOString() }));
    });

    // SECURITY: Return IDENTICAL response for both known and unknown emails.
    res.status(200).json({
      msg: "If that email address is registered, you will receive a password reset link shortly.",
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    // Zod validation error — tell user the email is invalid, nothing else.
    res.status(400).json({
      msg: error.errors?.[0]?.message || "Please enter a valid email address.",
      type: "WRONG_OR_MISSING_PAYLOAD",
      code: 605
    });
  }
};

/**
 * Handles password reset with a URL token.
 *
 * SECURITY (OWASP Forgot Password CS — User Resets Password):
 *  - Token is validated (hashed lookup + TTL check) inside the service.
 *  - Password confirmed by schema (password === confirmPassword).
 *  - On success, all sessions are invalidated (refreshToken cleared).
 *  - No auto-login is performed — user must re-authenticate.
 *  - Generic error messages for invalid/expired tokens.
 */
export const resetPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { token, password } = ResetPasswordSchema.parse(req.body);
    await AuthService.resetPassword(token, password);

    res.status(200).json({
      msg: "Your password has been reset successfully. Please sign in with your new password.",
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    // Surface specific OWASP-safe messages for expired/invalid tokens;
    // fall back to generic for unexpected errors.
    const safeMessages = [
      "This password reset link is invalid. Please request a new one.",
      "This password reset link has expired. Please request a new one.",
    ];
    const isSafeMessage = safeMessages.includes(error?.message);

    res.status(400).json({
      msg: isSafeMessage ? error.message : (error.errors?.[0]?.message || "Password reset failed. Please try again."),
      type: "FAILED",
      code: 602
    });
  }
};

/**
 * Generates a CSRF token for auth actions.
 */
export const csrfTokenHandler = async (req: Request, res: Response) => {
  try {
    const token = generateCsrfToken();
    res.status(200).json({
      msg: "CSRF token generated successfully",
      data: { csrfToken: token },
      type: "SUCCESS",
      code: 600
    });
  } catch (error: any) {
    res.status(500).json({
      msg: "Failed to generate CSRF token",
      type: "FAILED",
      code: 602
    });
  }
};
