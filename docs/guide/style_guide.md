# 스타일 가이드

모든 UI 작업은 이 문서의 CSS 변수 시스템을 따른다.
변수 정의 위치: `client/src/style.css` (`:root` 블록)

---

## 폰트

| 변수 | 용도 | 폰트 |
|------|------|------|
| `var(--font-sans)` | 본문, UI 텍스트 | Pretendard → 시스템 폴백 |
| `var(--font-mono)` | IP, 포트, 해시, 기술 데이터 | JetBrains Mono → Menlo |

> IP 주소, 포트, 해시값 등 기술적 데이터에는 반드시 `font-family: var(--font-mono)` 적용

---

## 타입 스케일

모든 `font-size`는 px 하드코딩 금지. 아래 변수를 사용한다.

| 변수 | 값 | 용도 |
|------|----|------|
| `--text-xs` | `11px` | 뱃지, 타임스탬프, 마이크로 레이블 |
| `--text-sm` | `13px` | 보조 텍스트, 버튼, 폼 레이블 |
| `--text-base` | `14px` | 기본 본문 |
| `--text-lg` | `16px` | 소제목, 강조 본문 |
| `--text-xl` | `20px` | 섹션 제목 |
| `--text-2xl` | `28px` | 페이지 제목 |
| `--text-3xl` | `40px` | 히어로 제목 |
| `--text-display` | `34px` | 섹션 대제목 (features-title 등) |
| `--text-hero` | `56px` | 랜딩 히어로 타이틀 |

미디어쿼리에서 반응형으로 축소할 때만 px 직접 사용을 허용한다 (예: `@media (max-width: 1100px) { .hero-title { font-size: 46px; } }`).

---

## 배경 레이어

| 변수 | 값 | 용도 |
|------|----|------|
| `--bg-base` | `#121214` | 메인 페이지 배경 |
| `--bg-surface` | `#1a1a1e` | 카드, 패널, 모달 |
| `--bg-elevated` | `#232328` | 드롭다운, 툴팁 |
| `--bg-input` | `#0e0e10` | 입력 필드 배경 |
| `--bg-overlay` | `rgba(0,0,0,0.6)` | 모달 오버레이 |

레이어 계층: `base` → `surface` → `elevated` 순으로 위에 올라온다.
카드 안의 입력 필드는 `--bg-base` 또는 `--bg-input`을 사용해 대비를 확보한다.

---

## 보더

| 변수 | 값 | 용도 |
|------|----|------|
| `--border-subtle` | `#1e1e22` | 거의 보이지 않는 구분선 |
| `--border-default` | `#2a2a30` | 일반 카드/패널 외곽선 |
| `--border-strong` | `#3a3a42` | hover 상태, 강조 외곽선 |

---

## 텍스트 색상

| 변수 | 값 | 용도 |
|------|----|------|
| `--text-primary` | `#f0f0f0` | 제목, 강조 텍스트 |
| `--text-secondary` | `#d4d4d4` | 본문, 일반 텍스트 |
| `--text-muted` | `#a0a0a0` | 중간 중요도 텍스트 (설명문 등) |
| `--text-tertiary` | `#787878` | 보조 텍스트, 레이블 |
| `--text-disabled` | `#525252` | 비활성, 힌트 |

**금지**: `--text-disabled(#525252)` 보다 어두운 색상은 사용하지 않는다.
다크 배경(`#121214`)에서 가독성이 보장되지 않는다.

텍스트 계층 선택 기준:
- 설명문·부제목처럼 읽혀야 하는 내용 → `--text-muted`
- 폼 레이블·아이콘 힌트처럼 조용히 있어야 하는 내용 → `--text-tertiary`
- placeholder·날짜처럼 눈에 띄면 안 되는 내용 → `--text-disabled`

---

## 로고 브랜드 색상 (예외)

앱 로고(두 화살표 교차 아이콘)는 **파랑 + 주황** 조합을 브랜드 아이덴티티로 유지한다.

| 용도 | 값 | 비고 |
|------|----|------|
| 파랑 화살표 | `#5b8def` | `--node-srv-color`와 동일 |
| 주황 화살표 | `#f97316` | 브랜드 고유 색상 |
| 보조 아이콘 | `#787878` | `--text-tertiary` 계열 |

> 로고 파랑은 UI accent(앰버)와 다르다. 로고 SVG에서만 허용되는 예외이며, 나머지 UI의 accent는 앰버를 사용한다.

---

## 액센트 (Primary Amber)

앱의 주 색상은 **앰버(Amber)** 계열이다. 엔지니어링 블루프린트 미학에서 채택.

| 변수 | 값 | 용도 |
|------|----|------|
| `--accent-primary` | `#d97706` | 주 버튼, 링크 (amber-600) |
| `--accent-hover` | `#b45309` | 버튼 hover (amber-700) |
| `--accent-focus` | `#f59e0b` | 포커스 링, 선택 상태 (amber-500) |
| `--accent-soft` | `#fbbf24` | 소프트 텍스트 (amber-400) |
| `--accent-light` | `#fcd34d` | 라이트 텍스트 (amber-300) |
| `--accent-bg` | `#292117` | 선택/활성 배경 |
| `--accent-bg-medium` | `#332a1a` | hover 배경 |
| `--accent-bg-deep` | `#1f1a12` | 버튼, 뱃지 배경 |
| `--accent-bg-subtle` | `#17140e` | 카드 hover, 매우 미세한 틴트 |

---

## 상태 색상

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-success` | `#22c55e` | 성공 상태 |
| `--color-success-light` | `#4ade80` | 성공 텍스트 (green-400) |
| `--color-success-lighter` | `#86efac` | 뱃지 텍스트 (green-300) |
| `--color-warning` | `#f59e0b` | 경고 상태 |
| `--color-warning-light` | `#fbbf24` | dirty 상태, 방화벽 (amber-400) |
| `--color-danger` | `#ef4444` | 위험/오류 |
| `--color-danger-hover` | `#dc2626` | 위험 버튼 hover |
| `--color-danger-bg` | `#450a0a` | danger 버튼 배경 |
| `--color-danger-bg-hover` | `#7f1d1d` | danger 버튼 hover 배경 |
| `--color-danger-text` | `#fca5a5` | danger 버튼 텍스트 |
| `--color-danger-text-hover` | `#fecaca` | danger 버튼 hover 텍스트 |
| `--color-danger-border` | `#ef4444` | danger 보더 (시맨틱 분리) |
| `--color-danger-surface` | `#1c0a0a` | danger 토스트/배너 배경 |
| `--color-danger-muted` | `#f87171` | danger 경고 텍스트 |
| `--color-info` | `#3ec6d6` | 정보 (= node-infra-color) |
| `--color-ip-text` | `#7dd3fc` | IP·포트 등 기술 데이터 텍스트 (sky-300) |

---

## 노드 타입 색상

그래프 노드는 타입별로 고정된 시맨틱 색상을 사용한다. 임의로 변경하지 않는다.

### SRV (서버)
| 변수 | 값 |
|------|----|
| `--node-srv-color` | `#5b8def` |
| `--node-srv-bg` | `#1a2d4a` |
| `--node-srv-glow` | `rgba(91,141,239,0.3)` |

### L7 (로드밸런서)
| 변수 | 값 |
|------|----|
| `--node-l7-color` | `#b494f7` |
| `--node-l7-bg` | `#2a1f52` |
| `--node-l7-bg-deep` | `#2e0a5a` |
| `--node-l7-text` | `#e9d5ff` |
| `--node-l7-glow` | `rgba(180,148,247,0.3)` |

### INFRA (인프라/DB)
| 변수 | 값 |
|------|----|
| `--node-infra-color` | `#3ec6d6` |
| `--node-infra-bg` | `#0d3340` |
| `--node-infra-bg-deep` | `#0a1e35` |
| `--node-infra-bg-light` | `#f0f9ff` |
| `--node-infra-text` | `#67d2dd` |
| `--node-infra-glow` | `rgba(62,198,214,0.3)` |

### EXT (외부 서비스)
| 변수 | 값 |
|------|----|
| `--node-ext-color` | `#42b883` |
| `--node-ext-bg` | `#0d2e1c` |
| `--node-ext-bg-deep` | `#052e16` |
| `--node-ext-text` | `#86efac` |
| `--node-ext-glow` | `rgba(66,184,131,0.3)` |

### DNS (도메인 네임 시스템)
| 변수 | 값 |
|------|----|
| `--node-dns-color` | `#f472b6` |
| `--node-dns-bg` | `#2e1228` |
| `--node-dns-bg-deep` | `#1f0a1a` |
| `--node-dns-bg-light` | `#fdf2f8` |
| `--node-dns-text` | `#f9a8d4` |
| `--node-dns-glow` | `rgba(244,114,182,0.3)` |
| `--node-dns-hover` | `#be185d` |

---

## 역할(Role) 뱃지

| 역할 | 색상 변수 | 배경 변수 | 의미 |
|------|----------|----------|------|
| MASTER | `--role-master` `#f59e0b` | `--role-master-bg` | 최상위 권한 (금색) |
| ADMIN | `--role-admin` `#5b8def` | `--role-admin-bg` | 관리자 (파랑) |
| WRITER | `--role-writer` `#42b883` | `--role-writer-bg` | 편집자 (초록) |
| READONLY | `--role-readonly` `#94a3b8` | `--role-readonly-bg` | 읽기 전용 (회색) |

---

## 버튼 시스템

`style.css`에 글로벌 버튼 클래스가 정의되어 있다. 새 버튼을 만들 때 반드시 글로벌 클래스를 사용한다.

### 카테고리

| 클래스 | 용도 | 외형 |
|--------|------|------|
| `.btn-primary` | 주요 액션 (저장, 확인, 추가) | accent 배경 + 흰색 텍스트 |
| `.btn-ghost` | 보조 액션 (취소, 뒤로, 닫기) | 투명 배경 + 보더 |
| `.btn-danger` | 위험 확인 (삭제, 로그아웃) | danger 배경 + danger 텍스트 |
| `.btn-danger-ghost` | 위험 트리거 (계정 삭제 버튼) | 투명 배경 + danger 보더 |
| `.btn-outline` | 강조 아웃라인 (새 프로젝트, 저장) | accent-bg 배경 + accent 보더/텍스트 |
| `.btn-icon` | 아이콘 버튼 (도움말, 설정) | 28x28 정사각형, 투명 배경 |

### 사이즈

| 클래스 | font-size | padding | height | border-radius | 용도 |
|--------|-----------|---------|--------|---------------|------|
| `.btn-sm` | `--text-xs` | `0 10px` | `28px` | `6px` | 툴바, 패널 내부 |
| (기본) | `--text-sm` | `7px 16px` | auto | `6px` | 모달 푸터, 폼 |
| `.btn-lg` | `--text-base` | `10px 28px` | auto | `8px` | 로그인, 히어로 CTA |

### 노드 타입 Modifier

모달 Primary 버튼에서 노드 타입별 색상을 사용할 때 적용한다.

| 클래스 | 배경 | hover 배경 |
|--------|------|-----------|
| `.btn-node-l7` | `--node-l7-color` | `--node-l7-hover` |
| `.btn-node-ext` | `--node-ext-color` | `--node-ext-hover` |

사용 예:
```html
<button class="btn-primary btn-node-l7">저장</button>
<button class="btn-ghost btn-sm">Export JSON</button>
<button class="btn-danger btn-lg">계정 삭제</button>
```

### 규칙

- scoped style에서 버튼 외형(background, color, border, padding, font-size, border-radius)을 재정의하지 않는다.
- 레이아웃 속성(flex, margin, width 등)만 scoped에서 추가한다.
- 상태 기반 스타일(.dirty 등)은 scoped에서 유지한다.
- 특수 버튼(canvas-btn, zoom-btn, choice-btn 등)은 글로벌 시스템 대상이 아니다.

---

## 헤더 버튼 규격

모든 뷰의 헤더(topbar, toolbar)에 배치되는 버튼은 동일한 높이와 기본 스타일을 공유한다.

### 공통 속성

| 속성 | 값 | 비고 |
|------|----|------|
| height | `36px` | 프로필 버튼과 동일 |
| border-radius | `6px` | |
| border | `1px solid var(--border-default)` | |
| background | `var(--bg-surface)` | |
| font-size | `var(--text-xs)` 또는 `var(--text-sm)` | 텍스트 양에 따라 |
| font-weight | `600` 또는 `700` | |
| color | `var(--text-tertiary)` | |
| padding | `0 12px` | 텍스트 버튼 기준 |
| transition | `all 0.15s` | |

### hover 상태

| 속성 | 값 |
|------|----|
| border-color | `var(--border-strong)` |
| color | `var(--text-secondary)` |
| background | `var(--bg-elevated)` (선택) |

### 아이콘 버튼 (정사각형)

`width: 36px; height: 36px; padding: 0;` — 설정, 도움말 등 아이콘만 있는 버튼.
원형이 필요하면 `border-radius: 50%` 추가.

### 적용 대상

| 뷰 | 버튼 | 클래스 |
|----|------|--------|
| ProjectSettings / AuditLog / Account | 돌아가기 | `.back-btn` |
| ProjectView | 목록으로 | `.btn-ghost.btn-sm` (scoped override) |
| ProjectView | 편집/읽기 전용 | `.btn-mode-toggle` |
| ProjectView | 설정 아이콘 | `.btn-toolbar-icon` |
| ProjectView | 자동저장 | `.btn-autosave` |
| ProjectView | 간격 선택 | `.select-interval` |
| ProjectView | 도움말 | `.btn-help` |
| 모든 뷰 | 프로필 | `.btn-user-trigger` |

### 규칙

- 헤더 버튼은 반드시 `height: 36px`을 사용한다. padding으로 높이를 결정하지 않는다.
- 글로벌 `.btn-sm`(28px)을 헤더에서 사용할 경우 scoped에서 `height: 36px`로 override한다.
- 프로필 버튼(`UserProfileDropdown`)이 기준이 되므로, 새 헤더 버튼 추가 시 프로필과 높이를 맞춘다.

---

## 전역 유틸리티

### 버튼 클릭 피드백
```css
button:active:not(:disabled) { transform: scale(0.97); }
```
전역 적용됨. 별도 구현 불필요.

### Shimmer Skeleton
```html
<div class="skeleton"></div>
```
로딩 중 placeholder에 `.skeleton` 클래스를 사용한다.
`style.css`에 `@keyframes shimmer`와 함께 전역 정의됨.

---

## 컴포넌트 시각 패턴

### 글래스 엣지 (모달/카드 상단 하이라이트)
배경 위에 올라오는 표면(모달, 카드, 오버레이)에 적용하는 표준 패턴.
`inset` 그림자로 상단에 얇은 밝은 선을 만들어 "유리 위에 올라온" 느낌을 준다.

```css
.modal {
  box-shadow:
    0 20px 60px rgba(0,0,0,0.4),
    inset 0 1px 0 rgba(255,255,255,0.04);
}
```

모달, 드롭다운, 플로팅 패널에 일관되게 적용한다.
단순 인라인 카드(리스트 아이템)에는 적용하지 않는다.

### 버튼 Amber Glow
accent 버튼 hover 시 amber 발광 효과를 추가한다.

```css
/* 주 버튼 (크기: 큰) */
.btn-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 0 18px rgba(217,119,6,0.4);
}

/* 보조 버튼 (크기: 작은) */
.btn-secondary:hover {
  background: var(--accent-bg-medium);
  box-shadow: 0 0 12px rgba(217,119,6,0.3);
}
```

danger 버튼에는 amber glow 적용하지 않는다.

### 좌측 3px 타입 컬러 바
노드 카드, Feature 카드 등 타입/카테고리를 구분할 때 사용하는 표준 패턴.
```css
.card { position: relative; overflow: hidden; padding-left: 13px; }
.card::before {
  content: ''; position: absolute;
  left: 0; top: 0; bottom: 0; width: 3px;
  background: var(--node-srv-color); /* 타입에 따라 교체 */
}
```

카드 hover 시 컬러 바 glow를 추가해 상호작용성을 강조한다.
```css
.card:hover::before {
  box-shadow: 2px 0 10px rgba(91,141,239,0.6); /* 색상은 타입에 맞게 */
}
```

### 섹션 타이틀 2px 세로선
설정 섹션 등 카테고리 제목에 accent 세로선으로 시각적 계층을 표현하는 패턴.
```css
.section-title {
  padding-left: 10px;
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  border-radius: 1px;
  background: var(--accent-primary);
}
/* 위험/오류 섹션은 색상 교체 */
.danger-title::before { background: var(--color-danger); }
```

### Blueprint 그리드 (GraphCanvas)
GraphCanvas 배경 격자는 "엔지니어링 청사진" 패턴을 사용한다.
```html
<!-- 24px 단위 미세 격자 -->
<pattern id="micro-grid" width="24" height="24" patternUnits="userSpaceOnUse">
  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
</pattern>
<!-- 120px 단위 굵은 격자 -->
<pattern id="dot-grid" width="120" height="120" patternUnits="userSpaceOnUse">
  <rect width="120" height="120" fill="url(#micro-grid)"/>
  <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="0.5"/>
</pattern>
```
점(dot) 격자가 아닌 선(line) 격자를 사용하는 것이 디자인 원칙이다.

### 페이지 트랜지션
`App.vue`의 `<transition name="page">` 전역 적용됨. 별도 구현 불필요.

---

## 스크롤바

`style.css`에 전역 정의됨. 별도 구현 불필요.

| 속성 | 값 | 비고 |
|------|----|------|
| 너비/높이 | `6px` | Webkit 전용 (`-webkit-scrollbar`) |
| Track 배경 | `transparent` | 배경과 자연스럽게 통합 |
| Thumb 색상 | `var(--border-strong)` | `#3a3a42` |
| Thumb hover | `var(--text-tertiary)` | `#787878` |
| Thumb 라운딩 | `3px` | |
| Firefox | `scrollbar-width: thin` | 표준 프로퍼티 |

Webkit(Chrome, Edge, Safari)과 Firefox 모두 지원한다.
`overflow-y: auto` 또는 `overflow-y: scroll`이 적용된 모든 요소에 자동 적용된다.

---

## 폼 컴포넌트 통일 규격

모든 폼 입력 요소(input, select, combobox)는 동일한 시각적 규격을 따른다.

### 공통 속성

| 속성 | 값 | 비고 |
|------|----|------|
| font-size | `var(--text-sm)` | 13px |
| padding | `9px 12px` | 상하 9px, 좌우 12px |
| border | `1px solid var(--border-default)` | |
| border-radius | `7px` | |
| background | `var(--bg-base)` | 카드 안에서 대비 확보 |
| color | `var(--text-secondary)` | |
| outline | `none` | |
| transition | `border-color 0.15s` | |
| box-sizing | `border-box` | |

### 상태별 스타일

| 상태 | 속성 | 값 |
|------|------|----|
| hover | border-color | `var(--border-strong)` |
| focus / open | border-color | `var(--accent-focus)` |
| placeholder | color | `var(--border-strong)` |
| disabled | opacity | `0.5`, cursor: `not-allowed` |

### 셀렉트/콤보박스 화살표(chevron) 규격

- 화살표 아이콘: `16px x 16px`, color `var(--text-disabled)`
- 트리거 내부 레이아웃: `display: flex; align-items: center; justify-content: space-between; gap: 8px`
- 텍스트와 화살표 사이 최소 gap: `8px`
- open 상태에서 화살표 회전: `transform: rotate(180deg)`

### 참고

- native `<select>` 대신 `CustomSelect` 컴포넌트를 사용할 것
- 색상 하드코딩 금지, 반드시 CSS 변수 사용

---

## 프로필 버튼 (UserProfileDropdown)

헤더 우측에 배치되는 사용자 프로필 드롭다운 트리거 버튼의 규격.

### 트리거 버튼 (`.btn-user-trigger`)

| 속성 | 값 |
|------|----|
| height | `36px` |
| padding | `3px 12px 3px 4px` |
| border | `1px solid var(--border-strong)` |
| border-radius | `6px` |
| background | `var(--bg-surface)` |
| color | `var(--text-tertiary)` |
| font-size | `var(--text-sm)` |
| font-weight | `600` |

### 아바타 (`.user-avatar`)

| 속성 | 값 |
|------|----|
| width / height | `28px` |
| border-radius | `50%` |
| background | `var(--accent-primary)` |
| color | `var(--bg-base)` |
| font-size | `12px` |
| font-weight | `700` |
| box-shadow | `0 0 6px rgba(217,119,6,0.25)` |

### hover 상태

| 속성 | 값 |
|------|----|
| border-color | `var(--accent-focus)` |
| color | `var(--text-secondary)` |
| box-shadow | `0 0 8px rgba(217,119,6,0.15)` |

---

## 아이콘 컴포넌트

프로젝트 전역에서 반복 사용되는 SVG 아이콘은 `Icon.vue` 단일 컴포넌트로 관리한다.

### 파일 위치

`client/src/components/Icon.vue`

### 사용법

```vue
<script setup lang="ts">
import Icon from '../components/Icon.vue'
</script>

<template>
  <!-- 기본 (16px) -->
  <Icon name="chevron-left" />

  <!-- 크기 지정 -->
  <Icon name="settings" :size="20" />

  <!-- 색상은 부모의 color를 상속 (currentColor) -->
  <span style="color: var(--text-tertiary)">
    <Icon name="lock" :size="13" />
  </span>

  <!-- class 전달 가능 -->
  <Icon name="chevron-down" :size="12" class="expand-icon" />
</template>
```

### Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `name` | `string` | (필수) | 아이콘 이름 |
| `size` | `number` | `16` | width/height (px) |

### 등록된 아이콘 목록

| 이름 | 설명 | 사용처 |
|------|------|--------|
| `chevron-left` | 왼쪽 화살표 | 돌아가기 버튼 |
| `chevron-down` | 아래 화살표 (12x12) | 펼치기/접기, 아코디언 |
| `chevron-down-sm` | 아래 화살표 (10x10) | 필터 드롭다운 |
| `close` | X 닫기 | 모달/팝업 닫기 |
| `panel-right` | 오른쪽 삼각형 | 패널 접기 |
| `panel-left` | 왼쪽 삼각형 | 패널 열기 |
| `settings` | 톱니바퀴 | 설정 버튼 |
| `copy` | 클립보드 복사 | IP/연락처 복사 |
| `filter` | 필터 라인 | 카테고리 필터 |
| `user-profile` | 사용자 실루엣 | 프로필 섹션 |
| `lock` | 자물쇠 | 비밀번호 섹션 |
| `warning-triangle` | 경고 삼각형 | 위험 섹션 (AccountView) |
| `warning-triangle-alt` | 경고 삼각형 (변형) | 위험 영역 (ProjectSettingsView) |
| `project-info` | 문서 아이콘 | 프로젝트 정보 섹션 |
| `members` | 사용자 그룹 | 멤버 관리 섹션 |
| `node-server` | 서버 랙 | 노드 추가 메뉴 |
| `node-l7` | 로드밸런서 | 노드 추가 메뉴 |
| `node-infra` | 데이터베이스 | 노드 추가 메뉴 |
| `node-dns` | 지구본 (DNS) | 노드 추가 메뉴 |
| `node-external` | 외부 서비스 | 노드 추가 메뉴 |

### 새 아이콘 추가 방법

`Icon.vue`의 `icons` 맵에 항목을 추가한다:

```typescript
'icon-name': {
  viewBox: '0 0 16 16',
  content: '<path d="..." stroke="currentColor" .../>'
}
```

### 규칙

- 반복 사용되는 기능적 아이콘만 등록한다 (장식용/일회용 SVG는 인라인 유지)
- 모든 path의 stroke/fill은 `currentColor`를 사용한다
- 브랜드 로고 SVG, GraphCanvas 내부 SVG, 다이얼로그 아이콘(하드코딩 색상)은 Icon 컴포넌트로 교체하지 않는다
- import는 상대 경로를 사용한다: `import Icon from '../components/Icon.vue'`

---

## JS에서 CSS 변수 읽기

GraphCanvas 등 D3/Canvas 기반 컴포넌트에서는 `getComputedStyle`로 CSS 변수를 읽는다.
하드코딩된 색상을 JS/TS 파일에 직접 작성하지 않는다.

```typescript
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// 사용 예
const nodeColor = cssVar('--node-srv-color')  // '#5b8def'
const accent = cssVar('--accent-primary')     // '#d97706'
```
