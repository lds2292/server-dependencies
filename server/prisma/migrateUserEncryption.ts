/**
 * 기존 User 테이블의 email/username 을 AES-256-GCM 으로 암호화하고
 * HMAC-SHA256 해시를 채웁니다.
 *
 * 실행 순서:
 *   1. prisma migrate deploy (phase1 마이그레이션 적용)
 *   2. ts-node prisma/migrateUserEncryption.ts
 *   3. prisma migrate deploy (phase2 마이그레이션 적용)
 *
 * 주의: ENCRYPTION_KEY 환경변수가 설정된 상태에서만 실행하세요.
 */
import 'dotenv/config'
import prisma from '../src/prisma'
import { isEncrypted, encrypt, hmac } from '../src/services/cryptoService'

interface RawUser {
  id: string
  email: string
  username: string
  emailHash: string | null
  usernameHash: string | null
}

async function migrate() {
  // Prisma 타입 검사를 우회하여 NULL 컬럼을 포함한 레코드를 raw SQL로 조회
  const users = await prisma.$queryRaw<RawUser[]>`SELECT id, email, username, "emailHash", "usernameHash" FROM "User"`
  console.log(`총 ${users.length}명 사용자 암호화 마이그레이션 시작`)

  let migrated = 0

  for (const user of users) {
    if (user.emailHash && user.usernameHash) {
      console.log(`  [skip] user ${user.id} 이미 완료됨`)
      continue
    }

    const plainEmail = isEncrypted(user.email) ? null : user.email
    const plainUsername = isEncrypted(user.username) ? null : user.username

    const newEmail = plainEmail ? encrypt(plainEmail) : user.email
    const newEmailHash = hmac((plainEmail ?? user.email).toLowerCase())
    const newUsername = plainUsername ? encrypt(plainUsername) : user.username
    const newUsernameHash = hmac(plainUsername ?? user.username)

    await prisma.$executeRaw`
      UPDATE "User"
      SET email = ${newEmail},
          "emailHash" = ${newEmailHash},
          username = ${newUsername},
          "usernameHash" = ${newUsernameHash}
      WHERE id = ${user.id}
    `

    migrated++
    console.log(`  [${migrated}/${users.length}] user ${user.id} 완료`)
  }

  console.log('User 암호화 마이그레이션 완료')
  await prisma.$disconnect()
}

migrate().catch(err => {
  console.error('마이그레이션 실패:', err)
  process.exit(1)
})
