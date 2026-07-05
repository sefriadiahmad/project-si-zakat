import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import {
  getDistribusiKuota,
  createZakatKeluar,
} from '../services/distribusi.service.js'
import {
  DistribusiKuotaQuerySchema,
  ZakatKeluarSchema,
} from '../schemas/distribusi.schema.js'

const router = Router()

router.use(authenticate)

router.get('/kuota', requireAdmin, asyncHandler(async (req, res) => {
  const parsed = DistribusiKuotaQuerySchema.parse(req.query)
  const result = await getDistribusiKuota(parsed)
  res.json(result)
}))

router.get('/rekomendasi', requireAdmin, asyncHandler(async (req, res) => {
  const parsed = DistribusiKuotaQuerySchema.parse(req.query)
  const result = await getDistribusiKuota(parsed)
  res.json({ rekomendasi: result.rekomendasi })
}))

router.post('/zakat-keluar', requireAdmin, asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    tahun_hijriah: req.body.tahun_hijriah || req.query.tahun_hijriah,
    tahun_masehi: req.body.tahun_masehi || req.query.tahun_masehi,
  }
  const parsed = ZakatKeluarSchema.parse(payload)
  const result = await createZakatKeluar(parsed, req.user)
  res.status(201).json(result)
}))

export default router
