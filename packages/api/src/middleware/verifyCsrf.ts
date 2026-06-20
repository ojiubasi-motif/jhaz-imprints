import { Request, Response, NextFunction } from "express";
import { verifyCsrfToken } from "../utils/csrfToken";

/**
 * Middleware to verify the stateless CSRF token.
 * Looks in 'x-csrf-token' header or in the request body.
 */
export function verifyCsrf(req: Request, res: Response, next: NextFunction) {
  // Safe methods do not require CSRF checks
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  const token = req.headers["x-csrf-token"] || req.body?.csrfToken || req.body?._csrf;

  if (!token || typeof token !== "string") {
    return res.status(403).json({
      error: "MISSING_CSRF_TOKEN",
      message: "CSRF token is required for this request.",
    });
  }

  const isValid = verifyCsrfToken(token);
  if (!isValid) {
    return res.status(403).json({
      error: "INVALID_CSRF_TOKEN",
      message: "CSRF token is invalid or expired.",
    });
  }

  next();
}
