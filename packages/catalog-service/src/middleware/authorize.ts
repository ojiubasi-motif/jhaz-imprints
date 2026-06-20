import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./authenticate";

/**
 * Middleware for role-based authorization.
 * Must be used AFTER the authenticate middleware.
 * 
 * @param allowedRoles List of roles allowed to access the route
 */
export const authorize = (...allowedRoles: Array<"CUSTOMER" | "ADMIN" | "TAILOR">) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      // SECURITY (OWASP — Logging & Monitoring CS):
      // Log authentication failure at the controller/middleware level.
      console.log(JSON.stringify({
        event: "authentication.failed",
        ip: req.ip,
        path: req.path,
        method: req.method,
        ts: new Date().toISOString(),
      }));

      return res.status(401).json({
        msg: "Unauthorized: Missing authentication credentials.",
        data: null,
        type: "AUTHENTICATION_FAILED",
        code: 602,
      });
    }

    if (!allowedRoles.includes(user.role)) {
      // SECURITY (OWASP — Logging & Monitoring CS):
      // Log authorization failure in a structured format for intrusion detection.
      console.log(JSON.stringify({
        event: "authorization.failed",
        userId: user.id,
        role: user.role,
        ip: req.ip,
        path: req.path,
        method: req.method,
        ts: new Date().toISOString(),
      }));

      return res.status(403).json({
        msg: "Forbidden: Insufficient permissions to access this resource.",
        data: null,
        type: "AUTHORIZATION_FAILED",
        code: 605,
      });
    }

    next();
  };
};
