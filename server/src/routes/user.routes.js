import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import {
  getUsers,
  createUser,
  deleteUser,
  toggleUserStatus,
} from '../services/user.service.js'
import { UserCreateSchema } from '../schemas/user.schema.js'

const router = Router()

router.use(authenticate)

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const users = await getUsers()
  res.json(users)
}))

/**
 * POST /api/users
 * Create a new user (admin only)
 */
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const parsed = UserCreateSchema.parse(req.body)
  const result = await createUser(parsed, req.user)
  res.status(201).json(result)
}))

/**
 * PATCH /api/users/:id/status
 * Toggle user active status (admin only)
 */
router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (Number.isNaN(id)) {
    throw new AppError('ID tidak valid', 400, ErrorCodes.VALIDATION_ERROR)
  }

  const { is_active } = req.body
  if (typeof is_active !== 'boolean') {
    throw new AppError('is_active harus berupa boolean', 400, ErrorCodes.VALIDATION_ERROR)
  }

  const result = await toggleUserStatus(id, is_active, req.user)
  res.json(result)
}))

/**
 * DELETE /api/users/:id
 * Delete a user (admin only)
 */
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (Number.isNaN(id)) {
    throw new AppError('ID tidak valid', 400, ErrorCodes.VALIDATION_ERROR)
  }

  await deleteUser(id, req.user)
  res.status(204).send()
}))

export default router
