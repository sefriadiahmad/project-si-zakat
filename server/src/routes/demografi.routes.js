import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import {
  getDemografiSummary,
  getDemografiRTDetail,
} from '../services/demografi.service.js'
import {
  DemografiQuerySchema,
  DemografiRTDetailQuerySchema,
} from '../schemas/demografi.schema.js'

const router = Router()

// All demografi routes require authentication and admin role
router.use(authenticate)
router.use(requireAdmin)

/**
 * GET /api/demografi
 * Get demografi summary for all RTs
 * Requirements: 10.1, 10.2, 10.4, 10.5
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const parsed = DemografiQuerySchema.parse(req.query)
    const result = await getDemografiSummary(parsed || {})
    res.json(result)
  })
)

/**
 * GET /api/demografi/:rtId
 * Get demografi detail for a specific RT
 * Requirements: 10.3, 10.5, 10.6
 */
router.get(
  '/:rtId',
  asyncHandler(async (req, res) => {
    const rtId = parseInt(req.params.rtId, 10)
    if (isNaN(rtId) || rtId <= 0) {
      return res.status(400).json({
        message: 'ID RT tidak valid',
        errors: [{ field: 'rtId', message: 'ID RT harus berupa angka positif' }],
      })
    }

    const parsed = DemografiRTDetailQuerySchema.parse(req.query)
    const result = await getDemografiRTDetail(rtId, parsed || {})
    res.json(result)
  })
)

export default router
