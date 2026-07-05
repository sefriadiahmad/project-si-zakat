import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import { requireAdmin } from '../middleware/authorize.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { AppError, ErrorCodes } from '../utils/errors.js'
import { getLaporanExportData } from '../services/laporan.service.js'
import { LaporanExportQuerySchema } from '../schemas/laporan.schema.js'
import * as XLSX from 'xlsx'
import { buildWorkbook } from '../lib/xlsx.js'
import { buildPdfLaporan } from '../lib/pdf.js'

const router = Router()

router.use(authenticate)

router.get('/export', requireAdmin, asyncHandler(async (req, res) => {
  const parsed = LaporanExportQuerySchema.parse(req.query)

  const startTime = Date.now()
  const result = await getLaporanExportData(parsed)
  const duration = Date.now() - startTime

  if (duration > 10000) {
    throw new AppError('Laporan gagal dibuat. Coba lagi atau perkecil rentang periode.', 504, ErrorCodes.TIMEOUT)
  }

  if (parsed.format === 'xlsx') {
    const workbook = await buildWorkbook(result.data)
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename=laporan-zakat-${Date.now()}.xlsx`)
    res.send(Buffer.from(buffer))
    return
  }

  const doc = await buildPdfLaporan(result.data, parsed, {
    MASJID_NAME: 'Masjid example',
    ADMIN_NAME: 'Admin',
    ADMIN_JABATAN: 'Admin Masjid',
  })
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename=laporan-zakat-${Date.now()}.pdf`)
  res.send(pdfBuffer)
}))

export default router
