<template>
  <div class="auth-page">
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
        <button type="submit" class="btn-submit" :disabled="loading">
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
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: #0f172a; padding: 24px;
}
.auth-card {
  width: 100%; max-width: 400px;
  background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 36px;
}
.auth-logo {
  display: block; text-align: center; font-size: 12px; font-weight: 700;
  color: #60a5fa; text-decoration: none; letter-spacing: 0.05em; margin-bottom: 24px;
}
.auth-title { font-size: 22px; font-weight: 700; color: #f1f5f9; text-align: center; margin: 0 0 28px 0; }
.auth-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 600; color: #94a3b8; }
.form-input {
  background: #0f172a; border: 1px solid #334155; border-radius: 7px;
  padding: 9px 12px; font-size: 14px; color: #e2e8f0; outline: none;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: #3b82f6; }
.form-input::placeholder { color: #475569; }
.form-error {
  font-size: 12px; color: #f87171; background: #2d1b1b; border: 1px solid #7f1d1d;
  border-radius: 6px; padding: 8px 12px;
}
.btn-submit {
  background: #2563eb; color: #fff; border: none; border-radius: 7px;
  padding: 10px; font-size: 14px; font-weight: 700; cursor: pointer;
  transition: background 0.15s; margin-top: 4px;
}
.btn-submit:hover:not(:disabled) { background: #1d4ed8; }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.auth-link { text-align: center; font-size: 13px; color: #64748b; margin: 20px 0 0 0; }
.auth-link a { color: #60a5fa; text-decoration: none; }
.auth-link a:hover { text-decoration: underline; }
</style>
