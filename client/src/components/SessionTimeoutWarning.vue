<script setup lang="ts">
import Icon from './Icon.vue'

const props = defineProps<{
  visible: boolean
  remainingSeconds: number
}>()

defineEmits<{
  extend: []
  logout: []
}>()

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <Teleport to="body">
    <Transition name="session-timeout">
      <div v-if="props.visible" class="session-timeout-overlay">
        <div class="session-timeout-card">
          <div class="session-timeout-icon">
            <Icon name="warning-triangle" :size="24" />
          </div>
          <h3 class="session-timeout-title">{{ $t('session.warningTitle') }}</h3>
          <p class="session-timeout-desc">
            {{ $t('session.warningDesc') }}
          </p>
          <div
            class="session-timeout-countdown"
            :class="{ urgent: props.remainingSeconds <= 60 }"
          >
            {{ formatTime(props.remainingSeconds) }}
          </div>
          <div class="session-timeout-actions">
            <button class="btn-ghost" @click="$emit('logout')">
              {{ $t('common.logout') }}
            </button>
            <button class="btn-primary" @click="$emit('extend')">
              {{ $t('session.extend') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.session-timeout-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.session-timeout-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 28px 32px;
  width: 360px;
  max-width: 90vw;
  text-align: center;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.session-timeout-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.session-timeout-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
}

.session-timeout-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0 0 24px;
  line-height: 1.5;
}

.session-timeout-countdown {
  font-family: var(--font-mono);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-warning);
  margin: 0 0 24px;
  letter-spacing: 2px;
  transition: color 0.3s;
}

.session-timeout-countdown.urgent {
  color: var(--color-danger);
}

.session-timeout-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.session-timeout-actions .btn-ghost,
.session-timeout-actions .btn-primary {
  flex: 1;
}

/* Transition */
.session-timeout-enter-active {
  transition: opacity 0.2s;
}
.session-timeout-enter-active .session-timeout-card {
  transition: transform 0.2s, opacity 0.2s;
}
.session-timeout-enter-from {
  opacity: 0;
}
.session-timeout-enter-from .session-timeout-card {
  transform: scale(0.95);
  opacity: 0;
}

.session-timeout-leave-active {
  transition: opacity 0.15s;
}
.session-timeout-leave-to {
  opacity: 0;
}
</style>
