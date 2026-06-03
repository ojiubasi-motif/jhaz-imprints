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

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "CUSTOMER" | "ADMIN" | "TAILOR";
  };
}

const INTERNAL_SECRET = process.env.INTERNAL_GATEWAY_SECRET;

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // ── Step 1: Verify request came from the gateway ──────────────────────────
  // Reject any request that does not carry the correct internal secret.
  // This prevents clients from bypassing the gateway and hitting this service directly.
  const incomingSecret = req.headers["x-internal-secret"];

  if (!INTERNAL_SECRET || incomingSecret !== INTERNAL_SECRET) {
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

/**
 * Verify request originated from the gateway (checks x-internal-secret only).
 */
export function verifyGatewayOrigin(req: Request, res: Response, next: NextFunction) {
  // Bypass check for health check endpoints (used by docker internally)
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  const incomingSecret = req.headers["x-internal-secret"];

  if (!INTERNAL_SECRET || incomingSecret !== INTERNAL_SECRET) {
    return res.status(403).json({
      msg: "Forbidden: Direct access to internal service is not permitted.",
      data: null,
      type: "GATEWAY_BYPASS_DETECTED",
      code: 403,
    });
  }

  next();
}