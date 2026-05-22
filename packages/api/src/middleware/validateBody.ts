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
      const error: any = new AppError(
        "Validation failed",
        400,
        "VALIDATION_ERROR"
      );
      error.errors = validation.error.flatten().fieldErrors;
      return next(error);
    }

    req.body = validation.data;
    next();
  };
}
