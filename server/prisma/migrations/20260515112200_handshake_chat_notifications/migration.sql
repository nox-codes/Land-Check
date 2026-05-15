-- Add new enum values (must be in their own committed transaction in PG)
ALTER TYPE "PurchaseStatus" ADD VALUE IF NOT EXISTS 'PENDING_SELLER';
ALTER TYPE "PurchaseStatus" ADD VALUE IF NOT EXISTS 'DECLINED';

-- New enum for notifications
CREATE TYPE "NotifType" AS ENUM ('OFFER_RECEIVED','OFFER_ACCEPTED','OFFER_DECLINED','ESCROW_HELD','ESCROW_RELEASED','MESSAGE_RECEIVED');
