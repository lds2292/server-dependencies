/**
 * 기존 ProjectMember 데이터에 role 할당
 * - Project.ownerId 보유자 → MASTER
 * - 나머지 멤버 → WRITER (기존에 쓰기 권한이 있었으므로)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const projects = await prisma.project.findMany({ select: { id: true, ownerId: true } })

  let masterCount = 0
  let writerCount = 0

  for (const project of projects) {
    await prisma.projectMember.updateMany({
      where: { projectId: project.id, userId: project.ownerId },
      data: { role: 'MASTER' },
    })
    masterCount++

    const updated = await prisma.projectMember.updateMany({
      where: { projectId: project.id, userId: { not: project.ownerId }, role: 'READONLY' },
      data: { role: 'WRITER' },
    })
    writerCount += updated.count
  }

  console.log(`MASTER 역할 할당: ${masterCount}건`)
  console.log(`WRITER 역할 할당: ${writerCount}건`)
}

main()
  .catch((err) => { console.error(err); process.exit(1) })
  .finally(() => prisma.$disconnect())
