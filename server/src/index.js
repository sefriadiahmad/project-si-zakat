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
import wilayahRtRoutes from './routes/wilayahRt.routes.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(helmet())

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use(compression())

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRateLimiter, authRoutes)
app.use('/api/muzakki', muzakkiRoutes)
app.use('/api/wilayah-rt', wilayahRtRoutes)

app.use(notFoundHandler)

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
    console.log(`API Base: http://localhost:${PORT}/api`)
  })
}

export default app
