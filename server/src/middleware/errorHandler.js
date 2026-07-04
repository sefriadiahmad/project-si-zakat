import { AppError } from '../utils/errors.js'

/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', {
      message: err.message,
      code: err.code,
      stack: err.stack,
    })
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }))

    return res.status(400).json({
      message: 'Validasi input gagal',
      errors,
    })
  }

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: err.message,
      code: err.code,
    })
  }

  // Handle Knex errors
  if (err.code === '23505') {
    // Unique violation
    return res.status(400).json({
      message: 'Data sudah ada sebelumnya',
      code: 'DUPLICATE_ENTRY',
    })
  }

  if (err.code === '23503') {
    // Foreign key violation
    return res.status(400).json({
      message: 'Data referensi tidak ditemukan',
      code: 'FOREIGN_KEY_VIOLATION',
    })
  }

  // Handle unknown errors
  return res.status(500).json({
    message: 'Terjadi kesalahan server. Hubungi administrator.',
    code: 'INTERNAL_ERROR',
  })
}

/**
 * Not found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    message: 'Data tidak ditemukan.',
    code: 'NOT_FOUND',
  })
}
