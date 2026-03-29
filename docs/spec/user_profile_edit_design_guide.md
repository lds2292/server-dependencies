# 사용자 정보 수정 - 디자인 가이드

> 기획서(`docs/user_profile_edit_spec.md`)에 대한 디자인 결정 문서.
> 개발 에이전트는 이 문서의 스펙을 그대로 따라 구현할 것.

---

## 제약 조건 (필수)

- 모든 색상은 `style.css`의 CSS 변수 사용 (하드코딩 금지)
- 이모지 사용 금지
- ProjectSettingsView.vue의 레이아웃 패턴과 CSS 클래스를 그대로 재사용
- 신규 CSS 변수 추가 불필요

---

## 1. 페이지 레이아웃

AccountView는 ProjectSettingsView와 동일한 구조를 따른다.

```
+------------------------------------------------------------------+
| [< 돌아가기]   내 정보 수정                    [UserDropdown]      |
+------------------------------------------------------------------+
|                        (max-width: 720px)                         |
|                                                                    |
|  +------------------------------------------------------------+   |
|  | [2px amber bar] 프로필 정보                                  |   |
|  |                                                              |   |
|  |  사용자명          [label: --text-disabled]                   |   |
|  |  [input]           [--bg-base, --border-default]             |   |
|  |                                                              |   |
|  |  이메일                                                      |   |
|  |  [input]                                                     |   |
|  |                                                              |   |
|  |  가입일                                                      |   |
|  |  2024-01-15        [--text-tertiary, 읽기 전용]              |   |
|  |                                                              |   |
|  |  [저장]            [btn-save 패턴]                            |   |
|  +------------------------------------------------------------+   |
|                          16px gap                                  |
|  +------------------------------------------------------------+   |
|  | [2px amber bar] 비밀번호 변경                                |   |
|  |                                                              |   |
|  |  현재 비밀번호                                               |   |
|  |  [input type=password]                                       |   |
|  |                                                              |   |
|  |  새 비밀번호                                                 |   |
|  |  [input type=password]                                       |   |
|  |                                                              |   |
|  |  새 비밀번호 확인                                            |   |
|  |  [input type=password]                                       |   |
|  |                                                              |   |
|  |  [비밀번호 변경]   [btn-save 패턴]                            |   |
|  +------------------------------------------------------------+   |
|                                                                    |
+------------------------------------------------------------------+
```

---

## 2. 재사용할 기존 CSS 클래스

ProjectSettingsView.vue에서 동일한 클래스명과 스타일을 그대로 사용한다. AccountView.vue의 `<style scoped>`에 동일하게 복사한다.

| 클래스 | 용도 |
|--------|------|
| `.settings-page` | 전체 페이지 래퍼 (min-height: 100vh, --bg-base) |
| `.settings-topbar` | 상단 바 (52px, --bg-surface, border-bottom) |
| `.back-btn` | 돌아가기 버튼 |
| `.settings-title` | 페이지 제목 ("내 정보 수정") |
| `.topbar-spacer` | flex: 1 스페이서 |
| `.settings-body` | 본문 영역 (max-width: 720px, margin: 0 auto, gap: 16px) |
| `.settings-section` | 섹션 카드 (--bg-surface, border-radius: 10px, padding: 24px 28px) |
| `.section-title` | 섹션 제목 (2px amber bar, uppercase, --text-tertiary) |
| `.section-icon` | 섹션 아이콘 (--accent-soft) |
| `.form-group` | 폼 필드 래퍼 (gap: 6px, margin-bottom: 14px) |
| `.form-label` | 폼 레이블 (--text-xs, --text-disabled) |
| `.form-input` | 입력 필드 (--bg-base, --border-default, focus: --accent-focus) |
| `.btn-save` | 저장 버튼 (amber accent, hover glow) |
| `.app-toast` | 토스트 알림 (.success / default=error) |

---

## 3. 상단 바 (Topbar) 디자인

ProjectSettingsView와 동일하되, `project-name-label`은 사용하지 않는다.

```html
<div class="settings-topbar">
  <button class="back-btn" @click="goBack">
    <svg><!-- chevron left --></svg>
    돌아가기
  </button>
  <span class="settings-title">내 정보 수정</span>
  <span class="topbar-spacer"></span>
  <UserProfileDropdown @logout="showLogoutConfirm = true" />
</div>
```

### "돌아가기" 동작
- `router.back()` 사용
- 브라우저 히스토리가 없으면 `/projects`로 이동 (기획서 3.3항 참조)
- 구현: `window.history.length > 1 ? router.back() : router.push({ name: 'projects' })`

---

## 4. 프로필 정보 섹션

### 섹션 아이콘 SVG
사용자 아이콘 (단일 인물):
```html
<svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="section-icon">
  <circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/>
  <path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

### 폼 필드 구조

```html
<section class="settings-section">
  <h2 class="section-title">
    <svg><!-- user icon --></svg>
    프로필 정보
  </h2>

  <div class="form-group">
    <label class="form-label">사용자명</label>
    <input v-model="editUsername" class="form-input" maxlength="30" />
  </div>

  <div class="form-group">
    <label class="form-label">이메일</label>
    <input v-model="editEmail" class="form-input" type="email" />
  </div>

  <div class="form-group">
    <label class="form-label">가입일</label>
    <span class="readonly-value">{{ formattedCreatedAt }}</span>
  </div>

  <button class="btn-save" @click="onSaveProfile" :disabled="savingProfile || !canSaveProfile">
    {{ savingProfile ? '저장 중...' : '저장' }}
  </button>
</section>
```

### 가입일 읽기 전용 표시 CSS

```css
.readonly-value {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  padding: 9px 0;
}
```

날짜 포맷: `YYYY-MM-DD` (예: `2024-01-15`)

---

## 5. 비밀번호 변경 섹션

### 섹션 아이콘 SVG
자물쇠 아이콘:
```html
<svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="section-icon">
  <rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/>
  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
```

### 폼 필드 구조

```html
<section class="settings-section">
  <h2 class="section-title">
    <svg><!-- lock icon --></svg>
    비밀번호 변경
  </h2>

  <div class="form-group">
    <label class="form-label">현재 비밀번호</label>
    <input v-model="currentPassword" class="form-input" type="password" />
  </div>

  <div class="form-group">
    <label class="form-label">새 비밀번호</label>
    <input v-model="newPassword" class="form-input" type="password" placeholder="8자 이상" />
  </div>

  <div class="form-group">
    <label class="form-label">새 비밀번호 확인</label>
    <input v-model="confirmPassword" class="form-input" type="password" />
    <span v-if="confirmPassword && !passwordMatch" class="field-error">비밀번호가 일치하지 않습니다.</span>
  </div>

  <button class="btn-save" @click="onChangePassword" :disabled="savingPassword || !canChangePassword">
    {{ savingPassword ? '변경 중...' : '비밀번호 변경' }}
  </button>
</section>
```

### 비밀번호 불일치 에러 메시지 CSS

```css
.field-error {
  font-size: var(--text-xs);
  color: var(--color-danger);
  margin-top: 2px;
}
```

---

## 6. 토스트 알림

ProjectSettingsView와 동일한 `.app-toast` 스타일을 재사용한다.

| 상황 | 타입 | 메시지 |
|------|------|--------|
| 프로필 저장 성공 | success | "저장되었습니다." |
| 비밀번호 변경 성공 | success | "비밀번호가 변경되었습니다." |
| 이메일 중복 | error | "이미 사용 중인 이메일입니다." |
| 사용자명 중복 | error | "이미 사용 중인 사용자명입니다." |
| 현재 비밀번호 불일치 | error | "현재 비밀번호가 올바르지 않습니다." |
| 네트워크 에러 | error | "저장에 실패했습니다." / "비밀번호 변경에 실패했습니다." |

---

## 7. UserProfileDropdown 수정

드롭다운 메뉴에 "내 정보 수정" 항목을 추가한다. "프로젝트 목록으로" 아래, 로그아웃 위에 배치.

```html
<!-- 기존 -->
<button v-if="showProjectsLink" @click="goProjects">프로젝트 목록으로</button>
<div v-if="showProjectsLink" class="user-dropdown-divider"></div>

<!-- 추가 -->
<button @click="goAccount">내 정보 수정</button>
<div class="user-dropdown-divider"></div>

<!-- 기존 -->
<button class="user-dropdown-danger" @click="emit('logout'); open = false">로그아웃</button>
```

"내 정보 수정" 버튼은 기존 드롭다운 버튼 스타일(`.user-dropdown-menu button`)을 그대로 따르며, 별도 클래스 불필요.

`/account` 페이지에서는 "내 정보 수정" 버튼을 숨기지 않는다 (현재 페이지에서도 노출 유지, 클릭 시 이미 해당 페이지이므로 무해).

---

## 8. 로그아웃 확인 모달

AccountView에도 ProjectSettingsView와 동일한 로그아웃 확인 모달을 포함한다. 동일한 CSS 클래스 재사용:

- `.modal-overlay`
- `.modal-card`
- `.modal-title`
- `.modal-actions`
- `.btn-cancel`
- `.btn-confirm`, `.btn-confirm-danger`
- `.fade-enter-active`, `.fade-leave-active` 트랜지션

---

## 9. 수정 대상 파일 목록

| 파일 | 작업 |
|------|------|
| server/src/services/authService.ts | `updateProfile`, `changePassword` 함수 추가 |
| server/src/controllers/authController.ts | `updateProfile`, `changePassword` 핸들러 추가 |
| server/src/routes/auth.ts | PUT `/profile`, PUT `/password` 라우트 추가 |
| client/src/api/authApi.ts | `updateProfile`, `changePassword` 메서드 추가 |
| client/src/stores/auth.ts | `updateProfile`, `changePassword` 액션 추가 |
| **client/src/views/AccountView.vue** | **신규 생성** |
| client/src/router/index.ts | `/account` 라우트 추가 |
| client/src/components/UserProfileDropdown.vue | "내 정보 수정" 메뉴 추가 |
