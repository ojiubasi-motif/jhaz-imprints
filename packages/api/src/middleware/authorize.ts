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
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }

    next();
  };
};
