-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL DEFAULT 'InvenPro',
    "cnpj" TEXT,
    "logoUrl" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'BRL',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);
