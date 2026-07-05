import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { v4 as uuidv4 } from 'uuid'
import { AppError, ErrorCodes } from '../utils/errors.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const MUSTAHIK_UPLOAD_DIR = path.join(__dirname, '../../uploads/mustahik')

const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/png']
const ALLOWED_EXT = ['.pdf', '.jpg', '.jpeg', '.png']

if (!fs.existsSync(MUSTAHIK_UPLOAD_DIR)) {
  fs.mkdirSync(MUSTAHIK_UPLOAD_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, MUSTAHIK_UPLOAD_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${uuidv4()}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()

  if (ALLOWED_MIMES.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    cb(null, true)
    return
  }

  cb(new AppError('Format dokumen harus PDF, JPG, atau PNG', 400, ErrorCodes.VALIDATION_ERROR))
}

export const uploadMustahikDocument = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter,
}).single('dokumen')

export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(
        new AppError('Ukuran dokumen maksimal 2 MB', 400, ErrorCodes.VALIDATION_ERROR)
      )
    }
    return next(new AppError(err.message, 400, ErrorCodes.VALIDATION_ERROR))
  }

  return next(err)
}
