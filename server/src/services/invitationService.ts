import { ProjectMemberRole } from '@prisma/client'
import prisma from '../prisma'
import { decrypt, hmac } from './cryptoService'
import { can, canAssignRole } from '../lib/permissions'

async function getRequesterMember(projectId: string, userId: string) {
  return prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
}

export async function sendInvitation(projectId: string, inviterId: string, identifier: string, role: ProjectMemberRole) {
  const requester = await getRequesterMember(projectId, inviterId)
  if (!requester) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!can(requester.role, 'add_member')) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })
  if (!canAssignRole(requester.role, role)) throw Object.assign(new Error('Not authorized to assign this role'), { code: 'ACCESS_DENIED' })

  const emailHash = hmac(identifier.toLowerCase())
  const target = await prisma.user.findUnique({ where: { emailHash } })
  if (!target) throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' })

  const alreadyMember = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: target.id } },
  })
  if (alreadyMember) throw Object.assign(new Error('Already a member'), { code: 'ALREADY_MEMBER' })

  const existing = await prisma.projectInvitation.findUnique({
    where: { projectId_inviteeId: { projectId, inviteeId: target.id } },
  })
  if (existing) {
    if (existing.status === 'PENDING') throw Object.assign(new Error('Invitation already sent'), { code: 'ALREADY_INVITED' })
    // REJECTED/ACCEPTED 상태면 새 초대로 덮어쓰기
    await prisma.projectInvitation.delete({ where: { id: existing.id } })
  }

  const invitation = await prisma.projectInvitation.create({
    data: { projectId, inviterId, inviteeId: target.id, role },
    include: {
      project: { select: { id: true, name: true } },
      inviter: { select: { id: true, username: true } },
    },
  })
  return invitation
}

export async function getMyInvitations(userId: string) {
  const invitations = await prisma.projectInvitation.findMany({
    where: { inviteeId: userId, status: 'PENDING' },
    include: {
      project: { select: { id: true, name: true } },
      inviter: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return invitations.map(inv => ({
    ...inv,
    inviter: { ...inv.inviter, username: decrypt(inv.inviter.username) },
  }))
}

export async function getProjectInvitations(projectId: string, requesterId: string) {
  const requester = await getRequesterMember(projectId, requesterId)
  if (!requester) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!can(requester.role, 'add_member')) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })

  const invitations = await prisma.projectInvitation.findMany({
    where: { projectId, status: 'PENDING' },
    include: {
      invitee: { select: { id: true, username: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
  return invitations.map(inv => ({
    ...inv,
    invitee: {
      ...inv.invitee,
      username: decrypt(inv.invitee.username),
      email: decrypt(inv.invitee.email),
    },
  }))
}

export async function respondInvitation(invitationId: string, userId: string, action: 'accept' | 'reject') {
  const invitation = await prisma.projectInvitation.findUnique({ where: { id: invitationId } })
  if (!invitation) throw Object.assign(new Error('Invitation not found'), { code: 'NOT_FOUND' })
  if (invitation.inviteeId !== userId) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })
  if (invitation.status !== 'PENDING') throw Object.assign(new Error('Invitation already processed'), { code: 'ALREADY_PROCESSED' })

  if (action === 'accept') {
    const alreadyMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: invitation.projectId, userId } },
    })
    if (alreadyMember) {
      await prisma.projectInvitation.update({ where: { id: invitationId }, data: { status: 'ACCEPTED' } })
      throw Object.assign(new Error('Already a member'), { code: 'ALREADY_MEMBER' })
    }

    await prisma.$transaction([
      prisma.projectMember.create({
        data: { projectId: invitation.projectId, userId, role: invitation.role },
      }),
      prisma.projectInvitation.update({
        where: { id: invitationId },
        data: { status: 'ACCEPTED' },
      }),
    ])
  } else {
    await prisma.projectInvitation.update({
      where: { id: invitationId },
      data: { status: 'REJECTED' },
    })
  }
}

export async function cancelInvitation(invitationId: string, requesterId: string, projectId: string) {
  const requester = await getRequesterMember(projectId, requesterId)
  if (!requester) throw Object.assign(new Error('Project not found'), { code: 'NOT_FOUND' })
  if (!can(requester.role, 'add_member')) throw Object.assign(new Error('Access denied'), { code: 'ACCESS_DENIED' })

  const invitation = await prisma.projectInvitation.findUnique({ where: { id: invitationId } })
  if (!invitation || invitation.projectId !== projectId) throw Object.assign(new Error('Invitation not found'), { code: 'NOT_FOUND' })

  await prisma.projectInvitation.delete({ where: { id: invitationId } })
}
