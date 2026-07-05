import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import { getPublikSummary, getKalkulatorConfig } from '../services/publik.service.js'
import { PublikSummaryQuerySchema } from '../schemas/publik.schema.js'

const router = Router()

router.get('/summary', asyncHandler(async (req, res) => {
  const parsed = PublikSummaryQuerySchema.parse(req.query)
  const result = await getPublikSummary(parsed)
  res.json(result)
}))

router.get('/kalkulator-config', asyncHandler(async (req, res) => {
  const result = await getKalkulatorConfig()
  res.json(result)
}))

export default router
