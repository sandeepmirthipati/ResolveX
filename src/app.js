import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import './config/env.js'

import complaintRoutes from './routes/complaintRoutes.js'
import { globalLimiter } from './middlewares/rateLimiter.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { HTTP_STATUS } from './constants/index.js'
import { isSmsConfigured } from './services/smsService.js'
import { isWhatsAppConfigured } from './services/whatsappService.js'


const app = express()
const corsOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? false : '*')

app.use(helmet())
app.use(cors({
  origin: corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use(globalLimiter)

app.get('/health', (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'ResolveX Backend is healthy and operational',
    data: {
      uptime: process.uptime(),
      timestamp: new Date(),
      notifications: {
        sms: isSmsConfigured(),
        whatsapp: isWhatsAppConfigured(),
      },
    },
    errors: null,
  })
})

app.use('/api/v1/complaints', complaintRoutes)

app.use((req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
    data: null,
    errors: null,
  })
})

app.use(errorHandler)

export default app
