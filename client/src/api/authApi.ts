import { http } from './http'

export interface AuthUser {
  id: string
  email: string
  username: string
  createdAt: string
}

export interface AuthResponse {
  user: AuthUser
  accessToken: string
  refreshToken: string
}

export const authApi = {
  register(email: string, username: string, password: string) {
    return http.post<AuthResponse>('/auth/register', { email, username, password })
  },
  login(email: string, password: string) {
    return http.post<AuthResponse>('/auth/login', { email, password })
  },
  logout(refreshToken: string) {
    return http.post('/auth/logout', { refreshToken })
  },
  refresh(refreshToken: string) {
    return http.post<{ accessToken: string }>('/auth/refresh', { refreshToken })
  },
  me() {
    return http.get<AuthUser>('/auth/me')
  },
}
