-- AlterEnum
ALTER TYPE "FeedbackStatus" ADD VALUE 'ARCHIVED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'OWNER';
ALTER TYPE "Role" ADD VALUE 'ANALYST_ASSISTANT';
ALTER TYPE "Role" ADD VALUE 'REVIEWER';

-- AlterTable
ALTER TABLE "Feedback" ADD COLUMN     "assignedToId" TEXT,
ADD COLUMN     "category" TEXT DEFAULT 'General',
ADD COLUMN     "company" TEXT,
ADD COLUMN     "priority" TEXT DEFAULT 'MEDIUM',
ADD COLUMN     "product" TEXT DEFAULT 'Core Platform',
ADD COLUMN     "rating" INTEGER DEFAULT 5,
ADD COLUMN     "rationale" TEXT,
ADD COLUMN     "source" TEXT DEFAULT 'Web Portal',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
