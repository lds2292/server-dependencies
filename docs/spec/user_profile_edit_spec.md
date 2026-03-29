# 사용자 정보 수정 구현 기획서

## 개요

로그인한 사용자가 자신의 프로필 정보(username, email)를 수정하고, 비밀번호를 변경할 수 있는 기능을 구현한다. 전용 뷰(`/account`)와 백엔드 API 2개를 추가한다.

---

## 1단계: 현황 분석

### 사용 가능한 데이터

| 항목 | 위치 | 내용 |
|------|------|------|
| 인증 사용자 정보 | `auth.user` (AuthUser) | `id`, `email`, `username`, `createdAt` |
| 인증 스토어 | `client/src/stores/auth.ts` | `user`, `isLoggedIn`, `login`, `register`, `logout` |
| API 클라이언트 | `client/src/api/authApi.ts` | `AuthUser` 타입, `authApi` 객체 |
| 서버 인증 서비스 | `server/src/services/authService.ts` | `register`, `login`, `verifyUserPassword`, 암호화/복호화 |
| 암호화 서비스 | `server/src/services/cryptoService.ts` | `encrypt`, `decrypt`, `hmac` |
| Prisma User 모델 | `server/prisma/schema.prisma` | email(암호화), emailHash(HMAC), username(암호화), usernameHash(HMAC), passwordHash |

### 기존 패턴 참조

- **ProjectSettingsView.vue**: 설정 페이지 레이아웃 (topbar + settings-body + settings-section)
- **UserProfileDropdown.vue**: 드롭다운 메뉴 (진입점으로 활용)
- **authService.ts**: 이미 `verifyUserPassword` 함수 존재 (비밀번호 변경 시 현재 비밀번호 확인용)

---

## 2단계: 데이터 모델 & 로직 설계

### 2.1 서버 API 엔드포인트

#### PUT /auth/profile - 프로필 정보 수정

```typescript
// Request Body
interface UpdateProfileRequest {
  username?: string   // 새 사용자명 (2~30자)
  email?: string      // 새 이메일
}

// Response 200
interface AuthUser {
  id: string
  email: string
  username: string
  createdAt: string
}

// Error 409: EMAIL_TAKEN | USERNAME_TAKEN
// Error 400: VALIDATION_ERROR
```

**서버 로직** (`authService.ts`에 함수 추가):
```typescript
export async function updateProfile(
  userId: string,
  data: { username?: string; email?: string }
) {
  const updateData: any = {}

  if (data.email) {
    const emailHash = hmac(data.email.toLowerCase())
    const existing = await prisma.user.findUnique({ where: { emailHash } })
    if (existing && existing.id !== userId) {
      throw Object.assign(new Error('이미 사용 중인 이메일입니다.'), { code: 'EMAIL_TAKEN' })
    }
    updateData.email = encrypt(data.email)
    updateData.emailHash = emailHash
  }

  if (data.username) {
    const usernameHash = hmac(data.username)
    const existing = await prisma.user.findUnique({ where: { usernameHash } })
    if (existing && existing.id !== userId) {
      throw Object.assign(new Error('이미 사용 중인 사용자명입니다.'), { code: 'USERNAME_TAKEN' })
    }
    updateData.username = encrypt(data.username)
    updateData.usernameHash = usernameHash
  }

  if (Object.keys(updateData).length === 0) {
    throw Object.assign(new Error('변경할 항목이 없습니다.'), { code: 'VALIDATION_ERROR' })
  }

  const user = await prisma.user.update({ where: { id: userId }, data: updateData })
  return decryptUserFields(user)
}
```

#### PUT /auth/password - 비밀번호 변경

```typescript
// Request Body
interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string      // 최소 8자
}

// Response 200: { message: '비밀번호가 변경되었습니다.' }
// Error 401: INVALID_CREDENTIALS (현재 비밀번호 불일치)
// Error 400: VALIDATION_ERROR (새 비밀번호 유효성)
```

**서버 로직** (`authService.ts`에 함수 추가):
```typescript
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  await verifyUserPassword(userId, currentPassword)
  const passwordHash = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}
```

### 2.2 서버 라우트 추가

`server/src/routes/auth.ts`에 추가:
```typescript
router.put('/profile', authenticate, authController.updateProfile)
router.put('/password', authenticate, authController.changePassword)
```

### 2.3 서버 컨트롤러 추가

`server/src/controllers/authController.ts`에 함수 추가:
- `updateProfile`: req.body에서 username/email 추출, authService.updateProfile 호출, 감사 로그 기록
- `changePassword`: req.body에서 currentPassword/newPassword 추출, authService.changePassword 호출, 감사 로그 기록

### 2.4 클라이언트 API 추가

`client/src/api/authApi.ts`에 추가:
```typescript
updateProfile(data: { username?: string; email?: string }) {
  return http.put<AuthUser>('/auth/profile', data)
},
changePassword(data: { currentPassword: string; newPassword: string }) {
  return http.put<{ message: string }>('/auth/password', data)
},
```

### 2.5 Auth Store 변경

`client/src/stores/auth.ts`에 추가:
```typescript
async function updateProfile(data: { username?: string; email?: string }): Promise<void> {
  const { data: updatedUser } = await authApi.updateProfile(data)
  user.value = updatedUser
}

async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await authApi.changePassword({ currentPassword, newPassword })
}
```

return 객체에 `updateProfile`, `changePassword` 추가.

### 2.6 라우터 추가

`client/src/router/index.ts`에 추가:
```typescript
{
  path: '/account',
  name: 'account',
  component: () => import('../views/AccountView.vue'),
  meta: { requiresAuth: true },
},
```

### 2.7 UserProfileDropdown 진입점 추가

드롭다운 메뉴에 "내 정보 수정" 버튼 추가 (로그아웃 위):
```html
<button @click="goAccount">내 정보 수정</button>
<div class="user-dropdown-divider"></div>
```

---

## 3단계: UI/UX 스펙

### 3.1 페이지 레이아웃 (ASCII 와이어프레임)

ProjectSettingsView.vue와 동일한 레이아웃 패턴을 따른다.

```
+------------------------------------------------------------------+
| [< 돌아가기]   내 정보 수정                    [UserDropdown]      |
+------------------------------------------------------------------+
|                                                                    |
|  +------------------------------------------------------------+   |
|  | -- 프로필 정보                                               |   |
|  |                                                              |   |
|  |  사용자명                                                    |   |
|  |  [___________________________]                               |   |
|  |                                                              |   |
|  |  이메일                                                      |   |
|  |  [___________________________]                               |   |
|  |                                                              |   |
|  |  가입일                                                      |   |
|  |  2024-01-15 (읽기 전용 표시)                                 |   |
|  |                                                              |   |
|  |  [저장]                                                      |   |
|  +------------------------------------------------------------+   |
|                                                                    |
|  +------------------------------------------------------------+   |
|  | -- 비밀번호 변경                                             |   |
|  |                                                              |   |
|  |  현재 비밀번호                                               |   |
|  |  [___________________________]                               |   |
|  |                                                              |   |
|  |  새 비밀번호                                                 |   |
|  |  [___________________________]                               |   |
|  |                                                              |   |
|  |  새 비밀번호 확인                                            |   |
|  |  [___________________________]                               |   |
|  |                                                              |   |
|  |  [비밀번호 변경]                                             |   |
|  +------------------------------------------------------------+   |
|                                                                    |
+------------------------------------------------------------------+
```

### 3.2 컴포넌트 구조

**AccountView.vue** (신규 파일)

| 요소 | 타입 | 설명 |
|------|------|------|
| editUsername | ref(string) | 수정 중인 사용자명 |
| editEmail | ref(string) | 수정 중인 이메일 |
| savingProfile | ref(boolean) | 프로필 저장 중 상태 |
| currentPassword | ref(string) | 현재 비밀번호 |
| newPassword | ref(string) | 새 비밀번호 |
| confirmPassword | ref(string) | 새 비밀번호 확인 |
| savingPassword | ref(boolean) | 비밀번호 변경 중 상태 |
| passwordMatch | computed(boolean) | 새 비밀번호 === 확인 |
| canSaveProfile | computed(boolean) | 변경사항 존재 && username 비어있지 않음 |
| canChangePassword | computed(boolean) | 3필드 모두 입력 && 새 비밀번호 >= 8자 && 비밀번호 일치 |

### 3.3 인터랙션

1. 페이지 진입 시 `auth.user`에서 현재 username, email을 폼에 채움
2. **프로필 저장**: username 또는 email 변경 시 "저장" 버튼 활성화. 저장 성공 시 성공 토스트, auth.user 갱신
3. **비밀번호 변경**: 3개 필드 모두 입력 후 "비밀번호 변경" 클릭. 성공 시 필드 초기화 + 성공 토스트
4. **에러 처리**:
   - 409 EMAIL_TAKEN -> "이미 사용 중인 이메일입니다."
   - 409 USERNAME_TAKEN -> "이미 사용 중인 사용자명입니다."
   - 401 INVALID_CREDENTIALS -> "현재 비밀번호가 올바르지 않습니다."
5. "돌아가기" 버튼은 이전 페이지로 (`router.back()`, 이전 기록 없으면 `/projects`)

### 3.4 빈 상태/에러 상태

- 사용자 정보가 없는 경우는 발생하지 않음 (requiresAuth 라우트 가드)
- 네트워크 에러: 일반 에러 토스트 표시

### 3.5 CSS 변수 제안

기존 ProjectSettingsView.vue의 스타일 클래스를 최대한 재사용한다. 동일한 클래스명 패턴 사용:
- `.settings-page`, `.settings-topbar`, `.settings-body`, `.settings-section`
- `.section-title`, `.form-group`, `.form-label`, `.form-input`
- `.btn-save`
- `.app-toast`

추가 CSS 변수는 불필요 -- 기존 변수만으로 충분하다.

---

## 4단계: 수정 파일 체크리스트

| 파일 | 작업 |
|------|------|
| server/src/services/authService.ts | `updateProfile`, `changePassword` 함수 추가 |
| server/src/controllers/authController.ts | `updateProfile`, `changePassword` 핸들러 추가 |
| server/src/routes/auth.ts | PUT `/profile`, PUT `/password` 라우트 추가 |
| client/src/api/authApi.ts | `updateProfile`, `changePassword` 메서드 추가 |
| client/src/stores/auth.ts | `updateProfile`, `changePassword` 액션 추가 |
| **client/src/views/AccountView.vue** | **신규 생성** - 사용자 정보 수정 페이지 |
| client/src/router/index.ts | `/account` 라우트 추가 |
| client/src/components/UserProfileDropdown.vue | "내 정보 수정" 메뉴 항목 추가 |

---

## 제약 조건

- email, username은 AES-256-GCM 암호화 + HMAC-SHA256 해시로 저장 (기존 패턴 준수)
- 비밀번호 변경 시 현재 비밀번호 검증 필수 (`verifyUserPassword` 재사용)
- 새 비밀번호는 최소 8자
- UI 스타일은 ProjectSettingsView.vue의 패턴을 그대로 따른다
- CSS 변수 하드코딩 금지
- 이모지 사용 금지