import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireAdminOrKasir } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { getDashboardSummary } from '../services/dashboard.service.js'
import { DashboardQuerySchema } from '../schemas/dashboard.schema.js'

const router = Router()

router.use(authenticate)

router.get('/summary', requireAdminOrKasir, asyncHandler(async (req, res) => {
  const parsed = DashboardQuerySchema.parse(req.query)
  const result = await getDashboardSummary(parsed)
  res.json(result)
}))

export default router
