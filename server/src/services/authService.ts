import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'
import type { AuthTokenPayload } from '../types'
import { encrypt, decrypt, hmac } from './cryptoService'
import { verifyGoogleIdToken } from './googleAuthService'
import { verifyGitHubCode } from './githubAuthService'

const SALT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/** DB에서 읽은 User 레코드의 암호화 필드를 복호화합니다. */
export function decryptUserFields<T extends { email: string }>(user: T): T {
  return { ...user, email: decrypt(user.email) }
}

export function generateAccessToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  } as jwt.SignOptions)
}

export function generateRefreshToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '30d',
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as AuthTokenPayload
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as AuthTokenPayload
}

/** 토큰 발급 + 세션 생성 헬퍼 */
async function issueTokens(user: { id: string; email: string; username: string; createdAt: Date }) {
  const payload: AuthTokenPayload = { userId: user.id, email: user.email, username: user.username }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)
  await prisma.session.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

  return { accessToken, refreshToken }
}

/** OAuth 로그인 시 표시 이름을 반환합니다. */
function resolveUsername(name: string): string {
  return name || 'User'
}

export async function register(email: string, username: string, password: string) {
  const emailHash = hmac(email.toLowerCase())

  const existingEmail = await prisma.user.findUnique({ where: { emailHash } })
  if (existingEmail) throw Object.assign(new Error('Email is already taken'), { code: 'EMAIL_TAKEN' })

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email: encrypt(email),
      emailHash,
      username,
      passwordHash,
    },
  })
  return decryptUserFields(user)
}

export async function login(email: string, password: string) {
  const emailHash = hmac(email.toLowerCase())
  const user = await prisma.user.findUnique({ where: { emailHash } })
  if (!user) throw Object.assign(new Error('Invalid email or password'), { code: 'INVALID_CREDENTIALS' })

  if (!user.passwordHash) throw Object.assign(new Error('Invalid email or password'), { code: 'INVALID_CREDENTIALS' })

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { code: 'INVALID_CREDENTIALS' })

  if (user.status === 'DEACTIVATED') {
    throw Object.assign(new Error('Account is deactivated'), {
      code: 'ACCOUNT_DEACTIVATED',
      deactivatedAt: user.deactivatedAt,
    })
  }

  const decrypted = decryptUserFields(user)
  const tokens = await issueTokens(decrypted)

  return { user: decrypted, ...tokens }
}

/**
 * Google OAuth 로그인/회원가입 통합 처리
 * 1. Google ID Token 검증
 * 2. OAuthAccount로 기존 연동 확인 -> 로그인
 * 3. emailHash로 기존 계정 확인 -> 자동 병합 후 로그인
 * 4. 신규 사용자 -> User + OAuthAccount 생성
 */
export async function googleLogin(idToken: string) {
  const googleUser = await verifyGoogleIdToken(idToken)

  // 1) OAuthAccount로 기존 연동 확인
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: { provider_providerSub: { provider: 'google', providerSub: googleUser.sub } },
    include: { user: true },
  })

  if (existingOAuth) {
    if (existingOAuth.user.status === 'DEACTIVATED') {
      throw Object.assign(new Error('Account is deactivated'), {
        code: 'ACCOUNT_DEACTIVATED', deactivatedAt: existingOAuth.user.deactivatedAt,
      })
    }
    const user = decryptUserFields(existingOAuth.user)
    const tokens = await issueTokens(user)
    return { user, ...tokens, isNewUser: false }
  }

  // 2) emailHash로 기존 계정 확인 (자동 병합)
  const emailHash = hmac(googleUser.email.toLowerCase())
  const existingUser = await prisma.user.findUnique({ where: { emailHash } })

  if (existingUser) {
    if (existingUser.status === 'DEACTIVATED') {
      throw Object.assign(new Error('Account is deactivated'), {
        code: 'ACCOUNT_DEACTIVATED', deactivatedAt: existingUser.deactivatedAt,
      })
    }
    await prisma.oAuthAccount.create({
      data: { userId: existingUser.id, provider: 'google', providerSub: googleUser.sub },
    })
    const user = decryptUserFields(existingUser)
    const tokens = await issueTokens(user)
    return { user, ...tokens, isNewUser: false }
  }

  // 3) 신규 사용자 생성
  const username = resolveUsername(googleUser.name)
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: encrypt(googleUser.email),
        emailHash,
        username,
        passwordHash: null,
      },
    })
    await tx.oAuthAccount.create({
      data: { userId: user.id, provider: 'google', providerSub: googleUser.sub },
    })
    return user
  })

  const user = decryptUserFields(newUser)
  const tokens = await issueTokens(user)
  return { user, ...tokens, isNewUser: true }
}

/**
 * GitHub OAuth 로그인/회원가입 통합 처리
 * googleLogin과 동일한 3단계 로직
 */
export async function githubLogin(code: string) {
  const githubUser = await verifyGitHubCode(code)

  // 1) OAuthAccount로 기존 연동 확인
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: { provider_providerSub: { provider: 'github', providerSub: githubUser.sub } },
    include: { user: true },
  })

  if (existingOAuth) {
    if (existingOAuth.user.status === 'DEACTIVATED') {
      throw Object.assign(new Error('Account is deactivated'), {
        code: 'ACCOUNT_DEACTIVATED', deactivatedAt: existingOAuth.user.deactivatedAt,
      })
    }
    const user = decryptUserFields(existingOAuth.user)
    const tokens = await issueTokens(user)
    return { user, ...tokens, isNewUser: false }
  }

  // 2) emailHash로 기존 계정 확인 (자동 병합)
  const emailHash = hmac(githubUser.email.toLowerCase())
  const existingUser = await prisma.user.findUnique({ where: { emailHash } })

  if (existingUser) {
    if (existingUser.status === 'DEACTIVATED') {
      throw Object.assign(new Error('Account is deactivated'), {
        code: 'ACCOUNT_DEACTIVATED', deactivatedAt: existingUser.deactivatedAt,
      })
    }
    await prisma.oAuthAccount.create({
      data: { userId: existingUser.id, provider: 'github', providerSub: githubUser.sub },
    })
    const user = decryptUserFields(existingUser)
    const tokens = await issueTokens(user)
    return { user, ...tokens, isNewUser: false }
  }

  // 3) 신규 사용자 생성
  const username = resolveUsername(githubUser.name)

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: encrypt(githubUser.email),
        emailHash,
        username,
        passwordHash: null,
      },
    })
    await tx.oAuthAccount.create({
      data: { userId: user.id, provider: 'github', providerSub: githubUser.sub },
    })
    return user
  })

  const user = decryptUserFields(newUser)
  const tokens = await issueTokens(user)
  return { user, ...tokens, isNewUser: true }
}

export async function verifyUserPassword(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw Object.assign(new Error('Invalid password'), { code: 'INVALID_CREDENTIALS' })
  if (!user.passwordHash) throw Object.assign(new Error('No password is set'), { code: 'OAUTH_ONLY_ACCOUNT' })
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw Object.assign(new Error('Invalid password'), { code: 'INVALID_CREDENTIALS' })
}

/** OAuth 재인증으로 본인 확인 (MASTER 위임 등) */
export async function verifyUserOAuth(userId: string, provider: string, credential: string): Promise<void> {
  let providerSub: string

  if (provider === 'google') {
    const googleUser = await verifyGoogleIdToken(credential)
    providerSub = googleUser.sub
  } else if (provider === 'github') {
    const githubUser = await verifyGitHubCode(credential)
    providerSub = githubUser.sub
  } else {
    throw Object.assign(new Error('Unsupported OAuth provider'), { code: 'UNSUPPORTED_PROVIDER' })
  }

  const oauthAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerSub: { provider, providerSub } },
  })
  if (!oauthAccount || oauthAccount.userId !== userId) {
    throw Object.assign(new Error('OAuth authentication does not match'), { code: 'INVALID_OAUTH_TOKEN' })
  }
}

export async function updateProfile(
  userId: string,
  data: { username?: string }
) {
  const updateData: Record<string, string> = {}

  if (data.username) {
    updateData.username = data.username
  }

  if (Object.keys(updateData).length === 0) {
    throw Object.assign(new Error('Nothing to update'), { code: 'VALIDATION_ERROR' })
  }

  const user = await prisma.user.update({ where: { id: userId }, data: updateData })
  return decryptUserFields(user)
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  await verifyUserPassword(userId, currentPassword)
  const passwordHashValue = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: passwordHashValue } })
}

/** 보관된 솔로 프로젝트를 ACTIVE로 복구 */
async function restoreArchivedProjects(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], userId: string) {
  const archivedMemberships = await tx.projectMember.findMany({
    where: { userId, role: 'MASTER', project: { status: 'ARCHIVED' } },
    select: { projectId: true },
  })
  if (archivedMemberships.length > 0) {
    await tx.project.updateMany({
      where: { id: { in: archivedMemberships.map(m => m.projectId) } },
      data: { status: 'ACTIVE' },
    })
  }
}

/** 계정 비활성화 (소프트 딜리트) — MASTER 자동 위임/보관 + 상태 전환 + 세션 무효화 */
async function deactivateAccount(userId: string) {
  await prisma.$transaction(async (tx) => {
    // MASTER인 프로젝트 처리
    const masterMemberships = await tx.projectMember.findMany({
      where: { userId, role: 'MASTER' },
      select: { projectId: true },
    })

    for (const { projectId } of masterMemberships) {
      const otherMembers = await tx.projectMember.findMany({
        where: { projectId, userId: { not: userId } },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      })

      if (otherMembers.length > 0) {
        // 다른 멤버가 있으면 최상위 역할에게 MASTER 위임 + 본인 멤버십 삭제
        const ROLE_PRIORITY: Record<string, number> = { MASTER: 0, ADMIN: 1, WRITER: 2, READONLY: 3 }
        otherMembers.sort((a, b) => (ROLE_PRIORITY[a.role] ?? 9) - (ROLE_PRIORITY[b.role] ?? 9) || a.joinedAt.getTime() - b.joinedAt.getTime())
        const successor = otherMembers[0]

        await tx.projectMember.update({
          where: { projectId_userId: { projectId, userId: successor.userId } },
          data: { role: 'MASTER' },
        })
        await tx.projectMember.delete({
          where: { projectId_userId: { projectId, userId } },
        })
      } else {
        // 본인만 남은 프로젝트는 보관 처리
        await tx.project.update({
          where: { id: projectId },
          data: { status: 'ARCHIVED' },
        })
      }
    }

    await tx.user.update({
      where: { id: userId },
      data: { status: 'DEACTIVATED', deactivatedAt: new Date() },
    })
    await tx.session.deleteMany({ where: { userId } })
  })
}

export async function deleteAccount(userId: string, password: string) {
  await verifyUserPassword(userId, password)
  await deactivateAccount(userId)
}

/** OAuth 재인증으로 계정 비활성화 */
export async function deleteAccountWithOAuth(userId: string, provider: string, credential: string) {
  let providerSub: string

  if (provider === 'google') {
    const googleUser = await verifyGoogleIdToken(credential)
    providerSub = googleUser.sub
  } else if (provider === 'github') {
    const githubUser = await verifyGitHubCode(credential)
    providerSub = githubUser.sub
  } else {
    throw Object.assign(new Error('Unsupported OAuth provider'), { code: 'UNSUPPORTED_PROVIDER' })
  }

  const oauthAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerSub: { provider, providerSub } },
  })
  if (!oauthAccount || oauthAccount.userId !== userId) {
    throw Object.assign(new Error('OAuth authentication does not match'), { code: 'INVALID_OAUTH_TOKEN' })
  }

  await deactivateAccount(userId)
}

/** 비활성 계정 복구 (비밀번호) */
export async function reactivateAccount(email: string, password: string) {
  const emailHash = hmac(email.toLowerCase())
  const user = await prisma.user.findUnique({ where: { emailHash } })
  if (!user) throw Object.assign(new Error('Invalid email or password'), { code: 'INVALID_CREDENTIALS' })
  if (user.status !== 'DEACTIVATED') throw Object.assign(new Error('Account is not deactivated'), { code: 'ACCOUNT_NOT_DEACTIVATED' })
  if (!user.passwordHash) throw Object.assign(new Error('Use OAuth to reactivate'), { code: 'OAUTH_ONLY_ACCOUNT' })

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw Object.assign(new Error('Invalid email or password'), { code: 'INVALID_CREDENTIALS' })

  const deletionDate = new Date(user.deactivatedAt!)
  deletionDate.setDate(deletionDate.getDate() + 30)
  if (new Date() >= deletionDate) {
    throw Object.assign(new Error('Recovery period has expired'), { code: 'RECOVERY_EXPIRED' })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: { status: 'ACTIVE', deactivatedAt: null },
    })
    await restoreArchivedProjects(tx, user.id)
    return u
  })
  const decrypted = decryptUserFields(updated)
  const tokens = await issueTokens(decrypted)
  return { user: decrypted, ...tokens }
}

/** 비활성 계정 복구 (OAuth) */
export async function reactivateAccountWithOAuth(provider: string, credential: string) {
  let providerSub: string
  let oauthEmail: string

  if (provider === 'google') {
    const googleUser = await verifyGoogleIdToken(credential)
    providerSub = googleUser.sub
    oauthEmail = googleUser.email
  } else if (provider === 'github') {
    const githubUser = await verifyGitHubCode(credential)
    providerSub = githubUser.sub
    oauthEmail = githubUser.email
  } else {
    throw Object.assign(new Error('Unsupported OAuth provider'), { code: 'UNSUPPORTED_PROVIDER' })
  }

  const oauthAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerSub: { provider, providerSub } },
    include: { user: true },
  })

  let user = oauthAccount?.user ?? null
  if (!user) {
    const emailHash = hmac(oauthEmail.toLowerCase())
    user = await prisma.user.findUnique({ where: { emailHash } })
  }

  if (!user) throw Object.assign(new Error('Account not found'), { code: 'INVALID_CREDENTIALS' })
  if (user.status !== 'DEACTIVATED') throw Object.assign(new Error('Account is not deactivated'), { code: 'ACCOUNT_NOT_DEACTIVATED' })

  const deletionDate = new Date(user.deactivatedAt!)
  deletionDate.setDate(deletionDate.getDate() + 30)
  if (new Date() >= deletionDate) {
    throw Object.assign(new Error('Recovery period has expired'), { code: 'RECOVERY_EXPIRED' })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.user.update({
      where: { id: user.id },
      data: { status: 'ACTIVE', deactivatedAt: null },
    })
    await restoreArchivedProjects(tx, user.id)
    return u
  })
  const decrypted = decryptUserFields(updated)
  const tokens = await issueTokens(decrypted)
  return { user: decrypted, ...tokens }
}

/** 영구 삭제 (배치용) */
async function permanentlyDeleteAccount(userId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.auditLog.updateMany({ where: { userId }, data: { userId: null } })
    await tx.projectInvitation.deleteMany({ where: { OR: [{ inviterId: userId }, { inviteeId: userId }] } })
    await tx.user.delete({ where: { id: userId } })
  })
}

/** 30일 경과된 비활성 계정 일괄 영구 삭제 */
export async function purgeExpiredAccounts() {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const expiredUsers = await prisma.user.findMany({
    where: { status: 'DEACTIVATED', deactivatedAt: { lte: cutoff } },
    select: { id: true },
  })

  let deleted = 0
  for (const u of expiredUsers) {
    try {
      await permanentlyDeleteAccount(u.id)
      deleted++
    } catch (err) {
      // 개별 실패 시 계속 진행
    }
  }
  return { total: expiredUsers.length, deleted }
}

export async function logout(refreshToken: string) {
  await prisma.session.deleteMany({ where: { token: refreshToken } })
}

export async function refresh(refreshToken: string) {
  const session = await prisma.session.findUnique({ where: { token: refreshToken } })
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } })
    throw Object.assign(new Error('Session expired'), { code: 'SESSION_EXPIRED' })
  }

  const payload = verifyRefreshToken(refreshToken)
  const accessToken = generateAccessToken({ userId: payload.userId, email: payload.email, username: payload.username })
  return { accessToken }
}
