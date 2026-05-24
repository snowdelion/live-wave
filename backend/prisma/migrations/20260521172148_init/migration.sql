-- CreateEnum
CREATE TYPE "StatusEnum" AS ENUM ('up', 'down');

-- CreateEnum
CREATE TYPE "Method" AS ENUM ('HEAD', 'GET', 'POST');

-- CreateTable
CREATE TABLE "Check" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "status" "StatusEnum" NOT NULL,
    "statusCode" INTEGER,
    "responseTime" INTEGER,
    "error" TEXT,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Check_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
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
    "userId" TEXT,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramChatId" INTEGER,
    "notifyTelegram" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Check_serviceId_idx" ON "Check"("serviceId");

-- CreateIndex
CREATE INDEX "Check_checkedAt_idx" ON "Check"("checkedAt");

-- CreateIndex
CREATE INDEX "Check_status_idx" ON "Check"("status");

-- CreateIndex
CREATE INDEX "Service_clientId_idx" ON "Service"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramChatId_key" ON "User"("telegramChatId");

-- AddForeignKey
ALTER TABLE "Check" ADD CONSTRAINT "Check_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
