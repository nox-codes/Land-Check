/*
  Warnings:

  - You are about to alter the column `amount` on the `Payment` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.
  - Added the required column `updatedAt` to the `AdminConfig` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `triggeredBy` on the `TrustScoreEvent` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TriggeredBy" AS ENUM ('AI', 'ADMIN', 'WEBHOOK', 'SYSTEM');

-- AlterTable
ALTER TABLE "AdminConfig" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "TrustScoreEvent" DROP COLUMN "triggeredBy",
ADD COLUMN     "triggeredBy" "TriggeredBy" NOT NULL;

-- CreateIndex
CREATE INDEX "Document_verificationId_idx" ON "Document"("verificationId");

-- CreateIndex
CREATE INDEX "LandVerification_userId_idx" ON "LandVerification"("userId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "ScamReport_userId_idx" ON "ScamReport"("userId");

-- CreateIndex
CREATE INDEX "ScamReport_parcelNumber_idx" ON "ScamReport"("parcelNumber");

-- CreateIndex
CREATE INDEX "TrustScoreEvent_verificationId_idx" ON "TrustScoreEvent"("verificationId");
