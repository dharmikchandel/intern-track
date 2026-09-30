-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('APPLICATION_CREATED', 'STATUS_CHANGED', 'NOTES_CHANGED', 'FOLLOW_UP_CHANGED', 'FOLLOW_UP_REMINDER_SENT');

-- CreateTable
CREATE TABLE "ApplicationActivity" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicationActivity_applicationId_createdAt_idx" ON "ApplicationActivity"("applicationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "ApplicationActivity_userId_type_createdAt_idx" ON "ApplicationActivity"("userId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationActivity" ADD CONSTRAINT "ApplicationActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing application gets one APPLICATION_CREATED event
-- dated at its creation time, so no detail page starts with an empty feed.
-- (Earlier status changes were never recorded and cannot be reconstructed.)
INSERT INTO "ApplicationActivity" ("id", "applicationId", "userId", "type", "createdAt")
SELECT gen_random_uuid()::text, "id", "userId", 'APPLICATION_CREATED', "createdAt"
FROM "Application";
