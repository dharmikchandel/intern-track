-- Optional display name and the user's IANA timezone (for "follow-up due" and the weekly digest).
ALTER TABLE "User" ADD COLUMN "displayName" TEXT,
ADD COLUMN "timezone" TEXT;
