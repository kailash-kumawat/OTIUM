/*
  Warnings:

  - Added the required column `version` to the `Consent` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `embedding` on the `Entry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Consent" ADD COLUMN     "version" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "embedding",
ADD COLUMN     "embedding" vector[1536] NOT NULL;
