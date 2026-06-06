-- DropForeignKey
ALTER TABLE "HttpMonitor" DROP CONSTRAINT "HttpMonitor_monitorId_fkey";

-- DropForeignKey
ALTER TABLE "IcmpMonitor" DROP CONSTRAINT "IcmpMonitor_monitorId_fkey";

-- DropForeignKey
ALTER TABLE "TcpMonitor" DROP CONSTRAINT "TcpMonitor_monitorId_fkey";

-- AddForeignKey
ALTER TABLE "HttpMonitor" ADD CONSTRAINT "HttpMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcmpMonitor" ADD CONSTRAINT "IcmpMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TcpMonitor" ADD CONSTRAINT "TcpMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
