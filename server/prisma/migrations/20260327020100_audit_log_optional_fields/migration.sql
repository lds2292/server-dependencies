-- AlterTable
ALTER TABLE "AuditLog"
  ALTER COLUMN "userId" DROP NOT NULL,
  ALTER COLUMN "projectId" DROP NOT NULL,
  ADD COLUMN "email" TEXT;

-- DropForeignKey (재생성을 위해 기존 제약 제거)
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_userId_fkey";
ALTER TABLE "AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_projectId_fkey";

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
