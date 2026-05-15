-- CreateEnum
CREATE TYPE "RegistryStatus" AS ENUM ('PENDING', 'FOUND', 'NOT_FOUND');

-- AlterTable
ALTER TABLE "LandVerification" ADD COLUMN     "landId" TEXT,
ADD COLUMN     "matchReport" JSONB,
ADD COLUMN     "registryStatus" "RegistryStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "Land" (
    "id" TEXT NOT NULL,
    "parcelNumber" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "documentType" TEXT,
    "registrationDate" TIMESTAMP(3),
    "size" TEXT,
    "encumbrances" TEXT,
    "transactionHistory" JSONB NOT NULL DEFAULT '[]',
    "rawData" JSONB NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "scrapedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Land_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Land_parcelNumber_key" ON "Land"("parcelNumber");

-- CreateIndex
CREATE INDEX "Land_parcelNumber_idx" ON "Land"("parcelNumber");

-- AddForeignKey
ALTER TABLE "LandVerification" ADD CONSTRAINT "LandVerification_landId_fkey" FOREIGN KEY ("landId") REFERENCES "Land"("id") ON DELETE SET NULL ON UPDATE CASCADE;
