-- AlterTable
ALTER TABLE "BlogPost" ADD COLUMN     "category" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "disclaimer" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "metaDescription" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "metaTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "ogImage" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "references" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reviewedBy" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "reviewedDate" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "scheduledDate" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "BlogRevision" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlogRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlogRevision_postId_idx" ON "BlogRevision"("postId");
