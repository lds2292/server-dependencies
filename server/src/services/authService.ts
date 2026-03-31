import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'
import type { AuthTokenPayload } from '../types'
import { encrypt, decrypt, hmac } from './cryptoService'
import { verifyGoogleIdToken } from './googleAuthService'

const SALT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

/** DB에서 읽은 User 레코드의 암호화 필드를 복호화합니다. */
export function decryptUserFields<T extends { email: string; username: string }>(user: T): T {
  return { ...user, email: decrypt(user.email), username: decrypt(user.username) }
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

/** username 중복 시 숫자 접미사를 추가하여 고유한 이름을 생성합니다. */
async function generateUniqueUsername(base: string): Promise<string> {
  const baseHash = hmac(base)
  const existing = await prisma.user.findUnique({ where: { usernameHash: baseHash } })
  if (!existing) return base

  let suffix = 2
  while (suffix <= 100) {
    const candidate = `${base}${suffix}`
    const candidateHash = hmac(candidate)
    const found = await prisma.user.findUnique({ where: { usernameHash: candidateHash } })
    if (!found) return candidate
    suffix++
  }
  throw new Error('사용자명 생성에 실패했습니다.')
}

export async function register(email: string, username: string, password: string) {
  const emailHash = hmac(email.toLowerCase())
  const usernameHash = hmac(username)

  const existingEmail = await prisma.user.findUnique({ where: { emailHash } })
  if (existingEmail) throw Object.assign(new Error('이미 사용 중인 이메일입니다.'), { code: 'EMAIL_TAKEN' })

  const existingUsername = await prisma.user.findUnique({ where: { usernameHash } })
  if (existingUsername) throw Object.assign(new Error('이미 사용 중인 사용자명입니다.'), { code: 'USERNAME_TAKEN' })

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      email: encrypt(email),
      emailHash,
      username: encrypt(username),
      usernameHash,
      passwordHash,
    },
  })
  return decryptUserFields(user)
}

export async function login(email: string, password: string) {
  const emailHash = hmac(email.toLowerCase())
  const user = await prisma.user.findUnique({ where: { emailHash } })
  if (!user) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })

  if (!user.passwordHash) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })

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
    const user = decryptUserFields(existingOAuth.user)
    const tokens = await issueTokens(user)
    return { user, ...tokens, isNewUser: false }
  }

  // 2) emailHash로 기존 계정 확인 (자동 병합)
  const emailHash = hmac(googleUser.email.toLowerCase())
  const existingUser = await prisma.user.findUnique({ where: { emailHash } })

  if (existingUser) {
    await prisma.oAuthAccount.create({
      data: { userId: existingUser.id, provider: 'google', providerSub: googleUser.sub },
    })
    const user = decryptUserFields(existingUser)
    const tokens = await issueTokens(user)
    return { user, ...tokens, isNewUser: false }
  }

  // 3) 신규 사용자 생성
  const username = await generateUniqueUsername(googleUser.name)
  const usernameHash = hmac(username)

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: encrypt(googleUser.email),
        emailHash,
        username: encrypt(username),
        usernameHash,
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

export async function verifyUserPassword(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw Object.assign(new Error('비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })
  if (!user.passwordHash) throw Object.assign(new Error('비밀번호가 설정되어 있지 않습니다.'), { code: 'OAUTH_ONLY_ACCOUNT' })
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) throw Object.assign(new Error('비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })
}

export async function updateProfile(
  userId: string,
  data: { username?: string }
) {
  const updateData: Record<string, string> = {}

  if (data.username) {
    const usernameHash = hmac(data.username)
    const existing = await prisma.user.findUnique({ where: { usernameHash } })
    if (existing && existing.id !== userId) {
      throw Object.assign(new Error('이미 사용 중인 사용자명입니다.'), { code: 'USERNAME_TAKEN' })
    }
    updateData.username = encrypt(data.username)
    updateData.usernameHash = usernameHash
  }

  if (Object.keys(updateData).length === 0) {
    throw Object.assign(new Error('변경할 항목이 없습니다.'), { code: 'VALIDATION_ERROR' })
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

/** 계정 삭제 공통 로직 (MASTER 체크 + 트랜잭션) */
async function performAccountDeletion(userId: string) {
  const masterProjects = await prisma.projectMember.findMany({
    where: { userId, role: 'MASTER' },
    include: { project: { select: { name: true } } },
  })
  if (masterProjects.length > 0) {
    const names = masterProjects.map(m => m.project.name).join(', ')
    const err = new Error(`MASTER 권한을 보유한 프로젝트가 있습니다: ${names}. 권한을 이전한 후 탈퇴해 주세요.`)
    ;(err as unknown as { code: string }).code = 'MASTER_ROLE_EXISTS'
    throw err
  }

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.updateMany({ where: { userId }, data: { userId: null } })
    await tx.projectInvitation.deleteMany({ where: { OR: [{ inviterId: userId }, { inviteeId: userId }] } })
    await tx.user.delete({ where: { id: userId } })
  })
}

export async function deleteAccount(userId: string, password: string) {
  await verifyUserPassword(userId, password)
  await performAccountDeletion(userId)
}

/** OAuth 재인증으로 계정 삭제 */
export async function deleteAccountWithOAuth(userId: string, provider: string, idToken: string) {
  if (provider !== 'google') {
    throw Object.assign(new Error('지원하지 않는 OAuth 프로바이더입니다.'), { code: 'UNSUPPORTED_PROVIDER' })
  }

  const googleUser = await verifyGoogleIdToken(idToken)

  const oauthAccount = await prisma.oAuthAccount.findUnique({
    where: { provider_providerSub: { provider: 'google', providerSub: googleUser.sub } },
  })
  if (!oauthAccount || oauthAccount.userId !== userId) {
    throw Object.assign(new Error('Google 인증 정보가 일치하지 않습니다.'), { code: 'INVALID_GOOGLE_TOKEN' })
  }

  await performAccountDeletion(userId)
}

export async function logout(refreshToken: string) {
  await prisma.session.deleteMany({ where: { token: refreshToken } })
}

export async function refresh(refreshToken: string) {
  const session = await prisma.session.findUnique({ where: { token: refreshToken } })
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } })
    throw Object.assign(new Error('세션이 만료되었습니다.'), { code: 'SESSION_EXPIRED' })
  }

  const payload = verifyRefreshToken(refreshToken)
  const accessToken = generateAccessToken({ userId: payload.userId, email: payload.email, username: payload.username })
  return { accessToken }
}
