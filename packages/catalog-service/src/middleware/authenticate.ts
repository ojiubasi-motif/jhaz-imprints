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
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    if (!token) {
      return res.status(401).json({
        msg: "Unauthorized: No token provided",
        data: null,
        type: "AUTHENTICATION_FAILED",
        code: 602
      });
    }
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
    return res.status(401).json({
      msg: "Unauthorized: Invalid or expired token",
      data: null,
      type: "AUTHENTICATION_FAILED",
      code: 602
    });
  }
}