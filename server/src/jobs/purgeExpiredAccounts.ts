import { purgeExpiredAccounts } from '../services/authService'
import logger from '../lib/logger'

const INTERVAL_MS = 24 * 60 * 60 * 1000 // 24시간

export function startPurgeJob() {
  // 서버 시작 5분 후 첫 실행, 이후 24시간 간격
  setTimeout(async () => {
    await runPurge()
    setInterval(runPurge, INTERVAL_MS)
  }, 5 * 60 * 1000)
}

async function runPurge() {
  try {
    const result = await purgeExpiredAccounts()
    if (result.total > 0) {
      logger.info('Purge expired accounts completed', result)
    }
  } catch (err) {
    logger.error('Purge expired accounts failed', { error: (err as Error).message })
  }
}
