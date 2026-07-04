import bcrypt from 'bcryptjs'

/**
 * Hash a password using bcrypt with cost factor 12
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} True if password matches
 */
export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

/**
 * Default passwords for seed data (change in production!)
 * These are simple passwords for development/testing only
 */
export const SEED_PASSWORDS = {
  ADMIN: 'admin123',
  KASIR: 'kasir123',
}
