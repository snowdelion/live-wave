-- DropIndex
DROP INDEX "Check_details_idx";

-- DropIndex
DROP INDEX "Monitor_type_idx";

-- CreateIndex
CREATE INDEX "Alert_enabled_idx" ON "Alert"("enabled");

-- CreateIndex
CREATE INDEX "Monitor_lastStatus_idx" ON "Monitor"("lastStatus");

-- CreateIndex
CREATE INDEX "Monitor_nextCheckAt_idx" ON "Monitor"("nextCheckAt");
