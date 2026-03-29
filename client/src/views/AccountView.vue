<template>
  <div class="settings-page">
    <div class="settings-topbar">
      <button class="back-btn" @click="goBack">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        돌아가기
      </button>
      <span class="settings-title">내 정보 수정</span>
      <span class="topbar-spacer"></span>
      <UserProfileDropdown @logout="showLogoutConfirm = true" />
    </div>

    <div class="settings-body">
      <!-- 프로필 정보 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="section-icon">
            <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/>
            <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          프로필 정보
        </h2>

        <div class="form-group">
          <label class="form-label">사용자명</label>
          <input v-model="editUsername" class="form-input" maxlength="30" />
        </div>

        <div class="form-group">
          <label class="form-label">이메일</label>
          <input :value="editEmail" class="form-input form-input-disabled" type="email" disabled />
          <span class="field-hint">이메일은 로그인에 사용되므로 변경할 수 없습니다.</span>
        </div>

        <div class="form-group">
          <label class="form-label">가입일</label>
          <span class="readonly-value">{{ formattedCreatedAt }}</span>
        </div>

        <button class="btn-save" @click="onSaveProfile" :disabled="savingProfile || !canSaveProfile">
          {{ savingProfile ? '저장 중...' : '저장' }}
        </button>
      </section>

      <!-- 비밀번호 변경 -->
      <section class="settings-section">
        <h2 class="section-title">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="section-icon">
            <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/>
            <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          비밀번호 변경
        </h2>

        <template v-if="!showPasswordForm">
          <p class="password-desc">비밀번호를 변경하려면 아래 버튼을 클릭하세요.</p>
          <button class="btn-save" @click="showPasswordForm = true">비밀번호 변경</button>
        </template>

        <template v-else>
          <div class="form-group">
            <label class="form-label">현재 비밀번호</label>
            <input v-model="currentPassword" class="form-input" type="password" />
          </div>

          <div class="form-group">
            <label class="form-label">새 비밀번호</label>
            <input v-model="newPassword" class="form-input" type="password" placeholder="8자 이상" />
          </div>

          <div class="form-group">
            <label class="form-label">새 비밀번호 확인</label>
            <input v-model="confirmPassword" class="form-input" type="password" />
            <span v-if="confirmPassword && !passwordMatch" class="field-error">비밀번호가 일치하지 않습니다.</span>
          </div>

          <div class="password-actions">
            <button class="btn-cancel" @click="onCancelPasswordChange">취소</button>
            <button class="btn-save" @click="onChangePassword" :disabled="savingPassword || !canChangePassword">
              {{ savingPassword ? '변경 중...' : '비밀번호 변경' }}
            </button>
          </div>
        </template>
      </section>
    </div>

    <!-- 토스트 -->
    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['app-toast', toastType]">{{ toastMsg }}</div>
    </transition>

    <!-- 로그아웃 확인 모달 -->
    <transition name="fade">
      <div v-if="showLogoutConfirm" class="modal-overlay" @click.self="showLogoutConfirm = false">
        <div class="modal-card" style="max-width:340px">
          <h2 class="modal-title">로그아웃</h2>
          <p style="font-size: var(--text-sm);color:var(--text-tertiary);margin:0 0 20px">로그아웃 하시겠습니까?</p>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showLogoutConfirm = false">취소</button>
            <button type="button" class="btn-confirm btn-confirm-danger" @click="onLogout">로그아웃</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import UserProfileDropdown from '../components/UserProfileDropdown.vue'

const router = useRouter()
const authStore = useAuthStore()

const showLogoutConfirm = ref(false)

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
  router.push({ name: 'login' })
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
    showToast('저장되었습니다.', 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string; code?: string } } }
    const code = e.response?.data?.code
    if (code === 'USERNAME_TAKEN') {
      showToast('이미 사용 중인 사용자명입니다.')
    } else {
      showToast('저장에 실패했습니다.')
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
    showToast('비밀번호가 변경되었습니다.', 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string; code?: string } } }
    const code = e.response?.data?.code
    if (code === 'INVALID_CREDENTIALS') {
      showToast('현재 비밀번호가 올바르지 않습니다.')
    } else {
      showToast('비밀번호 변경에 실패했습니다.')
    }
  } finally {
    savingPassword.value = false
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
  background: none;
  border: none;
  color: var(--text-disabled);
  font-size: var(--text-sm);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 5px;
  transition: color 0.15s, background 0.15s;
}
.back-btn:hover { color: var(--text-secondary); background: var(--border-default); }
.settings-title { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
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

.btn-save {
  font-size: var(--text-xs); font-weight: 700; padding: 7px 20px; border-radius: 7px;
  border: 1px solid var(--accent-hover); background: var(--accent-bg); color: var(--accent-soft);
  cursor: pointer; transition: all 0.15s;
}
.btn-save:hover:not(:disabled) { background: var(--accent-bg-medium); color: var(--accent-light); box-shadow: 0 0 12px rgba(217,119,6,0.3); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

/* 토스트 */
.app-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 10px;
  padding: 12px 24px; font-size: var(--text-base); color: #fca5a5; font-weight: 600;
  z-index: 700; white-space: nowrap; box-shadow: 0 4px 20px rgba(239,68,68,0.25);
  pointer-events: none;
}
.app-toast.success {
  background: #022c22; border-color: #059669; color: #6ee7b7;
  box-shadow: 0 4px 20px rgba(5,150,105,0.25);
}
.toast-fade-enter-active { transition: opacity 0.2s; }
.toast-fade-leave-active { transition: opacity 0.4s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }

/* 로그아웃 모달 */
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
.btn-cancel {
  padding: 6px 14px; border-radius: 6px; font-size: var(--text-sm); font-weight: 600;
  border: 1px solid var(--border-default); background: var(--bg-surface); color: var(--text-tertiary);
  cursor: pointer; transition: all 0.15s;
}
.btn-cancel:hover { border-color: var(--border-strong); color: var(--text-secondary); }
.btn-confirm {
  padding: 6px 14px; border-radius: 6px; font-size: var(--text-sm); font-weight: 700;
  border: none; cursor: pointer; transition: all 0.15s;
}
.btn-confirm-danger { background: var(--color-danger); color: #fff; }
.btn-confirm-danger:hover { background: var(--color-danger-hover); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
