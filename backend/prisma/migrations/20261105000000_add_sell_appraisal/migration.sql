-- AlterEnum
ALTER TYPE "InquiryType" ADD VALUE 'SELL_APPRAISAL';

-- CreateEnum
CREATE TYPE "InquiryService" AS ENUM ('SELL', 'APPRAISAL');

-- AlterTable
ALTER TABLE "Inquiry" ADD COLUMN     "propertyLocation" TEXT,
ADD COLUMN     "service" "InquiryService";
