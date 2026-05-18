-- DropForeignKey
ALTER TABLE "Check" DROP CONSTRAINT "Check_serviceId_fkey";

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
