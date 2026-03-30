<template>
  <div class="auth-page">
    <!-- 배경 장식 SVG — 희미한 그래프 노드 텍스처 -->
    <div class="auth-bg-deco" aria-hidden="true">
      <svg viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <!-- 엣지 (opacity: 0.03) -->
        <line x1="120" y1="82" x2="160" y2="782" stroke="#2a2a30" stroke-width="1" opacity="0.03"/>
        <line x1="1340" y1="62" x2="1320" y2="762" stroke="#2a2a30" stroke-width="1" opacity="0.03"/>
        <line x1="120" y1="82" x2="1340" y2="62" stroke="#2a2a30" stroke-width="1" opacity="0.025"/>
        <line x1="160" y1="782" x2="1320" y2="762" stroke="#2a2a30" stroke-width="1" opacity="0.025"/>
        <line x1="100" y1="422" x2="160" y2="782" stroke="#2a2a30" stroke-width="1" opacity="0.02"/>
        <line x1="1360" y1="440" x2="1320" y2="762" stroke="#2a2a30" stroke-width="1" opacity="0.02"/>
        <!-- 노드 (fill:none 윤곽만, opacity: 0.05) -->
        <!-- SRV 좌상단 -->
        <rect x="80" y="60" width="80" height="44" rx="7" fill="none" stroke="#5b8def" stroke-width="1.5" opacity="0.05"/>
        <text x="120" y="86" text-anchor="middle" fill="#5b8def" font-size="10" font-weight="700" opacity="0.05">SRV</text>
        <!-- SRV 우상단 -->
        <rect x="1300" y="40" width="80" height="44" rx="7" fill="none" stroke="#5b8def" stroke-width="1.5" opacity="0.05"/>
        <text x="1340" y="66" text-anchor="middle" fill="#5b8def" font-size="10" font-weight="700" opacity="0.05">SRV</text>
        <!-- L7 좌하단 -->
        <rect x="120" y="760" width="80" height="44" rx="7" fill="none" stroke="#b494f7" stroke-width="1.5" opacity="0.05"/>
        <text x="160" y="786" text-anchor="middle" fill="#b494f7" font-size="10" font-weight="700" opacity="0.05">L7</text>
        <!-- INFRA 우하단 -->
        <rect x="1280" y="740" width="80" height="44" rx="7" fill="none" stroke="#3ec6d6" stroke-width="1.5" opacity="0.05"/>
        <text x="1320" y="766" text-anchor="middle" fill="#3ec6d6" font-size="10" font-weight="700" opacity="0.05">DB</text>
        <!-- EXT 좌중단 -->
        <rect x="60" y="400" width="80" height="44" rx="7" fill="none" stroke="#42b883" stroke-width="1.5" opacity="0.05"/>
        <text x="100" y="426" text-anchor="middle" fill="#42b883" font-size="10" font-weight="700" opacity="0.05">EXT</text>
        <!-- L7 우중단 -->
        <rect x="1320" y="418" width="80" height="44" rx="7" fill="none" stroke="#b494f7" stroke-width="1.5" opacity="0.05"/>
        <text x="1360" y="444" text-anchor="middle" fill="#b494f7" font-size="10" font-weight="700" opacity="0.05">L7</text>
      </svg>
    </div>

    <!-- 폼 카드 -->
    <div class="auth-card">
      <router-link to="/" class="auth-logo">Server Dependencies</router-link>
      <h1 class="auth-title">회원가입</h1>

      <form class="auth-form" @submit.prevent="onSubmit">
        <div class="form-group">
          <label class="form-label">이메일</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="you@example.com" autocomplete="email" required />
        </div>
        <div class="form-group">
          <label class="form-label">사용자명</label>
          <input v-model="form.username" type="text" class="form-input" placeholder="표시 이름" autocomplete="username" required minlength="2" />
        </div>
        <div class="form-group">
          <label class="form-label">비밀번호</label>
          <input v-model="form.password" type="password" class="form-input" placeholder="8자 이상" autocomplete="new-password" required minlength="8" />
        </div>
        <div class="form-group">
          <label class="form-label">비밀번호 확인</label>
          <input v-model="form.confirm" type="password" class="form-input" placeholder="비밀번호 재입력" autocomplete="new-password" required />
        </div>
        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
        <button type="submit" class="btn-primary btn-lg btn-auth-submit" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <p class="auth-link">이미 계정이 있으신가요? <router-link to="/login">로그인</router-link></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const form = ref({ email: '', username: '', password: '', confirm: '' })
const errorMsg = ref('')
const loading = ref(false)

async function onSubmit() {
  errorMsg.value = ''
  if (form.value.password !== form.value.confirm) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }
  loading.value = true
  try {
    await auth.register(form.value.email, form.value.username, form.value.password)
    router.push({ name: 'projects' })
  } catch (err: unknown) {
    const e = err as { response?: { data?: { code?: string } } }
    const code = e.response?.data?.code
    if (code === 'EMAIL_TAKEN') errorMsg.value = '이미 사용 중인 이메일입니다.'
    else if (code === 'USERNAME_TAKEN') errorMsg.value = '이미 사용 중인 사용자명입니다.'
    else errorMsg.value = '회원가입 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
  background-color: var(--bg-base);
  background-image:
    radial-gradient(ellipse 55% 55% at 50% 50%, rgba(217,119,6,0.09) 0%, transparent 70%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cpath d='M 120 0 L 0 0 0 120' fill='none' stroke='rgba(255,255,255,0.10)' stroke-width='0.5'/%3E%3C/svg%3E"),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Cpath d='M 24 0 L 0 0 0 24' fill='none' stroke='rgba(255,255,255,0.06)' stroke-width='0.5'/%3E%3C/svg%3E");
  background-size: cover, 120px 120px, 24px 24px;
  background-position: center;
}

/* 배경 장식 SVG */
.auth-bg-deco {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}
.auth-bg-deco svg { width: 100%; height: 100%; }

/* 폼 카드 */
.auth-card {
  position: relative;
  z-index: 1;
  width: 100%; max-width: 400px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-top: 2px solid var(--accent-primary);
  border-radius: 12px;
  padding: 36px;
  box-shadow:
    0 0 0 1px rgba(217,119,6,0.12),
    0 24px 64px rgba(0,0,0,0.5),
    0 0 48px rgba(217,119,6,0.08),
    inset 0 1px 0 rgba(255,255,255,0.05);
}
.auth-logo {
  display: block; text-align: center; font-size: var(--text-xs); font-weight: 700;
  color: var(--accent-soft); text-decoration: none; letter-spacing: 0.05em; margin-bottom: 24px;
}
.auth-title { font-size: var(--text-xl); font-weight: 700; color: var(--text-primary); text-align: center; margin: 0 0 28px 0; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: var(--text-xs); font-weight: 600; color: var(--text-muted); }
.form-input {
  background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 7px;
  padding: 9px 12px; font-size: var(--text-base); color: var(--text-secondary); outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.form-input:focus { border-color: var(--accent-focus); box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
.form-input::placeholder { color: var(--text-tertiary); }
.form-error {
  font-size: var(--text-xs); color: #f87171; background: #2d1b1b; border: 1px solid #7f1d1d;
  border-radius: 6px; padding: 8px 12px;
}
.btn-auth-submit { width: 100%; margin-top: 4px; }
.auth-link { text-align: center; font-size: var(--text-sm); color: var(--text-muted); margin: 20px 0 0 0; }
.auth-link a { color: var(--accent-soft); text-decoration: none; }
.auth-link a:hover { text-decoration: underline; }
</style>
