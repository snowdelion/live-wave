/*
  Warnings:

  - You are about to drop the column `method` on the `Monitor` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `Monitor` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MonitorType" AS ENUM ('HTTP', 'ICMP', 'TCP');

-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "method",
DROP COLUMN "url",
ADD COLUMN     "type" "MonitorType" NOT NULL DEFAULT 'HTTP';

-- CreateTable
CREATE TABLE "HttpMonitor" (
    "monitorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" "Method" NOT NULL DEFAULT 'HEAD',

    CONSTRAINT "HttpMonitor_pkey" PRIMARY KEY ("monitorId")
);

-- CreateTable
CREATE TABLE "IcmpMonitor" (
    "monitorId" TEXT NOT NULL,
    "host" TEXT NOT NULL,

    CONSTRAINT "IcmpMonitor_pkey" PRIMARY KEY ("monitorId")
);

-- CreateTable
CREATE TABLE "TcpMonitor" (
    "monitorId" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL,

    CONSTRAINT "TcpMonitor_pkey" PRIMARY KEY ("monitorId")
);

-- CreateIndex
CREATE INDEX "Monitor_type_idx" ON "Monitor"("type");

-- AddForeignKey
ALTER TABLE "HttpMonitor" ADD CONSTRAINT "HttpMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcmpMonitor" ADD CONSTRAINT "IcmpMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TcpMonitor" ADD CONSTRAINT "TcpMonitor_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
