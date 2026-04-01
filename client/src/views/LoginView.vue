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

    <!-- OAuth 로그인 처리 중 오버레이 -->
    <transition name="fade">
      <div v-if="oauthLoading" class="oauth-loading-overlay">
        <div class="oauth-loading-card">
          <div class="oauth-spinner"></div>
          <p class="oauth-loading-text">{{ $t('auth.oauthLoading') }}</p>
        </div>
      </div>
    </transition>

    <!-- 폼 카드 -->
    <div class="auth-card">
      <router-link to="/" class="auth-logo">Seraph</router-link>
      <h1 class="auth-title">{{ $t('auth.login.title') }}</h1>

      <!-- 비활성화 완료 안내 -->
      <div v-if="route.query.deactivated === '1' && !deactivatedInfo" class="deactivated-notice">
        {{ $t('auth.login.deactivatedNotice') }}
      </div>

      <form class="auth-form" @submit.prevent="onSubmit">
        <div class="form-group">
          <label class="form-label">{{ $t('auth.login.email') }}</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="you@example.com" autocomplete="email" required />
        </div>
        <div class="form-group">
          <label class="form-label">{{ $t('auth.login.password') }}</label>
          <input v-model="form.password" type="password" class="form-input" :placeholder="$t('auth.login.passwordPlaceholder')" autocomplete="current-password" required />
        </div>
        <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>

        <!-- 비활성 계정 복구 배너 -->
        <div v-if="deactivatedInfo" class="deactivated-banner">
          <p class="deactivated-banner-text">{{ $t('auth.login.accountDeactivated') }}</p>
          <p class="deactivated-banner-date">{{ $t('auth.login.recoveryDeadline', { date: deactivatedInfo.deadline }) }}</p>
          <button class="btn-primary btn-auth-submit" :disabled="reactivating" @click="onReactivate">
            {{ reactivating ? $t('auth.login.reactivating') : $t('auth.login.reactivate') }}
          </button>
        </div>

        <button v-if="!deactivatedInfo" type="submit" class="btn-primary btn-lg btn-auth-submit" :disabled="loading">
          {{ loading ? $t('auth.login.submitting') : $t('auth.login.submit') }}
        </button>
      </form>

      <!-- Social login divider + OAuth buttons -->
      <div class="auth-divider"><span>{{ $t('auth.login.or') }}</span></div>
      <div class="oauth-buttons">
        <div class="oauth-btn-wrapper">
          <button class="oauth-btn" type="button" aria-hidden="true" tabindex="-1">
            <svg class="oauth-btn-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {{ $t('auth.google.continueWith') }}
          </button>
          <div ref="googleBtnRef" class="google-btn-overlay"></div>
        </div>
        <button class="oauth-btn" @click="onGitHubLogin" :disabled="githubLoading">
          <svg class="oauth-btn-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="currentColor" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.337-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
          </svg>
          {{ githubLoading ? $t('auth.github.processing') : $t('auth.github.continueWith') }}
        </button>
      </div>
      <div v-if="googleError" class="form-error">{{ googleError }}</div>
      <div v-if="githubError" class="form-error">{{ githubError }}</div>

      <p class="auth-link">{{ $t('auth.login.noAccount') }} <router-link to="/register">{{ $t('auth.login.register') }}</router-link></p>
      <div class="auth-locale">
        <button class="locale-toggle" @click="toggleLocale">{{ currentLocale === 'ko' ? 'English' : '한국어' }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { setLocale, getLocale } from '../i18n'
import { renderGoogleButton, isGoogleAuthAvailable, promptGoogleReauth } from '../utils/googleAuth'
import { openGitHubAuthPopup } from '../utils/githubAuth'
import { usePageSeo } from '../composables/usePageSeo'

usePageSeo({
  titleKey: 'seo.login.title',
  descriptionKey: 'seo.login.description',
})

const { t } = useI18n()
const currentLocale = ref(getLocale())
function toggleLocale() {
  const next = currentLocale.value === 'ko' ? 'en' : 'ko'
  setLocale(next)
  currentLocale.value = next
}
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const form = ref({ email: '', password: '' })
const errorMsg = ref('')
const loading = ref(false)
const googleBtnRef = ref<HTMLElement | null>(null)
const googleError = ref('')
const githubError = ref('')
const githubLoading = ref(false)
const oauthLoading = ref(false)
const deactivatedInfo = ref<{ deactivatedAt: string; deadline: string; provider?: 'google' | 'github' } | null>(null)
const reactivating = ref(false)

function formatDeadline(deactivatedAt: string): string {
  const d = new Date(deactivatedAt)
  d.setDate(d.getDate() + 30)
  return d.toLocaleDateString(getLocale() === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function onSubmit() {
  errorMsg.value = ''
  deactivatedInfo.value = null
  loading.value = true
  try {
    await auth.login(form.value.email, form.value.password)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? { name: 'projects' })
  } catch (err: unknown) {
    const e = err as { response?: { data?: { code?: string; deactivatedAt?: string } } }
    if (e.response?.data?.code === 'ACCOUNT_DEACTIVATED') {
      const at = e.response.data.deactivatedAt!
      deactivatedInfo.value = { deactivatedAt: at, deadline: formatDeadline(at) }
    } else if (e.response?.data?.code === 'INVALID_CREDENTIALS') {
      errorMsg.value = t('auth.login.invalidCredentials')
    } else {
      errorMsg.value = t('auth.login.error')
    }
  } finally {
    loading.value = false
  }
}

async function onReactivate() {
  reactivating.value = true
  errorMsg.value = ''
  try {
    const provider = deactivatedInfo.value?.provider
    if (provider === 'google') {
      const idToken = await promptGoogleReauth()
      await auth.reactivateAccount({ provider: 'google', idToken })
    } else if (provider === 'github') {
      const code = await openGitHubAuthPopup()
      await auth.reactivateAccount({ provider: 'github', idToken: code })
    } else {
      await auth.reactivateAccount({ email: form.value.email, password: form.value.password })
    }
    deactivatedInfo.value = null
    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? { name: 'projects' })
  } catch (err: unknown) {
    const e = err as { message?: string; response?: { data?: { code?: string } } }
    if (e.response?.data?.code === 'RECOVERY_EXPIRED') {
      errorMsg.value = t('auth.login.recoveryExpired')
      deactivatedInfo.value = null
    } else if (e.message === 'POPUP_CLOSED') {
      // User closed popup
    } else {
      errorMsg.value = t('auth.login.reactivateFailed')
    }
  } finally {
    reactivating.value = false
  }
}

async function onGoogleToken(idToken: string) {
  googleError.value = ''
  deactivatedInfo.value = null
  oauthLoading.value = true
  try {
    await auth.googleLogin(idToken)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? { name: 'projects' })
  } catch (err: unknown) {
    oauthLoading.value = false
    const e = err as { response?: { data?: { code?: string; deactivatedAt?: string } } }
    const code = e.response?.data?.code
    if (code === 'ACCOUNT_DEACTIVATED') {
      const at = e.response!.data!.deactivatedAt!
      deactivatedInfo.value = { deactivatedAt: at, deadline: formatDeadline(at), provider: 'google' }
    } else if (code === 'EMAIL_NOT_VERIFIED') {
      googleError.value = t('auth.google.emailNotVerified')
    } else {
      googleError.value = t('auth.google.error')
    }
  }
}

async function onGitHubLogin() {
  githubError.value = ''
  deactivatedInfo.value = null
  githubLoading.value = true
  try {
    const code = await openGitHubAuthPopup()
    oauthLoading.value = true
    await auth.githubLogin(code)
    const redirect = route.query.redirect as string | undefined
    router.push(redirect ?? { name: 'projects' })
  } catch (err: unknown) {
    oauthLoading.value = false
    const e = err as { message?: string; response?: { data?: { code?: string; deactivatedAt?: string } } }
    const code = e.response?.data?.code
    if (code === 'ACCOUNT_DEACTIVATED') {
      const at = e.response!.data!.deactivatedAt!
      deactivatedInfo.value = { deactivatedAt: at, deadline: formatDeadline(at), provider: 'github' }
    } else if (code === 'EMAIL_NOT_VERIFIED') {
      githubError.value = t('auth.github.emailNotVerified')
    } else if (e.message === 'POPUP_BLOCKED') {
      githubError.value = t('auth.github.popupBlocked')
    } else if (e.message === 'POPUP_CLOSED') {
      // User closed popup intentionally, no error
    } else {
      githubError.value = t('auth.github.error')
    }
  } finally {
    githubLoading.value = false
  }
}

function tryRenderGoogleButton() {
  if (googleBtnRef.value && isGoogleAuthAvailable()) {
    renderGoogleButton(googleBtnRef.value, onGoogleToken)
    return true
  }
  return false
}

onMounted(() => {
  if (!tryRenderGoogleButton()) {
    // GIS 스크립트가 아직 로드되지 않은 경우 재시도
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      if (tryRenderGoogleButton() || attempts >= 20) {
        clearInterval(interval)
      }
    }, 200)
  }
})
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
  display: block; text-align: center; font-size: var(--text-xl); font-weight: 700;
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

/* 구분선 */
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-default);
}
.auth-divider span {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  white-space: nowrap;
}

/* OAuth 버튼 */
.oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.oauth-btn-wrapper {
  position: relative;
  width: 100%;
  height: 40px;
}
.oauth-btn-wrapper .oauth-btn {
  pointer-events: none;
}
.oauth-btn-wrapper:hover .oauth-btn {
  border-color: var(--border-strong);
  background: var(--bg-elevated);
}
.google-btn-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
  opacity: 0.01;
  cursor: pointer;
}
.google-btn-overlay :deep(iframe),
.google-btn-overlay :deep(div) {
  width: 100% !important;
  height: 40px !important;
}
.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 40px;
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.oauth-btn:hover { border-color: var(--border-strong); background: var(--bg-elevated); }
.oauth-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.oauth-btn-logo { width: 18px; height: 18px; flex-shrink: 0; }

.auth-link { text-align: center; font-size: var(--text-sm); color: var(--text-muted); margin: 20px 0 0 0; }
.auth-link a { color: var(--accent-soft); text-decoration: none; }
.auth-link a:hover { text-decoration: underline; }
.auth-locale { text-align: center; margin-top: 16px; }
.locale-toggle {
  font-size: var(--text-xs); font-weight: 600; color: var(--text-tertiary);
  background: transparent; border: 1px solid var(--border-default); border-radius: 4px;
  padding: 4px 12px; cursor: pointer; font-family: var(--font-mono);
  transition: color 0.15s, border-color 0.15s;
}
.locale-toggle:hover { color: var(--text-primary); border-color: var(--border-strong); }

/* 비활성화 완료 안내 */
.deactivated-notice {
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: color-mix(in srgb, var(--color-warning) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning) 15%, transparent);
  border-radius: 6px;
  padding: 10px 14px;
  margin-bottom: 16px;
  text-align: center;
  line-height: 1.5;
}

/* 비활성 계정 복구 배너 */
.deactivated-banner {
  background: color-mix(in srgb, var(--color-warning) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning) 25%, transparent);
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.deactivated-banner-text {
  font-size: var(--text-sm);
  color: var(--color-warning-light);
  font-weight: 700;
  margin: 0 0 4px;
  line-height: 1.5;
}
.deactivated-banner-date {
  font-size: var(--text-sm);
  color: var(--text-muted);
  margin: 0 0 12px;
}

/* OAuth 로딩 오버레이 */
.oauth-loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
}
.oauth-loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 32px 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.oauth-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--border-default);
  border-top-color: var(--accent-primary);
  border-radius: 50%;
  animation: oauth-spin 0.7s linear infinite;
}
@keyframes oauth-spin {
  to { transform: rotate(360deg); }
}
.oauth-loading-text {
  margin: 0;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
