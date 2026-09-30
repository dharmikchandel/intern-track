-- DropIndex
DROP INDEX "Application_appliedDate_idx";

-- DropIndex
DROP INDEX "Application_status_idx";

-- DropIndex
DROP INDEX "Application_userId_idx";

-- CreateIndex
CREATE INDEX "Application_userId_appliedDate_idx" ON "Application"("userId", "appliedDate" DESC);

-- CreateIndex
CREATE INDEX "Application_userId_status_appliedDate_idx" ON "Application"("userId", "status", "appliedDate" DESC);
