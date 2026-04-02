/**
 * 암호화된 username을 평문으로 복호화합니다.
 *
 * 실행: ts-node prisma/migrateUsernameDecrypt.ts
 * 주의: ENCRYPTION_KEY 환경변수가 설정된 상태에서만 실행하세요.
 */
import 'dotenv/config'
import prisma from '../src/prisma'
import { isEncrypted, decrypt } from '../src/services/cryptoService'

async function migrate() {
  const users = await prisma.$queryRaw<{ id: string; username: string }[]>`SELECT id, username FROM "User"`
  console.log(`총 ${users.length}명 사용자 username 복호화 시작`)

  let migrated = 0

  for (const user of users) {
    if (!isEncrypted(user.username)) {
      console.log(`  [skip] user ${user.id} 이미 평문`)
      continue
    }

    const plainUsername = decrypt(user.username)

    await prisma.$executeRaw`
      UPDATE "User"
      SET username = ${plainUsername}
      WHERE id = ${user.id}
    `

    migrated++
    console.log(`  [${migrated}] user ${user.id} 복호화 완료: ${plainUsername}`)
  }

  console.log('Username 복호화 마이그레이션 완료')
  await prisma.$disconnect()
}

migrate().catch(err => {
  console.error('마이그레이션 실패:', err)
  process.exit(1)
})
