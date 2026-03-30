# 버튼 스타일 통일화 구현 기획서

## 개요

프로젝트 전체에 걸쳐 약 50개 이상의 버튼 클래스가 각 컴포넌트/뷰의 scoped style에 독립적으로 정의되어 있어 padding, border-radius, font-size, 색상이 불일치한다. 글로벌 버튼 클래스 시스템을 `style.css`에 정의하고, 각 컴포넌트의 scoped 버튼 스타일을 글로벌 클래스로 교체한다.

---

## 1단계: 현황 분석

### 문제 요약

| 속성 | 현재 상태 | 파일 수 |
|------|----------|---------|
| padding | `5px 12px`, `6px 14px`, `6px 18px`, `7px 14px`, `7px 16px`, `7px 20px`, `8px 16px`, `8px 18px`, `9px 24px`, `10px 28px` | 전체 |
| border-radius | `5px`, `6px`, `7px`, `8px` 혼재 | 전체 |
| font-size | `--text-xs`, `--text-sm`, `--text-base` 혼용 | 전체 |
| disabled | `opacity: 0.4` vs `0.5` | 다수 |
| danger 색상 | `#ef4444`, `#450a0a`, `#7f1d1d`, `#991b1b`, `#fca5a5`, `#fecaca` 하드코딩 | 8개 |

### 동일 클래스명의 스타일 차이 (.btn-primary 기준)

| 파일 | background | padding | border-radius |
|------|-----------|---------|---------------|
| DnsModal, InfraModal | `--accent-primary` | `8px 18px` | `6px` |
| L7Modal | `--node-l7-color` | `8px 18px` | `6px` |
| ExternalServiceModal | `--node-ext-color` | `8px 18px` | `6px` |
| ServerModal | `--accent-primary` | `8px 18px` | `6px` |
| DependencyModal | `--accent-primary` | `8px 18px` | `6px` |
| ImpactPanel | `--accent-primary` | `7px 16px` | `6px` |
| GraphCanvas | `--accent-primary` | `7px 16px` | `6px` |
| ProjectSettingsView | `--accent-bg` (아웃라인풍) | `7px 14px` | `6px` |
| ProjectView | `--accent-bg` (아웃라인풍) | `6px 14px` | `6px` |
| HeroView (lg) | `--accent-primary` | `10px 28px` | `8px` |
| HeroView (sm) | `--accent-primary` | `6px 18px` | `6px` |

---

## 2단계: 글로벌 버튼 클래스 설계

### 2.1 CSS 변수 추가 (style.css :root)

Danger 색상 하드코딩을 제거하기 위해 CSS 변수를 추가한다.

```css
/* 기존 */
--color-danger: #ef4444;
--color-danger-hover: #dc2626;

/* 추가 */
--color-danger-bg: #450a0a;         /* danger 버튼 배경 */
--color-danger-bg-hover: #7f1d1d;   /* danger 버튼 hover 배경 */
--color-danger-text: #fca5a5;       /* danger 버튼 텍스트 */
--color-danger-text-hover: #fecaca; /* danger 버튼 hover 텍스트 */
--color-danger-border: #ef4444;     /* = --color-danger와 동일하지만 시맨틱 분리 */
--color-danger-surface: #1c0a0a;    /* danger 토스트/배너 배경 */
--color-danger-muted: #f87171;      /* danger 경고 텍스트 (에러 메시지 등) */
```

### 2.2 버튼 카테고리 (5가지)

#### A. `.btn-primary` -- 주요 액션
- 저장, 확인, 추가, 초대, 내보내기 등 핵심 CTA
- accent 배경 + 흰색 텍스트

#### B. `.btn-ghost` -- 보조 액션 (기존 .btn-secondary, .btn-cancel 통합)
- 취소, 뒤로, 닫기 등
- 투명 배경 + 보더

#### C. `.btn-danger` -- 위험 액션
- 삭제, 계정 탈퇴, 떠나기 등
- danger 배경 + danger 텍스트

#### D. `.btn-outline` -- 강조 아웃라인 (기존 .btn-save, .btn-new 등)
- 새 프로젝트, 저장 (accent 보더/텍스트)
- accent 보더 + accent 텍스트

#### E. `.btn-icon` -- 아이콘/미니 버튼
- 정사각형, 최소 패딩
- 삭제(x), 설정(gear) 등

### 2.3 사이즈 변형 (3가지)

| 사이즈 | 클래스 | font-size | padding | height | border-radius | 용도 |
|--------|--------|-----------|---------|--------|---------------|------|
| sm | `.btn-sm` | `--text-xs` (11px) | `0 10px` | `28px` | `6px` | 툴바, 패널 내부, 뱃지형 |
| md | `.btn-md` (기본) | `--text-sm` (13px) | `7px 16px` | auto | `6px` | 모달 푸터, 폼, 일반 |
| lg | `.btn-lg` | `--text-base` (14px) | `10px 28px` | auto | `8px` | 로그인, 히어로 CTA |

### 2.4 노드 타입 Modifier (모달 Primary용)

모달 Primary 버튼이 노드 타입별 색상을 사용하는 것은 의도된 차별화이므로 modifier 클래스로 유지한다.

| Modifier | background | hover |
|----------|-----------|-------|
| `.btn-node-l7` | `--node-l7-color` | `#6d28d9` (CSS 변수 추가: `--node-l7-hover`) |
| `.btn-node-ext` | `--node-ext-color` | `#15803d` (CSS 변수 추가: `--node-ext-hover`) |

```css
/* 사용 예 */
<button class="btn-primary btn-node-l7">저장</button>
```

### 2.5 글로벌 클래스 CSS 구조

```css
/* ── 버튼 공통 ── */
.btn-primary,
.btn-ghost,
.btn-danger,
.btn-outline {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 700;
  padding: 7px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  text-decoration: none;
  box-sizing: border-box;
  line-height: 1.4;
}

/* Primary */
.btn-primary {
  background: var(--accent-primary);
  color: #fff;
  border: none;
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 0 12px rgba(217,119,6,0.35);
}
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--text-tertiary);
  border: 1px solid var(--border-default);
}
.btn-ghost:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}
.btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

/* Danger */
.btn-danger {
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger);
}
.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-bg-hover);
  color: var(--color-danger-text-hover);
}
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Danger Ghost (아웃라인만) */
.btn-danger-ghost {
  background: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
}
.btn-danger-ghost:hover:not(:disabled) {
  background: color-mix(in srgb, var(--color-danger) 15%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-danger) 30%, transparent);
}
.btn-danger-ghost:disabled { opacity: 0.5; cursor: not-allowed; }

/* Outline (accent) */
.btn-outline {
  background: var(--accent-bg);
  color: var(--accent-soft);
  border: 1px solid var(--accent-hover);
}
.btn-outline:hover:not(:disabled) {
  background: var(--accent-bg-medium);
  color: var(--accent-light);
  box-shadow: 0 0 12px rgba(217,119,6,0.3);
}
.btn-outline:disabled { opacity: 0.5; cursor: not-allowed; }

/* 사이즈 변형 */
.btn-sm {
  font-size: var(--text-xs);
  padding: 0 10px;
  height: 28px;
}
.btn-lg {
  font-size: var(--text-base);
  padding: 10px 28px;
  border-radius: 8px;
}

/* 노드 타입 modifier */
.btn-node-l7 {
  background: var(--node-l7-color);
}
.btn-node-l7:hover:not(:disabled) {
  background: var(--node-l7-hover);
  box-shadow: 0 0 12px var(--node-l7-glow);
}

.btn-node-ext {
  background: var(--node-ext-color);
}
.btn-node-ext:hover:not(:disabled) {
  background: var(--node-ext-hover);
  box-shadow: 0 0 12px var(--node-ext-glow);
}

/* 아이콘 버튼 */
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid var(--border-default);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}
.btn-icon:hover:not(:disabled) {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}
.btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }
```

---

## 3단계: 컴포넌트별 매핑 테이블

### 모달 컴포넌트

| 파일 | 현재 클래스 | 변환 후 | 비고 |
|------|-----------|---------|------|
| ServerModal.vue | `.btn-primary` (scoped) | `.btn-primary` (global) | accent 유지 |
| ServerModal.vue | `.btn-secondary` (scoped) | `.btn-ghost` (global) | |
| L7Modal.vue | `.btn-primary` (scoped, L7 색상) | `.btn-primary.btn-node-l7` (global) | 노드 타입 modifier |
| L7Modal.vue | `.btn-secondary` (scoped) | `.btn-ghost` (global) | |
| InfraModal.vue | `.btn-primary` (scoped) | `.btn-primary` (global) | accent 유지 |
| InfraModal.vue | `.btn-secondary` (scoped) | `.btn-ghost` (global) | |
| ExternalServiceModal.vue | `.btn-primary` (scoped, ext 색상) | `.btn-primary.btn-node-ext` (global) | 노드 타입 modifier |
| ExternalServiceModal.vue | `.btn-secondary` (scoped) | `.btn-ghost` (global) | |
| DnsModal.vue | `.btn-primary` (scoped) | `.btn-primary` (global) | accent 유지 |
| DnsModal.vue | `.btn-secondary` (scoped) | `.btn-ghost` (global) | |
| DependencyModal.vue | `.btn-primary` (scoped) | `.btn-primary` (global) | accent 유지 |
| DependencyModal.vue | `.btn-secondary` (scoped) | `.btn-ghost` (global) | |
| GraphConflictModal.vue | `.btn-confirm` (scoped) | `.btn-primary` (global) | |
| GraphConflictModal.vue | `.btn-cancel` (scoped) | `.btn-ghost` (global) | |

### 패널 컴포넌트

| 파일 | 현재 클래스 | 변환 후 | 비고 |
|------|-----------|---------|------|
| ImpactPanel.vue | `.btn-primary` (scoped) | `.btn-primary` (global) | 마스킹 해제 확인 |
| ImpactPanel.vue | `.btn-secondary` (scoped) | `.btn-ghost` (global) | 마스킹 해제 취소 |
| ServerPanel.vue | `.btn-secondary` (scoped, Export) | `.btn-ghost.btn-sm` (global) | Export/Import |
| GraphCanvas.vue | `.btn-primary` (scoped, 내보내기) | `.btn-primary` (global) | 내보내기 모달 |
| GraphCanvas.vue | `.btn-secondary` (scoped, 취소) | `.btn-ghost` (global) | 내보내기 취소 |

### 뷰 컴포넌트

| 파일 | 현재 클래스 | 변환 후 | 비고 |
|------|-----------|---------|------|
| LoginView.vue | `.btn-submit` (scoped) | `.btn-primary.btn-lg` (global) + 커스텀 width | 로그인 CTA |
| RegisterView.vue | `.btn-submit` (scoped) | `.btn-primary.btn-lg` (global) + 커스텀 width | 회원가입 CTA |
| HeroView.vue | `.btn-primary` (scoped, lg) | `.btn-primary.btn-lg` (global) | 히어로 CTA |
| HeroView.vue | `.btn-secondary` (scoped, lg) | `.btn-ghost.btn-lg` (global) | 히어로 보조 |
| HeroView.vue | `.btn-primary-sm` (scoped) | `.btn-primary.btn-sm` (global) | 헤더 버튼 |
| HeroView.vue | `.btn-secondary-sm` (scoped) | `.btn-ghost.btn-sm` (global) | 헤더 버튼 |
| ForbiddenView.vue | `.forbidden-btn` (scoped) | `.btn-ghost.btn-lg` (global) | 목록으로 |
| ProjectsView.vue | `.btn-new` (scoped) | `.btn-outline.btn-sm` (global) | 새 프로젝트 |
| ProjectsView.vue | `.btn-cancel` (scoped) | `.btn-ghost` (global) | 모달 취소 |
| ProjectsView.vue | `.btn-confirm` (scoped) | `.btn-primary` (global) | 모달 확인 |
| ProjectsView.vue | `.btn-confirm-danger` (scoped) | `.btn-danger` (global) | 로그아웃 확인 |
| ProjectsView.vue | `.btn-accept` (scoped) | `.btn-primary.btn-sm` (global) | 초대 수락 |
| ProjectsView.vue | `.btn-reject` (scoped) | `.btn-ghost.btn-sm` (global) | 초대 거절, hover 시 danger 색상은 별도 scoped 유지 |
| ProjectView.vue | `.btn-primary` (scoped) | `.btn-outline.btn-sm` (global) | 실제로 accent-bg 아웃라인풍 |
| ProjectView.vue | `delete-btn-cancel` (scoped) | `.btn-ghost` (global) + flex:1 scoped | 다이얼로그 취소 |
| ProjectView.vue | `delete-btn-confirm` (scoped) | `.btn-danger` (global) + flex:1 scoped | 다이얼로그 확인 |
| ProjectView.vue | `.btn-save` (scoped) | `.btn-outline.btn-sm` (global) + `.dirty` scoped 유지 | 저장 |
| ProjectView.vue | `.btn-back` (scoped) | `.btn-ghost.btn-sm` (global) | 목록 링크 |
| ProjectView.vue | `.btn-help` (scoped) | `.btn-icon` (global) | 도움말 |
| ProjectView.vue | `.btn-toolbar-icon` (scoped) | `.btn-icon` (global) | 설정 아이콘 |
| ProjectView.vue | `.btn-empty-sample`, `.btn-empty-add` | `.btn-primary.btn-lg` / `.btn-ghost.btn-lg` | 빈 상태 |
| ProjectSettingsView.vue | `.btn-save` (scoped) | `.btn-outline.btn-sm` (global) | 저장 |
| ProjectSettingsView.vue | `.btn-primary` (scoped) | `.btn-outline.btn-sm` (global) | 초대 |
| ProjectSettingsView.vue | `.btn-danger` (scoped) | `.btn-danger` (global) | 탈퇴/삭제 |
| ProjectSettingsView.vue | `delete-btn-cancel` (scoped) | `.btn-ghost` (global) + flex:1 scoped | 다이얼로그 취소 |
| ProjectSettingsView.vue | `delete-btn-confirm` (scoped) | `.btn-danger` (global) + flex:1 scoped | 다이얼로그 확인 |
| AccountView.vue | `.btn-save` (scoped) | `.btn-outline.btn-sm` (global) | 프로필 저장 |
| AccountView.vue | `.btn-danger` (scoped) | `.btn-danger-ghost` (global) | 계정 삭제 (아웃라인) |
| AccountView.vue | `.btn-cancel` (scoped) | `.btn-ghost` (global) | 모달 취소 |
| AccountView.vue | `.btn-confirm.btn-confirm-danger` (scoped) | `.btn-danger` (global) | 모달 위험 확인 |
| AuditLogView.vue | `.btn-save` (scoped) | `.btn-outline.btn-sm` (global) | 필터 관련 |
| AuditLogView.vue | `.btn-cancel` (scoped) | `.btn-ghost` (global) | 모달 취소 |
| AuditLogView.vue | `.btn-confirm.btn-confirm-danger` (scoped) | `.btn-danger` (global) | 로그아웃 확인 |

### 유지하는 특수 버튼 (글로벌 시스템 미적용)

| 클래스 | 파일 | 이유 |
|--------|------|------|
| `.canvas-btn` | GraphCanvas.vue | 캔버스 고유 UI, 배경 blur/투명 |
| `.zoom-btn` | GraphCanvas.vue | 줌 컨트롤 고유 UI |
| `.path-cancel-btn` | GraphCanvas.vue | 경로 모드 고유 UI |
| `.tracking-btn` | GraphCanvas.vue | 트래킹 토글 고유 |
| `.btn-add` | ServerPanel.vue | 패널 헤더 추가 버튼, 고유 레이아웃 |
| `.btn-mode-toggle` | ProjectView.vue | 읽기전용 토글 고유 상태 |
| `.btn-autosave` | ProjectView.vue | 자동저장 토글 고유 상태 |
| `.choice-btn` | GraphConflictModal.vue | 충돌 선택 고유 UI |
| `.btn-bulk` | GraphConflictModal.vue | 일괄 선택 고유 UI |
| `.btn-copy` | ImpactPanel.vue | 미니 복사 버튼 |
| `.btn-unmask` | ImpactPanel.vue | 마스킹 해제 고유 UI |
| `.btn-dep`, `.btn-clear` | ImpactPanel.vue | 패널 하단 고유 UI |
| `.btn-card-settings` | ProjectsView.vue | 카드 내부 설정 아이콘 |
| `.btn-ip-add`, `.btn-ip-remove` | ServerModal.vue | IP 필드 고유 |
| `.btn-add-contact`, `.btn-remove` | ExternalServiceModal.vue | 담당자 필드 고유 |
| `.btn-user-trigger` | UserProfileDropdown.vue | 프로필 드롭다운 트리거 |
| `.member-remove-btn` | ProjectView/ProjectSettingsView | 멤버 삭제 미니 버튼 |
| `.quick-btn` | AuditLogView.vue | 날짜 퀵 필터 고유 |
| `.back-btn` | AccountView/AuditLogView/ProjectSettingsView | 뒤로가기 고유 (아이콘+텍스트) |
| `.detail-toggle` | ProjectView.vue | 패널 토글 고유 |

---

## 4단계: 수정 파일 체크리스트

| 파일 | 작업 내용 |
|------|----------|
| `client/src/style.css` | danger CSS 변수 7개 추가, 노드 hover 변수 2개 추가, 글로벌 버튼 클래스 전체 추가 |
| `docs/guide/style_guide.md` | 버튼 시스템 섹션 추가 (카테고리, 사이즈, modifier) |
| `client/src/components/ServerModal.vue` | scoped `.btn-primary`/`.btn-secondary` 삭제, template 클래스명 유지 또는 `.btn-ghost`로 변경 |
| `client/src/components/L7Modal.vue` | scoped 버튼 스타일 삭제, `.btn-primary.btn-node-l7` + `.btn-ghost` 적용 |
| `client/src/components/InfraModal.vue` | scoped 버튼 스타일 삭제, 글로벌 `.btn-primary` + `.btn-ghost` |
| `client/src/components/ExternalServiceModal.vue` | scoped 버튼 스타일 삭제, `.btn-primary.btn-node-ext` + `.btn-ghost` |
| `client/src/components/DnsModal.vue` | scoped 버튼 스타일 삭제, 글로벌 적용 |
| `client/src/components/DependencyModal.vue` | scoped 버튼 스타일 삭제, 글로벌 적용 |
| `client/src/components/GraphCanvas.vue` | 내보내기 모달의 scoped `.btn-primary`/`.btn-secondary` 삭제, 글로벌 적용 |
| `client/src/components/ImpactPanel.vue` | 패스워드 모달의 scoped `.btn-primary`/`.btn-secondary` 삭제, 글로벌 적용 |
| `client/src/components/ServerPanel.vue` | Export/Import `.btn-secondary` -> `.btn-ghost.btn-sm` |
| `client/src/components/GraphConflictModal.vue` | `.btn-confirm`/`.btn-cancel` -> `.btn-primary`/`.btn-ghost` |
| `client/src/views/LoginView.vue` | `.btn-submit` -> `.btn-primary.btn-lg` + width scoped |
| `client/src/views/RegisterView.vue` | `.btn-submit` -> `.btn-primary.btn-lg` + width scoped |
| `client/src/views/HeroView.vue` | `.btn-primary`/`.btn-secondary`/sm -> 글로벌 `.btn-primary.btn-lg`/`.btn-ghost.btn-lg`/sm |
| `client/src/views/ProjectsView.vue` | `.btn-new`/`.btn-cancel`/`.btn-confirm`/`.btn-accept`/`.btn-reject` -> 글로벌 |
| `client/src/views/ProjectView.vue` | `.btn-primary`/`.btn-save`/`.btn-back`/delete계열 -> 글로벌 + scoped 보조 |
| `client/src/views/ProjectSettingsView.vue` | `.btn-save`/`.btn-primary`/`.btn-danger`/delete계열 -> 글로벌 + scoped 보조 |
| `client/src/views/AccountView.vue` | `.btn-save`/`.btn-danger`/`.btn-cancel`/`.btn-confirm` -> 글로벌 |
| `client/src/views/AuditLogView.vue` | `.btn-save`/`.btn-cancel`/`.btn-confirm` -> 글로벌 |
| `client/src/views/ForbiddenView.vue` | `.forbidden-btn` -> `.btn-ghost.btn-lg` |

---

## 제약 조건

1. 색상 하드코딩 금지 -- 반드시 CSS 변수 사용 (CLAUDE.md)
2. 이모지 사용 금지
3. 특수 버튼(canvas-btn, zoom-btn, path-cancel-btn 등)은 글로벌 시스템에 포함하지 않음
4. 모달 Primary 버튼의 노드 타입별 색상(L7=보라, EXT=초록)은 `.btn-node-*` modifier로 유지
5. 기존 기능/레이아웃이 깨지지 않도록 scoped에서 flex:1, margin-top 등 레이아웃 속성은 유지
6. `.dirty` 상태 등 상태 기반 스타일은 scoped에서 유지
7. 글로벌 클래스는 `style.css`의 기존 `button:active` 규칙 아래에 추가
8. `docs/guide/style_guide.md`에 버튼 규격 섹션 필수 추가
9. 프론트엔드만 수정 -- 백엔드 변경 불필요
