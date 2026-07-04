import { AppError, ErrorCodes } from '../utils/errors.js'

/**
 * Role Authorization Middleware
 *
 * Restricts access based on user roles.
 *
 * Usage:
 *   requireRole('admin_masjid')           // Only admin
 *   requireRole(['admin_masjid', 'kasir_amil'])  // Admin or Kasir
 */

/**
 * Create role authorization middleware
 * @param {string|string[]} allowedRoles - Role(s) allowed to access
 * @returns {Function} Express middleware
 */
export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Autentikasi diperlukan', 401, ErrorCodes.UNAUTHORIZED))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Akses ditolak.', 403, ErrorCodes.FORBIDDEN))
    }

    next()
  }
}

/**
 * Middleware: Admin Masjid only
 */
export const requireAdmin = requireRole('admin_masjid')

/**
 * Middleware: Admin Masjid or Kasir Amil
 */
export const requireAdminOrKasir = requireRole(['admin_masjid', 'kasir_amil'])
