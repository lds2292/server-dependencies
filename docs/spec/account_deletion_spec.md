# 회원탈퇴(계정 삭제) 구현 기획서

## 개요

로그인한 사용자가 자신의 계정을 영구 삭제할 수 있는 기능이다. 비밀번호 재확인을 통해 본인 인증 후 계정을 삭제하며, 소유 프로젝트는 조건에 따라 소유권 이전 또는 함께 삭제된다. 삭제 후 로그인 페이지로 리다이렉트한다.

---

## 1단계: 현황 분석

### 구현 완료된 파일

| 영역 | 파일 | 역할 |
|------|------|------|
| 서버 서비스 | `server/src/services/authService.ts` | `deleteAccount()` - 비밀번호 확인, 프로젝트 처리, 데이터 정리, 사용자 삭제 |
| 감사 로그 | `server/src/services/auditLogService.ts` | `ACCOUNT_DELETE` 액션 타입 정의 |
| 서버 컨트롤러 | `server/src/controllers/authController.ts` | `deleteAccount()` - 요청 검증, 서비스 호출, 감사 로그 기록 |
| 라우트 | `server/src/routes/auth.ts` | `DELETE /auth/account` (인증 필수) |
| API 클라이언트 | `client/src/api/authApi.ts` | `authApi.deleteAccount(password)` |
| 인증 Store | `client/src/stores/auth.ts` | `deleteAccount()` 액션 - API 호출 + 로컬 세션 정리 |
| UI | `client/src/views/AccountView.vue` | 위험 영역 섹션 + 비밀번호 확인 모달 |
| DB 스키마 | `server/prisma/schema.prisma` | Cascade 삭제 규칙 (Session, ProjectMember, GraphData, AuditLog->Project) |

### 기존 패턴 참조

- **AccountView.vue**: 프로필 수정/비밀번호 변경과 동일한 설정 페이지 내에 "계정 삭제" 섹션으로 배치
- **authService.ts**: `verifyUserPassword()`를 재사용하여 비밀번호 확인
- **auditLogService.ts**: 기존 감사 액션 패턴(`LOGIN_SUCCESS`, `PASSWORD_CHANGE` 등)을 따라 `ACCOUNT_DELETE` 추가

---

## 2단계: 데이터 모델 & 로직 설계

### 2.1 API 엔드포인트

#### DELETE /auth/account - 계정 삭제

```
인증: 필수 (Bearer Token)
```

```typescript
// Request Body
interface DeleteAccountRequest {
  password: string  // 본인 확인용 현재 비밀번호
}

// Response 204: No Content (성공 시 빈 응답)

// Error Responses
// 400: { error: '비밀번호를 입력하세요.', code: 'VALIDATION_ERROR' }
// 401: { error: '비밀번호가 올바르지 않습니다.', code: 'INVALID_CREDENTIALS' }
// 500: { error: '서버 오류가 발생했습니다.' }
```

### 2.2 서버 삭제 로직 (`authService.deleteAccount`)

함수 시그니처:
```typescript
export async function deleteAccount(userId: string, password: string): Promise<void>
```

처리 순서:

1. **비밀번호 확인**: `verifyUserPassword(userId, password)` 호출. 실패 시 `INVALID_CREDENTIALS` 에러
2. **소유 프로젝트 처리**:
   - 해당 사용자가 `ownerId`인 프로젝트 목록 조회
   - 각 프로젝트에 대해 **본인을 제외한 MASTER 또는 ADMIN 역할 멤버**를 `joinedAt` 오름차순으로 조회 (가장 먼저 참여한 관리자)
   - 적격 멤버가 있는 경우: 해당 멤버에게 `ownerId` 이전
   - 적격 멤버가 없는 경우: 프로젝트 삭제 (GraphData, ProjectMember, AuditLog, ProjectInvitation은 `onDelete: Cascade`로 자동 삭제)
3. **감사 로그 연결 해제**: `AuditLog.userId`를 `null`로 설정 (userId는 nullable 필드이므로 감사 기록 자체는 보존)
4. **초대 레코드 삭제**: `ProjectInvitation`에서 `inviterId` 또는 `inviteeId`가 해당 사용자인 레코드 삭제
5. **사용자 삭제**: `User` 레코드 삭제. 다음 연관 데이터는 Cascade로 자동 삭제:
   - `Session` (모든 세션)
   - `ProjectMember` (참여 중인 프로젝트 멤버십)

### 2.3 Prisma Cascade 규칙 요약

| 모델 | 외래키 | onDelete | 비고 |
|------|--------|----------|------|
| Session | userId -> User | Cascade | 사용자 삭제 시 자동 삭제 |
| ProjectMember | userId -> User | Cascade | 사용자 삭제 시 자동 삭제 |
| ProjectMember | projectId -> Project | Cascade | 프로젝트 삭제 시 자동 삭제 |
| GraphData | projectId -> Project | Cascade | 프로젝트 삭제 시 자동 삭제 |
| AuditLog | projectId -> Project | Cascade | 프로젝트 삭제 시 자동 삭제 |
| AuditLog | userId -> User | 기본(Restrict) | **수동으로 null 처리 필요** |
| ProjectInvitation | projectId -> Project | Cascade | 프로젝트 삭제 시 자동 삭제 |
| ProjectInvitation | inviterId -> User | 기본(Restrict) | **수동으로 삭제 필요** |
| ProjectInvitation | inviteeId -> User | 기본(Restrict) | **수동으로 삭제 필요** |

### 2.4 컨트롤러 로직 (`authController.deleteAccount`)

```typescript
export async function deleteAccount(req: Request, res: Response): Promise<void>
```

처리 순서:
1. `req.body.password` 검증 (빈 값이면 400 반환)
2. `authService.deleteAccount(userId, password)` 호출
3. 감사 로그 기록: `ACCOUNT_DELETE` 액션, `SUCCESS` 상태, `email` 필드에 사용자 이메일 기록 (userId는 이미 삭제되었으므로 사용 불가)
4. 204 No Content 응답

### 2.5 클라이언트 Store 액션 (`auth.deleteAccount`)

```typescript
async function deleteAccount(password: string): Promise<void> {
  await authApi.deleteAccount(password)
  setAccessToken(null)
  localStorage.removeItem('refreshToken')
  user.value = null
}
```

- API 호출 성공 후 로컬 세션 정보 완전 정리
- Store의 `user`를 `null`로 설정하여 `isLoggedIn`이 `false`가 됨

---

## 3단계: UI/UX 스펙

### 3.1 레이아웃

계정 삭제 섹션은 AccountView 하단에 위치하며, 위험 동작임을 시각적으로 구분한다.

```
+--------------------------------------------------+
|  AccountView (/account)                          |
|                                                  |
|  [프로필 정보 섹션]                                |
|  [비밀번호 변경 섹션]                               |
|                                                  |
|  +----------------------------------------------+|
|  | (danger border)                              ||
|  |  /!\ 계정 삭제                                ||
|  |                                              ||
|  |  계정을 삭제하면 모든 데이터가 영구적으로       ||
|  |  삭제되며 복구할 수 없습니다. 소유한 프로젝트   ||
|  |  중 다른 관리자가 있는 프로젝트는 소유권이      ||
|  |  이전되고, 그렇지 않은 프로젝트는 함께          ||
|  |  삭제됩니다.                                  ||
|  |                                              ||
|  |  [ 계정 삭제 ]  (danger outline button)       ||
|  +----------------------------------------------+|
+--------------------------------------------------+
```

### 3.2 확인 모달

"계정 삭제" 버튼 클릭 시 비밀번호 확인 모달이 표시된다.

```
+----------------------------------------+
|  계정 삭제                              |
|                                        |
|  이 작업은 되돌릴 수 없습니다.           |
|  계속하려면 비밀번호를 입력하세요.        |
|                                        |
|  비밀번호 확인                          |
|  [____________________________]        |
|                                        |
|              [ 취소 ] [ 계정 삭제 ]     |
+----------------------------------------+
```

### 3.3 컴포넌트 상태 변수

| 변수명 | 타입 | 초기값 | 용도 |
|--------|------|--------|------|
| `showDeleteConfirm` | `Ref<boolean>` | `false` | 확인 모달 표시 여부 |
| `deletePassword` | `Ref<string>` | `''` | 모달 내 비밀번호 입력값 |
| `deletingAccount` | `Ref<boolean>` | `false` | 삭제 진행 중 로딩 상태 |

### 3.4 CSS 스타일링

위험 영역 시각 구분에 사용되는 CSS 변수 (기존 `style.css`에 정의됨):

| CSS 변수 | 용도 |
|----------|------|
| `--color-danger` | 위험 영역 테두리, 아이콘, 버튼 텍스트/테두리 색상 |
| `--color-danger-hover` | 확인 버튼 hover 배경 |
| `--bg-surface` | 섹션/모달 배경 |
| `--border-default` | 기본 테두리 |
| `--text-tertiary` | 설명 텍스트 |
| `--text-sm` | 설명 텍스트 크기 |
| `--text-xs` | 버튼 텍스트 크기 |

위험 섹션 전용 스타일:
```css
/* 위험 영역 테두리: --color-danger를 30% 불투명도로 혼합 */
.danger-section {
  border-color: color-mix(in srgb, var(--color-danger) 30%, transparent);
}

/* 섹션 타이틀 좌측 바를 위험 색상으로 변경 */
.section-title-danger::before {
  background: var(--color-danger) !important;
}

/* 위험 아이콘 색상 */
.section-title-danger .section-icon {
  color: var(--color-danger);
}

/* 위험 버튼: 아웃라인 스타일 */
.btn-danger {
  border: 1px solid var(--color-danger);
  background: transparent;
  color: var(--color-danger);
}
.btn-danger:hover {
  background: color-mix(in srgb, var(--color-danger) 15%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-danger) 30%, transparent);
}

/* 확인 모달 삭제 버튼: 실색 배경 */
.btn-confirm-danger {
  background: var(--color-danger);
  color: #fff;
}
.btn-confirm-danger:hover {
  background: var(--color-danger-hover);
}
```

### 3.5 인터랙션 흐름

1. 사용자가 "계정 삭제" 버튼 클릭
2. 확인 모달 표시 (fade 트랜지션)
3. 비밀번호 입력 필드에 포커스
4. Enter 키 또는 "계정 삭제" 버튼으로 제출 가능 (`@keyup.enter`)
5. 비밀번호 미입력 시 확인 버튼 비활성화 (`:disabled="deletingAccount || !deletePassword"`)
6. 제출 시:
   - 버튼 텍스트 "삭제 중..."으로 변경, 비활성화
   - 성공: 로컬 세션 정리 후 `/login` 페이지로 리다이렉트
   - 비밀번호 오류: 토스트 메시지 "비밀번호가 올바르지 않습니다." (error 타입)
   - 서버 오류: 토스트 메시지 "계정 삭제에 실패했습니다." (error 타입)
7. 모달 외부 클릭 또는 "취소" 버튼으로 모달 닫기 + 비밀번호 초기화

---

## 4단계: 사용자 시나리오

### 정상 흐름

1. 사용자가 `/account` 페이지 하단 "계정 삭제" 버튼 클릭
2. 확인 모달에서 비밀번호 입력 후 "계정 삭제" 클릭
3. 서버에서 비밀번호 확인 성공
4. 소유 프로젝트 처리 (이전 또는 삭제)
5. 관련 데이터 정리 및 사용자 삭제
6. 클라이언트 세션 정리, 로그인 페이지로 이동

### 엣지 케이스

| 시나리오 | 처리 방식 |
|----------|----------|
| 비밀번호 미입력 | 확인 버튼 비활성화 (프론트엔드 검증) |
| 비밀번호 오류 | 401 응답, 토스트 "비밀번호가 올바르지 않습니다." |
| 소유 프로젝트에 다른 MASTER/ADMIN 있음 | 가장 먼저 참여한 MASTER/ADMIN에게 소유권 이전 |
| 소유 프로젝트에 다른 MASTER/ADMIN 없음 (WRITER/READONLY만 있거나 멤버 없음) | 프로젝트 전체 삭제 (Cascade로 연관 데이터 포함) |
| 소유 프로젝트 없음 | 프로젝트 처리 단계 건너뜀 |
| 다른 프로젝트의 일반 멤버인 경우 | ProjectMember 레코드가 Cascade로 자동 삭제됨 |
| 감사 로그에 사용자 기록 존재 | userId를 null로 설정하여 로그 자체는 보존 |
| 보낸/받은 초대 존재 | 수동으로 삭제 (Cascade 미적용) |
| 네트워크 오류 | 토스트 "계정 삭제에 실패했습니다.", 모달 유지 |
| 토큰 만료 상태에서 시도 | 인증 미들웨어에서 401 반환 (API 인터셉터가 처리) |

---

## 5단계: 보안 요구사항

| 항목 | 구현 방식 |
|------|----------|
| 인증 | `authenticate` 미들웨어 필수 (JWT Bearer Token) |
| 본인 확인 | 비밀번호 재입력 필수 (`bcryptjs.compare`로 검증) |
| 감사 추적 | 삭제 전 `ACCOUNT_DELETE` 감사 로그 기록 (email, IP, User-Agent) |
| 감사 로그 보존 | 사용자 삭제 후에도 감사 로그 레코드 유지 (userId만 null) |
| 세션 정리 | 서버: Cascade로 모든 Session 삭제 / 클라이언트: localStorage, 메모리 토큰 정리 |
| 비밀번호 전송 | HTTPS 위에서 Request Body로 전송 (DELETE 메서드 + body) |

---

## 6단계: 수정 파일 체크리스트

| 파일 | 작업 내용 |
|------|----------|
| `server/prisma/schema.prisma` | 변경 없음 - AuditLog.userId nullable, Session/ProjectMember에 Cascade 이미 설정 |
| `server/src/services/auditLogService.ts` | `AuditAction` 타입에 `'ACCOUNT_DELETE'` 추가 완료 |
| `server/src/services/authService.ts` | `deleteAccount(userId, password)` 함수 추가 완료 |
| `server/src/controllers/authController.ts` | `deleteAccount(req, res)` 핸들러 추가 완료 |
| `server/src/routes/auth.ts` | `router.delete('/account', authenticate, authController.deleteAccount)` 추가 완료 |
| `client/src/api/authApi.ts` | `deleteAccount(password)` 메서드 추가 완료 - `http.delete('/auth/account', { data: { password } })` |
| `client/src/stores/auth.ts` | `deleteAccount(password)` 액션 추가 완료 - API 호출 + 세션 정리 |
| `client/src/views/AccountView.vue` | 위험 영역 섹션 + 확인 모달 UI 추가 완료 |

---

## 참고: 주요 구현 결정 사항

1. **DELETE 메서드 + Body**: RESTful 관례상 DELETE에 body를 보내는 것은 비표준이나, 비밀번호 확인을 위해 채택. `axios`에서는 `{ data: { password } }` 형태로 전달.

2. **소유권 이전 우선순위**: MASTER와 ADMIN을 동등하게 취급하며, `joinedAt` 기준 가장 먼저 참여한 사람에게 이전. WRITER/READONLY는 이전 대상에서 제외.

3. **감사 로그 처리**: 사용자 삭제 전에 `userId`를 null로 설정하여 FK 제약을 회피하면서도 로그 기록 자체는 보존. 삭제 후 기록하는 감사 로그에는 `email` 필드만 사용.

4. **초대 수동 삭제**: `ProjectInvitation`의 `inviterId`, `inviteeId`에 Cascade가 설정되어 있지 않으므로 수동으로 `deleteMany` 처리.

5. **트랜잭션 미사용**: 현재 구현은 Prisma 트랜잭션(`$transaction`)을 사용하지 않음. 중간 단계 실패 시 부분 삭제 상태가 될 수 있으나, 비밀번호 확인이 선행되므로 실패 가능성이 낮다고 판단한 것으로 보임.
