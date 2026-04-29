/**
 * Body validation middleware using Zod schemas.
 */

import { Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import type { AuthenticatedRequest } from "./authenticate";
import { AppError } from "../errors/AppError";

export function validateBody(schema: ZodSchema) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);

    if (!validation.success) {
      const errors = validation.error.flatten();
      throw new AppError(
        `Validation failed: ${JSON.stringify(errors)}`,
        400,
        "VALIDATION_ERROR"
      );
    }

    req.body = validation.data;
    next();
  };
}
