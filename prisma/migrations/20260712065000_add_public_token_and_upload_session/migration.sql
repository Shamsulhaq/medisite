-- AlterTable: Add publicToken column to Consultation (nullable first)
ALTER TABLE "Consultation" ADD COLUMN "publicToken" TEXT;

-- Populate existing rows with unique UUIDs
UPDATE "Consultation" SET "publicToken" = gen_random_uuid()::text WHERE "publicToken" IS NULL;

-- Make it required and add unique constraint
ALTER TABLE "Consultation" ALTER COLUMN "publicToken" SET NOT NULL;
ALTER TABLE "Consultation" ALTER COLUMN "publicToken" SET DEFAULT gen_random_uuid()::text;

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_publicToken_key" ON "Consultation"("publicToken");

-- CreateTable: UploadSession
CREATE TABLE "UploadSession" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "targetType" TEXT NOT NULL DEFAULT 'attachment',
    "targetId" TEXT NOT NULL DEFAULT '',
    "files" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UploadSession_token_key" ON "UploadSession"("token");
