import { ProjectMemberRole } from '@prisma/client'
import prisma from '../prisma'
import { decrypt, hmac } from './cryptoService'
import { can, canAssignRole, canManageTarget } from '../lib/permissions'

type UserFields = { id: string; email: string; username: string }
type MemberWithUser = { role: ProjectMemberRole; user: UserFields; [key: string]: unknown }

function decryptMemberUser<T extends MemberWithUser>(member: T): T {
  return { ...member, user: { ...member.user, email: decrypt(member.user.email), username: decrypt(member.user.username) } }
}

function decryptProjectMembers<T extends { members: MemberWithUser[] }>(project: T): T {
  return { ...project, members: project.members.map(decryptMemberUser) }
}

const memberInclude = {
  members: {
    include: { user: { select: { id: true, username: true, email: true } } },
    orderBy: [
      { role: 'asc' as const },
      { joinedAt: 'asc' as const },
    ],
  },
}

async function getRequesterMember(projectId: string, requestingUserId: string) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: requestingUserId } },
  })
  return member
}

export async function checkPermission(projectId: string, userId: string, action: import('../lib/permissions').PermissionAction) {
  const member = await getRequesterMember(projectId, userId)
  if (!member) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!can(member.role, action)) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })
}

export async function getProjectsForUser(userId: string) {
  const projects = await prisma.project.findMany({
    where: { members: { some: { userId } }, status: 'ACTIVE' },
    include: memberInclude,
    orderBy: { updatedAt: 'desc' },
  })
  return projects.map(decryptProjectMembers)
}

export async function getProjectById(projectId: string, requestingUserId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: memberInclude,
  })
  if (!project) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  const isMember = project.members.some((m: { userId: string }) => m.userId === requestingUserId)
  if (!isMember) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })
  return decryptProjectMembers(project)
}

export async function createProject(name: string, ownerId: string, description?: string) {
  const project = await prisma.project.create({
    data: {
      name,
      description,
      ownerId,
      members: { create: { userId: ownerId, role: 'MASTER' } },
      graphData: {
        create: {
          data: { servers: [], l7Nodes: [], infraNodes: [], externalNodes: [], dependencies: [] },
          positions: {},
        },
      },
    },
    include: memberInclude,
  })
  return decryptProjectMembers(project)
}

export async function updateProject(projectId: string, requestingUserId: string, patch: { name?: string; description?: string }) {
  const requester = await getRequesterMember(projectId, requestingUserId)
  if (!requester) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!can(requester.role, 'update_project')) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: patch,
    include: memberInclude,
  })
  return decryptProjectMembers(updated)
}

export async function deleteProject(projectId: string, requestingUserId: string) {
  const requester = await getRequesterMember(projectId, requestingUserId)
  if (!requester) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!can(requester.role, 'delete_project')) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })
  await prisma.project.delete({ where: { id: projectId } })
}

export async function addMember(projectId: string, requestingUserId: string, identifier: string, role: ProjectMemberRole) {
  const requester = await getRequesterMember(projectId, requestingUserId)
  if (!requester) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!can(requester.role, 'add_member')) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })
  if (!canAssignRole(requester.role, role)) throw Object.assign(new Error('Not authorized to assign this role'), { code: 'ACCESS_DENIED' })

  const emailHash = hmac(identifier.toLowerCase())
  const target = await prisma.user.findUnique({
    where: { emailHash },
  })
  if (!target) throw Object.assign(new Error('User not found'), { code: 'MEMBER_NOT_FOUND' })

  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: target.id } },
  })
  if (alreadyMember) throw Object.assign(new Error('Already a member'), { code: 'ALREADY_MEMBER' })

  await prisma.projectMember.create({ data: { projectId, userId: target.id, role } })
  return getProjectById(projectId, requestingUserId)
}

export async function removeMember(projectId: string, requestingUserId: string, targetUserId: string) {
  const [requester, target] = await Promise.all([
    getRequesterMember(projectId, requestingUserId),
    getRequesterMember(projectId, targetUserId),
  ])
  if (!requester) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!target) throw Object.assign(new Error('Member not found'), { code: 'NOT_FOUND' })

  const isSelf = requestingUserId === targetUserId
  if (isSelf) {
    if (requester.role === 'MASTER') throw Object.assign(new Error('Master must transfer ownership before leaving'), { code: 'ACCESS_DENIED' })
  } else {
    if (!canManageTarget(requester.role, target.role)) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })
  }

  await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId: targetUserId } } })

  if (isSelf) return null
  return getProjectById(projectId, requestingUserId)
}

export async function leaveProject(projectId: string, userId: string) {
  const member = await getRequesterMember(projectId, userId)
  if (!member) throw Object.assign(new Error('Not a project member'), { code: 'NOT_FOUND' })
  if (member.role === 'MASTER') throw Object.assign(new Error('Master must transfer ownership before leaving'), { code: 'ACCESS_DENIED' })
  await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } })
}

export async function updateMemberRole(projectId: string, requestingUserId: string, targetUserId: string, newRole: ProjectMemberRole) {
  const [requester, target] = await Promise.all([
    getRequesterMember(projectId, requestingUserId),
    getRequesterMember(projectId, targetUserId),
  ])
  if (!requester) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!target) throw Object.assign(new Error('Member not found'), { code: 'NOT_FOUND' })

  // Ownership 이전: 새 역할이 MASTER인 경우
  if (newRole === 'MASTER') {
    if (requester.role !== 'MASTER') throw Object.assign(new Error('Only Master can transfer ownership'), { code: 'ACCESS_DENIED' })

    await prisma.$transaction([
      prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId: targetUserId } },
        data: { role: 'MASTER' },
      }),
      prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId: requestingUserId } },
        data: { role: 'ADMIN' },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { ownerId: targetUserId },
      }),
    ])
    return getProjectById(projectId, requestingUserId)
  }

  // 일반 역할 변경
  if (!canManageTarget(requester.role, target.role)) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })
  if (!canAssignRole(requester.role, newRole)) throw Object.assign(new Error('Not authorized to assign this role'), { code: 'ACCESS_DENIED' })

  await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId: targetUserId } },
    data: { role: newRole },
  })
  return getProjectById(projectId, requestingUserId)
}
