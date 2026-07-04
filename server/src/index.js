import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth.routes.js'
import muzakkiRoutes from './routes/muzakki.routes.js'
import mustahikRoutes from './routes/mustahik.routes.js'
import zakatRoutes from './routes/zakat.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import distribusiRoutes from './routes/distribusi.routes.js'
import laporanRoutes from './routes/laporan.routes.js'
import demografiRoutes from './routes/demografi.routes.js'
import publikRoutes from './routes/publik.routes.js'

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))

// Compression
app.use(compression())

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/muzakki', muzakkiRoutes)
app.use('/api/mustahik', mustahikRoutes)
app.use('/api/zakat', zakatRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/distribusi', distribusiRoutes)
app.use('/api/laporan', laporanRoutes)
app.use('/api/demografi', demografiRoutes)
app.use('/api/publik', publikRoutes)

// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   API Base: http://localhost:${PORT}/api`)
})

export default app
