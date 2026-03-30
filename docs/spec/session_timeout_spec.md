# 세션 타임아웃 자동 로그아웃 구현 기획서

## 개요

사용자가 30분간 아무 입력(마우스 이동, 클릭, 키보드 입력, 스크롤, 터치)을 하지 않으면 자동 로그아웃하고 로그인 페이지로 리다이렉트한다. 만료 5분 전에 경고 모달을 표시하여 세션 연장 기회를 제공한다.

---

## 1단계: 현황 분석

### 현재 인증 구조

- **JWT 기반 인증**: Access Token 15분 + Refresh Token 30일
- **auth store** (`client/src/stores/auth.ts`): `login`, `logout`, `initializeSession` 등 관리
- **Axios interceptor** (`client/src/api/http.ts`): 401 응답 시 refresh token으로 자동 갱신
- **라우터 가드** (`client/src/router/index.ts`): `meta.requiresAuth`로 미인증 접근 차단
- **현재 로그아웃**: `authStore.logout()` 호출 -> token 삭제 + user null 처리

### 사용 가능한 데이터

- `authStore.isLoggedIn`: computed, 로그인 상태 확인
- `authStore.logout()`: 서버 로그아웃 API + 로컬 토큰 정리
- `router.push({ name: 'login' })`: 로그인 페이지 이동

### 백엔드 변경 여부

**백엔드 변경 불필요**. 이유:
- 유휴 타임아웃은 클라이언트 UX 정책이며, 서버 JWT 만료와는 별개
- Access Token(15분)이 만료되면 Axios interceptor가 자동으로 refresh하므로, 유휴 감지와 JWT 갱신은 독립적
- "연장" 버튼은 단순히 클라이언트 타이머를 리셋하면 충분

---

## 2단계: 데이터 모델 & 로직 설계

### 새 composable: `useIdleTimeout`

`client/src/composables/useIdleTimeout.ts`

```typescript
// 설정 상수
const IDLE_TIMEOUT = 30 * 60 * 1000     // 30분
const WARNING_BEFORE = 5 * 60 * 1000    // 만료 5분 전 경고

// composable 인터페이스
export function useIdleTimeout() {
  const isWarningVisible: Ref<boolean>     // 경고 모달 표시 여부
  const remainingSeconds: Ref<number>      // 남은 초 (카운트다운 표시용)

  function start(): void       // 타이머 시작 (로그인 후 또는 앱 마운트 시)
  function stop(): void        // 타이머 중지 (로그아웃 시)
  function extend(): void      // "연장" 버튼 -> 타이머 리셋

  return { isWarningVisible, remainingSeconds, start, stop, extend }
}
```

### 로직 흐름

```
[앱 마운트 & 로그인 상태]
  |
  v
start() -- 이벤트 리스너 등록 + 타이머 시작
  |
  +--> 사용자 활동 감지 (mousemove, mousedown, keydown, scroll, touchstart)
  |     -> resetTimer(): 타이머 리셋 (경고 미표시 상태에서만)
  |
  +--> 25분 경과 (IDLE_TIMEOUT - WARNING_BEFORE)
  |     -> isWarningVisible = true
  |     -> 매초 remainingSeconds 카운트다운 시작
  |
  +--> "연장" 버튼 클릭
  |     -> extend(): isWarningVisible = false, 타이머 전체 리셋
  |
  +--> 30분 경과 (remainingSeconds === 0)
        -> authStore.logout()
        -> router.push({ name: 'login', query: { reason: 'idle' } })
        -> stop()
```

### 핵심 구현 상세

1. **이벤트 리스너**: `document`에 passive로 등록하여 성능 영향 최소화
2. **쓰로틀링**: 활동 이벤트는 10초 간격으로 쓰로틀 (mousemove가 매 프레임 발생하므로)
3. **경고 중 활동 무시**: `isWarningVisible`이 true인 동안에는 일반 활동으로 타이머가 리셋되지 않음. 반드시 "연장" 버튼을 눌러야 함
4. **타이머 정확도**: `setTimeout` + 1초 간격 `setInterval`로 카운트다운 표시. `setTimeout`은 25분 후 경고 트리거, 그 후 `setInterval`로 매초 카운트다운
5. **탭 비활성 대응**: `setTimeout`/`setInterval`은 백그라운드 탭에서 지연될 수 있으므로, 경고 표시 시점과 만료 시점을 타임스탬프 기반으로 계산

```typescript
// 타임스탬프 기반 정확한 계산
let lastActivityTime = Date.now()

function checkExpiry() {
  const elapsed = Date.now() - lastActivityTime
  const remaining = IDLE_TIMEOUT - elapsed

  if (remaining <= 0) {
    // 자동 로그아웃
    performLogout()
  } else if (remaining <= WARNING_BEFORE) {
    isWarningVisible.value = true
    remainingSeconds.value = Math.ceil(remaining / 1000)
  }
}
```

6. **메모리 정리**: `stop()` 시 모든 이벤트 리스너와 타이머 제거

### auth store 수정 사항

수정 없음. 기존 `logout()` 메서드를 그대로 사용한다.

### 라우터 수정 사항

`client/src/router/index.ts` -- 로그인 페이지에서 idle 로그아웃 안내 메시지를 표시하기 위해 `query.reason` 파라미터를 활용할 수 있으나, 최소 구현에서는 생략 가능.

---

## 3단계: UI/UX 스펙

### 경고 모달 와이어프레임

```
+------------------------------------------+
|          [bg-overlay 전체화면]             |
|                                          |
|   +----------------------------------+   |
|   |                                  |   |
|   |   [!] 세션 만료 경고              |   |
|   |                                  |   |
|   |   활동이 없어 곧 자동 로그아웃     |   |
|   |   됩니다.                        |   |
|   |                                  |   |
|   |        [  4:32  ]                |   |
|   |      (남은 시간 카운트다운)        |   |
|   |                                  |   |
|   |   [로그아웃]        [세션 연장]    |   |
|   |                                  |   |
|   +----------------------------------+   |
|                                          |
+------------------------------------------+
```

### 컴포넌트 구조

#### SessionTimeoutWarning.vue (신규)

| 항목 | 값 |
|------|-----|
| Props | `visible: boolean`, `remainingSeconds: number` |
| Emits | `extend`, `logout` |
| 위치 | `client/src/components/SessionTimeoutWarning.vue` |

**template 구조:**
- `<Teleport to="body">` 사용 (기존 CustomSelect/CustomCombobox 패턴 참조)
- 최상위: overlay div (클릭 시 아무 동작 없음 -- 실수로 닫히지 않도록)
- 내부: 모달 카드
  - 경고 아이콘 (SVG inline, `--color-warning` 색상)
  - 제목: "세션 만료 경고"
  - 설명: "활동이 없어 곧 자동 로그아웃됩니다."
  - 카운트다운: `MM:SS` 형식, 큰 글씨, mono 폰트
  - 하단 버튼 2개:
    - "로그아웃" -- `btn-ghost` (좌측)
    - "세션 연장" -- `btn-primary` (우측)

**카운트다운 포맷 함수:**
```typescript
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
```

### 인터랙션

| 액션 | 결과 |
|------|------|
| "세션 연장" 클릭 | emit('extend') -> 모달 닫힘, 타이머 30분 리셋 |
| "로그아웃" 클릭 | emit('logout') -> 즉시 로그아웃 |
| overlay 클릭 | 아무 동작 없음 (실수 방지) |
| ESC 키 | 아무 동작 없음 (명시적 선택 강제) |
| 카운트다운 0 도달 | composable 내부에서 자동 로그아웃 실행 |

### 빈 상태 / 에러 상태

- 비로그인 상태: composable이 start()하지 않으므로 모달 표시 없음
- 네트워크 에러로 로그아웃 실패: `authStore.logout()`의 catch 무시 패턴 그대로 (토큰만 로컬 삭제)

### 카운트다운 1분 이하 강조

- 남은 시간이 60초 이하가 되면 카운트다운 텍스트 색상을 `--color-danger`로 변경하여 긴급감 표현

---

## 4단계: 수정 파일 체크리스트

| 파일 경로 | 작업 내용 |
|----------|----------|
| **`client/src/composables/useIdleTimeout.ts`** | **[신규]** 유휴 타임아웃 composable |
| **`client/src/components/SessionTimeoutWarning.vue`** | **[신규]** 경고 모달 컴포넌트 |
| `client/src/App.vue` | useIdleTimeout 통합 + SessionTimeoutWarning 렌더링 |

### 주의사항

- `App.vue`에서 `useIdleTimeout`을 사용하고 `SessionTimeoutWarning`을 렌더링한다. 이렇게 하면 어떤 페이지에서든 타임아웃이 동작한다.
- `authStore.isLoggedIn`을 watch하여 로그인 시 `start()`, 로그아웃 시 `stop()`을 자동 호출한다.
- 기존 코드(auth store, http interceptor, router)는 수정하지 않는다.
- `document` 이벤트 리스너는 반드시 `onUnmounted`에서 정리한다.
- 경고 모달의 z-index는 기존 모달보다 높게 설정하여 다른 모달 위에 표시한다.

---

## 제약 조건

- 프론트엔드만 수정. 백엔드 변경 없음.
- 이모지 사용 금지.
- CSS 색상 하드코딩 금지 -- 반드시 CSS 변수 사용.
- 기존 인증 흐름(JWT refresh, 401 interceptor)에 영향을 주지 않는다.
- 30분 타임아웃, 5분 전 경고는 상수로 관리하여 추후 변경 용이하게 한다.
