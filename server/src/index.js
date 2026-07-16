import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'

dotenv.config()

import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { authRateLimiter } from './middleware/rateLimit.js'
import authRoutes from './routes/auth.routes.js'
import muzakkiRoutes from './routes/muzakki.routes.js'
import mustahikRoutes from './routes/mustahik.routes.js'
import wilayahRtRoutes from './routes/wilayahRt.routes.js'
import { MUSTAHIK_UPLOAD_DIR } from './middleware/upload.js'
import zakatRoutes from './routes/zakat.routes.js'
import distribusiRoutes from './routes/distribusi.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import laporanRoutes from './routes/laporan.routes.js'
import publikRoutes from './routes/publik.routes.js'
import demografiRoutes from './routes/demografi.routes.js'
import userRoutes from './routes/user.routes.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}))

app.use(compression())

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use('/uploads/mustahik', express.static(MUSTAHIK_UPLOAD_DIR))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRateLimiter, authRoutes)
app.use('/api/muzakki', muzakkiRoutes)
app.use('/api/mustahik', mustahikRoutes)
app.use('/api/wilayah-rt', wilayahRtRoutes)
app.use('/api/zakat', zakatRoutes)
app.use('/api/distribusi', distribusiRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/laporan', laporanRoutes)
app.use('/api/publik', publikRoutes)
app.use('/api/demografi', demografiRoutes)
app.use('/api/users', userRoutes)

app.use(notFoundHandler)

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV}`)
  })
}

export default app
