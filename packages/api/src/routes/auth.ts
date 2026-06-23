import { Router } from "express";
import rateLimit from "express-rate-limit";
import { registerHandler, loginHandler, meHandler, logoutHandler, refreshHandler, forgotPasswordHandler, resetPasswordHandler, verifyAdminOtpHandler, csrfTokenHandler, updateProfileHandler, getTailorsHandler } from "../handlers/auth";
import { authenticate } from "../middleware/authenticate";
import { verifyCsrf } from "../middleware/verifyCsrf";
import { authorize } from "../middleware/authorize";

const router = Router();

// Rate limiter for auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 requests per windowMs (prevents self-lockout while keeping brute-force window tight)
  message: { error: "Too many requests from this IP, please try again after 15 minutes" },
});

// Rate limiter specifically for CSRF token fetches
const csrfLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs to allow repeated forms access without heavy CPU exhaustion risk
  message: { error: "Too many requests. Please try again after 15 minutes" },
  standardHeaders: true,
  legacyHeaders: false,
});

// SECURITY (OWASP Forgot Password CS — Forgot Password Request):
// Stricter rate limit on forgot-password to prevent email-flooding attacks.
// An attacker could hammer this endpoint to flood a victim's inbox with reset emails.
// 5 requests / 60 minutes per IP is generous for legitimate use but blocks abuse.
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: "Too many password reset requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slightly looser limit for the reset-password step (token entry form).
const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { error: "Too many requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF Token fetch route (public, rate-limited)
router.get("/csrf-token", csrfLimiter, csrfTokenHandler);

// Apply rate limiter and CSRF protection to register and login
router.post("/register", authLimiter, verifyCsrf, registerHandler);
router.post("/login", authLimiter, verifyCsrf, loginHandler);
router.post("/logout", logoutHandler);
router.get("/refresh", refreshHandler);
router.post("/admin/verify-otp", authLimiter, verifyCsrf, verifyAdminOtpHandler);

// ── Forgot / Reset Password ───────────────────────────────────────────────────
// SECURITY: Both endpoints are PUBLIC (no JWT required).
// They must also be added to PUBLIC_ROUTES in packages/gateway/middleware/auth.js.
router.post("/forgot-password", forgotPasswordLimiter, verifyCsrf, forgotPasswordHandler);
router.post("/reset-password", resetPasswordLimiter, resetPasswordHandler);

// Protected route to get current user details
router.get("/me", authenticate, meHandler);
router.put("/profile", authenticate, verifyCsrf, updateProfileHandler);

// Admin-only route to list tailors
router.get("/tailors", authenticate, authorize("ADMIN"), getTailorsHandler);

export default router;

