-- CreateEnum
CREATE TYPE "server_deps"."UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "server_deps"."ProjectStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "server_deps"."ProjectMemberRole" AS ENUM ('MASTER', 'ADMIN', 'WRITER', 'READONLY');

-- CreateEnum
CREATE TYPE "server_deps"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "server_deps"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT,
    "status" "server_deps"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_deps"."Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_deps"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "status" "server_deps"."ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_deps"."ProjectMember" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "server_deps"."ProjectMemberRole" NOT NULL DEFAULT 'READONLY',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "server_deps"."ProjectInvitation" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeId" TEXT NOT NULL,
    "role" "server_deps"."ProjectMemberRole" NOT NULL,
    "status" "server_deps"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_deps"."GraphData" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "contacts" JSONB,
    "positions" JSONB,
    "version" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GraphData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_deps"."AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "projectId" TEXT,
    "action" TEXT NOT NULL,
    "nodeId" TEXT,
    "email" TEXT,
    "status" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "failReason" TEXT,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_deps"."OAuthAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerSub" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OAuthAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHash_key" ON "server_deps"."User"("emailHash");

-- CreateIndex
CREATE INDEX "User_status_deactivatedAt_idx" ON "server_deps"."User"("status", "deactivatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "server_deps"."Session"("token");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "server_deps"."Project"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_projectId_inviteeId_key" ON "server_deps"."ProjectInvitation"("projectId", "inviteeId");

-- CreateIndex
CREATE UNIQUE INDEX "GraphData_projectId_key" ON "server_deps"."GraphData"("projectId");

-- CreateIndex
CREATE INDEX "AuditLog_projectId_createdAt_idx" ON "server_deps"."AuditLog"("projectId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "server_deps"."AuditLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_email_createdAt_idx" ON "server_deps"."AuditLog"("email", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "server_deps"."AuditLog"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_status_createdAt_idx" ON "server_deps"."AuditLog"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "OAuthAccount_userId_idx" ON "server_deps"."OAuthAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OAuthAccount_provider_providerSub_key" ON "server_deps"."OAuthAccount"("provider", "providerSub");

-- AddForeignKey
ALTER TABLE "server_deps"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "server_deps"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "server_deps"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "server_deps"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "server_deps"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "server_deps"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "server_deps"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "server_deps"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."GraphData" ADD CONSTRAINT "GraphData_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "server_deps"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "server_deps"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."AuditLog" ADD CONSTRAINT "AuditLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "server_deps"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_deps"."OAuthAccount" ADD CONSTRAINT "OAuthAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "server_deps"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
