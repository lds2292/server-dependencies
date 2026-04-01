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
  const hasGitHubProvider = computed(() => user.value?.providers?.includes('github') ?? false)

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

  /** 토큰 저장 후 /me로 전체 사용자 정보(providers, hasPassword 포함) 로드 */
  async function setTokensAndLoadUser(accessToken: string, refreshToken: string): Promise<void> {
    setAccessToken(accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    const { data: userData } = await authApi.me()
    user.value = userData
  }

  async function login(email: string, password: string): Promise<void> {
    const { data } = await authApi.login(email, password)
    await setTokensAndLoadUser(data.accessToken, data.refreshToken)
  }

  async function register(email: string, username: string, password: string): Promise<void> {
    const { data } = await authApi.register(email, username, password)
    await setTokensAndLoadUser(data.accessToken, data.refreshToken)
  }

  async function googleLogin(idToken: string): Promise<void> {
    const { data } = await authApi.googleLogin(idToken)
    await setTokensAndLoadUser(data.accessToken, data.refreshToken)
  }

  async function githubLogin(code: string): Promise<void> {
    const { data } = await authApi.githubLogin(code)
    await setTokensAndLoadUser(data.accessToken, data.refreshToken)
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

  async function reactivateAccount(params: { email: string; password: string } | { provider: string; idToken: string }): Promise<void> {
    const { data } = await authApi.reactivateAccount(params)
    await setTokensAndLoadUser(data.accessToken, data.refreshToken)
  }

  return {
    user, isLoggedIn, isOAuthOnly, hasGoogleProvider, hasGitHubProvider, sessionInitialized,
    initializeSession, login, register, googleLogin, githubLogin, logout,
    updateProfile, changePassword, deleteAccount, reactivateAccount,
  }
})
