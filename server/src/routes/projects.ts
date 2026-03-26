import { Router } from 'express'
import * as projectController from '../controllers/projectController'
import * as graphController from '../controllers/graphController'
import { authenticate } from '../middleware/authenticate'

const router = Router()

router.use(authenticate)

router.get('/', projectController.listProjects)
router.post('/', projectController.createProject)
router.get('/:id', projectController.getProject)
router.patch('/:id', projectController.updateProject)
router.delete('/:id', projectController.deleteProject)

router.post('/:id/members', projectController.addMember)
router.delete('/:id/members/:userId', projectController.removeMember)

router.get('/:id/graph', graphController.getGraph)
router.put('/:id/graph', graphController.saveGraph)
router.get('/:id/graph/positions', graphController.getPositions)
router.put('/:id/graph/positions', graphController.savePositions)

export default router
