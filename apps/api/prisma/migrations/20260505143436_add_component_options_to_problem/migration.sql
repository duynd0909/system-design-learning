-- AlterTable
ALTER TABLE "problems" ADD COLUMN     "componentOptions" TEXT[] DEFAULT ARRAY[]::TEXT[];
