-- ================================================================
-- Migration: add_missing_fields
-- Adds columns present in schema.prisma but absent from the
-- initial migration (20260429171811_apply_schema_fixes).
-- ================================================================

-- ── User: add password + refreshToken ───────────────────────────
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "password"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "refreshToken" TEXT;

-- ── Order: add product snapshot + price fields ──────────────────
ALTER TABLE "Order"
  ADD COLUMN IF NOT EXISTS "productId"        TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS "styleOptionName"  TEXT NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS "fabricOptionName" TEXT NOT NULL DEFAULT 'Standard',
  ADD COLUMN IF NOT EXISTS "colorName"        TEXT,
  ADD COLUMN IF NOT EXISTS "basePrice"        DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "styleModifier"    DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "fabricModifier"   DOUBLE PRECISION NOT NULL DEFAULT 0;

-- ── CachedProduct: event-replicated catalog from MongoDB ────────
CREATE TABLE IF NOT EXISTS "CachedProduct" (
  "id"            TEXT NOT NULL,
  "slug"          TEXT NOT NULL,
  "name"          TEXT NOT NULL,
  "basePrice"     DOUBLE PRECISION NOT NULL,
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "fabricOptions" JSONB NOT NULL DEFAULT '[]',
  "styleOptions"  JSONB NOT NULL DEFAULT '[]',
  "colorOptions"  JSONB NOT NULL DEFAULT '[]',
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CachedProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CachedProduct_slug_key"
  ON "CachedProduct"("slug");