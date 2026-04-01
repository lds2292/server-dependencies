export interface GitHubUserPayload {
  sub: string
  email: string
  name: string
}

/**
 * GitHub Authorization Code를 Access Token으로 교환하고,
 * 사용자 정보를 조회하여 반환한다.
 */
export async function verifyGitHubCode(code: string): Promise<GitHubUserPayload> {
  // 1) code → access_token 교환
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  })

  const tokenData = await tokenRes.json() as { access_token?: string; error?: string }
  if (!tokenData.access_token) {
    throw Object.assign(new Error('Invalid GitHub authorization code'), { code: 'INVALID_GITHUB_TOKEN' })
  }

  const accessToken = tokenData.access_token

  // 2) 사용자 정보 조회
  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  const userData = await userRes.json() as { id?: number; login?: string; name?: string | null }
  if (!userData.id) {
    throw Object.assign(new Error('Failed to fetch GitHub user info'), { code: 'INVALID_GITHUB_TOKEN' })
  }

  // 3) 이메일 조회 (primary + verified)
  const emailRes = await fetch('https://api.github.com/user/emails', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  const emails = await emailRes.json() as Array<{ email: string; primary: boolean; verified: boolean }>
  const primaryEmail = emails.find(e => e.primary && e.verified)
  if (!primaryEmail) {
    throw Object.assign(new Error('GitHub account has no verified primary email'), { code: 'EMAIL_NOT_VERIFIED' })
  }

  return {
    sub: String(userData.id),
    email: primaryEmail.email,
    name: userData.name || userData.login || primaryEmail.email.split('@')[0],
  }
}
