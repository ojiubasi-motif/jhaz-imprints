-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_measurementId_fkey";

-- AlterTable
ALTER TABLE "CachedProduct" ALTER COLUMN "fabricOptions" DROP DEFAULT,
ALTER COLUMN "styleOptions" DROP DEFAULT,
ALTER COLUMN "colorOptions" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "basePrice",
DROP COLUMN "colorName",
DROP COLUMN "fabricModifier",
DROP COLUMN "fabricOptionName",
DROP COLUMN "productId",
DROP COLUMN "styleModifier",
DROP COLUMN "styleOptionName",
ADD COLUMN     "items" JSONB NOT NULL,
ALTER COLUMN "measurementId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
