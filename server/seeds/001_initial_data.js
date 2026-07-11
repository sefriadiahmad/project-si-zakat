/**
 * Seed: Initial users and wilayah RT
 *
 * Creates:
 * - Admin Masjid account
 * - Kasir Amil account
 * - Sample wilayah RT entries
 *
 * Requirement: 1.1, 1.2, 11.2 (bcrypt cost 12)
 */

import { hashPassword, SEED_PASSWORDS } from '../src/utils/password.js'

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing entries
  await knex('users').del()

  // Create users
  const adminPassword = await hashPassword(SEED_PASSWORDS.ADMIN)
  const users = [
    {
      username: 'admin',
      password_hash: adminPassword,
      full_name: 'Ahmad Sefriadi',
      role: 'admin_masjid',
      is_active: true,
    },
  ]

  await knex('users').insert(users)

  console.log('✅ Seed completed:')
  console.log('   - Admin Masjid: username=admin, password=' + SEED_PASSWORDS.ADMIN)
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex('users').del()
}
