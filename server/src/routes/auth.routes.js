import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { login, refreshTokenForUser } from '../services/auth.service.js'

const router = Router()

router.post('/login', asyncHandler(async (req, res) => {
  const result = await login(req.body)

  res.json(result)
}))

router.post('/logout', authenticate, (req, res) => {
  res.status(204).send()
})

router.post('/refresh', authenticate, (req, res) => {
  res.json({ token: refreshTokenForUser(req.user) })
})

export default router
