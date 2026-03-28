import { Request, Response } from 'express'
import * as invitationService from '../services/invitationService'
import * as auditLogService from '../services/auditLogService'
import logger from '../lib/logger'

function handleError(err: unknown, res: Response, context: string): void {
  const e = err as { code?: string; message?: string }
  if (e.code === 'NOT_FOUND') { res.status(404).json({ error: e.message, code: e.code }); return }
  if (e.code === 'ACCESS_DENIED') { res.status(403).json({ error: e.message, code: e.code }); return }
  if (e.code === 'ALREADY_MEMBER') { res.status(409).json({ error: e.message, code: e.code }); return }
  if (e.code === 'ALREADY_INVITED') { res.status(409).json({ error: e.message, code: e.code }); return }
  if (e.code === 'ALREADY_PROCESSED') { res.status(409).json({ error: e.message, code: e.code }); return }
  logger.error(`INVITATION ${context} error`, { error: (err as Error).message })
  res.status(500).json({ error: '서버 오류가 발생했습니다.' })
}

export async function sendInvitation(req: Request, res: Response): Promise<void> {
  try {
    const { identifier, role } = req.body
    if (!identifier || !role) { res.status(400).json({ error: 'identifier와 role은 필수입니다.' }); return }
    const invitation = await invitationService.sendInvitation(req.params.id, req.user!.userId, identifier, role)
    await auditLogService.createAuditLog({
      userId: req.user!.userId, projectId: req.params.id, action: 'INVITATION_SENT', status: 'SUCCESS',
      detail: JSON.stringify({ identifier }),
    }).catch(() => {})
    logger.info('INVITATION sent', { projectId: req.params.id, inviterId: req.user!.userId, identifier, role })
    res.status(201).json(invitation)
  } catch (err) { handleError(err, res, 'sendInvitation') }
}

export async function getProjectInvitations(req: Request, res: Response): Promise<void> {
  try {
    const invitations = await invitationService.getProjectInvitations(req.params.id, req.user!.userId)
    res.json(invitations)
  } catch (err) { handleError(err, res, 'getProjectInvitations') }
}

export async function cancelInvitation(req: Request, res: Response): Promise<void> {
  try {
    await invitationService.cancelInvitation(req.params.invId, req.user!.userId, req.params.id)
    await auditLogService.createAuditLog({
      userId: req.user!.userId, projectId: req.params.id, action: 'INVITATION_CANCELLED', status: 'SUCCESS',
    }).catch(() => {})
    logger.info('INVITATION cancelled', { projectId: req.params.id, invId: req.params.invId, actorId: req.user!.userId })
    res.status(204).send()
  } catch (err) { handleError(err, res, 'cancelInvitation') }
}

export async function getMyInvitations(req: Request, res: Response): Promise<void> {
  try {
    const invitations = await invitationService.getMyInvitations(req.user!.userId)
    res.json(invitations)
  } catch (err) { handleError(err, res, 'getMyInvitations') }
}

export async function acceptInvitation(req: Request, res: Response): Promise<void> {
  try {
    await invitationService.respondInvitation(req.params.id, req.user!.userId, 'accept')
    await auditLogService.createAuditLog({
      userId: req.user!.userId, action: 'INVITATION_ACCEPTED', status: 'SUCCESS',
    }).catch(() => {})
    logger.info('INVITATION accepted', { invitationId: req.params.id, userId: req.user!.userId })
    res.status(204).send()
  } catch (err) { handleError(err, res, 'acceptInvitation') }
}

export async function rejectInvitation(req: Request, res: Response): Promise<void> {
  try {
    await invitationService.respondInvitation(req.params.id, req.user!.userId, 'reject')
    await auditLogService.createAuditLog({
      userId: req.user!.userId, action: 'INVITATION_REJECTED', status: 'SUCCESS',
    }).catch(() => {})
    logger.info('INVITATION rejected', { invitationId: req.params.id, userId: req.user!.userId })
    res.status(204).send()
  } catch (err) { handleError(err, res, 'rejectInvitation') }
}
