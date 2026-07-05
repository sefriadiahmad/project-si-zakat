import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireAdmin, requireAdminOrKasir } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import {
  getMuzakkiList,
  createMuzakki,
  updateMuzakki,
  toggleMuzakkiStatus,
  getMuzakkiById
} from '../services/muzakki.service.js'

const router = Router()

// Apply authentication middleware to all muzakki routes
router.use(authenticate)

/**
 * GET /api/muzakki
 * List muzakki with search, filter RT, sorting, and pagination.
 */
router.get('/', requireAdminOrKasir, asyncHandler(async (req, res) => {
  const result = await getMuzakkiList(req.query)
  res.json(result)
}))

/**
 * POST /api/muzakki
 * Register a new muzakki.
 */
router.post('/', requireAdminOrKasir, asyncHandler(async (req, res) => {
  const result = await createMuzakki(req.body, req.user)
  res.status(201).json(result)
}))

/**
 * GET /api/muzakki/:id
 * Get single muzakki details.
 */
router.get('/:id', requireAdminOrKasir, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    throw new AppError('ID tidak valid', 400, ErrorCodes.VALIDATION_ERROR)
  }
  const result = await getMuzakkiById(id)
  res.json(result)
}))

/**
 * PUT /api/muzakki/:id
 * Update muzakki data.
 */
router.put('/:id', requireAdminOrKasir, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    throw new AppError('ID tidak valid', 400, ErrorCodes.VALIDATION_ERROR)
  }
  const result = await updateMuzakki(id, req.body, req.user)
  res.json(result)
}))

/**
 * PATCH /api/muzakki/:id/status
 * Toggle status active/inactive (Admin only).
 */
router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    throw new AppError('ID tidak valid', 400, ErrorCodes.VALIDATION_ERROR)
  }
  const { is_active } = req.body
  const result = await toggleMuzakkiStatus(id, is_active, req.user)
  res.json(result)
}))

export default router
