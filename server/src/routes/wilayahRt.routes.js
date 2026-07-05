import { Router } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { requireAdminOrKasir } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const router = Router()

router.use(authenticate)
router.use(requireAdminOrKasir)

router.get('/', asyncHandler(async (req, res) => {
  const rtList = await db('wilayah_rt').select('*').orderBy('nama_rt', 'asc')
  res.json(rtList)
}))

export default router
