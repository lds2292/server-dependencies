import prisma from '../prisma'

export async function getProjectsForUser(userId: string) {
  return prisma.project.findMany({
    where: { members: { some: { userId } } },
    include: { members: { include: { user: { select: { id: true, username: true, email: true } } } } },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getProjectById(projectId: string, requestingUserId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { members: { include: { user: { select: { id: true, username: true, email: true } } } } },
  })
  if (!project) throw Object.assign(new Error('프로젝트를 찾을 수 없습니다.'), { code: 'NOT_FOUND' })
  const isMember = project.members.some((m: { userId: string }) => m.userId === requestingUserId)
  if (!isMember) throw Object.assign(new Error('접근 권한이 없습니다.'), { code: 'ACCESS_DENIED' })
  return project
}

export async function createProject(name: string, ownerId: string, description?: string) {
  return prisma.project.create({
    data: {
      name,
      description,
      ownerId,
      members: { create: { userId: ownerId } },
      graphData: {
        create: {
          data: { servers: [], l7Nodes: [], infraNodes: [], externalNodes: [], dependencies: [] },
          positions: {},
        },
      },
    },
    include: { members: { include: { user: { select: { id: true, username: true, email: true } } } } },
  })
}

export async function updateProject(projectId: string, requestingUserId: string, patch: { name?: string; description?: string }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw Object.assign(new Error('프로젝트를 찾을 수 없습니다.'), { code: 'NOT_FOUND' })
  if (project.ownerId !== requestingUserId) throw Object.assign(new Error('접근 권한이 없습니다.'), { code: 'ACCESS_DENIED' })

  return prisma.project.update({
    where: { id: projectId },
    data: patch,
    include: { members: { include: { user: { select: { id: true, username: true, email: true } } } } },
  })
}

export async function deleteProject(projectId: string, requestingUserId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw Object.assign(new Error('프로젝트를 찾을 수 없습니다.'), { code: 'NOT_FOUND' })
  if (project.ownerId !== requestingUserId) throw Object.assign(new Error('접근 권한이 없습니다.'), { code: 'ACCESS_DENIED' })
  await prisma.project.delete({ where: { id: projectId } })
}

export async function addMember(projectId: string, requestingUserId: string, identifier: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { members: true } })
  if (!project) throw Object.assign(new Error('프로젝트를 찾을 수 없습니다.'), { code: 'NOT_FOUND' })
  if (project.ownerId !== requestingUserId) throw Object.assign(new Error('접근 권한이 없습니다.'), { code: 'ACCESS_DENIED' })

  const target = await prisma.user.findFirst({
    where: { OR: [{ email: identifier }, { username: identifier }] },
  })
  if (!target) throw Object.assign(new Error('해당 사용자를 찾을 수 없습니다.'), { code: 'MEMBER_NOT_FOUND' })

  const alreadyMember = project.members.some((m: { userId: string }) => m.userId === target.id)
  if (alreadyMember) throw Object.assign(new Error('이미 멤버입니다.'), { code: 'ALREADY_MEMBER' })

  await prisma.projectMember.create({ data: { projectId, userId: target.id } })
  return getProjectById(projectId, requestingUserId)
}

export async function removeMember(projectId: string, requestingUserId: string, targetUserId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw Object.assign(new Error('프로젝트를 찾을 수 없습니다.'), { code: 'NOT_FOUND' })

  const isOwner = project.ownerId === requestingUserId
  const isSelf = requestingUserId === targetUserId
  if (!isOwner && !isSelf) throw Object.assign(new Error('접근 권한이 없습니다.'), { code: 'ACCESS_DENIED' })
  if (isOwner && targetUserId === requestingUserId) throw Object.assign(new Error('owner는 프로젝트를 삭제해야 나갈 수 있습니다.'), { code: 'ACCESS_DENIED' })

  await prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId: targetUserId } } })
  return getProjectById(projectId, requestingUserId)
}
