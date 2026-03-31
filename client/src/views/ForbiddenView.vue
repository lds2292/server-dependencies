<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" stroke="#ef4444" stroke-width="1.5" fill="#1c0a0a"/>
        <line x1="14" y1="14" x2="34" y2="34" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="34" y1="14" x2="14" y2="34" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <div class="forbidden-title">{{ $t('forbidden.title') }}</div>
      <div class="forbidden-desc">{{ $t('forbidden.desc') }}</div>
      <button class="btn-ghost btn-lg forbidden-btn" @click="router.push({ name: 'projects' })">{{ $t('forbidden.backToList') }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped>
.forbidden-page {
  min-height: 100vh;
  background: var(--bg-base);
  display: flex;
  align-items: center;
  justify-content: center;
}
.forbidden-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 48px 56px;
  text-align: center;
}
.forbidden-title {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--text-primary);
}
.forbidden-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: 1.7;
}
.forbidden-btn { margin-top: 8px; }
</style>
