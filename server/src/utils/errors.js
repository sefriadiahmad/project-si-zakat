/**
 * Custom Application Error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

/**
 * Error codes
 */
export const ErrorCodes = {
  // Authentication
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Authorization
  FORBIDDEN: 'FORBIDDEN',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  PHONE_EXISTS: 'PHONE_EXISTS',

  // Business logic
  NO_VERIFIED_MUSTAHIK: 'NO_VERIFIED_MUSTAHIK',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Not found
  NOT_FOUND: 'NOT_FOUND',

  // Timeout
  TIMEOUT: 'TIMEOUT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
}
