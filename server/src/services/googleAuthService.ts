import { OAuth2Client } from 'google-auth-library'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const client = new OAuth2Client(GOOGLE_CLIENT_ID)

export interface GoogleTokenPayload {
  sub: string
  email: string
  name: string
  picture?: string
  email_verified: boolean
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleTokenPayload> {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  if (!payload || !payload.email || !payload.sub) {
    throw Object.assign(new Error('유효하지 않은 Google ID Token입니다.'), { code: 'INVALID_GOOGLE_TOKEN' })
  }
  if (!payload.email_verified) {
    throw Object.assign(new Error('이메일이 인증되지 않은 Google 계정입니다.'), { code: 'EMAIL_NOT_VERIFIED' })
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email.split('@')[0],
    picture: payload.picture,
    email_verified: payload.email_verified,
  }
}
