import db from '../db.js'
import { SplitTransaksiSchema, ZakatSessionQuerySchema } from '../schemas/zakat.schema.js'
import { auditLog } from '../utils/auditLog.js'
import { AppError, ErrorCodes } from '../utils/errors.js'

export async function createZakatMasukSession(data, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  const parsed = SplitTransaksiSchema.parse(data)

  const sessionId = crypto.randomUUID()

  let insertedRows
  await connection.transaction(async (trx) => {
    const rows = parsed.items.map((item) => ({
      session_id: sessionId,
      muzakki_id: parsed.muzakki_id,
      kasir_id: user.id,
      jenis_zakat: item.jenis_zakat,
      nominal: item.nominal ?? 0,
      berat_kg: item.berat_kg ?? 0,
      jumlah_jiwa: item.jumlah_jiwa ?? null,
      kembalian_infaq: item.kembalian_infaq ?? 0,
      metode_bayar: parsed.metode_bayar,
      no_referensi: parsed.no_referensi ?? null,
      tahun_hijriah: parsed.tahun_hijriah,
      tahun_masehi: parsed.tahun_masehi,
    }))

    const [inserted] = await trx('zakat_masuk').insert(rows).returning('*')
    insertedRows = inserted

    for (const row of inserted) {
      await logMutation(trx, user.id, 'CREATE', 'zakat_masuk', row.id, row)
    }
  })

  return { session_id: sessionId, items: insertedRows }
}

export async function getZakatMasukBySession(sessionId, dependencies = {}) {
  const connection = dependencies.db || db
  const parsed = ZakatSessionQuerySchema.parse({ session_id: sessionId })

  const rows = await connection('zakat_masuk')
    .join('muzakki', 'zakat_masuk.muzakki_id', 'muzakki.id')
    .join('users as kasir', 'zakat_masuk.kasir_id', 'kasir.id')
    .join('wilayah_rt', 'muzakki.wilayah_rt_id', 'wilayah_rt.id')
    .select(
      'zakat_masuk.*',
      'muzakki.nama_lengkap as nama_muzakki',
      'muzakki.no_telepon',
      'wilayah_rt.nama_rt',
      'kasir.full_name as nama_kasir'
    )
    .where('zakat_masuk.session_id', parsed.session_id)
    .orderBy('zakat_masuk.created_at', 'asc')

  if (rows.length === 0) {
    throw new AppError('Transaksi tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
  }

  return rows
}

export async function markZakatSessionPrinted(sessionId, printType, userId, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  const existing = await connection('zakat_masuk').where({ session_id: sessionId }).first()
  if (!existing) {
    throw new AppError('Transaksi tidak ditemukan', 404, ErrorCodes.NOT_FOUND)
  }

  await connection.transaction(async (trx) => {
    await trx('zakat_masuk')
      .where({ session_id: sessionId })
      .update({
        print_at: trx.fn.now(),
        print_type: printType,
      })

    await logMutation(trx, userId, 'UPDATE', 'zakat_masuk', existing.id, {
      print_at: trx.fn.now(),
      print_type: printType,
    })
  })

  return { session_id: sessionId, print_type: printType }
}
