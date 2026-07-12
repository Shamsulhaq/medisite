-- AlterTable
ALTER TABLE "Consultation" ADD COLUMN     "investigationDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "pendingVitalsAt" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pendingVitalsBp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pendingVitalsBy" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pendingVitalsByName" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pendingVitalsComplaint" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pendingVitalsPulse" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pendingVitalsSpo2" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pendingVitalsTemp" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "pendingVitalsWeight" TEXT NOT NULL DEFAULT '';
