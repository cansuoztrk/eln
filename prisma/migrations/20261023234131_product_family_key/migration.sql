-- DropIndex
DROP INDEX "Product_brandId_idx";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "familyKey" TEXT;

-- CreateIndex
CREATE INDEX "Product_brandId_familyKey_idx" ON "Product"("brandId", "familyKey");
