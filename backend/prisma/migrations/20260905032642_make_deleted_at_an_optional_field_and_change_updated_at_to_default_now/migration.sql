/*
  Warnings:

  - Changed the type of `embedding` on the `Entry` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Entry" DROP COLUMN "embedding",
ADD COLUMN     "embedding" vector[1536] NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "deleted_at" DROP NOT NULL;
