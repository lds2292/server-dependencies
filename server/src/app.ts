import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRouter from './routes/auth'
import projectsRouter from './routes/projects'

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

export default app
