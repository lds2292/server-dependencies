import { Request, Response } from 'express'
import * as projectService from '../services/projectService'

function handleProjectError(err: unknown, res: Response): void {
  const e = err as { code?: string; message?: string }
  if (e.code === 'NOT_FOUND') { res.status(404).json({ error: e.message, code: e.code }); return }
  if (e.code === 'ACCESS_DENIED') { res.status(403).json({ error: e.message, code: e.code }); return }
  if (e.code === 'MEMBER_NOT_FOUND') { res.status(404).json({ error: e.message, code: e.code }); return }
  if (e.code === 'ALREADY_MEMBER') { res.status(409).json({ error: e.message, code: e.code }); return }
  res.status(500).json({ error: '서버 오류가 발생했습니다.' })
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  try {
    const projects = await projectService.getProjectsForUser(req.user!.userId)
    res.json(projects)
  } catch (err) { handleProjectError(err, res) }
}

export async function getProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.getProjectById(req.params.id, req.user!.userId)
    res.json(project)
  } catch (err) { handleProjectError(err, res) }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const { name, description } = req.body
    const project = await projectService.createProject(name, req.user!.userId, description)
    res.status(201).json(project)
  } catch (err) { handleProjectError(err, res) }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.updateProject(req.params.id, req.user!.userId, req.body)
    res.json(project)
  } catch (err) { handleProjectError(err, res) }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    await projectService.deleteProject(req.params.id, req.user!.userId)
    res.status(204).send()
  } catch (err) { handleProjectError(err, res) }
}

export async function addMember(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.addMember(req.params.id, req.user!.userId, req.body.identifier)
    res.json(project)
  } catch (err) { handleProjectError(err, res) }
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.removeMember(req.params.id, req.user!.userId, req.params.userId)
    res.json(project)
  } catch (err) { handleProjectError(err, res) }
}
