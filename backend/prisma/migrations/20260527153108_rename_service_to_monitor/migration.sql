/*
  Warnings:

  - You are about to drop the column `serviceId` on the `Check` table. All the data in the column will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `monitorId` to the `Check` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Check" DROP CONSTRAINT "Check_serviceId_fkey";

-- DropIndex
DROP INDEX "Check_serviceId_idx";

-- AlterTable
ALTER TABLE "Check" DROP COLUMN "serviceId",
ADD COLUMN     "monitorId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Service";

-- CreateTable
CREATE TABLE "Monitor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" "Method" NOT NULL DEFAULT 'HEAD',
    "checkInterval" INTEGER NOT NULL DEFAULT 10,
    "timeout" INTEGER NOT NULL DEFAULT 5000,
    "lastStatus" "StatusEnum",
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Monitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Monitor_clientId_idx" ON "Monitor"("clientId");

-- CreateIndex
CREATE INDEX "Check_monitorId_idx" ON "Check"("monitorId");

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_monitorId_fkey" FOREIGN KEY ("monitorId") REFERENCES "Monitor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
