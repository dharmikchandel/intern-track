-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailDigestEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastDigestSentAt" TIMESTAMP(3);
