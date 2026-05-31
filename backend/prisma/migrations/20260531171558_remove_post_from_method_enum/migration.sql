/*
  Warnings:

  - The values [POST] on the enum `Method` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Method_new" AS ENUM ('HEAD', 'GET');
ALTER TABLE "public"."Monitor" ALTER COLUMN "method" DROP DEFAULT;
ALTER TABLE "Monitor" ALTER COLUMN "method" TYPE "Method_new" USING ("method"::text::"Method_new");
ALTER TYPE "Method" RENAME TO "Method_old";
ALTER TYPE "Method_new" RENAME TO "Method";
DROP TYPE "public"."Method_old";
ALTER TABLE "Monitor" ALTER COLUMN "method" SET DEFAULT 'HEAD';
COMMIT;
