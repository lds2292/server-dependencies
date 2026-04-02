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
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
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
    if (e.code === 'ACCOUNT_DEACTIVATED') {
      logger.warn('AUTH login blocked - deactivated', { email, ipAddress })
      res.status(403).json({
        error: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED',
        deactivatedAt: (err as unknown as { deactivatedAt: Date }).deactivatedAt,
      })
    } else if (e.code === 'INVALID_CREDENTIALS') {
      await auditLogService.createAuditLog({
        action: 'LOGIN_FAILED', status: 'FAILED',
        email, ipAddress, userAgent, failReason: 'INVALID_CREDENTIALS',
      }).catch(() => {})
      logger.warn('AUTH login failed', { email, reason: 'INVALID_CREDENTIALS', ipAddress })
      res.status(401).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH login error', { email, error: (err as Error).message })
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
    }
  }
}

export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { idToken } = req.body
    if (!idToken) {
      res.status(400).json({ error: 'idToken is required', code: 'VALIDATION_ERROR' })
      return
    }
    const result = await authService.googleLogin(idToken)
    await auditLogService.createAuditLog({
      action: result.isNewUser ? 'REGISTER_GOOGLE' : 'LOGIN_GOOGLE',
      status: 'SUCCESS',
      userId: result.user.id,
      email: result.user.email,
      ipAddress,
      userAgent,
    })
    logger.info(`AUTH google ${result.isNewUser ? 'register' : 'login'} success`, { userId: result.user.id, email: result.user.email, ipAddress })
    const status = result.isNewUser ? 201 : 200
    res.status(status).json({
      user: { id: result.user.id, email: result.user.email, username: result.user.username, createdAt: result.user.createdAt },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'ACCOUNT_DEACTIVATED') {
      res.status(403).json({
        error: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED',
        deactivatedAt: (err as unknown as { deactivatedAt: Date }).deactivatedAt,
      })
    } else if (e.code === 'INVALID_GOOGLE_TOKEN' || e.code === 'EMAIL_NOT_VERIFIED') {
      logger.warn('AUTH google login failed', { reason: e.code })
      res.status(401).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH google login error', { error: (err as Error).message })
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
    }
  }
}

export async function githubLogin(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { code } = req.body
    if (!code) {
      res.status(400).json({ error: 'code is required', code: 'VALIDATION_ERROR' })
      return
    }
    const result = await authService.githubLogin(code)
    await auditLogService.createAuditLog({
      action: result.isNewUser ? 'REGISTER_GITHUB' : 'LOGIN_GITHUB',
      status: 'SUCCESS',
      userId: result.user.id,
      email: result.user.email,
      ipAddress,
      userAgent,
    })
    logger.info(`AUTH github ${result.isNewUser ? 'register' : 'login'} success`, { userId: result.user.id, email: result.user.email, ipAddress })
    const status = result.isNewUser ? 201 : 200
    res.status(status).json({
      user: { id: result.user.id, email: result.user.email, username: result.user.username, createdAt: result.user.createdAt },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'ACCOUNT_DEACTIVATED') {
      res.status(403).json({
        error: 'Account is deactivated', code: 'ACCOUNT_DEACTIVATED',
        deactivatedAt: (err as unknown as { deactivatedAt: Date }).deactivatedAt,
      })
    } else if (e.code === 'INVALID_GITHUB_TOKEN' || e.code === 'EMAIL_NOT_VERIFIED') {
      logger.warn('AUTH github login failed', { reason: e.code })
      res.status(401).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH github login error', { error: (err as Error).message })
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
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
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) { res.status(400).json({ error: 'refreshToken required', code: 'VALIDATION_ERROR' }); return }
    const result = await authService.refresh(refreshToken)
    logger.info('AUTH token refreshed')
    res.json(result)
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === 'SESSION_EXPIRED') {
      logger.warn('AUTH token refresh failed', { reason: 'SESSION_EXPIRED' })
      res.status(401).json({ error: 'Session expired', code: 'SESSION_EXPIRED' })
    } else {
      logger.warn('AUTH token refresh failed', { reason: 'INVALID_TOKEN', error: (err as Error).message })
      res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' })
    }
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { username } = req.body
    if (!username) {
      res.status(400).json({ error: 'Nothing to update', code: 'VALIDATION_ERROR' })
      return
    }
    if (typeof username !== 'string' || username.length < 2 || username.length > 30) {
      res.status(400).json({ error: 'Username must be 2-30 characters', code: 'VALIDATION_ERROR' })
      return
    }
    const user = await authService.updateProfile(req.user!.userId, { username })
    await auditLogService.createAuditLog({
      action: 'PROFILE_UPDATE', status: 'SUCCESS',
      userId: req.user!.userId, ipAddress, userAgent,
    }).catch(() => {})
    logger.info('AUTH profile updated', { userId: user.id })
    res.json({ id: user.id, email: user.email, username: user.username, createdAt: user.createdAt })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'EMAIL_TAKEN' || e.code === 'USERNAME_TAKEN') {
      res.status(409).json({ error: e.message, code: e.code })
    } else if (e.code === 'VALIDATION_ERROR') {
      res.status(400).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH profile update error', { userId: req.user!.userId, error: (err as Error).message })
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
    }
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current password and new password are required', code: 'VALIDATION_ERROR' })
      return
    }
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters', code: 'VALIDATION_ERROR' })
      return
    }
    await authService.changePassword(req.user!.userId, currentPassword, newPassword)
    await auditLogService.createAuditLog({
      action: 'PASSWORD_CHANGE', status: 'SUCCESS',
      userId: req.user!.userId, ipAddress, userAgent,
    }).catch(() => {})
    logger.info('AUTH password changed', { userId: req.user!.userId })
    res.json({ message: 'Password changed' })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Current password is incorrect', code: e.code })
    } else if (e.code === 'OAUTH_ONLY_ACCOUNT') {
      res.status(403).json({ error: 'No password is set', code: e.code })
    } else if (e.code === 'VALIDATION_ERROR') {
      res.status(400).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH password change error', { userId: req.user!.userId, error: (err as Error).message })
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
    }
  }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { password, provider, idToken } = req.body
    const userId = req.user!.userId

    if (provider && idToken) {
      await authService.deleteAccountWithOAuth(userId, provider, idToken)
    } else if (password) {
      await authService.deleteAccount(userId, password)
    } else {
      res.status(400).json({ error: 'Verification information is required', code: 'VALIDATION_ERROR' })
      return
    }

    await auditLogService.createAuditLog({
      action: 'ACCOUNT_DEACTIVATE', status: 'SUCCESS',
      email: req.user!.email, ipAddress, userAgent,
    }).catch(() => {})
    logger.info('AUTH account deleted', { userId, ipAddress })
    res.status(204).send()
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid password', code: e.code })
    } else if (e.code === 'INVALID_GOOGLE_TOKEN' || e.code === 'INVALID_OAUTH_TOKEN' || e.code === 'INVALID_GITHUB_TOKEN') {
      res.status(401).json({ error: 'OAuth authentication failed', code: e.code })
    } else if (e.code === 'UNSUPPORTED_PROVIDER') {
      res.status(400).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH account delete error', { userId: req.user!.userId, error: (err as Error).message })
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
    }
  }
}

export async function reactivateAccount(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { email, password, provider, idToken } = req.body

    let result
    if (provider && idToken) {
      result = await authService.reactivateAccountWithOAuth(provider, idToken)
    } else if (email && password) {
      result = await authService.reactivateAccount(email, password)
    } else {
      res.status(400).json({ error: 'Email and password, or OAuth credentials required', code: 'VALIDATION_ERROR' })
      return
    }

    await auditLogService.createAuditLog({
      action: 'ACCOUNT_REACTIVATE', status: 'SUCCESS',
      userId: result.user.id, email: result.user.email, ipAddress, userAgent,
    }).catch(() => {})
    logger.info('AUTH account reactivated', { userId: result.user.id, ipAddress })

    res.json({
      user: { id: result.user.id, email: result.user.email, username: result.user.username, createdAt: result.user.createdAt },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: 'Invalid credentials', code: e.code })
    } else if (e.code === 'ACCOUNT_NOT_DEACTIVATED') {
      res.status(400).json({ error: e.message, code: e.code })
    } else if (e.code === 'RECOVERY_EXPIRED') {
      res.status(410).json({ error: 'Recovery period has expired', code: e.code })
    } else if (e.code === 'INVALID_GOOGLE_TOKEN' || e.code === 'INVALID_GITHUB_TOKEN') {
      res.status(401).json({ error: 'OAuth authentication failed', code: e.code })
    } else {
      logger.error('AUTH reactivate error', { error: (err as Error).message })
      res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
    }
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) {
      logger.warn('AUTH me user not found', { userId: req.user!.userId })
      res.status(404).json({ error: 'User not found', code: 'NOT_FOUND' }); return
    }
    const decrypted = authService.decryptUserFields(user)
    const oauthAccounts = await prisma.oAuthAccount.findMany({
      where: { userId: decrypted.id },
      select: { provider: true },
    })
    res.json({
      id: decrypted.id,
      email: decrypted.email,
      username: decrypted.username,
      createdAt: decrypted.createdAt,
      hasPassword: user.passwordHash !== null,
      providers: oauthAccounts.map(a => a.provider),
    })
  } catch (err) {
    logger.error('AUTH me error', { userId: req.user!.userId, error: (err as Error).message })
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' })
  }
}
