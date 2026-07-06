/*
  Warnings:

  - You are about to drop the column `clientId` on the `Alert` table. All the data in the column will be lost.
  - You are about to drop the column `clientId` on the `Monitor` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Alert` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Alert` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Monitor` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Alert_clientId_key";

-- DropIndex
DROP INDEX "Monitor_clientId_idx";

-- AlterTable
ALTER TABLE "Alert" DROP COLUMN "clientId",
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "enabled" SET DEFAULT false;

-- AlterTable
ALTER TABLE "Monitor" DROP COLUMN "clientId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "password" TEXT,
    "telegramId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "Alert_userId_key" ON "Alert"("userId");

-- CreateIndex
CREATE INDEX "Monitor_userId_idx" ON "Monitor"("userId");

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Monitor" ADD CONSTRAINT "Monitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
