import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRouter from './routes/auth'
import projectsRouter from './routes/projects'
import logger from './lib/logger'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path === '/api/health') { next(); return }
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'
    logger[level](`HTTP ${res.statusCode} ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      userId: req.user?.userId ?? null,
    })
  })
  next()
})

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default app
