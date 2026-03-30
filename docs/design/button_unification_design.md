# 버튼 통일화 디자인 가이드

## 개요

기획서(docs/spec/button_unification_spec.md)의 글로벌 버튼 클래스 시스템을 구현하기 위한 디자인 스펙이다.
기존 디자인 시스템(style.css, style_guide.md)과의 일관성을 유지하면서 5개 카테고리 + 3개 사이즈 + 2개 노드 modifier를 정의한다.

---

## 1. CSS 변수 추가

### Danger 시맨틱 변수 (:root에 추가)

```css
--color-danger-bg: #450a0a;
--color-danger-bg-hover: #7f1d1d;
--color-danger-text: #fca5a5;
--color-danger-text-hover: #fecaca;
--color-danger-border: #ef4444;
--color-danger-surface: #1c0a0a;
--color-danger-muted: #f87171;
```

### 노드 hover 변수 (:root에 추가)

```css
--node-l7-hover: #6d28d9;
--node-ext-hover: #15803d;
```

---

## 2. 버튼 카테고리별 CSS 스펙

### 2.1 공통 베이스

모든 버튼 카테고리 셀렉터(`.btn-primary, .btn-ghost, .btn-danger, .btn-danger-ghost, .btn-outline`)에 적용:

| 속성 | 값 |
|------|----|
| display | `inline-flex` |
| align-items | `center` |
| justify-content | `center` |
| gap | `6px` |
| font-family | `var(--font-sans)` |
| font-size | `var(--text-sm)` (13px) |
| font-weight | `700` |
| padding | `7px 16px` |
| border-radius | `6px` |
| cursor | `pointer` |
| transition | `all 0.15s` |
| white-space | `nowrap` |
| text-decoration | `none` |
| box-sizing | `border-box` |
| line-height | `1.4` |

### 2.2 Primary (.btn-primary)

주요 액션 버튼. 저장, 확인, 추가, 초대, 내보내기 등.

| 상태 | background | color | border | box-shadow |
|------|-----------|-------|--------|------------|
| 기본 | `var(--accent-primary)` | `#fff` | `none` | - |
| hover | `var(--accent-hover)` | `#fff` | - | `0 0 12px rgba(217,119,6,0.35)` |
| disabled | - | - | - | opacity: 0.5, cursor: not-allowed |

### 2.3 Ghost (.btn-ghost)

보조 액션 버튼. 취소, 뒤로, 닫기, 거절 등.

| 상태 | background | color | border |
|------|-----------|-------|--------|
| 기본 | `transparent` | `var(--text-tertiary)` | `1px solid var(--border-default)` |
| hover | `transparent` | `var(--text-secondary)` | `1px solid var(--border-strong)` |
| disabled | - | - | opacity: 0.5, cursor: not-allowed |

### 2.4 Danger (.btn-danger)

위험 액션 버튼. 삭제 확인, 로그아웃 확인 등.

| 상태 | background | color | border |
|------|-----------|-------|--------|
| 기본 | `var(--color-danger-bg)` | `var(--color-danger-text)` | `1px solid var(--color-danger)` |
| hover | `var(--color-danger-bg-hover)` | `var(--color-danger-text-hover)` | - |
| disabled | - | - | opacity: 0.5, cursor: not-allowed |

### 2.5 Danger Ghost (.btn-danger-ghost)

위험 아웃라인 버튼. 계정 삭제 트리거 등.

| 상태 | background | color | border |
|------|-----------|-------|--------|
| 기본 | `transparent` | `var(--color-danger)` | `1px solid var(--color-danger)` |
| hover | `color-mix(in srgb, var(--color-danger) 15%, transparent)` | - | box-shadow: `0 0 12px color-mix(in srgb, var(--color-danger) 30%, transparent)` |
| disabled | - | - | opacity: 0.5, cursor: not-allowed |

### 2.6 Outline (.btn-outline)

액센트 아웃라인 버튼. 새 프로젝트, 저장, 초대 등.

| 상태 | background | color | border |
|------|-----------|-------|--------|
| 기본 | `var(--accent-bg)` | `var(--accent-soft)` | `1px solid var(--accent-hover)` |
| hover | `var(--accent-bg-medium)` | `var(--accent-light)` | box-shadow: `0 0 12px rgba(217,119,6,0.3)` |
| disabled | - | - | opacity: 0.5, cursor: not-allowed |

---

## 3. 사이즈 변형

### 3.1 Small (.btn-sm)

| 속성 | 값 |
|------|----|
| font-size | `var(--text-xs)` (11px) |
| padding | `0 10px` |
| height | `28px` |

### 3.2 Medium (기본, 클래스 불필요)

기본 사이즈. 모달 푸터, 폼, 일반 용도.

| 속성 | 값 |
|------|----|
| font-size | `var(--text-sm)` (13px) |
| padding | `7px 16px` |
| height | auto |

### 3.3 Large (.btn-lg)

| 속성 | 값 |
|------|----|
| font-size | `var(--text-base)` (14px) |
| padding | `10px 28px` |
| border-radius | `8px` |

---

## 4. 노드 타입 Modifier

### 4.1 L7 (.btn-node-l7)

`.btn-primary.btn-node-l7` 형태로 사용. L7Modal의 Primary 버튼에 적용.

| 상태 | background | box-shadow |
|------|-----------|------------|
| 기본 | `var(--node-l7-color)` | - |
| hover | `var(--node-l7-hover)` | `0 0 12px var(--node-l7-glow)` |

### 4.2 EXT (.btn-node-ext)

`.btn-primary.btn-node-ext` 형태로 사용. ExternalServiceModal의 Primary 버튼에 적용.

| 상태 | background | box-shadow |
|------|-----------|------------|
| 기본 | `var(--node-ext-color)` | - |
| hover | `var(--node-ext-hover)` | `0 0 12px var(--node-ext-glow)` |

---

## 5. Icon 버튼 (.btn-icon)

정사각형 아이콘 버튼. 도움말(?), 설정(gear) 등.

| 속성 | 값 |
|------|----|
| display | `inline-flex` |
| align-items | `center` |
| justify-content | `center` |
| width | `28px` |
| height | `28px` |
| padding | `0` |
| border-radius | `6px` |
| border | `1px solid var(--border-default)` |
| background | `transparent` |
| color | `var(--text-tertiary)` |
| cursor | `pointer` |
| transition | `all 0.15s` |

hover: border-color `var(--border-strong)`, color `var(--text-secondary)`
disabled: opacity 0.5, cursor not-allowed

---

## 6. 컴포넌트별 적용 결정

### 모달 컴포넌트 (6개)

공통: scoped의 `.btn-primary` / `.btn-secondary` 스타일 삭제. template 클래스명 변경.

- **ServerModal**: `.btn-secondary` -> `.btn-ghost` / `.btn-primary` 유지 (글로벌)
- **L7Modal**: `.btn-secondary` -> `.btn-ghost` / `.btn-primary` -> `.btn-primary btn-node-l7`
- **InfraModal**: `.btn-secondary` -> `.btn-ghost` / `.btn-primary` 유지
- **ExternalServiceModal**: `.btn-secondary` -> `.btn-ghost` / `.btn-primary` -> `.btn-primary btn-node-ext`
- **DnsModal**: `.btn-secondary` -> `.btn-ghost` / `.btn-primary` 유지
- **DependencyModal**: `.btn-secondary` -> `.btn-ghost` / `.btn-primary` 유지

### 뷰 컴포넌트

- **LoginView / RegisterView**: `.btn-submit` -> `.btn-primary btn-lg` + scoped에서 width/margin-top만 유지
- **HeroView**: `.btn-primary` -> `.btn-primary btn-lg` / `.btn-secondary` -> `.btn-ghost btn-lg` / `.btn-primary-sm` -> `.btn-primary btn-sm` / `.btn-secondary-sm` -> `.btn-ghost btn-sm`
- **ForbiddenView**: `.forbidden-btn` -> `.btn-ghost btn-lg` + scoped에서 margin-top만 유지
- **ProjectsView**: `.btn-new` -> `.btn-outline btn-sm` / `.btn-cancel` -> `.btn-ghost` / `.btn-confirm` -> `.btn-primary` / `.btn-confirm-danger` -> `.btn-danger` / `.btn-accept` -> `.btn-primary btn-sm` / `.btn-reject` -> `.btn-ghost btn-sm` + scoped hover danger 유지
- **ProjectView**: `.btn-back` -> `.btn-ghost btn-sm` / `.btn-save` -> `.btn-outline btn-sm` + .dirty scoped / `.btn-primary` (초대) -> `.btn-outline btn-sm` / `.btn-empty-sample` -> `.btn-outline btn-lg` / `.btn-empty-add` -> `.btn-ghost btn-lg` / `delete-btn-cancel` -> `.btn-ghost` + flex:1 scoped / `delete-btn-confirm` -> `.btn-danger` + flex:1 scoped / 로그아웃 `delete-btn-confirm` -> `.btn-danger` + flex:1 scoped
- **ProjectSettingsView**: `.btn-save` -> `.btn-outline btn-sm` / `.btn-primary` -> `.btn-outline btn-sm` / `.btn-danger` -> `.btn-danger` / `delete-btn-cancel` -> `.btn-ghost` + flex:1 scoped / `delete-btn-confirm` -> `.btn-danger` + flex:1 scoped / `.btn-cancel` -> `.btn-ghost` / `.btn-confirm.btn-confirm-danger` -> `.btn-danger`
- **AccountView**: `.btn-save` -> `.btn-outline btn-sm` / `.btn-danger` -> `.btn-danger-ghost` / `.btn-cancel` (비밀번호) -> `.btn-ghost btn-sm` / `.btn-cancel` (모달) -> `.btn-ghost` / `.btn-confirm.btn-confirm-danger` -> `.btn-danger`
- **AuditLogView**: `.btn-cancel` -> `.btn-ghost` / `.btn-confirm.btn-confirm-danger` -> `.btn-danger`
- **GraphCanvas**: `.btn-secondary` -> `.btn-ghost` / `.btn-primary` 유지 (글로벌)
- **ImpactPanel**: `.btn-secondary` -> `.btn-ghost` / `.btn-primary` 유지
- **ServerPanel**: `.btn-secondary` -> `.btn-ghost btn-sm` (Export/Import)
- **GraphConflictModal**: `.btn-cancel` -> `.btn-ghost` / `.btn-confirm` -> `.btn-primary`

---

## 7. Scoped에서 유지해야 하는 속성

글로벌 클래스로 교체한 뒤에도 scoped에 남겨야 하는 레이아웃/상태 속성:

| 파일 | 클래스 | 유지 속성 |
|------|--------|----------|
| LoginView/RegisterView | `.btn-primary.btn-lg` | `width: 100%; margin-top: 4px` |
| ForbiddenView | `.btn-ghost.btn-lg` | `margin-top: 8px` |
| ProjectView | `.btn-outline.btn-sm.dirty` | `border-color, color, background` (dirty 상태) |
| ProjectView/ProjectSettingsView | `.delete-btn-cancel`, `.delete-btn-confirm` | `flex: 1` |
| ProjectsView | `.btn-reject:hover` | `border-color: var(--color-danger); color: var(--color-danger-muted)` |
| ServerPanel | `.btn-ghost.btn-sm` | `flex: 1; text-align: center` |

---

## 8. 수정 대상 파일 목록

| 파일 | 작업 |
|------|------|
| `client/src/style.css` | CSS 변수 9개 추가 + 글로벌 버튼 클래스 전체 추가 |
| `docs/guide/style_guide.md` | 버튼 시스템 섹션 추가 |
| `client/src/components/ServerModal.vue` | template + scoped style 수정 |
| `client/src/components/L7Modal.vue` | template + scoped style 수정 |
| `client/src/components/InfraModal.vue` | template + scoped style 수정 |
| `client/src/components/ExternalServiceModal.vue` | template + scoped style 수정 |
| `client/src/components/DnsModal.vue` | template + scoped style 수정 |
| `client/src/components/DependencyModal.vue` | template + scoped style 수정 |
| `client/src/components/GraphCanvas.vue` | template + scoped style 수정 |
| `client/src/components/ImpactPanel.vue` | template + scoped style 수정 |
| `client/src/components/ServerPanel.vue` | template + scoped style 수정 |
| `client/src/components/GraphConflictModal.vue` | template + scoped style 수정 |
| `client/src/views/LoginView.vue` | template + scoped style 수정 |
| `client/src/views/RegisterView.vue` | template + scoped style 수정 |
| `client/src/views/HeroView.vue` | template + scoped style 수정 |
| `client/src/views/ForbiddenView.vue` | template + scoped style 수정 |
| `client/src/views/ProjectsView.vue` | template + scoped style 수정 |
| `client/src/views/ProjectView.vue` | template + scoped style 수정 |
| `client/src/views/ProjectSettingsView.vue` | template + scoped style 수정 |
| `client/src/views/AccountView.vue` | template + scoped style 수정 |
| `client/src/views/AuditLogView.vue` | template + scoped style 수정 |
