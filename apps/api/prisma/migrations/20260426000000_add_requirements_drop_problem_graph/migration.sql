-- DropForeignKey
ALTER TABLE "problem_graphs" DROP CONSTRAINT "problem_graphs_problemId_fkey";

-- AlterTable
ALTER TABLE "submissions" ADD COLUMN "requirementOrder" INTEGER;

-- DropTable
DROP TABLE "problem_graphs";

-- CreateTable
CREATE TABLE "requirements" (
    "id" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "nodes" JSONB NOT NULL,
    "edges" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "requirements_problemId_idx" ON "requirements"("problemId");

-- CreateIndex
CREATE UNIQUE INDEX "requirements_problemId_order_key" ON "requirements"("problemId", "order");

-- AddForeignKey
ALTER TABLE "requirements" ADD CONSTRAINT "requirements_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "problems"("id") ON DELETE CASCADE ON UPDATE CASCADE;
