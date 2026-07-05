export async function auditLog(trx, userId, operasi, namaTabel, recordId, payload = null) {
  const [entry] = await trx('audit_log')
    .insert({
      user_id: userId ?? null,
      operasi,
      nama_tabel: namaTabel,
      record_id: recordId,
      payload,
    })
    .returning('*')

  return entry
}
