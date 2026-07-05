import rateLimit from 'express-rate-limit'
import { ErrorCodes } from '../utils/errors.js'

const defaultWindowMs = Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60_000
const defaultMax = Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 5

export function createAuthRateLimiter(options = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? defaultWindowMs,
    max: options.max ?? defaultMax,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests ?? true,
    validate: options.validate ?? true,
    message: {
      message: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.',
      code: ErrorCodes.RATE_LIMIT_EXCEEDED,
    },
  })
}

export const authRateLimiter = createAuthRateLimiter()
