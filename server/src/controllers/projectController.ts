import { Request, Response } from 'express'
import * as projectService from '../services/projectService'
import logger from '../lib/logger'

function handleProjectError(err: unknown, res: Response, context?: string): void {
  const e = err as { code?: string; message?: string }
  const ctx = context ?? 'operation'
  if (e.code === 'NOT_FOUND') {
    logger.warn(`PROJECT ${ctx} not found`, { code: e.code })
    res.status(404).json({ error: e.message, code: e.code }); return
  }
  if (e.code === 'ACCESS_DENIED') {
    logger.warn(`PROJECT ${ctx} access denied`, { code: e.code })
    res.status(403).json({ error: e.message, code: e.code }); return
  }
  if (e.code === 'MEMBER_NOT_FOUND') {
    logger.warn(`PROJECT ${ctx} member not found`, { code: e.code })
    res.status(404).json({ error: e.message, code: e.code }); return
  }
  if (e.code === 'ALREADY_MEMBER') {
    logger.warn(`PROJECT ${ctx} already member`, { code: e.code })
    res.status(409).json({ error: e.message, code: e.code }); return
  }
  logger.error(`PROJECT ${ctx} error`, { error: (err as Error).message })
  res.status(500).json({ error: '서버 오류가 발생했습니다.' })
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  try {
    const projects = await projectService.getProjectsForUser(req.user!.userId)
    res.json(projects)
  } catch (err) { handleProjectError(err, res, 'listProjects') }
}

export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user!.userId)
    res.json(project)
  } catch (err) { handleProjectError(err, res, 'getProject') }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const { name, description } = req.body
    const project = await projectService.createProject(name, req.user!.userId, description)
    logger.info('PROJECT created', { projectId: project.id, userId: req.user!.userId, name: project.name })
    res.status(201).json(project)
  } catch (err) { handleProjectError(err, res, 'createProject') }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.updateProject(req.params.id, req.user!.userId, req.body)
    logger.info('PROJECT updated', { projectId: req.params.id, userId: req.user!.userId })
    res.json(project)
  } catch (err) { handleProjectError(err, res, 'updateProject') }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    await projectService.deleteProject(req.params.id, req.user!.userId)
    logger.info('PROJECT deleted', { projectId: req.params.id, userId: req.user!.userId })
    res.status(204).send()
  } catch (err) { handleProjectError(err, res, 'deleteProject') }
}

export async function addMember(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.addMember(req.params.id, req.user!.userId, req.body.identifier)
    logger.info('PROJECT member added', { projectId: req.params.id, actorId: req.user!.userId, identifier: req.body.identifier })
    res.json(project)
  } catch (err) { handleProjectError(err, res, 'addMember') }
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.removeMember(req.params.id, req.user!.userId, req.params.userId)
    logger.info('PROJECT member removed', { projectId: req.params.id, actorId: req.user!.userId, targetUserId: req.params.userId })
    res.json(project)
  } catch (err) { handleProjectError(err, res, 'removeMember') }
}
