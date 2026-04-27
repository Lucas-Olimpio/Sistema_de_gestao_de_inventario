-- AlterTable
ALTER TABLE "AccountsPayable" ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "AccountsReceivable" ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "Installment" ADD COLUMN     "paymentMethod" "PaymentMethod";
