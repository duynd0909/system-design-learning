-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'CONTENT_EDITOR', 'ADMIN');

-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';
