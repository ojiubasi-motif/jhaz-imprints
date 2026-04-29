/**
 * Image upload service for Cloudinary integration.
 */

import cloudinary from "cloudinary";

const c = cloudinary.v2;

c.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

/**
 * Upload an image file to Cloudinary.
 * Automatically converts to WebP for web optimization.
 */
export async function uploadToCloudinary(file: Express.Multer.File): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = c.uploader.upload_stream(
      {
        folder: "jhaz-imprints/products",
        resource_type: "image",
        format: "webp", // Auto-convert to WebP
        quality: "auto",
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        }
      }
    );

    stream.end(file.buffer);
  });
}

/**
 * Delete an image from Cloudinary by public ID.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    c.uploader.destroy(publicId, (error, result) => {
      if (error) {
        reject(new Error(`Cloudinary delete failed: ${error.message}`));
      } else if (result?.result === "ok") {
        resolve();
      } else {
        reject(new Error("Failed to delete image from Cloudinary"));
      }
    });
  });
}
