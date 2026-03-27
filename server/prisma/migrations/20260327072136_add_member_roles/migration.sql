-- CreateEnum
CREATE TYPE "ProjectMemberRole" AS ENUM ('MASTER', 'ADMIN', 'WRITER', 'READONLY');

-- AlterTable
ALTER TABLE "ProjectMember" ADD COLUMN     "role" "ProjectMemberRole" NOT NULL DEFAULT 'READONLY';
