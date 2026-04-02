const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            ux_mode?: 'popup' | 'redirect'
          }) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean
            isSkippedMoment: () => boolean
          }) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

let initialized = false
let tokenCallback: ((token: string) => void) | null = null

function ensureInitialized(): void {
  if (initialized || !window.google) return
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      if (tokenCallback) {
        tokenCallback(response.credential)
        tokenCallback = null
      }
    },
    ux_mode: 'popup',
  })
  initialized = true
}

/** GIS가 로드되었는지 확인합니다. */
export function isGoogleAuthAvailable(): boolean {
  return !!window.google?.accounts?.id
}

/**
 * GIS 빌트인 Google 버튼을 지정된 DOM 요소에 렌더링합니다.
 * 사용자가 버튼을 클릭하면 onToken 콜백으로 ID Token이 전달됩니다.
 */
export function renderGoogleButton(element: HTMLElement, onToken: (token: string) => void): void {
  if (!window.google) return
  tokenCallback = onToken
  ensureInitialized()
  window.google.accounts.id.renderButton(element, {
    type: 'standard',
    theme: 'filled_black',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    logo_alignment: 'left',
    width: element.offsetWidth || 368,
  })
}

/**
 * Google 재인증용: OAuth 팝업 윈도우를 열어 ID Token을 받습니다.
 * One Tap은 쿨다운 제한이 있어 반복 호출 시 표시되지 않으므로,
 * 직접 OAuth implicit flow 팝업을 사용합니다.
 */
export function promptGoogleReauth(): Promise<string> {
  return new Promise((resolve, reject) => {
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const state = crypto.randomUUID()
    const nonce = crypto.randomUUID()
    sessionStorage.setItem('google_oauth_state', state)

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'id_token',
      scope: 'openid email profile',
      state,
      nonce,
      prompt: 'select_account',
    })

    const width = 500
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
      'google-oauth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`,
    )

    if (!popup) {
      reject(new Error('POPUP_BLOCKED'))
      return
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'google-oauth-callback') return

      window.removeEventListener('message', onMessage)
      clearInterval(pollTimer)

      const { idToken, state: returnedState, error } = event.data
      if (error) {
        reject(new Error(error))
        return
      }

      const savedState = sessionStorage.getItem('google_oauth_state')
      sessionStorage.removeItem('google_oauth_state')

      if (returnedState !== savedState) {
        reject(new Error('State mismatch'))
        return
      }

      if (!idToken) {
        reject(new Error('No ID token received'))
        return
      }

      resolve(idToken)
    }

    window.addEventListener('message', onMessage)

    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer)
        window.removeEventListener('message', onMessage)
        reject(new Error('POPUP_CLOSED'))
      }
    }, 500)
  })
}
