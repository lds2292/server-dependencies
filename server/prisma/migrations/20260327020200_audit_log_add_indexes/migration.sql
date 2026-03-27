-- CreateIndex
CREATE INDEX "AuditLog_email_createdAt_idx" ON "AuditLog"("email", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_status_createdAt_idx" ON "AuditLog"("status", "createdAt" DESC);
