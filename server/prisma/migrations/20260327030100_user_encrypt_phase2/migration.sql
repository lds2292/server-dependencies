-- Phase 2: 해시 컬럼에 NOT NULL + 유니크 제약 추가, 기존 평문 유니크 인덱스 제거
-- Phase 1 마이그레이션 + migrateUserEncryption.ts 스크립트 실행 후 적용하세요.

-- 해시 컬럼 NOT NULL 설정
ALTER TABLE "User" ALTER COLUMN "emailHash" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "usernameHash" SET NOT NULL;

-- 해시 컬럼 유니크 인덱스 추가
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");
CREATE UNIQUE INDEX "User_usernameHash_key" ON "User"("usernameHash");

-- 기존 평문 유니크 인덱스 제거
DROP INDEX IF EXISTS "User_email_key";
DROP INDEX IF EXISTS "User_username_key";
