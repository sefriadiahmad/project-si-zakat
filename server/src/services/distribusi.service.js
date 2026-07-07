import db from '../db.js'
import { auditLog } from '../utils/auditLog.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import { ZakatKeluarSchema } from '../schemas/distribusi.schema.js'

export async function hitungKuota(tahunHijriah, tahunMasehi, dependencies = {}) {
  const connection = dependencies.db || db

  // Build query base
  let query = connection('zakat_masuk')

  // Apply filters if provided
  if (tahunHijriah) {
    query = query.where('tahun_hijriah', parseInt(tahunHijriah, 10))
  }
  if (tahunMasehi) {
    query = query.where('tahun_masehi', parseInt(tahunMasehi, 10))
  }

  const masuk = await query
    .sum({
      total_uang: connection.raw(
        "CASE WHEN jenis_zakat IN ('fitrah_uang','mal','fidyah','infaq') THEN nominal ELSE 0 END"
      ),
      total_beras: connection.raw(
        "CASE WHEN jenis_zakat = 'fitrah_beras' THEN berat_kg ELSE 0 END"
      ),
    })
    .first()

  const mustahik = await connection('mustahik_asnaf')
    .where('status_verifikasi', 'terverifikasi')
    .sum({ total_tanggungan: 'jumlah_tanggungan' })
    .first()

  const totalUang = Number(masuk?.total_uang || 0)
  const totalBeras = Number(masuk?.total_beras || 0)
  const totalTanggungan = Number(mustahik?.total_tanggungan || 0)

  if (totalTanggungan === 0) {
    throw new AppError('Belum ada mustahik terverifikasi', 400, ErrorCodes.NO_VERIFIED_MUSTAHIK)
  }

  return {
    kuota_uang_per_jiwa: Number((totalUang / totalTanggungan).toFixed(2)),
    kuota_beras_per_jiwa: Number((totalBeras / totalTanggungan).toFixed(3)),
    total_uang_masuk: totalUang,
    total_beras_masuk: totalBeras,
    total_tanggungan: totalTanggungan,
  }
}

export async function rekomendasiPerMustahik(mustahikList, kuota, dependencies = {}) {
  return (mustahikList || []).map((m) => {
    const tanggungan = Number(m.jumlah_tanggungan || 0)
    return {
      ...m,
      rekomendasi_uang: Number((tanggungan * kuota.kuota_uang_per_jiwa).toFixed(2)),
      rekomendasi_beras: Number((tanggungan * kuota.kuota_beras_per_jiwa).toFixed(3)),
    }
  })
}

export async function getDistribusiKuota(queryParams = {}, dependencies = {}) {
  const connection = dependencies.db || db
  const { tahun_hijriah, tahun_masehi } = queryParams

  const kuota = await hitungKuota(tahun_hijriah, tahun_masehi, { db: connection })

  const mustahikList = await connection('mustahik_asnaf')
    .where('status_verifikasi', 'terverifikasi')
    .select('id', 'nama_kepala_keluarga', 'kategori_asnaf', 'jumlah_tanggungan', 'wilayah_rt_id')

  const rekomendasi = await rekomendasiPerMustahik(mustahikList, kuota, { db: connection })

  return {
    ...kuota,
    rekomendasi,
  }
}

export async function createZakatKeluar(data, user, dependencies = {}) {
  const connection = dependencies.db || db
  const logMutation = dependencies.auditLog || auditLog

  const parsed = ZakatKeluarSchema.parse(data)

  let inserted
  await connection.transaction(async (trx) => {
    const [row] = await trx('zakat_keluar')
      .insert({
        mustahik_id: parsed.mustahik_id,
        admin_id: user.id,
        nominal: parsed.nominal || 0,
        berat_kg: parsed.berat_kg || 0,
        keterangan: parsed.keterangan || null,
        tahun_hijriah: parsed.tahun_hijriah,
        tahun_masehi: parsed.tahun_masehi,
      })
      .returning('*')

    inserted = row
    await logMutation(trx, user.id, 'CREATE', 'zakat_keluar', inserted.id, inserted)
  })

  return inserted
}
