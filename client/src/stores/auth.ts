import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, type AuthUser } from '../api/authApi'
import { setAccessToken } from '../api/http'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const sessionInitialized = ref(false)

  const isLoggedIn = computed(() => user.value !== null)

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

  async function logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try { await authApi.logout(refreshToken) } catch { /* ignore */ }
    }
    setAccessToken(null)
    localStorage.removeItem('refreshToken')
    user.value = null
  }

  async function updateProfile(data: { username?: string }): Promise<void> {
    const { data: updatedUser } = await authApi.updateProfile(data)
    user.value = updatedUser
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await authApi.changePassword({ currentPassword, newPassword })
  }

  return { user, isLoggedIn, sessionInitialized, initializeSession, login, register, logout, updateProfile, changePassword }
})
