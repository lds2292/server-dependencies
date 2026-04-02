import prisma from '../prisma'
import { decrypt, isEncrypted } from './cryptoService'

export type AuditAction =
  | 'UNMASK_CONTACTS'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'OWNERSHIP_TRANSFERRED'
  | 'INVITATION_SENT'
  | 'INVITATION_CANCELLED'
  | 'INVITATION_ACCEPTED'
  | 'INVITATION_REJECTED'
  | 'PROFILE_UPDATE'
  | 'PASSWORD_CHANGE'
  | 'ACCOUNT_DELETE'
  | 'LOGIN_GOOGLE'
  | 'REGISTER_GOOGLE'
  | 'LOGIN_GITHUB'
  | 'REGISTER_GITHUB'
  | 'ACCOUNT_DEACTIVATE'
  | 'ACCOUNT_REACTIVATE'
export type AuditStatus = 'SUCCESS' | 'FAILED'

interface CreateAuditLogParams {
  action: AuditAction
  status: AuditStatus
  userId?: string
  projectId?: string
  nodeId?: string
  email?: string
  ipAddress?: string
  userAgent?: string
  failReason?: string
  detail?: string
}

export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  const { userId, projectId, ...rest } = params
  await prisma.auditLog.create({
    data: {
      ...rest,
      ...(userId ? { user: { connect: { id: userId } } } : {}),
      ...(projectId ? { project: { connect: { id: projectId } } } : {}),
    },
  })
}

export async function getAuditLogs(projectId: string, limit = 200) {
  const logs = await prisma.auditLog.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
  })

  return logs.map(log => ({
    ...log,
    email: log.email && isEncrypted(log.email) ? decrypt(log.email) : log.email,
    user: log.user
      ? {
          ...log.user,
          email: isEncrypted(log.user.email) ? decrypt(log.user.email) : log.user.email,
        }
      : null,
  }))
}
