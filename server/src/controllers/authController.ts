import { Request, Response } from 'express'
import * as authService from '../services/authService'
import prisma from '../prisma'

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
    res.status(201).json({
      user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt },
      accessToken,
      refreshToken,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'EMAIL_TAKEN' || e.code === 'USERNAME_TAKEN') {
      res.status(409).json({ error: e.message, code: e.code })
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다.' })
    }
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    res.json({
      user: { id: result.user.id, email: result.user.email, username: result.user.username, createdAt: result.user.createdAt },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: e.message, code: e.code })
    } else {
      res.status(500).json({ error: '서버 오류가 발생했습니다.' })
    }
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body
    if (refreshToken) await authService.logout(refreshToken)
    res.status(204).send()
  } catch {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) { res.status(400).json({ error: 'refreshToken이 필요합니다.' }); return }
    const result = await authService.refresh(refreshToken)
    res.json(result)
  } catch (err: unknown) {
    const e = err as { code?: string }
    if (e.code === 'SESSION_EXPIRED') {
      res.status(401).json({ error: '세션이 만료되었습니다.', code: 'SESSION_EXPIRED' })
    } else {
      res.status(401).json({ error: '유효하지 않은 토큰입니다.' })
    }
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    if (!user) { res.status(404).json({ error: '사용자를 찾을 수 없습니다.' }); return }
    res.json({ id: user.id, email: user.email, username: user.username, createdAt: user.createdAt })
  } catch {
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}
