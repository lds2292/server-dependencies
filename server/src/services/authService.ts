import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'
import type { AuthTokenPayload } from '../types'
import { encrypt, decrypt, hmac } from './cryptoService'

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

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })

  const decrypted = decryptUserFields(user)
  const payload: AuthTokenPayload = { userId: user.id, email: decrypted.email, username: decrypted.username }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.session.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

  return { user: decrypted, accessToken, refreshToken }
}

export async function verifyUserPassword(userId: string, password: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw Object.assign(new Error('비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })
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

export async function deleteAccount(userId: string, password: string) {
  // 비밀번호 확인
  await verifyUserPassword(userId, password)

  // MASTER 역할인 프로젝트가 있으면 탈퇴 차단
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

  // 데이터 변경은 트랜잭션으로 원자성 보장
  await prisma.$transaction(async (tx) => {
    // 감사 로그에서 userId 연결 해제 (기록 보존)
    await tx.auditLog.updateMany({
      where: { userId },
      data: { userId: null },
    })

    // 초대 관련 레코드 삭제
    await tx.projectInvitation.deleteMany({
      where: { OR: [{ inviterId: userId }, { inviteeId: userId }] },
    })

    // 사용자 삭제 (Session, ProjectMember는 onDelete: Cascade로 자동 삭제)
    await tx.user.delete({ where: { id: userId } })
  })
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
