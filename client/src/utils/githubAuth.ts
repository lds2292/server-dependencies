const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID ?? ''

/**
 * GitHub OAuth 인증 팝업을 열고, redirect 후 받은 code를 반환한다.
 */
export function openGitHubAuthPopup(): Promise<string> {
  return new Promise((resolve, reject) => {
    const redirectUri = `${window.location.origin}/auth/github/callback`
    const state = crypto.randomUUID()
    sessionStorage.setItem('github_oauth_state', state)

    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: 'read:user user:email',
      state,
    })

    const width = 500
    const height = 700
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      `https://github.com/login/oauth/authorize?${params}`,
      'github-oauth',
      `width=${width},height=${height},left=${left},top=${top},popup=yes`
    )

    if (!popup) {
      reject(new Error('POPUP_BLOCKED'))
      return
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'github-oauth-callback') return

      window.removeEventListener('message', onMessage)
      clearInterval(pollTimer)

      const { code, state: returnedState, error } = event.data
      if (error) {
        reject(new Error(error))
        return
      }

      const savedState = sessionStorage.getItem('github_oauth_state')
      sessionStorage.removeItem('github_oauth_state')

      if (returnedState !== savedState) {
        reject(new Error('State mismatch'))
        return
      }

      resolve(code)
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
