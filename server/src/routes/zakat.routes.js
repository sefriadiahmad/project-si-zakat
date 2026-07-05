import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireAdminOrKasir } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import {
  createZakatMasukSession,
  getZakatMasukBySession,
} from '../services/zakat.service.js'
import { SplitTransaksiSchema, ZakatSessionQuerySchema } from '../schemas/zakat.schema.js'

const router = Router()

router.use(authenticate)

router.post(
  '/masuk',
  requireAdminOrKasir,
  asyncHandler(async (req, res) => {
    const payload = {
      ...req.body,
      items: Array.isArray(req.body.items) ? req.body.items : [],
    }

    const parsed = SplitTransaksiSchema.parse(payload)

    const result = await createZakatMasukSession(parsed, req.user)
    res.status(201).json(result)
  })
)

router.get(
  '/masuk/:sessionId',
  requireAdminOrKasir,
  asyncHandler(async (req, res) => {
    const sessionId = req.params.sessionId
    if (!sessionId) {
      throw new AppError('Session ID wajib diisi', 400, ErrorCodes.VALIDATION_ERROR)
    }

    const result = await getZakatMasukBySession(sessionId)
    res.json(result)
  })
)

export default router
