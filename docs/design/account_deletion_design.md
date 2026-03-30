# 계정 삭제 (회원탈퇴) - 디자인 가이드

> `client/src/views/AccountView.vue`의 계정 삭제 기능에 대한 디자인 스펙.

---

## 제약 조건 (필수)

- CSS 색상 하드코딩 금지 -- 반드시 `style.css`의 CSS 변수(`var(--)`) 사용
- 이모지 사용 금지
- JS/TS에서 색상 필요 시 `getComputedStyle`로 CSS 변수를 읽을 것

---

## 1. 인터랙션 흐름

```
[내 정보 수정 페이지 (AccountView)]
       |
       v
  위험 영역 섹션 (danger-section)
  "계정 삭제" 버튼 클릭
       |
       v
  모달 오버레이 (fade 트랜지션)
  비밀번호 입력 요구
       |
       +--- 취소 / 오버레이 클릭 --> 모달 닫힘, 비밀번호 초기화
       |
       +--- 비밀번호 입력 후 "계정 삭제" 클릭 (또는 Enter)
               |
               +--- 성공 --> 로그인 페이지로 즉시 리다이렉트
               +--- 실패 (비밀번호 오류) --> 토스트 "비밀번호가 올바르지 않습니다."
               +--- 실패 (기타) --> 토스트 "계정 삭제에 실패했습니다."
```

---

## 2. 위험 영역 섹션

### 레이아웃

```
+---------------------------------------------------------------+
|[|] 계정 삭제                          (2px 좌측 빨간 세로선)  |
|                                                                |
| 계정을 삭제하면 모든 데이터가 영구적으로 삭제되며              |
| 복구할 수 없습니다. 소유한 프로젝트 중 다른 관리자가           |
| 있는 프로젝트는 소유권이 이전되고,                             |
| 그렇지 않은 프로젝트는 함께 삭제됩니다.                        |
|                                                                |
| [ 계정 삭제 ]                                                  |
+---------------------------------------------------------------+
```

### CSS 스펙

| 속성 | 값 | 비고 |
|------|-----|------|
| 보더 | `color-mix(in srgb, var(--color-danger) 30%, transparent)` | 일반 섹션과 차별화 |
| 좌측 세로선 | `var(--color-danger)` | 스타일 가이드 "섹션 타이틀 2px 세로선" 패턴, danger 변형 |
| 경고 아이콘 | 삼각형 + 느낌표 SVG, `currentColor` | `var(--color-danger)` |
| 설명문 | `var(--text-sm)`, `var(--text-tertiary)`, `line-height: 1.6` | |
| 버튼 | 아웃라인 스타일 (투명 배경 + danger 보더) | 실수 방지를 위해 "초대하지 않는" 디자인 |
| 버튼 hover | `color-mix(in srgb, var(--color-danger) 15%, transparent)` 배경 + danger glow | amber glow 미적용 (스타일 가이드 준수) |

---

## 3. 비밀번호 확인 모달

### 레이아웃

```
+---------------------------------------+
| 계정 삭제                             |
|                                       |
| 이 작업은 되돌릴 수 없습니다.         |
| 계속하려면 비밀번호를 입력하세요.      |
|                                       |
| 비밀번호 확인                         |
| [________________________]            |
|                                       |
|              [ 취소 ] [ 계정 삭제 ]   |
+---------------------------------------+
```

### CSS 스펙

| 요소 | 속성 | 값 |
|------|------|-----|
| 오버레이 | background | `rgba(0,0,0,0.55)` |
| 모달 카드 | max-width | `400px` |
| 모달 카드 | background | `var(--bg-surface)` |
| 모달 카드 | border | `1px solid var(--border-default)` |
| 모달 카드 | border-radius | `12px` |
| 모달 카드 | box-shadow | `0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)` (글래스 엣지) |
| 제목 | font-size / weight / color | `var(--text-base)` / 700 / `var(--text-primary)` |
| 설명문 | font-size / color | `var(--text-sm)` / `var(--text-tertiary)` |
| 입력 필드 | background / border | `var(--bg-base)` / `var(--border-default)` |
| 입력 필드 focus | border-color | `var(--accent-focus)` (앰버 -- 입력 필드는 중립적 인터랙션) |
| 취소 버튼 | 스타일 | 아웃라인, `var(--text-tertiary)` |
| 확인 버튼 | 스타일 | filled, `var(--color-danger)` 배경, 흰색 텍스트 |
| 확인 버튼 hover | background | `var(--color-danger-hover)` |
| 확인 버튼 disabled | opacity | `0.4`, `cursor: not-allowed` |
| 트랜지션 | transition | `opacity 0.15s` (fade) |

---

## 4. 상태별 동작

| 상태 | UI 변화 |
|------|---------|
| 비밀번호 미입력 | "계정 삭제" 버튼 disabled (opacity: 0.4) |
| 삭제 진행 중 | 버튼 텍스트 "삭제 중...", disabled |
| 비밀번호 오류 | 에러 토스트 (하단 중앙, 2.5초 자동 소멸) |
| 삭제 성공 | 토스트 없이 로그인 페이지로 즉시 이동 |
| 모달 취소 | 비밀번호 초기화, 모달 닫힘 (fade out) |

---

## 5. 타이포그래피

| 요소 | font-size | font-weight | color |
|------|-----------|-------------|-------|
| 섹션 타이틀 | `--text-xs` (11px) | 700 | `--text-tertiary` |
| 경고 설명문 | `--text-sm` (13px) | 400 | `--text-tertiary` |
| "계정 삭제" 버튼 (섹션) | `--text-xs` (11px) | 700 | `--color-danger` |
| 모달 타이틀 | `--text-base` (14px) | 700 | `--text-primary` |
| 모달 설명문 | `--text-sm` (13px) | 400 | `--text-tertiary` |
| 폼 레이블 | `--text-xs` (11px) | 600 | `--text-disabled` |
| 취소 버튼 | `--text-sm` (13px) | 600 | `--text-tertiary` |
| 확인 버튼 | `--text-sm` (13px) | 700 | #fff |

---

## 6. 간격

| 요소 | 속성 | 값 |
|------|------|-----|
| 섹션 내부 패딩 | padding | 24px 28px |
| 설명문 하단 마진 | margin-bottom | 16px |
| 모달 내부 패딩 | padding | 20px |
| 모달 타이틀 하단 마진 | margin-bottom | 12px |
| 모달 설명문 하단 마진 | margin-bottom | 16px |
| 폼 그룹 하단 마진 | margin-bottom | 16px |
| 버튼 영역 gap | gap | 8px |
| 입력 필드 패딩 | padding | 9px 12px |

---

## 7. 스타일 가이드 준수 검토

| 항목 | 상태 | 비고 |
|------|------|------|
| CSS 변수 사용 | O | 색상/폰트 대부분 CSS 변수 참조 |
| danger 버튼 amber glow 미적용 | O | 스타일 가이드 규칙 준수 |
| 글래스 엣지 패턴 | O | 모달에 `inset 0 1px 0 rgba(255,255,255,0.04)` 적용 |
| 좌측 세로선 패턴 | O | danger 변형으로 빨간색 적용 |
| 전역 버튼 active 피드백 | O | `button:active { scale(0.97) }` 전역 적용 |
| font-size CSS 변수 | O | `--text-xs`, `--text-sm`, `--text-base` 사용 |
| 이모지 미사용 | O | 아이콘은 인라인 SVG |

---

## 8. template 배치

```
settings-page
  +-- settings-topbar
  +-- settings-body
  |     +-- section.settings-section (프로필)
  |     +-- section.settings-section (비밀번호)
  |     +-- section.settings-section.danger-section (계정 삭제)
  +-- transition[toast-fade] > app-toast
  +-- transition[fade] > modal-overlay > modal-card (회원탈퇴 확인)
  +-- transition[fade] > modal-overlay > modal-card (로그아웃 확인)
```

---

## 9. script 핵심 변수

```typescript
const showDeleteConfirm = ref(false)   // 모달 표시 여부
const deletePassword = ref('')          // 비밀번호 입력값
const deletingAccount = ref(false)      // 삭제 진행 중 플래그
```
