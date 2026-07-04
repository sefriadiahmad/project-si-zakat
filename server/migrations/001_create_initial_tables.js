/**
 * Migration: Create initial tables
 *
 * Tables created:
 * - users: User accounts (Admin Masjid, Kasir Amil)
 * - wilayah_rt: RT/zones for geographic organization
 * - muzakki: People who pay zakat
 *
 * Requirement: 11.7 (database constraints)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Create users table
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary()
    table.string('username', 50).notNullable().unique()
    table.string('password_hash', 255).notNullable()
    table.string('full_name', 150).notNullable()
    table.string('role', 20).notNullable().checkIn(['admin_masjid', 'kasir_amil'])
    table.boolean('is_active').notNullable().defaultTo(true)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // Create wilayah_rt table
  await knex.schema.createTable('wilayah_rt', (table) => {
    table.increments('id').primary()
    table.string('nama_rt', 50).notNullable().unique()
    table.text('keterangan')
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // Create muzakki table
  await knex.schema.createTable('muzakki', (table) => {
    table.increments('id').primary()
    table.string('nama_lengkap', 150).notNullable()
    table.string('no_telepon', 20).notNullable().unique()
    table.integer('wilayah_rt_id').unsigned().notNullable()
      .references('id')
      .inTable('wilayah_rt')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.text('alamat_detail')
    table.text('catatan')
    table.boolean('is_active').notNullable().defaultTo(true)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // Create index on muzakki for search optimization (Requirement 2.6)
  await knex.schema.alterTable('muzakki', (table) => {
    table.index('nama_lengkap')
    table.index('no_telepon')
    table.index('wilayah_rt_id')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('muzakki')
  await knex.schema.dropTableIfExists('wilayah_rt')
  await knex.schema.dropTableIfExists('users')
}
