import app from './app'
import logger from './lib/logger'
import { startPurgeJob } from './jobs/purgeExpiredAccounts'

const PORT = parseInt(process.env.PORT ?? '3001', 10)

app.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`)
  startPurgeJob()
})
