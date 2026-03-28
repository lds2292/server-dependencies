<template>
  <div class="forbidden-page">
    <div class="forbidden-card">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" stroke="#ef4444" stroke-width="1.5" fill="#1c0a0a"/>
        <line x1="14" y1="14" x2="34" y2="34" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
        <line x1="34" y1="14" x2="14" y2="34" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <div class="forbidden-title">접근 권한이 없습니다</div>
      <div class="forbidden-desc">이 프로젝트에 접근할 권한이 없습니다.<br/>프로젝트 소유자에게 초대를 요청하세요.</div>
      <button class="forbidden-btn" @click="router.push({ name: 'projects' })">프로젝트 목록으로</button>
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
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}
.forbidden-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.7;
}
.forbidden-btn {
  margin-top: 8px;
  font-size: 13px;
  font-weight: 700;
  padding: 9px 24px;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  background: var(--bg-base);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}
.forbidden-btn:hover {
  border-color: var(--accent-focus);
  color: var(--accent-soft);
}
</style>
