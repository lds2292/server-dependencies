import { Request, Response } from 'express'
import * as authService from '../services/authService'
import * as auditLogService from '../services/auditLogService'
import prisma from '../prisma'
import logger from '../lib/logger'

function getClientInfo(req: Request) {
  return {
    ipAddress: (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password } = req.body
    const user = await authService.register(email, username, password)
    const payload = { userId: user.id, email: user.email, username: user.username }
    const accessToken = authService.generateAccessToken(payload)
    const refreshToken = authService.generateRefreshToken(payload)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)
    await prisma.session.create({ data: { token: refreshToken, userId: user.id, expiresAt } })
    logger.info('AUTH register success', { userId: user.id, email: user.email, username: user.username })
    res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'EMAIL_TAKEN' || e.code === 'USERNAME_TAKEN') {
      logger.warn('AUTH register conflict', { email: req.body.email, code: e.code })
      res.status(409).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH register error', { email: req.body.email, error: (err as Error).message })
      res.status(500).json({ error: '서버 오류가 발생했습니다.' })
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const result = await authService.login(email, password)
    await auditLogService.createAuditLog({
      action: 'LOGIN_SUCCESS', status: 'SUCCESS',
      userId: result.user.id, email: result.user.email, ipAddress, userAgent,
    })
    logger.info('AUTH login success', { userId: result.user.id, email: result.user.email, ipAddress })
    res.json({
      user: { id: result.user.id, email: result.user.email, username: result.user.username, createdAt: result.user.createdAt },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_CREDENTIALS') {
      await auditLogService.createAuditLog({
        action: 'LOGIN_FAILED', status: 'FAILED',
        email, ipAddress, userAgent, failReason: 'INVALID_CREDENTIALS',
      }).catch(() => {})
      logger.warn('AUTH login failed', { email, reason: 'INVALID_CREDENTIALS', ipAddress })
      res.status(401).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH login error', { email, error: (err as Error).message })
      res.status(500).json({ error: '서버 오류가 발생했습니다.' })
    }
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { refreshToken } = req.body
    let userId: string | undefined
    if (refreshToken) {
      const session = await prisma.session.findUnique({ where: { token: refreshToken } })
      userId = session?.userId
      await authService.logout(refreshToken)
    }
    await auditLogService.createAuditLog({
      action: 'LOGOUT', status: 'SUCCESS',
      userId, ipAddress, userAgent,
    }).catch(() => {})
    logger.info('AUTH logout', { userId, ipAddress })
    res.status(204).send()
  } catch (err) {
    logger.error('AUTH logout error', { error: (err as Error).message })
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) { res.status(400).json({ error: 'refreshToken이 필요합니다.' }); return }
    const result = await authService.refresh(refreshToken)
    logger.info('AUTH token refreshed')
    res.json(result)
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === 'SESSION_EXPIRED') {
      logger.warn('AUTH token refresh failed', { reason: 'SESSION_EXPIRED' })
      res.status(401).json({ error: '세션이 만료되었습니다.', code: 'SESSION_EXPIRED' })
    } else {
      logger.warn('AUTH token refresh failed', { reason: 'INVALID_TOKEN', error: (err as Error).message })
      res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
    }
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      logger.warn('AUTH me user not found', { userId: req.user!.userId })
      res.status(404).json({ error: '사용자를 찾을 수 없습니다.' }); return
    }
    const decrypted = authService.decryptUserFields(user)
    res.json({ id: decrypted.id, email: decrypted.email, username: decrypted.username, createdAt: decrypted.createdAt })
  } catch (err) {
    logger.error('AUTH me error', { userId: req.user!.userId, error: (err as Error).message })
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
