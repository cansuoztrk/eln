-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "lastSnapshotAt" TIMESTAMP(3),
ADD COLUMN     "suspiciousAuto" BOOLEAN NOT NULL DEFAULT false;
