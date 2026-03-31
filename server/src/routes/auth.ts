import { Router } from 'express'
import * as authController from '../controllers/authController'
import { authenticate } from '../middleware/authenticate'

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/google', authController.googleLogin)
router.post('/logout', authController.logout)
router.post('/refresh', authController.refresh)
router.get('/me', authenticate, authController.me)
router.put('/profile', authenticate, authController.updateProfile)
router.put('/password', authenticate, authController.changePassword)
router.delete('/account', authenticate, authController.deleteAccount)

export default router
