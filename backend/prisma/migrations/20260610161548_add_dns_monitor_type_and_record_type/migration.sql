-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('A', 'AAAA', 'MX', 'TXT', 'CNAME');

-- AlterEnum
ALTER TYPE "MonitorType" ADD VALUE 'DNS';

-- CreateTable
CREATE TABLE "DnsMonitor" (
    "monitorId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "recordType" "RecordType" NOT NULL,

    CONSTRAINT "DnsMonitor_pkey" PRIMARY KEY ("monitorId")
);

-- AddForeignKey
ALTER TABLE "DnsMonitor" ADD CONSTRAINT "DnsMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
