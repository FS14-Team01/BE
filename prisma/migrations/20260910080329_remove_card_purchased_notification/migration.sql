/*
  Warnings:

  - The values [CARD_PURCHASED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
DELETE FROM "Notification" WHERE "type" = 'CARD_PURCHASED';
CREATE TYPE "NotificationType_new" AS ENUM ('EXCHANGE_OFFER_RECEIVED', 'EXCHANGE_ACCEPTED', 'EXCHANGE_REJECTED', 'CARD_SOLD', 'CARD_SOLD_OUT');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;
