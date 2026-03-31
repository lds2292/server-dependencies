# Google OAuth 소셜 로그인 구현 기획서

## 개요

Google Identity Services(GIS)의 ID Token 방식을 사용하여 소셜 로그인을 추가한다. 기존 이메일/비밀번호 인증과 병행하며, 같은 이메일의 기존 계정은 자동 병합(merge)한다. 향후 GitHub, Kakao 등 다른 OAuth 프로바이더 추가를 고려한 확장 가능한 설계를 적용한다.

---

## 1단계: 현황 분석

### 현재 인증 구조

- **서버**: Express + JWT (Access 15분 / Refresh 30일) + Prisma + PostgreSQL
- **인증 서비스**: `server/src/services/authService.ts` -- `register`, `login`, `deleteAccount`, `verifyUserPassword` 등
- **암호화**: `server/src/services/cryptoService.ts` -- `encrypt`, `decrypt`, `hmac` (AES-256-GCM + HMAC-SHA256)
- **미들웨어**: `server/src/middleware/authenticate.ts` -- Bearer 토큰 검증
- **라우트**: `server/src/routes/auth.ts` -- 8개 엔드포인트
- **컨트롤러**: `server/src/controllers/authController.ts` -- 각 엔드포인트 핸들러
- **클라이언트 Store**: `client/src/stores/auth.ts` -- Pinia store (`login`, `register`, `logout`, `deleteAccount` 등)
- **API 클라이언트**: `client/src/api/authApi.ts` -- `AuthUser`, `AuthResponse` 인터페이스 + API 호출
- **HTTP 클라이언트**: `client/src/api/http.ts` -- Axios 인스턴스, interceptor (401 시 토큰 갱신)
- **라우터**: `client/src/router/index.ts` -- 인증 가드, publicOnly 페이지 리다이렉트

### 현재 DB 스키마 (User)

```prisma
model User {
  id           String   @id @default(uuid())
  email        String              // AES-256-GCM 암호화
  emailHash    String   @unique    // HMAC-SHA256
  username     String              // AES-256-GCM 암호화
  usernameHash String   @unique    // HMAC-SHA256
  passwordHash String
  createdAt    DateTime @default(now())
  // ... relations
}
```

### 현재 문제점

1. `User.passwordHash`가 `NOT NULL` -- OAuth 전용 사용자는 비밀번호가 없으므로 nullable로 변경 필요
2. OAuth 프로바이더 정보를 저장할 테이블이 없음
3. 계정 삭제 시 `verifyUserPassword`만 사용 -- OAuth 사용자는 Google 재인증이 필요
4. 클라이언트 로그인/회원가입 뷰에 소셜 로그인 버튼이 없음
5. AccountView 회원탈퇴 모달이 비밀번호 입력만 지원

### 사용 가능한 기존 패턴

- 세션 생성 패턴: `authController.ts`의 `register`/`login`에서 accessToken + refreshToken + Session 레코드 생성
- 에러 코드 패턴: `Object.assign(new Error('메시지'), { code: 'ERROR_CODE' })` 방식
- 감사 로그 패턴: `auditLogService.createAuditLog(...)` 호출
- 클라이언트 에러 처리 패턴: `e.response?.data?.code` 분기

---

## 2단계: 데이터 모델 & 로직 설계

### 2.1 Prisma 스키마 변경

```prisma
// User 모델 변경 -- passwordHash를 nullable로
model User {
  id           String   @id @default(uuid())
  email        String
  emailHash    String   @unique
  username     String
  usernameHash String   @unique
  passwordHash String?                    // nullable로 변경 (OAuth 전용 사용자)
  createdAt    DateTime @default(now())

  // 기존 relations 유지
  ownedProjects       Project[]           @relation("ProjectOwner")
  memberships         ProjectMember[]
  sessions            Session[]
  auditLogs           AuditLog[]
  invitationsSent     ProjectInvitation[] @relation("InvitationsSent")
  invitationsReceived ProjectInvitation[] @relation("InvitationsReceived")

  // 신규 relation
  oauthAccounts       OAuthAccount[]
}

// 신규 모델 -- 확장 가능한 OAuth 프로바이더 연동
model OAuthAccount {
  id            String   @id @default(uuid())
  userId        String
  provider      String              // "google" | "github" | "kakao" 등
  providerSub   String              // 프로바이더의 고유 사용자 ID (Google의 sub 값)
  createdAt     DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerSub])  // 프로바이더별 고유 사용자 ID는 유일
  @@index([userId])
}
```

마이그레이션 SQL 핵심:
1. `User.passwordHash`를 nullable로 `ALTER COLUMN`
2. `OAuthAccount` 테이블 생성

### 2.2 서버 타입 변경

```typescript
// server/src/types/index.ts -- 기존 유지, 추가 없음
// AuthTokenPayload는 변경 없음 (userId, email, username)
```

### 2.3 서버 서비스 변경

#### 2.3.1 신규: `server/src/services/googleAuthService.ts`

```typescript
// Google ID Token 검증 서비스
// google-auth-library 패키지 사용

import { OAuth2Client } from 'google-auth-library'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const client = new OAuth2Client(GOOGLE_CLIENT_ID)

export interface GoogleTokenPayload {
  sub: string        // Google 고유 사용자 ID
  email: string
  name: string
  picture?: string
  email_verified: boolean
}

/**
 * Google ID Token을 검증하고 페이로드를 반환한다.
 * @throws 검증 실패 시 에러
 */
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
```

#### 2.3.2 변경: `server/src/services/authService.ts`

**신규 함수 추가:**

```typescript
/**
 * Google OAuth 로그인/회원가입 통합 처리
 *
 * 1. Google ID Token 검증
 * 2. OAuthAccount로 기존 연동 확인 -> 있으면 로그인
 * 3. emailHash로 기존 일반 계정 확인 -> 있으면 OAuthAccount 연동 후 로그인 (자동 병합)
 * 4. 신규 사용자 -> User + OAuthAccount 생성 (passwordHash = null)
 */
export async function googleLogin(idToken: string): Promise<{
  user: { id: string; email: string; username: string; createdAt: Date }
  accessToken: string
  refreshToken: string
  isNewUser: boolean
}> {
  // ... 구현 상세는 아래 플로우 참조
}

/**
 * OAuth 사용자의 계정 삭제 (Google ID Token으로 본인 확인)
 */
export async function deleteAccountWithOAuth(
  userId: string,
  provider: string,
  idToken: string
): Promise<void> {
  // Google ID Token 검증 -> sub가 해당 userId의 OAuthAccount와 일치하는지 확인
  // 이후 기존 deleteAccount의 MASTER 체크 + 트랜잭션 로직 재사용
}
```

**기존 함수 변경:**

| 함수 | 변경 내용 |
|------|-----------|
| `verifyUserPassword` | OAuth 전용 계정(passwordHash === null)이면 `OAUTH_ONLY_ACCOUNT` 에러 발생 |
| `deleteAccount` | 내부의 MASTER 체크 + 트랜잭션 로직을 별도 헬퍼(`performAccountDeletion`)로 분리하여 `deleteAccountWithOAuth`에서도 재사용 |
| `changePassword` | OAuth 전용 계정이면 `OAUTH_ONLY_ACCOUNT` 에러 발생 |

**`googleLogin` 상세 플로우:**

```typescript
export async function googleLogin(idToken: string) {
  const googleUser = await verifyGoogleIdToken(idToken)

  // 1) OAuthAccount로 기존 연동 확인
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: { provider_providerSub: { provider: 'google', providerSub: googleUser.sub } },
    include: { user: true },
  })

  if (existingOAuth) {
    const user = decryptUserFields(existingOAuth.user)
    return issueTokens(user, false)
  }

  // 2) emailHash로 기존 계정 확인 (자동 병합)
  const emailHash = hmac(googleUser.email.toLowerCase())
  const existingUser = await prisma.user.findUnique({ where: { emailHash } })

  if (existingUser) {
    // OAuthAccount 연동 추가
    await prisma.oAuthAccount.create({
      data: {
        userId: existingUser.id,
        provider: 'google',
        providerSub: googleUser.sub,
      },
    })
    const user = decryptUserFields(existingUser)
    return issueTokens(user, false)
  }

  // 3) 신규 사용자 생성
  const usernameBase = googleUser.name
  const username = await generateUniqueUsername(usernameBase)
  const usernameHash = hmac(username)

  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: encrypt(googleUser.email),
        emailHash,
        username: encrypt(username),
        usernameHash,
        passwordHash: null,  // OAuth 전용
      },
    })
    await tx.oAuthAccount.create({
      data: {
        userId: user.id,
        provider: 'google',
        providerSub: googleUser.sub,
      },
    })
    return user
  })

  const user = decryptUserFields(newUser)
  return issueTokens(user, true)
}

// 헬퍼: 토큰 발급 + 세션 생성
function issueTokens(user: { id: string; email: string; username: string; createdAt: Date }, isNewUser: boolean) {
  const payload: AuthTokenPayload = { userId: user.id, email: user.email, username: user.username }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)
  // 참고: 이 함수 내에서 prisma.session.create 호출
  // (실제 구현 시 async로 처리)

  return { user, accessToken, refreshToken, isNewUser }
}

// 헬퍼: username 중복 시 숫자 접미사 추가
async function generateUniqueUsername(base: string): Promise<string> {
  const baseHash = hmac(base)
  const existing = await prisma.user.findUnique({ where: { usernameHash: baseHash } })
  if (!existing) return base

  let suffix = 2
  while (true) {
    const candidate = `${base}${suffix}`
    const candidateHash = hmac(candidate)
    const found = await prisma.user.findUnique({ where: { usernameHash: candidateHash } })
    if (!found) return candidate
    suffix++
    if (suffix > 100) throw new Error('사용자명 생성에 실패했습니다.')
  }
}
```

### 2.4 서버 컨트롤러 변경

#### `server/src/controllers/authController.ts`

**신규 함수:**

```typescript
/**
 * POST /api/auth/google
 * Body: { idToken: string }
 * 응답: AuthResponse (user, accessToken, refreshToken) + isNewUser
 */
export async function googleLogin(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { idToken } = req.body
    if (!idToken) {
      res.status(400).json({ error: 'idToken이 필요합니다.', code: 'VALIDATION_ERROR' })
      return
    }
    const result = await authService.googleLogin(idToken)
    await auditLogService.createAuditLog({
      action: result.isNewUser ? 'REGISTER_GOOGLE' : 'LOGIN_GOOGLE',
      status: 'SUCCESS',
      userId: result.user.id,
      email: result.user.email,
      ipAddress,
      userAgent,
    })
    const status = result.isNewUser ? 201 : 200
    res.status(status).json({
      user: { id: result.user.id, email: result.user.email, username: result.user.username, createdAt: result.user.createdAt },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    })
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_GOOGLE_TOKEN' || e.code === 'EMAIL_NOT_VERIFIED') {
      res.status(401).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH google login error', { error: (err as Error).message })
      res.status(500).json({ error: '서버 오류가 발생했습니다.' })
    }
  }
}
```

**기존 함수 변경:**

| 함수 | 변경 내용 |
|------|-----------|
| `deleteAccount` | body에서 `password` 대신 `{ password?, provider?, idToken? }` 수용. provider가 있으면 `deleteAccountWithOAuth` 호출, 없으면 기존 로직 유지. password도 provider도 없으면 400 에러. |
| `changePassword` | OAuth 전용 계정 에러(`OAUTH_ONLY_ACCOUNT`) 처리 추가 -- 403 응답 |
| `me` | 응답에 `hasPassword` 필드 추가 (OAuth 전용 계정 판별용) |

**`deleteAccount` 변경 상세:**

```typescript
export async function deleteAccount(req: Request, res: Response): Promise<void> {
  const { ipAddress, userAgent } = getClientInfo(req)
  try {
    const { password, provider, idToken } = req.body
    const userId = req.user!.userId

    if (provider && idToken) {
      // OAuth 재인증으로 계정 삭제
      await authService.deleteAccountWithOAuth(userId, provider, idToken)
    } else if (password) {
      // 기존 비밀번호 확인으로 계정 삭제
      await authService.deleteAccount(userId, password)
    } else {
      res.status(400).json({ error: '본인 확인 정보가 필요합니다.', code: 'VALIDATION_ERROR' })
      return
    }

    await auditLogService.createAuditLog({
      action: 'ACCOUNT_DELETE', status: 'SUCCESS',
      email: req.user!.email, ipAddress, userAgent,
    }).catch(() => {})
    res.status(204).send()
  } catch (err: unknown) {
    // 기존 에러 처리 + INVALID_GOOGLE_TOKEN 추가
    const e = err as { code?: string; message?: string }
    if (e.code === 'INVALID_CREDENTIALS') {
      res.status(401).json({ error: '비밀번호가 올바르지 않습니다.', code: e.code })
    } else if (e.code === 'INVALID_GOOGLE_TOKEN') {
      res.status(401).json({ error: 'Google 인증에 실패했습니다.', code: e.code })
    } else if (e.code === 'MASTER_ROLE_EXISTS') {
      res.status(409).json({ error: e.message, code: e.code })
    } else {
      logger.error('AUTH account delete error', { userId: req.user!.userId, error: (err as Error).message })
      res.status(500).json({ error: '서버 오류가 발생했습니다.' })
    }
  }
}
```

**`me` 응답 변경:**

```typescript
// 기존
res.json({ id: decrypted.id, email: decrypted.email, username: decrypted.username, createdAt: decrypted.createdAt })

// 변경 후
const oauthAccounts = await prisma.oAuthAccount.findMany({
  where: { userId: decrypted.id },
  select: { provider: true },
})
res.json({
  id: decrypted.id,
  email: decrypted.email,
  username: decrypted.username,
  createdAt: decrypted.createdAt,
  hasPassword: user.passwordHash !== null,
  providers: oauthAccounts.map(a => a.provider),  // ["google"] 등
})
```

### 2.5 API 엔드포인트 요약

| Method | Path | Auth | 설명 |
|--------|------|------|------|
| POST | `/api/auth/google` | 없음 | Google ID Token으로 로그인/회원가입 |
| GET | `/api/auth/me` | 필요 | (변경) `hasPassword`, `providers` 필드 추가 |
| DELETE | `/api/auth/account` | 필요 | (변경) `{ provider, idToken }` 또는 `{ password }` |
| PUT | `/api/auth/password` | 필요 | (변경) OAuth 전용 계정이면 403 |

### 2.6 클라이언트 타입 변경

```typescript
// client/src/api/authApi.ts

export interface AuthUser {
  id: string
  email: string
  username: string
  createdAt: string
  hasPassword: boolean       // 신규: 비밀번호 설정 여부
  providers: string[]        // 신규: 연동된 OAuth 프로바이더 목록
}

// authApi 객체에 추가
export const authApi = {
  // ... 기존 메서드 유지

  googleLogin(idToken: string) {
    return http.post<AuthResponse>('/auth/google', { idToken })
  },

  // deleteAccount 시그니처 변경
  deleteAccount(params: { password: string } | { provider: string; idToken: string }) {
    return http.delete('/auth/account', { data: params })
  },
}
```

### 2.7 클라이언트 Store 변경

```typescript
// client/src/stores/auth.ts -- 추가/변경 사항

async function googleLogin(idToken: string): Promise<void> {
  const { data } = await authApi.googleLogin(idToken)
  setAccessToken(data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  user.value = data.user
}

// deleteAccount 시그니처 변경
async function deleteAccount(params: { password: string } | { provider: string; idToken: string }): Promise<void> {
  await authApi.deleteAccount(params)
  setAccessToken(null)
  localStorage.removeItem('refreshToken')
  user.value = null
}

// computed 추가
const isOAuthOnly = computed(() => user.value !== null && !user.value.hasPassword)
const hasGoogleProvider = computed(() => user.value?.providers?.includes('google') ?? false)

return {
  // ... 기존 + 추가
  googleLogin,
  isOAuthOnly,
  hasGoogleProvider,
}
```

---

## 3단계: UI/UX 스펙

### 3.1 Google 로그인 버튼 -- LoginView.vue, RegisterView.vue

두 페이지 모두 기존 폼 아래에 구분선과 Google 로그인 버튼을 추가한다.

```
+------------------------------------------+
|          Server Dependencies             |
|              로그인                       |
|                                          |
| 이메일                                   |
| [________________________]               |
| 비밀번호                                 |
| [________________________]               |
|                                          |
| [        로그인         ]  <-- 기존      |
|                                          |
| ----------- 또는 ----------              |
|                                          |
| [  G  Google로 계속하기  ]  <-- 신규     |
|                                          |
| 계정이 없으신가요? 회원가입              |
+------------------------------------------+
```

#### Google 버튼 스타일

Google 브랜드 가이드라인에 따라 버튼을 구성한다. 다크 테마에 맞춘 커스텀 스타일링을 적용한다.

**신규 CSS 변수** (`client/src/style.css`에 추가):

```css
/* ── 소셜 로그인 ── */
--btn-google-bg: #232328;
--btn-google-bg-hover: #2a2a30;
--btn-google-border: #3a3a42;
--btn-google-text: #d4d4d4;
```

**구분선 스타일:**

```css
.auth-divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0;
}
.auth-divider::before,
.auth-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-default);
}
.auth-divider span {
  font-size: var(--text-xs);
  color: var(--text-disabled);
  white-space: nowrap;
}
```

**Google 버튼 스타일:**

```css
.btn-google {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  height: 42px;
  background: var(--btn-google-bg);
  border: 1px solid var(--btn-google-border);
  border-radius: 7px;
  color: var(--btn-google-text);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.btn-google:hover {
  background: var(--btn-google-bg-hover);
  border-color: var(--border-strong);
}
.btn-google:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-google svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}
```

Google "G" 로고는 공식 SVG를 인라인으로 사용한다 (장식용 일회성 아이콘이므로 Icon.vue에 등록하지 않음).

```html
<button class="btn-google" @click="onGoogleLogin" :disabled="googleLoading">
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
  {{ googleLoading ? '로그인 중...' : 'Google로 계속하기' }}
</button>
```

#### Google Identity Services 로딩

Google GIS 라이브러리를 index.html에 스크립트로 로드하지 **않는다**. 대신 Google ID Token을 직접 받는 방식을 사용한다.

**방식: 팝업 기반 (google.accounts.oauth2)**

`index.html`에 GIS 스크립트 태그를 추가한다:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

클라이언트에서 `google.accounts.id.initialize` + `google.accounts.id.prompt` 또는 커스텀 버튼의 `renderButton`을 사용하지 않고, **One Tap이 아닌 팝업 방식**으로 ID Token을 받는다. 구체적으로는:

**신규 유틸리티: `client/src/utils/googleAuth.ts`**

```typescript
const GOOGLE_CLIENT_ID = '374996474078-79ppp4r3hsm1vmo7ch2e14mujlke2u6r.apps.googleusercontent.com'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void
          cancel: () => void
        }
      }
    }
  }
}

let initialized = false
let resolveToken: ((token: string) => void) | null = null
let rejectToken: ((error: Error) => void) | null = null

function ensureInitialized(): void {
  if (initialized || !window.google) return
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      if (resolveToken) {
        resolveToken(response.credential)
        resolveToken = null
        rejectToken = null
      }
    },
  })
  initialized = true
}

/**
 * Google 로그인 팝업을 표시하고 ID Token을 반환한다.
 * 숨겨진 div에 renderButton을 그린 뒤 프로그래밍적으로 클릭하여 팝업을 트리거한다.
 */
export function requestGoogleIdToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services가 로드되지 않았습니다.'))
      return
    }
    ensureInitialized()
    resolveToken = resolve
    rejectToken = reject

    // 숨겨진 버튼으로 팝업 트리거
    let container = document.getElementById('g-signin-hidden')
    if (!container) {
      container = document.createElement('div')
      container.id = 'g-signin-hidden'
      container.style.position = 'fixed'
      container.style.top = '-9999px'
      container.style.left = '-9999px'
      document.body.appendChild(container)
    }
    container.innerHTML = ''
    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      size: 'large',
    })
    // 렌더링된 iframe 내부 버튼을 클릭
    const iframe = container.querySelector('iframe')
    if (iframe) {
      // Google 버튼이 iframe 안에 있으므로 직접 클릭 불가
      // 대안: prompt() 사용
    }

    // prompt() 방식으로 대체
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // One Tap이 표시되지 않으면 FedCM 또는 팝업 폴백 필요
        // 이 경우 reject
        if (rejectToken) {
          rejectToken(new Error('Google 로그인이 취소되었습니다.'))
          resolveToken = null
          rejectToken = null
        }
      }
    })
  })
}
```

> **주의**: Google Identity Services는 2023년 이후 `prompt()`(One Tap) 방식을 권장한다. 하지만 One Tap은 쿠키/브라우저 상태에 따라 표시되지 않을 수 있다. 더 안정적인 방식은 **`google.accounts.oauth2.initCodeClient`를 사용한 Authorization Code 방식**이지만, 요구사항에서 ID Token 방식을 명시했으므로 아래의 **커스텀 팝업 방식**을 채택한다.

**최종 채택 방식: `google.accounts.id.initialize` + 커스텀 버튼 클릭**

```typescript
// client/src/utils/googleAuth.ts (최종)

const GOOGLE_CLIENT_ID = '374996474078-79ppp4r3hsm1vmo7ch2e14mujlke2u6r.apps.googleusercontent.com'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
            ux_mode?: 'popup' | 'redirect'
            context?: 'signin' | 'signup' | 'use'
          }) => void
          prompt: (callback?: (notification: {
            isNotDisplayed: () => boolean
            isSkippedMoment: () => boolean
            getDismissedReason: () => string
          }) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

type TokenCallback = (token: string) => void
type ErrorCallback = (error: Error) => void

let pendingResolve: TokenCallback | null = null
let pendingReject: ErrorCallback | null = null

export function initializeGoogleAuth(onToken: TokenCallback): void {
  if (!window.google) return
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (response) => {
      onToken(response.credential)
    },
    ux_mode: 'popup',
  })
}

/**
 * Google One Tap 프롬프트를 표시한다.
 * 사용자가 Google 계정을 선택하면 initialize의 callback이 호출된다.
 */
export function promptGoogleLogin(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google) {
      reject(new Error('Google Identity Services가 로드되지 않았습니다.'))
      return
    }

    pendingResolve = resolve
    pendingReject = reject

    initializeGoogleAuth((token) => {
      if (pendingResolve) {
        pendingResolve(token)
        pendingResolve = null
        pendingReject = null
      }
    })

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        if (pendingReject) {
          pendingReject(new Error('Google 로그인 팝업을 표시할 수 없습니다. 팝업 차단을 확인해 주세요.'))
          pendingResolve = null
          pendingReject = null
        }
      }
    })
  })
}
```

### 3.2 AccountView.vue 변경

#### 비밀번호 변경 섹션

OAuth 전용 계정(`!hasPassword && providers.length > 0`)이면 비밀번호 변경 섹션을 다른 문구로 표시한다.

```
+------------------------------------------+
| > 비밀번호 변경                          |
|                                          |
|   Google 계정으로 로그인하고 있어        |
|   비밀번호가 설정되어 있지 않습니다.     |
|                                          |
+------------------------------------------+
```

`authStore.isOAuthOnly` computed로 분기한다.

#### 계정 삭제 모달

OAuth 사용자와 일반 사용자의 확인 방식을 분기한다.

**일반 사용자 (기존 유지):**
```
+------------------------------------------+
|        계정 삭제                         |
|                                          |
| 이 작업은 되돌릴 수 없습니다.            |
| 계속하려면 비밀번호를 입력하세요.        |
|                                          |
| 비밀번호 확인                            |
| [________________________]               |
|                                          |
|              [취소]  [계정 삭제]         |
+------------------------------------------+
```

**Google OAuth 사용자:**
```
+------------------------------------------+
|        계정 삭제                         |
|                                          |
| 이 작업은 되돌릴 수 없습니다.            |
| 계속하려면 Google 계정으로 본인 확인을   |
| 진행하세요.                              |
|                                          |
| [  G  Google로 본인 확인  ]              |
|                                          |
|              [취소]                      |
+------------------------------------------+
```

**하이브리드 사용자 (비밀번호 + Google 모두 있는 경우):**
비밀번호 입력 방식을 기본으로 표시한다 (기존 UX 유지).

#### 연동 정보 섹션 (프로필 정보 아래)

```
+------------------------------------------+
| > 로그인 방법                            |
|                                          |
|   [G] Google 연동됨                      |
|   -------------------------              |
|   비밀번호 설정됨                        |
|       또는                               |
|   비밀번호 미설정                        |
+------------------------------------------+
```

이 섹션은 읽기 전용 정보 표시만 한다 (연동 해제 기능은 이 기획 범위 밖).

### 3.3 컴포넌트 Props/Emit

이 기획에서는 신규 컴포넌트를 만들지 않는다. 기존 뷰 파일 내에서 처리한다.

| 뷰 | 변경 내용 |
|----|-----------|
| `LoginView.vue` | 구분선 + Google 버튼 추가, `onGoogleLogin` 핸들러 |
| `RegisterView.vue` | 구분선 + Google 버튼 추가, `onGoogleLogin` 핸들러 |
| `AccountView.vue` | 비밀번호 섹션 분기, 삭제 모달 분기, 로그인 방법 섹션 추가 |

### 3.4 인터랙션

- **Google 버튼 클릭**: `loading` 상태 표시 -> GIS 팝업 -> ID Token 수신 -> 서버 API 호출 -> 성공 시 리다이렉트
- **에러 표시**: 기존 `.form-error` 스타일 재사용
- **AccountView 삭제 모달**: `authStore.hasGoogleProvider && !authStore.user.hasPassword` 이면 Google 확인 UI, 그 외 비밀번호 UI

### 3.5 빈 상태/에러 상태

| 상황 | 처리 |
|------|------|
| GIS 스크립트 로드 실패 | Google 버튼을 `disabled` 처리, 에러 메시지 미표시 (일반 로그인은 정상 작동) |
| Google 팝업 차단 | `.form-error`로 "Google 로그인 팝업을 표시할 수 없습니다. 팝업 차단을 확인해 주세요." 표시 |
| Google 토큰 검증 실패 (서버) | `.form-error`로 "Google 인증에 실패했습니다. 다시 시도해 주세요." 표시 |
| 이메일 미인증 Google 계정 | `.form-error`로 "이메일이 인증되지 않은 Google 계정입니다." 표시 |
| username 자동 생성 실패 | 서버 500, 일반 에러 메시지 표시 |

---

## 4단계: 수정 파일 체크리스트

### 서버

| 파일 경로 | 작업 |
|-----------|------|
| `server/prisma/schema.prisma` | `User.passwordHash`를 `String?`로 변경, **`OAuthAccount` 모델 추가**, `User`에 `oauthAccounts` relation 추가 |
| `server/package.json` | `google-auth-library` 의존성 추가 |
| **`server/src/services/googleAuthService.ts`** | **신규 생성**. Google ID Token 검증 (`verifyGoogleIdToken`) |
| `server/src/services/authService.ts` | `googleLogin` 함수 추가, `deleteAccountWithOAuth` 함수 추가, `performAccountDeletion` 헬퍼 분리, `verifyUserPassword`에 OAuth 전용 계정 체크 추가, `changePassword`에 OAuth 전용 계정 체크 추가, `generateUniqueUsername` 헬퍼 추가, `issueTokens` 헬퍼 분리 |
| `server/src/controllers/authController.ts` | `googleLogin` 핸들러 추가, `deleteAccount` 핸들러에 OAuth 분기 추가, `me` 핸들러에 `hasPassword`/`providers` 응답 필드 추가, `changePassword`에 `OAUTH_ONLY_ACCOUNT` 에러 처리 추가 |
| `server/src/routes/auth.ts` | `router.post('/google', authController.googleLogin)` 추가 |

### 클라이언트

| 파일 경로 | 작업 |
|-----------|------|
| `client/index.html` | GIS 스크립트 태그 추가 (`<script src="https://accounts.google.com/gsi/client" async defer>`) |
| **`client/src/utils/googleAuth.ts`** | **신규 생성**. `initializeGoogleAuth`, `promptGoogleLogin`, 전역 타입 선언 |
| `client/src/api/authApi.ts` | `AuthUser`에 `hasPassword`, `providers` 필드 추가, `googleLogin` 메서드 추가, `deleteAccount` 시그니처 변경 |
| `client/src/stores/auth.ts` | `googleLogin` 액션 추가, `deleteAccount` 시그니처 변경, `isOAuthOnly`/`hasGoogleProvider` computed 추가 |
| `client/src/views/LoginView.vue` | 구분선 + Google 버튼 추가, `onGoogleLogin` 핸들러, 스타일 추가 |
| `client/src/views/RegisterView.vue` | 구분선 + Google 버튼 추가, `onGoogleLogin` 핸들러, 스타일 추가 |
| `client/src/views/AccountView.vue` | 비밀번호 섹션 OAuth 분기, 삭제 모달 OAuth 분기 (Google 재인증), 로그인 방법 섹션 추가 |
| `client/src/style.css` | `--btn-google-bg`, `--btn-google-bg-hover`, `--btn-google-border`, `--btn-google-text` CSS 변수 추가 |

### 환경 변수

| 변수 | 위치 | 값 |
|------|------|----|
| `GOOGLE_CLIENT_ID` | `server/.env` | `374996474078-79ppp4r3hsm1vmo7ch2e14mujlke2u6r.apps.googleusercontent.com` |

### DB 마이그레이션

```bash
cd server && npx prisma migrate dev --name add-oauth-account
```

---

## 5. 에지 케이스 및 에러 처리

| 시나리오 | 처리 |
|----------|------|
| 같은 Google 계정으로 반복 로그인 | OAuthAccount로 조회 -> 기존 세션 발급 (정상) |
| 일반 가입 후 같은 이메일로 Google 로그인 | emailHash 매칭 -> OAuthAccount 자동 연동 -> 이후 두 방식 모두 로그인 가능 |
| Google 로그인 후 같은 이메일로 일반 가입 시도 | emailHash 유니크 제약 -> "이미 사용 중인 이메일입니다." (기존 로직 동작) |
| OAuth 전용 유저가 비밀번호 변경 시도 | `OAUTH_ONLY_ACCOUNT` 에러 -> 403 응답 -> "비밀번호가 설정되어 있지 않습니다." |
| OAuth 전용 유저가 비밀번호로 로그인 시도 | emailHash 조회 성공 -> `passwordHash`가 null -> `bcrypt.compare`에서 실패 -> "이메일 또는 비밀번호가 올바르지 않습니다." (기존 에러) |
| Google 서버 장애로 토큰 검증 실패 | 서버에서 catch -> 500 응답 -> "서버 오류가 발생했습니다." |
| GIS 스크립트 CDN 장애 | `window.google` 미존재 -> Google 버튼 disabled, 일반 로그인은 정상 작동 |
| Google 계정의 username이 이미 존재 | `generateUniqueUsername`으로 숫자 접미사 추가 (예: "홍길동" -> "홍길동2") |
| 하이브리드 유저(비밀번호+Google) 계정 삭제 | `hasPassword`가 true이므로 비밀번호 확인 UI 표시 (기존 방식) |
| 삭제된 Google 계정으로 로그인 시도 | Google 자체에서 인증 불가, 앱까지 도달하지 않음 |
| MASTER 역할 보유 유저가 OAuth로 삭제 시도 | `MASTER_ROLE_EXISTS` 에러 -> 409 응답 (기존 동일) |

---

## 6. 보안 고려사항

1. **ID Token 서버 사이드 검증**: Google ID Token은 반드시 서버에서 `google-auth-library`로 검증한다. 클라이언트에서 디코딩한 payload를 신뢰하지 않는다.
2. **audience 검증**: `verifyIdToken`의 `audience`에 자사 Client ID를 명시하여 다른 앱용 토큰 재사용 공격을 방지한다.
3. **email_verified 체크**: Google 계정의 이메일이 인증되지 않은 경우 거부한다.
4. **providerSub 유니크 제약**: `@@unique([provider, providerSub])`로 프로바이더별 고유 사용자 ID 중복 방지.
5. **CSRF**: GIS의 ID Token은 일회용이며, 서버에서 nonce/audience를 검증하므로 CSRF 위험이 낮다.
6. **passwordHash nullable**: OAuth 전용 계정은 `passwordHash`가 `null`이므로, `verifyPassword` 호출 전 null 체크를 추가하여 의도치 않은 인증 우회를 방지한다.
7. **계정 삭제 재인증**: OAuth 사용자의 계정 삭제 시 Google ID Token을 다시 받아 `sub`가 일치하는지 검증하여 본인 확인을 보장한다.
8. **GOOGLE_CLIENT_ID**: 서버 환경 변수로 관리. 클라이언트의 Client ID는 공개값이므로 코드에 포함해도 무방하다.

---

## 제약 조건

- CSS 색상 하드코딩 금지 -- 모든 색상은 `style.css` CSS 변수 사용 (Google 로고 SVG의 브랜드 컬러는 예외)
- 이모지 사용 금지
- 버튼은 글로벌 클래스 사용 원칙이나, Google 버튼은 고유 스타일이므로 `.btn-google` 클래스를 `style.css`에 글로벌로 정의
- Google "G" 로고 SVG는 인라인 사용 (장식용 일회성 아이콘 -- Icon.vue 등록 불필요)
- `native <select>` 대신 `CustomSelect` 사용 (이 기획에는 select 없음)
- 스타일 가이드(`docs/guide/style_guide.md`)에 소셜 로그인 버튼 섹션 추가 필요
