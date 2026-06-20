/**
 * Gateway-Centric Authentication Middleware (catalog-service)
 *
 * In the gateway-centric architecture, the API Gateway is the ONLY component
 * that validates JWTs. Once validated, the gateway:
 *   1. Strips the Authorization header (JWT never reaches microservices).
 *   2. Injects trusted x-user-* headers (id, role, email).
 *   3. Injects x-internal-secret so microservices can verify the request origin.
 *
 * This middleware:
 *   - Verifies x-internal-secret matches INTERNAL_GATEWAY_SECRET.
 *   - Reads forwarded x-user-* headers and attaches them to req.user.
 *   - Rejects requests that did NOT come through the gateway (missing secret).
 *
 * No JWT validation occurs here — that is the gateway's sole responsibility.
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "CUSTOMER" | "ADMIN" | "TAILOR";
  };
}

const INTERNAL_SECRET = process.env.INTERNAL_GATEWAY_SECRET;

/**
 * Constant-time secret comparison to prevent timing-oracle attacks.
 * SECURITY (OWASP — CWE-208): Standard string === is not constant-time;
 * a precise timing side-channel can reveal the secret length or prefix.
 * crypto.timingSafeEqual() always runs in O(n) regardless of where strings diverge.
 */
function verifySecret(incoming: string | string[] | undefined): boolean {
  if (!INTERNAL_SECRET || !incoming || Array.isArray(incoming)) return false;
  try {
    const a = Buffer.from(incoming);
    const b = Buffer.from(INTERNAL_SECRET);
    // Buffers must be same length for timingSafeEqual; length inequality is itself a fail.
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // ── Step 1: Verify request came from the gateway ──────────────────────────
  // Reject any request that does not carry the correct internal secret.
  // SECURITY: Uses constant-time comparison (crypto.timingSafeEqual) to
  // prevent timing side-channel attacks on the shared secret.
  if (!verifySecret(req.headers["x-internal-secret"])) {
    return res.status(403).json({
      msg: "Forbidden: Direct access to internal service is not permitted.",
      data: null,
      type: "GATEWAY_BYPASS_DETECTED",
      code: 403,
    });
  }

  // ── Step 2: Read pre-validated identity headers from the gateway ──────────
  const userId    = req.headers["x-user-id"]    as string | undefined;
  const userRole  = req.headers["x-user-role"]  as string | undefined;
  const userEmail = req.headers["x-user-email"] as string | undefined;

  if (!userId || !userRole) {
    return res.status(401).json({
      msg: "Unauthorized: Missing identity headers. Ensure the gateway is performing authentication.",
      data: null,
      type: "AUTHENTICATION_FAILED",
      code: 401,
    });
  }

  req.user = {
    id:    userId,
    email: userEmail ?? "",
    role:  userRole as "CUSTOMER" | "ADMIN" | "TAILOR",
  };

  next();
}

export function verifyGatewayOrigin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Bypass check for health check endpoints (used by docker internally)
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  // SECURITY: constant-time comparison (see verifySecret above)
  if (!verifySecret(req.headers["x-internal-secret"])) {
    return res.status(403).json({
      msg: "Forbidden: Direct access to internal service is not permitted.",
      data: null,
      type: "GATEWAY_BYPASS_DETECTED",
      code: 403,
    });
  }

  // Populate req.user context if pre-validated headers are present from gateway
  const userId    = req.headers["x-user-id"]    as string | undefined;
  const userRole  = req.headers["x-user-role"]  as string | undefined;
  const userEmail = req.headers["x-user-email"] as string | undefined;

  if (userId && userRole) {
    req.user = {
      id:    userId,
      email: userEmail ?? "",
      role:  userRole as "CUSTOMER" | "ADMIN" | "TAILOR",
    };
  }

  next();
}