import prisma from '../prisma'

export type AuditAction =
  | 'UNMASK_CONTACTS'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED'
  | 'OWNERSHIP_TRANSFERRED'
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

export async function getAuditLogs(projectId: string, limit = 100) {
  return prisma.auditLog.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
  })
}
