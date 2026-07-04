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
  await knex('wilayah_rt').del()

  // Create users
  const adminPassword = await hashPassword(SEED_PASSWORDS.ADMIN)
  const kasirPassword = await hashPassword(SEED_PASSWORDS.KASIR)

  const users = [
    {
      username: 'admin',
      password_hash: adminPassword,
      full_name: 'Ahmad Fauzi',
      role: 'admin_masjid',
      is_active: true,
    },
    {
      username: 'kasir',
      password_hash: kasirPassword,
      full_name: 'Siti Aminah',
      role: 'kasir_amil',
      is_active: true,
    },
  ]

  await knex('users').insert(users)

  // Create wilayah RT
  const wilayahRT = [
    { nama_rt: 'RT 01', keterangan: 'Blok A - Perumdos' },
    { nama_rt: 'RT 02', keterangan: 'Blok B - Perumdos' },
    { nama_rt: 'RT 03', keterangan: 'Blok C - Perumdos' },
    { nama_rt: 'RT 04', keterangan: 'Blok D - Perumdos' },
    { nama_rt: 'RT 05', keterangan: 'Blok E - Perumdos' },
    { nama_rt: 'RT 06', keterangan: 'Komp. Masjid Al-Ikhlas' },
  ]

  await knex('wilayah_rt').insert(wilayahRT)

  console.log('✅ Seed completed:')
  console.log('   - Admin Masjid: username=admin, password=' + SEED_PASSWORDS.ADMIN)
  console.log('   - Kasir Amil: username=kasir, password=' + SEED_PASSWORDS.KASIR)
  console.log('   - Wilayah RT: 6 entries created')
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex('users').del()
  await knex('wilayah_rt').del()
}
