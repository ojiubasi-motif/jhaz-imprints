/**
 * Extend Express Request type with authenticated user info.
 */

import type { User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: "CUSTOMER" | "ADMIN" | "TAILOR";
      };
    }
  }
}
