-- CreateTable
CREATE TABLE "RecapShare" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "stats" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "RecapShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecapShare_slug_key" ON "RecapShare"("slug");

-- CreateIndex
CREATE INDEX "RecapShare_userId_createdAt_idx" ON "RecapShare"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "RecapShare" ADD CONSTRAINT "RecapShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
