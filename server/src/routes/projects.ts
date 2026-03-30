import { Router } from 'express'
import * as projectController from '../controllers/projectController'
import * as graphController from '../controllers/graphController'
import * as invitationController from '../controllers/invitationController'
import { authenticate } from '../middleware/authenticate'

const router = Router()

router.use(authenticate)

router.get('/', projectController.listProjects)
router.post('/', projectController.createProject)
router.get('/:id', projectController.getProject)
router.patch('/:id', projectController.updateProject)
router.delete('/:id', projectController.deleteProject)

router.post('/:id/invitations', invitationController.sendInvitation)
router.get('/:id/invitations', invitationController.getProjectInvitations)
router.delete('/:id/invitations/:invId', invitationController.cancelInvitation)

router.delete('/:id/members/me', projectController.leaveProject)
router.delete('/:id/members/:userId', projectController.removeMember)
router.patch('/:id/members/:userId/role', projectController.updateMemberRole)

router.get('/:id/graph', graphController.getGraph)
router.put('/:id/graph', graphController.saveGraph)
router.get('/:id/graph/positions', graphController.getPositions)
router.put('/:id/graph/positions', graphController.savePositions)

router.post('/:id/transfer-ownership', projectController.transferOwnership)

router.post('/:id/contacts/unmask', projectController.unmasksContacts)

router.get('/:id/audit-logs', projectController.getAuditLogs)

router.get('/:id/nodes/:nodeId/contacts', projectController.getNodeContacts)
router.put('/:id/nodes/:nodeId/contacts', projectController.saveNodeContacts)

export default router
