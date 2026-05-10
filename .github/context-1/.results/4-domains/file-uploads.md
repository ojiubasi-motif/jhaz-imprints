# File Uploads Domain — Deep Dive

## Overview
Image upload pipeline: Multer parses multipart form-data into memory buffers, then streams to Cloudinary. Admin-only access. Auto-converts to WebP.

## Multer Config
```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new AppError("Only image files are allowed", 422));
    cb(null, true);
  },
});
```

## Upload Route
```typescript
router.post("/", authenticate, authorize("ADMIN"), (req, res, next) => {
  upload.any()(req, res, (err) => {
    const files = req.files as Express.Multer.File[];
    const file = files?.[0];
    uploadService.uploadToCloudinary(file).then((result) => res.status(201).json(result)).catch(next);
  });
});
```

## Cloudinary Upload
```typescript
export async function uploadToCloudinary(file: Express.Multer.File): Promise<UploadResult> {
  const stream = c.uploader.upload_stream(
    { folder: "jhaz-imprints/products", resource_type: "image", format: "webp", quality: "auto" },
    (error, result) => { resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height }); }
  );
  stream.end(file.buffer);
}
```

## Idempotent Delete
```typescript
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  c.uploader.destroy(publicId, (error, result) => {
    if (result?.result === "not found") resolve(); // Treat as success
  });
}
```

## Response Shape
```json
{ "url": "https://res.cloudinary.com/...", "publicId": "jhaz-imprints/products/abc123", "width": 800, "height": 600 }
```
