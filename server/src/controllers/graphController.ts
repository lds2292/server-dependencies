import { Request, Response } from 'express'
import * as graphService from '../services/graphService'
import * as projectService from '../services/projectService'

async function assertProjectAccess(projectId: string, userId: string, res: Response): Promise<boolean> {
  try {
    await projectService.getProjectById(projectId, userId)
    return true
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'NOT_FOUND') { res.status(404).json({ error: e.message }); return false }
    if (e.code === 'ACCESS_DENIED') { res.status(403).json({ error: e.message }); return false }
    res.status(500).json({ error: '서버 오류가 발생했습니다.' }); return false
  }
}

export async function getGraph(req: Request, res: Response): Promise<void> {
  if (!await assertProjectAccess(req.params.id, req.user!.userId, res)) return
  try {
    const data = await graphService.getGraph(req.params.id)
    res.json(data)
  } catch { res.status(500).json({ error: '서버 오류가 발생했습니다.' }) }
}

export async function saveGraph(req: Request, res: Response): Promise<void> {
  if (!await assertProjectAccess(req.params.id, req.user!.userId, res)) return
  try {
    await graphService.saveGraph(req.params.id, req.body)
    res.status(204).send()
  } catch { res.status(500).json({ error: '서버 오류가 발생했습니다.' }) }
}

export async function getPositions(req: Request, res: Response): Promise<void> {
  if (!await assertProjectAccess(req.params.id, req.user!.userId, res)) return
  try {
    const positions = await graphService.getPositions(req.params.id)
    res.json(positions)
  } catch { res.status(500).json({ error: '서버 오류가 발생했습니다.' }) }
}

export async function savePositions(req: Request, res: Response): Promise<void> {
  if (!await assertProjectAccess(req.params.id, req.user!.userId, res)) return
  try {
    await graphService.savePositions(req.params.id, req.body)
    res.status(204).send()
  } catch { res.status(500).json({ error: '서버 오류가 발생했습니다.' }) }
}
