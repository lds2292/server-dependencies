import { Request, Response } from 'express'
import * as projectService from '../services/projectService'
import * as authService from '../services/authService'
import * as graphService from '../services/graphService'
import * as auditLogService from '../services/auditLogService'
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
    const { identifier, role } = req.body
    if (!role) { res.status(400).json({ error: 'role은 필수입니다.' }); return }
    const project = await projectService.addMember(req.params.id, req.user!.userId, identifier, role)
    await auditLogService.createAuditLog({
      userId: req.user!.userId, projectId: req.params.id, action: 'MEMBER_ADDED', status: 'SUCCESS',
    }).catch(() => {})
    logger.info('PROJECT member added', { projectId: req.params.id, actorId: req.user!.userId, identifier, role })
    res.json(project)
  } catch (err) { handleProjectError(err, res, 'addMember') }
}

export async function removeMember(req: Request, res: Response): Promise<void> {
  try {
    const project = await projectService.removeMember(req.params.id, req.user!.userId, req.params.userId)
    await auditLogService.createAuditLog({
      userId: req.user!.userId, projectId: req.params.id, action: 'MEMBER_REMOVED', status: 'SUCCESS',
    }).catch(() => {})
    logger.info('PROJECT member removed', { projectId: req.params.id, actorId: req.user!.userId, targetUserId: req.params.userId })
    res.json(project)
  } catch (err) { handleProjectError(err, res, 'removeMember') }
}

export async function updateMemberRole(req: Request, res: Response): Promise<void> {
  try {
    const { role } = req.body
    if (!role) { res.status(400).json({ error: 'role은 필수입니다.' }); return }
    const project = await projectService.updateMemberRole(req.params.id, req.user!.userId, req.params.userId, role)
    const auditAction = role === 'MASTER' ? 'OWNERSHIP_TRANSFERRED' : 'MEMBER_ROLE_CHANGED'
    await auditLogService.createAuditLog({
      userId: req.user!.userId, projectId: req.params.id, action: auditAction, status: 'SUCCESS',
    }).catch(() => {})
    logger.info(`PROJECT ${auditAction}`, { projectId: req.params.id, actorId: req.user!.userId, targetUserId: req.params.userId, role })
    res.json(project)
  } catch (err) { handleProjectError(err, res, 'updateMemberRole') }
}

export async function leaveProject(req: Request, res: Response): Promise<void> {
  try {
    await projectService.leaveProject(req.params.id, req.user!.userId)
    await auditLogService.createAuditLog({
      userId: req.user!.userId, projectId: req.params.id, action: 'MEMBER_REMOVED', status: 'SUCCESS',
    }).catch(() => {})
    logger.info('PROJECT leaveProject', { projectId: req.params.id, userId: req.user!.userId })
    res.status(204).send()
  } catch (err) { handleProjectError(err, res, 'leaveProject') }
}

export async function unmasksContacts(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const { nodeId, password } = req.body
  const userId = req.user!.userId
  const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ?? req.socket.remoteAddress
  const userAgent = req.headers['user-agent']
  try {
    await authService.verifyUserPassword(userId, password)
    const contacts = await graphService.getRawNodeContacts(id, nodeId)
    if (contacts === null) {
      res.status(404).json({ error: '노드를 찾을 수 없습니다.' }); return
    }
    await auditLogService.createAuditLog({
      userId, projectId: id, action: 'UNMASK_CONTACTS', status: 'SUCCESS',
      nodeId, ipAddress, userAgent,
    })
    logger.info('PROJECT unmasksContacts success', { projectId: id, userId, nodeId, ipAddress })
    res.json({ contacts })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_CREDENTIALS') {
      await auditLogService.createAuditLog({
        userId, projectId: id, action: 'UNMASK_CONTACTS', status: 'FAILED',
        nodeId, ipAddress, userAgent, failReason: 'INVALID_CREDENTIALS',
      }).catch(() => {})
      logger.warn('PROJECT unmasksContacts failed - invalid credentials', { projectId: id, userId, nodeId, ipAddress })
      res.status(401).json({ error: e.message, code: e.code }); return
    }
    logger.error('PROJECT unmasksContacts error', { projectId: id, userId, error: (err as Error).message })
    res.status(500).json({ error: '서버 오류가 발생했습니다.' })
  }
}

export async function getAuditLogs(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  try {
    await projectService.checkPermission(id, req.user!.userId, 'view_audit_logs')
    const logs = await auditLogService.getAuditLogs(id)
    res.json({ logs })
  } catch (err) { handleProjectError(err, res, 'getAuditLogs') }
}

export async function getNodeContacts(req: Request, res: Response): Promise<void> {
  const { id, nodeId } = req.params
  try {
    const contacts = await graphService.getRawNodeContacts(id, nodeId)
    res.json({ contacts: contacts ?? [] })
  } catch (err) { handleProjectError(err, res, 'getNodeContacts') }
}

const PHONE_REGEX = /^(01[016789]\d{7,8}|02\d{7,8}|0[3-9]\d{8,9}|1[5-6]\d{6})$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

function validateContacts(contacts: unknown): { index: number; field: string; message: string }[] {
  if (!Array.isArray(contacts)) return []
  return contacts.flatMap((c: { phone?: string; email?: string }, i) => {
    const errs: { index: number; field: string; message: string }[] = []
    if (c.phone?.trim() && !PHONE_REGEX.test(c.phone.trim()))
      errs.push({ index: i, field: 'phone', message: '올바르지 않은 전화번호 형식입니다.' })
    if (c.email?.trim() && !EMAIL_REGEX.test(c.email.trim()))
      errs.push({ index: i, field: 'email', message: '올바르지 않은 이메일 형식입니다.' })
    return errs
  })
}

export async function saveNodeContacts(req: Request, res: Response): Promise<void> {
  const { id, nodeId } = req.params
  const { contacts } = req.body
  try {
    const errors = validateContacts(contacts)
    if (errors.length > 0) {
      res.status(400).json({ error: '유효하지 않은 연락처 데이터가 있습니다.', details: errors })
      return
    }
    await graphService.saveNodeContacts(id, nodeId, contacts)
    res.json({ ok: true })
  } catch (err) { handleProjectError(err, res, 'saveNodeContacts') }
}
