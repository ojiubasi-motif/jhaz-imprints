/**
 * Image upload routes for admin panel.
 * Handles file uploads to Cloudinary and deletion.
 */

import { Router } from "express";
import multer from "multer";
import { authenticate, type AuthenticatedRequest } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
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
  authorize("ADMIN"),
  (req: AuthenticatedRequest, res, next) => {
    // Accept any field name — avoids multer "Unexpected field" errors
    upload.any()(req, res, (err: any) => {
      const files = req.files as Express.Multer.File[] | undefined;
      const file = files?.[0];

      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            msg: "File too large. Max 5 MB.",
            type: "FAILED",
            code: 602
          });
        }
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            msg: `Upload error: ${err.message}`,
            type: "FAILED",
            code: 602
          });
        }
        return next(err);
      }

      if (!file) {
        return res.status(400).json({
          msg: "No file provided. Send an image as form-data with any key name.",
          type: "FAILED",
          code: 602
        });
      }

      uploadService
        .uploadToCloudinary(file)
        .then((result) => res.status(201).json({
          msg: "upload success",
          data: result,
          type: "SUCCESS",
          code: 600
        }))
        .catch(next);
    });
  }
);

/**
 * DELETE /api/v1/admin/uploads
 * Delete an image from Cloudinary by public ID.
 */
router.delete(
  "/",
  authenticate,
  authorize("ADMIN"),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        throw new AppError("publicId is required", 400);
      }

      await uploadService.deleteFromCloudinary(publicId);
      res.json({
        msg: "delete success",
        data: { success: true },
        type: "SUCCESS",
        code: 600
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
