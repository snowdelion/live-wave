-- AlterTable
ALTER TABLE "Check" ADD COLUMN     "details" JSONB;

-- CreateIndex
CREATE INDEX "Check_details_idx" ON "Check"("details");
