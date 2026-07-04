/**
 * Migration: Create transaction and audit tables
 *
 * Tables created:
 * - mustahik_asnaf: Zakat recipients with asnaf category
 * - zakat_masuk: Incoming zakat transactions
 * - zakat_keluar: Outgoing distribution transactions
 * - audit_log: Audit trail for all mutations
 *
 * Requirement: 11.7 (database constraints)
 * Requirement: 6.8 (index on tahun_hijriah, tahun_masehi for performance)
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Create mustahik_asnaf table
  await knex.schema.createTable('mustahik_asnaf', (table) => {
    table.increments('id').primary()
    table.string('nama_kepala_keluarga', 150).notNullable()
    table.integer('wilayah_rt_id').unsigned().notNullable()
      .references('id')
      .inTable('wilayah_rt')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.string('kategori_asnaf', 20).notNullable()
      .checkIn(['fakir', 'miskin', 'amil', 'mualaf', 'riqab', 'gharim', 'fisabilillah', 'ibnu_sabil'])
    table.integer('jumlah_tanggungan', 2).notNullable()
      .checkBetween([1, 99])
    table.text('dokumen_url')
    table.string('status_verifikasi', 20).notNullable().defaultTo('menunggu')
      .checkIn(['menunggu', 'terverifikasi', 'ditolak'])
    table.string('alasan_penolakan', 500)
    table.integer('verified_by').unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
    table.timestamp('verified_at', { useTz: true })
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // Create index on mustahik_asnaf
  await knex.schema.alterTable('mustahik_asnaf', (table) => {
    table.index('status_verifikasi')
    table.index('kategori_asnaf')
    table.index('wilayah_rt_id')
  })

  // Create zakat_masuk table
  await knex.schema.createTable('zakat_masuk', (table) => {
    table.increments('id').primary()
    table.uuid('session_id').notNullable()
    table.integer('muzakki_id').unsigned().notNullable()
      .references('id')
      .inTable('muzakki')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.integer('kasir_id').unsigned().notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.string('jenis_zakat', 30).notNullable()
      .checkIn(['fitrah_uang', 'fitrah_beras', 'mal', 'fidyah', 'infaq'])
    table.decimal('nominal', 17, 2).defaultTo(0)
    table.decimal('berat_kg', 10, 3).defaultTo(0)
    table.integer('jumlah_jiwa', 2)
    table.decimal('kembalian_infaq', 17, 2).defaultTo(0)
    table.string('metode_bayar', 20).notNullable()
      .checkIn(['tunai', 'transfer', 'qris'])
    table.string('no_referensi', 50)
    table.integer('tahun_hijriah', 2).notNullable()
    table.integer('tahun_masehi', 2).notNullable()
    table.timestamp('print_at', { useTz: true })
    table.string('print_type', 10)
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // Create indexes on zakat_masuk for performance (Requirement 6.8)
  await knex.schema.alterTable('zakat_masuk', (table) => {
    table.index(['tahun_hijriah', 'tahun_masehi'])
    table.index('session_id')
    table.index('muzakki_id')
    table.index('jenis_zakat')
  })

  // Create zakat_keluar table
  await knex.schema.createTable('zakat_keluar', (table) => {
    table.increments('id').primary()
    table.integer('mustahik_id').unsigned().notNullable()
      .references('id')
      .inTable('mustahik_asnaf')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.integer('admin_id').unsigned().notNullable()
      .references('id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('CASCADE')
    table.decimal('nominal', 17, 2).defaultTo(0)
    table.decimal('berat_kg', 10, 3).defaultTo(0)
    table.text('keterangan')
    table.integer('tahun_hijriah', 2).notNullable()
    table.integer('tahun_masehi', 2).notNullable()
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // Create indexes on zakat_keluar for performance (Requirement 6.8)
  await knex.schema.alterTable('zakat_keluar', (table) => {
    table.index(['tahun_hijriah', 'tahun_masehi'])
    table.index('mustahik_id')
  })

  // Create audit_log table
  await knex.schema.createTable('audit_log', (table) => {
    table.increments('id').primary()
    table.integer('user_id').unsigned()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL')
      .onUpdate('CASCADE')
    table.string('operasi', 10).notNullable()
      .checkIn(['CREATE', 'UPDATE', 'DELETE'])
    table.string('nama_tabel', 50).notNullable()
    table.integer('record_id').notNullable()
    table.jsonb('payload')
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now())
  })

  // Create index on audit_log
  await knex.schema.alterTable('audit_log', (table) => {
    table.index('user_id')
    table.index('nama_tabel')
    table.index('record_id')
    table.index('created_at')
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_log')
  await knex.schema.dropTableIfExists('zakat_keluar')
  await knex.schema.dropTableIfExists('zakat_masuk')
  await knex.schema.dropTableIfExists('mustahik_asnaf')
}
