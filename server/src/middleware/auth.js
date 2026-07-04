import jwt from 'jsonwebtoken'
import { AppError, ErrorCodes } from '../utils/errors.js'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h'
const JWT_REFRESH_THRESHOLD_MINUTES = parseInt(process.env.JWT_REFRESH_THRESHOLD_MINUTES) || 30

/**
 * Generate JWT token
 * @param {Object} payload - Token payload (user data)
 * @returns {string} JWT token
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

/**
 * Decode token without verification (for checking expiry)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
export function decodeToken(token) {
  return jwt.decode(token)
}

/**
 * Check if token needs refresh (less than threshold minutes remaining)
 * @param {Object} decodedToken - Decoded token
 * @returns {boolean}
 */
export function needsRefresh(decodedToken) {
  const now = Math.floor(Date.now() / 1000)
  const exp = decodedToken.exp
  const thresholdSeconds = JWT_REFRESH_THRESHOLD_MINUTES * 60

  return (exp - now) < thresholdSeconds
}

/**
 * Get time remaining until token expires (in seconds)
 * @param {Object} decodedToken - Decoded token
 * @returns {number} Seconds until expiry
 */
export function getTimeRemaining(decodedToken) {
  const now = Math.floor(Date.now() / 1000)
  return decodedToken.exp - now
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user to request
 * Auto-refreshes token if within 30 minutes of expiry
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token tidak ditemukan', 401, ErrorCodes.UNAUTHORIZED)
    }

    const token = authHeader.substring(7)

    // Verify token
    const decoded = verifyToken(token)

    // Attach user to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: decoded.role,
      fullName: decoded.fullName,
    }

    // Check if token needs refresh
    if (needsRefresh(decoded)) {
      // Generate new token
      const newToken = generateToken({
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        fullName: decoded.fullName,
      })

      // Set refresh token in header
      res.setHeader('X-Refresh-Token', newToken)
    }

    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Sesi berakhir. Silakan login kembali.', 401, ErrorCodes.TOKEN_EXPIRED))
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Token tidak valid', 401, ErrorCodes.UNAUTHORIZED))
    }
    next(error)
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = verifyToken(token)

      req.user = {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        fullName: decoded.fullName,
      }
    }

    next()
  } catch {
    // Silently continue without user
    next()
  }
}
