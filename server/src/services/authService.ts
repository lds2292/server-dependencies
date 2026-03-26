import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'
import type { AuthTokenPayload } from '../types'

const SALT_ROUNDS = 12

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
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
  const existingEmail = await prisma.user.findUnique({ where: { email } })
  if (existingEmail) throw Object.assign(new Error('이미 사용 중인 이메일입니다.'), { code: 'EMAIL_TAKEN' })

  const existingUsername = await prisma.user.findUnique({ where: { username } })
  if (existingUsername) throw Object.assign(new Error('이미 사용 중인 사용자명입니다.'), { code: 'USERNAME_TAKEN' })

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  })
  return user
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw Object.assign(new Error('이메일 또는 비밀번호가 올바르지 않습니다.'), { code: 'INVALID_CREDENTIALS' })

  const payload: AuthTokenPayload = { userId: user.id, email: user.email, username: user.username }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.session.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

  return { user, accessToken, refreshToken }
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
