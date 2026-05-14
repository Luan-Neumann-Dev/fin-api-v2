/*
  Warnings:

  - You are about to drop the column `display_name` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the `creadit_cards` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "creadit_cards" DROP CONSTRAINT "creadit_cards_user_id_fkey";

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_credit_card_id_fkey";

-- AlterTable
ALTER TABLE "piggy_banks" ALTER COLUMN "icon" SET DEFAULT 'piggy';

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "display_name";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "display_name" TEXT;

-- DropTable
DROP TABLE "creadit_cards";

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#7c3aed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "credit_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
