-- CreateEnum
CREATE TYPE "WalletTxType" AS ENUM ('FUND', 'ESCROW_HOLD', 'ESCROW_RELEASE', 'ADMIN_CREDIT', 'ADMIN_DEBIT');

-- CreateEnum
CREATE TYPE "PurchaseStatus" AS ENUM ('INITIATED', 'DOCS_UPLOADED', 'AI_REVIEWED', 'IN_ESCROW', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "fromWalletId" TEXT,
    "toWalletId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "reference" TEXT NOT NULL,
    "note" TEXT,
    "purchaseId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandPurchase" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "verificationId" TEXT NOT NULL,
    "agreedAmount" DECIMAL(15,2) NOT NULL,
    "status" "PurchaseStatus" NOT NULL DEFAULT 'INITIATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_reference_key" ON "WalletTransaction"("reference");

-- CreateIndex
CREATE INDEX "WalletTransaction_fromWalletId_idx" ON "WalletTransaction"("fromWalletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_toWalletId_idx" ON "WalletTransaction"("toWalletId");

-- CreateIndex
CREATE INDEX "WalletTransaction_purchaseId_idx" ON "WalletTransaction"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "LandPurchase_verificationId_key" ON "LandPurchase"("verificationId");

-- CreateIndex
CREATE INDEX "LandPurchase_buyerId_idx" ON "LandPurchase"("buyerId");

-- CreateIndex
CREATE INDEX "LandPurchase_sellerId_idx" ON "LandPurchase"("sellerId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_fromWalletId_fkey" FOREIGN KEY ("fromWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_toWalletId_fkey" FOREIGN KEY ("toWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "LandPurchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandPurchase" ADD CONSTRAINT "LandPurchase_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandPurchase" ADD CONSTRAINT "LandPurchase_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LandPurchase" ADD CONSTRAINT "LandPurchase_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "LandVerification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
