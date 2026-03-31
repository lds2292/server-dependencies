import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type AuthUser } from '../api/authApi'
import { setAccessToken } from '../api/http'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const sessionInitialized = ref(false)

  const isLoggedIn = computed(() => user.value !== null)
  const isOAuthOnly = computed(() => user.value !== null && !user.value.hasPassword)
  const hasGoogleProvider = computed(() => user.value?.providers?.includes('google') ?? false)

  async function initializeSession(): Promise<void> {
    if (sessionInitialized.value) return
    sessionInitialized.value = true

    const refreshToken = localStorage.getItem('refreshToken')
    if (!refreshToken) return

    try {
      const { data } = await authApi.refresh(refreshToken)
      setAccessToken(data.accessToken)
      const { data: userData } = await authApi.me()
      user.value = userData
    } catch {
      localStorage.removeItem('refreshToken')
      setAccessToken(null)
    }
  }

  async function login(email: string, password: string): Promise<void> {
    const { data } = await authApi.login(email, password)
    setAccessToken(data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    user.value = data.user
  }

  async function register(email: string, username: string, password: string): Promise<void> {
    const { data } = await authApi.register(email, username, password)
    setAccessToken(data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    user.value = data.user
  }

  async function googleLogin(idToken: string): Promise<void> {
    const { data } = await authApi.googleLogin(idToken)
    setAccessToken(data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    user.value = data.user
  }

  async function logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try { await authApi.logout(refreshToken) } catch { /* ignore */ }
    }
    setAccessToken(null)
    localStorage.removeItem('refreshToken')
    user.value = null
    // 히스토리를 초기화하여 뒤로가기로 인증 필요 페이지에 접근 방지
    window.location.replace('/login')
  }

  async function updateProfile(data: { username?: string }): Promise<void> {
    const { data: updatedUser } = await authApi.updateProfile(data)
    user.value = updatedUser
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authApi.changePassword({ currentPassword, newPassword })
  }

  async function deleteAccount(params: { password: string } | { provider: string; idToken: string }): Promise<void> {
    await authApi.deleteAccount(params)
    setAccessToken(null)
    localStorage.removeItem('refreshToken')
    user.value = null
  }

  return {
    user, isLoggedIn, isOAuthOnly, hasGoogleProvider, sessionInitialized,
    initializeSession, login, register, googleLogin, logout,
    updateProfile, changePassword, deleteAccount,
  }
})
