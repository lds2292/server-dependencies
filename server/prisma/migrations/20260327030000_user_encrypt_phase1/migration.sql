-- Phase 1: 해시 컬럼 추가 (nullable)
-- 이후 migrateUserEncryption.ts 스크립트를 실행한 뒤 Phase 2 마이그레이션을 적용하세요.

ALTER TABLE "User" ADD COLUMN "emailHash" TEXT;
ALTER TABLE "User" ADD COLUMN "usernameHash" TEXT;
