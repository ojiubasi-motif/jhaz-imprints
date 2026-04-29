/**
 * Image upload routes for admin panel.
 * Handles file uploads to Cloudinary and deletion.
 */

import { Router } from "express";
import multer from "multer";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { AppError } from "../errors/AppError";
import * as uploadService from "../services/uploadService";

const router = Router();

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Only image files are allowed", 422));
    }
    cb(null, true);
  },
});

/**
 * POST /api/v1/admin/uploads
 * Upload an image to Cloudinary.
 */
router.post(
  "/",
  authenticate,
  (req: AuthenticatedRequest, res, next) => {
    // Check admin role (optional — can allow any authenticated user)
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin role required" });
    }
    next();
  },
  upload.single("file"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.file) {
        throw new AppError("No file provided", 400);
      }

      const result = await uploadService.uploadToCloudinary(req.file);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/admin/uploads
 * Delete an image from Cloudinary by public ID.
 */
router.delete(
  "/",
  authenticate,
  (req: AuthenticatedRequest, res, next) => {
    if (req.user?.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Admin role required" });
    }
    next();
  },
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        throw new AppError("publicId is required", 400);
      }

      await uploadService.deleteFromCloudinary(publicId);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
