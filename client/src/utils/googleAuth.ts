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
 * Google 재인증용: One Tap 프롬프트를 표시하여 ID Token을 받습니다.
 * AccountView 계정 삭제 시 사용합니다.
 */
export function promptGoogleReauth(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services가 로드되지 않았습니다.'))
      return
    }

    tokenCallback = resolve
    ensureInitialized()

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        tokenCallback = null
        reject(new Error('Google 인증 팝업을 표시할 수 없습니다. 팝업 차단을 확인해 주세요.'))
      }
    })
  })
}
