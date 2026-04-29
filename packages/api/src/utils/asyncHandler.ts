/**
 * Async route handler wrapper.
 * Automatically catches errors and passes them to Express error middleware.
 */

import type { Request, Response, NextFunction } from "express";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
