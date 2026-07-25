/*
  Warnings:

  - A unique constraint covering the columns `[telegramChatId]` on the table `Alert` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Alert_telegramChatId_key" ON "Alert"("telegramChatId");
