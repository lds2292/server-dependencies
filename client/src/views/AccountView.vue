<template>
  <div class="settings-page">
    <div class="settings-topbar">
      <button class="back-btn" @click="goBack">
        <Icon name="chevron-left" :size="16" />
        {{ t('common.back') }}
      </button>
      <span class="topbar-title">{{ t('account.topbarTitle') }}</span>
      <span class="topbar-spacer"></span>
      <UserProfileDropdown @logout="showLogoutConfirm = true" />
    </div>

    <div class="settings-body">
      <!-- 프로필 정보 -->
      <section class="settings-section">
        <h2 class="section-title">
          <Icon name="user-profile" :size="13" class="section-icon" />
          {{ t('account.profileInfo') }}
        </h2>

        <div class="form-group">
          <label class="form-label">{{ t('account.username') }}</label>
          <input v-model="editUsername" class="form-input" maxlength="30" />
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('account.email') }}</label>
          <input :value="editEmail" class="form-input form-input-disabled" type="email" disabled />
          <span class="field-hint">{{ t('account.emailHint') }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">{{ t('account.createdAt') }}</label>
          <span class="readonly-value">{{ formattedCreatedAt }}</span>
        </div>

        <button class="btn-outline btn-sm" @click="onSaveProfile" :disabled="savingProfile || !canSaveProfile">
          {{ savingProfile ? t('common.saving') : t('common.save') }}
        </button>
      </section>

      <!-- 로그인 방법 -->
      <section class="settings-section">
        <h2 class="section-title">
          <Icon name="lock" :size="13" class="section-icon" />
          {{ t('account.loginMethods') }}
        </h2>

        <div class="login-methods">
          <div v-if="authStore.hasGoogleProvider" class="login-method-item">
            <svg class="google-logo" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span class="login-method-label">{{ t('account.googleLinked') }}</span>
          </div>
          <div class="login-method-item">
            <Icon name="lock" :size="14" class="login-method-icon" />
            <span class="login-method-label">{{ authStore.user?.hasPassword ? t('account.passwordSet') : t('account.passwordNotSet') }}</span>
          </div>
        </div>
      </section>

      <!-- 비밀번호 변경 -->
      <section v-if="!authStore.isOAuthOnly" class="settings-section">
        <h2 class="section-title">
          <Icon name="lock" :size="13" class="section-icon" />
          {{ t('account.changePassword') }}
        </h2>

        <template v-if="!showPasswordForm">
          <p class="password-desc">{{ t('account.changePasswordDesc') }}</p>
          <button class="btn-outline btn-sm" @click="showPasswordForm = true">{{ t('account.changePassword') }}</button>
        </template>

        <template v-else>
          <div class="form-group">
            <label class="form-label">{{ t('account.currentPassword') }}</label>
            <input v-model="currentPassword" class="form-input" type="password" />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('account.newPassword') }}</label>
            <input v-model="newPassword" class="form-input" type="password" :placeholder="t('account.newPasswordPlaceholder')" />
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('account.confirmNewPassword') }}</label>
            <input v-model="confirmPassword" class="form-input" type="password" />
            <span v-if="confirmPassword && !passwordMatch" class="field-error">{{ t('account.passwordMismatch') }}</span>
          </div>

          <div class="password-actions">
            <button class="btn-ghost btn-sm" @click="onCancelPasswordChange">{{ t('common.cancel') }}</button>
            <button class="btn-outline btn-sm" @click="onChangePassword" :disabled="savingPassword || !canChangePassword">
              {{ savingPassword ? t('account.changingPassword') : t('account.changePassword') }}
            </button>
          </div>
        </template>
      </section>

      <section v-else class="settings-section">
        <h2 class="section-title">
          <Icon name="lock" :size="13" class="section-icon" />
          {{ t('account.changePassword') }}
        </h2>
        <p class="password-desc">{{ t('account.oauthOnlyDesc') }}</p>
      </section>

      <!-- 회원탈퇴 -->
      <section class="settings-section danger-section">
        <h2 class="section-title section-title-danger">
          <Icon name="warning-triangle" :size="13" class="section-icon" />
          {{ t('account.deleteAccount') }}
        </h2>
        <p class="danger-desc">{{ t('account.deleteAccountDesc') }}</p>
        <button class="btn-danger-ghost" @click="showDeleteConfirm = true">{{ t('account.deleteAccount') }}</button>
      </section>
    </div>

    <!-- 토스트 -->
    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['app-toast', toastType]">{{ toastMsg }}</div>
    </transition>

    <!-- 회원탈퇴 확인 모달 (비밀번호 방식) -->
    <transition name="fade">
      <div v-if="showDeleteConfirm && !useGoogleDeleteAuth" class="modal-overlay" @click.self="onCancelDelete">
        <div class="modal-card" style="max-width:400px">
          <h2 class="modal-title">{{ t('account.deleteModal.title') }}</h2>
          <p class="modal-desc">{{ t('account.deleteModal.passwordDesc') }}</p>
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">{{ t('impactPanel.passwordConfirm') }}</label>
            <input
              v-model="deletePassword"
              class="form-input"
              type="password"
              :placeholder="t('account.deleteModal.passwordPlaceholder')"
              @keyup.enter="onDeleteAccount"
            />
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-ghost" @click="onCancelDelete">{{ t('common.cancel') }}</button>
            <button
              type="button"
              class="btn-danger"
              :disabled="deletingAccount || !deletePassword"
              @click="onDeleteAccount"
            >
              {{ deletingAccount ? t('common.deleting') : t('account.deleteAccount') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 회원탈퇴 확인 모달 (Google 재인증 방식) -->
    <transition name="fade">
      <div v-if="showDeleteConfirm && useGoogleDeleteAuth" class="modal-overlay" @click.self="onCancelDelete">
        <div class="modal-card" style="max-width:400px">
          <h2 class="modal-title">{{ t('account.deleteModal.title') }}</h2>
          <p class="modal-desc">{{ t('account.deleteModal.googleDesc') }}</p>
          <div v-if="deleteError" class="form-error" style="margin-bottom:16px">{{ deleteError }}</div>
          <div class="modal-actions">
            <button type="button" class="btn-ghost" @click="onCancelDelete">{{ t('common.cancel') }}</button>
            <button
              type="button"
              class="btn-danger"
              :disabled="deletingAccount"
              @click="onDeleteAccountWithGoogle"
            >
              {{ deletingAccount ? t('common.deleting') : t('account.deleteModal.googleButton') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 로그아웃 확인 모달 -->
    <transition name="fade">
      <div v-if="showLogoutConfirm" class="modal-overlay" @click.self="showLogoutConfirm = false">
        <div class="modal-card" style="max-width:340px">
          <h2 class="modal-title">{{ t('common.logout') }}</h2>
          <p style="font-size: var(--text-sm);color:var(--text-tertiary);margin:0 0 20px">{{ t('common.logoutConfirm') }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-ghost" @click="showLogoutConfirm = false">{{ t('common.cancel') }}</button>
            <button type="button" class="btn-danger" @click="onLogout">{{ t('common.logout') }}</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { promptGoogleReauth } from '../utils/googleAuth'
import UserProfileDropdown from '../components/UserProfileDropdown.vue'
import Icon from '../components/Icon.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const showLogoutConfirm = ref(false)

// OAuth 전용 계정이면서 Google 프로바이더가 있으면 Google 재인증 사용
const useGoogleDeleteAuth = computed(() => authStore.isOAuthOnly && authStore.hasGoogleProvider)

// ─── 토스트 ───────────────────────────────────────────────
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('error')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success' | 'error' = 'error') {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2500)
}

// ─── 네비게이션 ──────────────────────────────────────────
function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'projects' })
  }
}

async function onLogout() {
  await authStore.logout()
}

// ─── 프로필 정보 ────────────────────────────────────────
const editUsername = ref('')
const editEmail = ref('')
const savingProfile = ref(false)

const formattedCreatedAt = computed(() => {
  if (!authStore.user?.createdAt) return ''
  return new Date(authStore.user.createdAt).toISOString().slice(0, 10)
})

const canSaveProfile = computed(() => {
  if (!editUsername.value.trim()) return false
  return editUsername.value.trim() !== authStore.user?.username
})

async function onSaveProfile() {
  if (!canSaveProfile.value) return
  savingProfile.value = true
  try {
    const data: { username?: string } = {}
    if (editUsername.value.trim() !== authStore.user?.username) {
      data.username = editUsername.value.trim()
    }
    await authStore.updateProfile(data)
    showToast(t('account.toast.saved'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string; code?: string } } }
    const code = e.response?.data?.code
    if (code === 'USERNAME_TAKEN') {
      showToast(t('account.toast.usernameTaken'))
    } else {
      showToast(t('account.toast.saveFailed'))
    }
  } finally {
    savingProfile.value = false
  }
}

// ─── 비밀번호 변경 ──────────────────────────────────────
const showPasswordForm = ref(false)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const savingPassword = ref(false)

function onCancelPasswordChange() {
  showPasswordForm.value = false
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

const passwordMatch = computed(() => newPassword.value === confirmPassword.value)

const canChangePassword = computed(() => {
  return (
    currentPassword.value.length > 0 &&
    newPassword.value.length >= 8 &&
    confirmPassword.value.length > 0 &&
    passwordMatch.value
  )
})

async function onChangePassword() {
  if (!canChangePassword.value) return
  savingPassword.value = true
  try {
    await authStore.changePassword(currentPassword.value, newPassword.value)
    showPasswordForm.value = false
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    showToast(t('account.toast.passwordChanged'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string; code?: string } } }
    const code = e.response?.data?.code
    if (code === 'INVALID_CREDENTIALS') {
      showToast(t('account.toast.passwordInvalid'))
    } else {
      showToast(t('account.toast.passwordChangeFailed'))
    }
  } finally {
    savingPassword.value = false
  }
}

// ─── 회원탈퇴 ──────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const deletePassword = ref('')
const deletingAccount = ref(false)
const deleteError = ref('')

function onCancelDelete() {
  showDeleteConfirm.value = false
  deletePassword.value = ''
  deleteError.value = ''
}

async function onDeleteAccount() {
  if (!deletePassword.value) return
  deletingAccount.value = true
  try {
    await authStore.deleteAccount({ password: deletePassword.value })
    window.location.replace('/login')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string; code?: string } } }
    const msg = e.response?.data?.error || t('account.toast.deleteFailed')
    showToast(msg)
  } finally {
    deletingAccount.value = false
  }
}

async function onDeleteAccountWithGoogle() {
  deletingAccount.value = true
  deleteError.value = ''
  try {
    const idToken = await promptGoogleReauth()
    await authStore.deleteAccount({ provider: 'google', idToken })
    window.location.replace('/login')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string; code?: string } } }
    if (e.response?.data?.error) {
      deleteError.value = e.response.data.error
    } else {
      deleteError.value = (err as Error).message || t('account.toast.googleAuthFailed')
    }
  } finally {
    deletingAccount.value = false
  }
}

// ─── 초기화 ───────────────────────────────────────────────
onMounted(() => {
  if (authStore.user) {
    editUsername.value = authStore.user.username
    editEmail.value = authStore.user.email
  }
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-base);
  display: flex;
  flex-direction: column;
}

/* 상단 바 */
.settings-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  height: 52px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 36px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  padding: 0 12px;
  border-radius: 6px;
  transition: all 0.15s;
}
.back-btn:hover { color: var(--text-secondary); border-color: var(--border-strong); background: var(--bg-elevated); }
.topbar-title { font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); }
.topbar-spacer { flex: 1; }

/* 본문 */
.settings-body {
  flex: 1;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 60px;
  display: flex; flex-direction: column; gap: 16px;
}

/* 섹션 */
.settings-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 24px 28px;
}
.section-title {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 18px 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding-left: 10px;
  position: relative;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  border-radius: 1px;
  background: var(--accent-primary);
}
.section-icon {
  color: var(--accent-soft);
  flex-shrink: 0;
}

/* 로그인 방법 */
.login-methods {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.login-method-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
}
.google-logo {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
.login-method-icon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}
.login-method-label {
  font-weight: 500;
}

/* 폼 */
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-label { font-size: var(--text-xs); font-weight: 600; color: var(--text-disabled); }
.form-input {
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 7px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--accent-focus); }
.form-input::placeholder { color: var(--border-strong); }

.readonly-value {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  padding: 9px 0;
}

.field-hint {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  margin-top: 2px;
}

.form-input-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.field-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin-top: 2px;
}

.form-error {
  font-size: var(--text-xs); color: #f87171; background: #2d1b1b; border: 1px solid #7f1d1d;
  border-radius: 6px; padding: 8px 12px;
}

.password-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0 0 14px;
}

.password-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 위험 영역 (회원탈퇴) */
.danger-section {
  border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
}
.section-title-danger::before {
  background: var(--color-danger) !important;
}
.section-title-danger .section-icon {
  color: var(--color-danger);
}
.danger-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0 0 16px;
  line-height: 1.6;
}
.modal-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0 0 16px;
  line-height: 1.5;
}


/* 토스트 */
.app-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 10px;
  padding: 12px 24px; font-size: var(--text-base); color: #fca5a5; font-weight: 600;
  z-index: 1100; white-space: nowrap; box-shadow: 0 4px 20px rgba(239,68,68,0.25);
  pointer-events: none;
}
.app-toast.success {
  background: #022c22; border-color: #059669; color: #6ee7b7;
  box-shadow: 0 4px 20px rgba(5,150,105,0.25);
}
.toast-fade-enter-active { transition: opacity 0.2s; }
.toast-fade-leave-active { transition: opacity 0.4s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }

/* 모달 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal-card {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 12px;
  padding: 20px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
}
.modal-title { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); margin: 0 0 12px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
