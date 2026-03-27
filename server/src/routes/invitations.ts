import { Router } from 'express'
import * as invitationController from '../controllers/invitationController'
import { authenticate } from '../middleware/authenticate'

const router = Router()

router.use(authenticate)

router.get('/', invitationController.getMyInvitations)
router.patch('/:id/accept', invitationController.acceptInvitation)
router.patch('/:id/reject', invitationController.rejectInvitation)

export default router
