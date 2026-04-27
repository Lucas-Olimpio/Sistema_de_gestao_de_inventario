-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "freightAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SalesOrder" ADD COLUMN     "discountAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "freightAmount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
