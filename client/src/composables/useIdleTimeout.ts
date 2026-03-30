import { ref, onUnmounted } from 'vue'

const IDLE_TIMEOUT = 30 * 60 * 1000      // 30분
const WARNING_BEFORE = 5 * 60 * 1000     // 만료 5분 전 경고
const THROTTLE_MS = 10_000               // 활동 이벤트 쓰로틀 10초
const TICK_INTERVAL = 1_000              // 카운트다운 1초 간격

const ACTIVITY_EVENTS: Array<keyof DocumentEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
]

export function useIdleTimeout(options: {
  onWarning?: () => void
  onExpire: () => void
}) {
  const isWarningVisible = ref(false)
  const remainingSeconds = ref(0)

  let lastActivityTime = 0
  let warningTimer: ReturnType<typeof setTimeout> | null = null
  let tickInterval: ReturnType<typeof setInterval> | null = null
  let lastThrottleTime = 0
  let running = false

  function resetTimer(): void {
    lastActivityTime = Date.now()

    // 경고 표시 중이면 활동으로 리셋하지 않음
    if (isWarningVisible.value) return

    clearWarningTimer()
    scheduleWarning()
  }

  function handleActivity(): void {
    if (!running) return
    if (isWarningVisible.value) return

    const now = Date.now()
    if (now - lastThrottleTime < THROTTLE_MS) return
    lastThrottleTime = now

    resetTimer()
  }

  function scheduleWarning(): void {
    const warningDelay = IDLE_TIMEOUT - WARNING_BEFORE
    warningTimer = setTimeout(() => {
      showWarning()
    }, warningDelay)
  }

  function showWarning(): void {
    isWarningVisible.value = true
    options.onWarning?.()
    startCountdown()
  }

  function startCountdown(): void {
    updateRemaining()
    tickInterval = setInterval(() => {
      updateRemaining()
    }, TICK_INTERVAL)
  }

  function updateRemaining(): void {
    const elapsed = Date.now() - lastActivityTime
    const remaining = IDLE_TIMEOUT - elapsed

    if (remaining <= 0) {
      performExpire()
    } else {
      remainingSeconds.value = Math.ceil(remaining / 1000)
    }
  }

  function performExpire(): void {
    stop()
    isWarningVisible.value = false
    remainingSeconds.value = 0
    options.onExpire()
  }

  function clearWarningTimer(): void {
    if (warningTimer !== null) {
      clearTimeout(warningTimer)
      warningTimer = null
    }
  }

  function clearTickInterval(): void {
    if (tickInterval !== null) {
      clearInterval(tickInterval)
      tickInterval = null
    }
  }

  function addListeners(): void {
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true })
    }
  }

  function removeListeners(): void {
    for (const event of ACTIVITY_EVENTS) {
      document.removeEventListener(event, handleActivity)
    }
  }

  function start(): void {
    if (running) return
    running = true
    lastActivityTime = Date.now()
    lastThrottleTime = 0
    isWarningVisible.value = false
    remainingSeconds.value = 0
    addListeners()
    scheduleWarning()
  }

  function stop(): void {
    if (!running) return
    running = false
    removeListeners()
    clearWarningTimer()
    clearTickInterval()
    isWarningVisible.value = false
    remainingSeconds.value = 0
  }

  function extend(): void {
    clearTickInterval()
    isWarningVisible.value = false
    remainingSeconds.value = 0
    lastActivityTime = Date.now()
    lastThrottleTime = 0
    clearWarningTimer()
    scheduleWarning()
  }

  onUnmounted(() => {
    stop()
  })

  return {
    isWarningVisible,
    remainingSeconds,
    start,
    stop,
    extend,
  }
}
