/**
 * JWT authentication middleware.
 * Verifies Bearer token from Authorization header and attaches user info to req.user.
 */

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: "CUSTOMER" | "ADMIN" | "TAILOR";
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    const decoded = jwt.verify(token, secret) as {
      id: string;
      email: string;
      role: string;
    };

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role as "CUSTOMER" | "ADMIN" | "TAILOR",
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}