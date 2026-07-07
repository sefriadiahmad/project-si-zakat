import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireAdmin, requireAdminOrKasir } from '../middleware/authorize.js'
import { uploadMustahikDocument, handleUploadError } from '../middleware/upload.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import {
  getMustahikList,
  createMustahik,
  verifikasiMustahik,
  getMustahikById,
} from '../services/mustahik.service.js'

const router = Router()

router.use(authenticate)

/**
 * GET /api/mustahik
 * List mustahik with filter status/asnaf/RT and pagination.
 */
router.get('/', requireAdminOrKasir, asyncHandler(async (req, res) => {
  const result = await getMustahikList(req.query)
  res.json(result)
}))

/**
 * POST /api/mustahik
 * Register a new mustahik (status menunggu). Optional dokumen upload.
 */
router.post(
  '/',
  requireAdminOrKasir,
  (req, res, next) => {
    uploadMustahikDocument(req, res, (err) => {
      if (err) return handleUploadError(err, req, res, next)
      next()
    })
  },
  asyncHandler(async (req, res) => {
    const payload = {
      ...req.body,
      dokumen_url: req.file ? `/uploads/mustahik/${req.file.filename}` : null,
    }
    const result = await createMustahik(payload, req.user)
    res.status(201).json(result)
  })
)

/**
 * GET /api/mustahik/:id
 * Get single mustahik details.
 */
router.get('/:id', requireAdminOrKasir, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (Number.isNaN(id)) {
    throw new AppError('ID tidak valid', 400, ErrorCodes.VALIDATION_ERROR)
  }
  const result = await getMustahikById(id)
  res.json(result)
}))

/**
 * PATCH /api/mustahik/:id/verifikasi
 * Admin verifies or rejects a mustahik registration.
 */
router.patch('/:id/verifikasi', requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (Number.isNaN(id)) {
    throw new AppError('ID tidak valid', 400, ErrorCodes.VALIDATION_ERROR)
  }

  // Log the request for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.log('Verifikasi request:', { id, body: req.body, userId: req.user?.id })
  }

  const result = await verifikasiMustahik(id, req.body, req.user)
  res.json(result)
}))

export default router
