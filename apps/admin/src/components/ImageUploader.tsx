/**
 * Image Uploader — drag-and-drop component for uploading images to Cloudinary.
 * Supports progress tracking, file validation, and removal.
 */

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

export interface UploadedImage {
  url: string;
  publicId: string;
  alt?: string;
}

interface ImageUploaderProps {
  label: string;
  existingImages?: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxFiles?: number;
  isPrimary?: boolean;
  onPrimaryChange?: (primaryPublicId: string) => void;
}

interface UploadProgress {
  [publicId: string]: number;
}

const ACCEPTED_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
};

export function ImageUploader({
  label,
  existingImages = [],
  onImagesChange,
  maxFiles = 10,
  isPrimary = false,
  onPrimaryChange,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setError(null);
      setUploading(true);

      const newImages: UploadedImage[] = [];

      for (const file of acceptedFiles) {
        const fileId = `upload_${Date.now()}_${Math.random()}`;

        try {
          const formData = new FormData();
          formData.append("file", file);

          // Upload using XMLHttpRequest for progress tracking
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener("progress", (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setUploadProgress((prev) => ({ ...prev, [fileId]: progress }));
              }
            });

            xhr.addEventListener("load", () => {
              if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                newImages.push({
                  url: response.url,
                  publicId: response.publicId,
                  alt: file.name,
                });
                resolve();
              } else {
                reject(new Error("Upload failed"));
              }
            });

            xhr.addEventListener("error", () => {
              reject(new Error("Network error during upload"));
            });

            xhr.open("POST", "/api/v1/admin/uploads");
            const token = localStorage.getItem("auth_token");
            if (token) {
              xhr.setRequestHeader("Authorization", `Bearer ${token}`);
            }

            xhr.send(formData);
          });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Upload failed. Please try again."
          );
          console.error("Upload error:", err);
        } finally {
          setUploadProgress((prev) => {
            const copy = { ...prev };
            delete copy[fileId];
            return copy;
          });
        }
      }

      if (newImages.length > 0) {
        const combined = [...existingImages, ...newImages].slice(0, maxFiles);
        onImagesChange(combined);
      }

      setUploading(false);
    },
    [existingImages, maxFiles, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: 5 * 1024 * 1024, // 5 MB
  });

  const handleRemove = async (publicId: string) => {
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/v1/admin/uploads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ publicId }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete image");
      }

      const updated = existingImages.filter((img) => img.publicId !== publicId);
      onImagesChange(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete image");
    }
  };

  const handleSetPrimary = (publicId: string) => {
    onPrimaryChange?.(publicId);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">{label}</label>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 bg-gray-50 hover:border-gray-400"
        } ${uploading ? "opacity-50" : ""}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-primary font-semibold">Drop images here...</p>
        ) : (
          <div>
            <p className="font-semibold text-gray-900">Drag & drop images here</p>
            <p className="text-sm text-muted">or click to select files</p>
            <p className="text-xs text-muted mt-2">
              JPG, PNG, WebP • Max 5 MB per file
            </p>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Progress Bars */}
      {Object.entries(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id}>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted mt-1">{progress}%</p>
            </div>
          ))}
        </div>
      )}

      {/* Thumbnail Grid */}
      {existingImages.length > 0 && (
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4">
          {existingImages.map((image, idx) => (
            <div key={image.publicId} className="relative group">
              <img
                src={image.url}
                alt={image.alt || "Uploaded image"}
                className="w-full h-32 object-cover rounded border border-gray-200"
              />

              {/* Remove Button */}
              <button
                onClick={() => handleRemove(image.publicId)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                ✕
              </button>

              {/* Primary Toggle */}
              {isPrimary && (
                <label className="absolute bottom-1 left-1 flex items-center gap-1 bg-white/80 px-2 py-1 rounded text-xs cursor-pointer">
                  <input
                    type="radio"
                    name="primary"
                    checked={idx === 0}
                    onChange={() => handleSetPrimary(image.publicId)}
                    className="w-3 h-3"
                  />
                  <span>Primary</span>
                </label>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
