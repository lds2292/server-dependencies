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

---

## 역할(Role) 뱃지

| 역할 | 색상 변수 | 배경 변수 | 의미 |
|------|----------|----------|------|
| MASTER | `--role-master` `#f59e0b` | `--role-master-bg` | 최상위 권한 (금색) |
| ADMIN | `--role-admin` `#5b8def` | `--role-admin-bg` | 관리자 (파랑) |
| WRITER | `--role-writer` `#42b883` | `--role-writer-bg` | 편집자 (초록) |
| READONLY | `--role-readonly` `#94a3b8` | `--role-readonly-bg` | 읽기 전용 (회색) |

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
