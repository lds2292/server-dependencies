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

## 배경 레이어

| 변수 | 값 | 용도 |
|------|----|------|
| `--bg-base` | `#0a0e1a` | 메인 페이지 배경 |
| `--bg-surface` | `#111827` | 카드, 패널, 모달 |
| `--bg-elevated` | `#141f30` | 드롭다운, 툴팁 |
| `--bg-input` | `#0a0e1a` | 입력 필드 배경 |
| `--bg-overlay` | `rgba(0,0,0,0.6)` | 모달 오버레이 |

레이어 계층: `base` → `surface` → `elevated` 순으로 위에 올라온다.
카드 안의 입력 필드는 `--bg-base`를 사용해 대비를 확보한다.

---

## 보더

| 변수 | 값 | 용도 |
|------|----|------|
| `--border-subtle` | `#111827` | 거의 보이지 않는 구분선 |
| `--border-default` | `#1e2a3a` | 일반 카드/패널 외곽선 |
| `--border-strong` | `#2e3f55` | hover 상태, 강조 외곽선 |

---

## 텍스트 색상

| 변수 | 값 | 용도 |
|------|----|------|
| `--text-primary` | `#f1f5f9` | 제목, 강조 텍스트 |
| `--text-secondary` | `#e2e8f0` | 본문, 일반 텍스트 |
| `--text-muted` | `#cbd5e1` | 중간 중요도 텍스트 |
| `--text-tertiary` | `#94a3b8` | 보조 텍스트, 레이블 |
| `--text-disabled` | `#64748b` | 비활성, 힌트 |

**금지**: `--text-disabled(#64748b)` 보다 어두운 색상은 사용하지 않는다.
다크 배경(`#0a0e1a`)에서 가독성이 보장되지 않는다.

---

## 로고 브랜드 색상 (예외)

앱 로고(두 화살표 교차 아이콘)는 **파랑 + 주황** 조합을 브랜드 아이덴티티로 유지한다.

| 용도 | 값 | 비고 |
|------|----|------|
| 파랑 화살표 | `#3b82f6` | `--node-srv-color`와 동일 |
| 주황 화살표 | `#f97316` | 브랜드 고유 색상 |
| 보조 아이콘 | `#94a3b8` | `--text-tertiary` 계열 |

> 로고 파랑은 UI accent(시안)와 다르다. 로고 SVG에서만 허용되는 예외이며, 나머지 UI의 accent는 시안을 사용한다.

---

## 액센트 (Primary Cyan)

앱의 주 색상은 **시안(Cyan)** 계열이다. 인프라/네트워크 도구의 정밀한 느낌을 위해 채택.

| 변수 | 값 | 용도 |
|------|----|------|
| `--accent-primary` | `#0891b2` | 주 버튼, 링크 |
| `--accent-hover` | `#0e7490` | 버튼 hover |
| `--accent-focus` | `#06b6d4` | 포커스 링, 선택 상태 |
| `--accent-soft` | `#22d3ee` | 소프트 텍스트 |
| `--accent-light` | `#67e8f9` | 라이트 텍스트 |
| `--accent-bg` | `#0a2d3a` | 선택/활성 배경 |
| `--accent-bg-medium` | `#0c3545` | hover 배경 |
| `--accent-bg-deep` | `#061c26` | 버튼, 뱃지 배경 |
| `--accent-bg-subtle` | `#071520` | 매우 미세한 틴트 |

---

## 상태 색상

| 변수 | 값 | 용도 |
|------|----|------|
| `--color-success` | `#22c55e` | 성공 상태 |
| `--color-success-light` | `#4ade80` | 성공 텍스트 (밝음) |
| `--color-success-lighter` | `#86efac` | 뱃지 텍스트 |
| `--color-warning` | `#f59e0b` | 경고 상태 |
| `--color-warning-light` | `#fbbf24` | dirty 상태, 방화벽 |
| `--color-danger` | `#ef4444` | 위험/오류 |
| `--color-danger-hover` | `#dc2626` | 위험 버튼 hover |
| `--color-info` | `#22d3ee` | 정보 (= accent-soft) |
| `--color-ip-text` | `#7dd3fc` | IP·포트 등 기술 데이터 텍스트 |

---

## 노드 타입 색상

그래프 노드는 타입별로 고정된 시맨틱 색상을 사용한다. 임의로 변경하지 않는다.

### SRV (서버)
| 변수 | 값 |
|------|----|
| `--node-srv-color` | `#3b82f6` (blue-500) |
| `--node-srv-bg` | `#1e3a5f` |
| `--node-srv-glow` | `rgba(59,130,246,0.3)` |

### L7 (로드밸런서)
| 변수 | 값 |
|------|----|
| `--node-l7-color` | `#a78bfa` (violet-400) |
| `--node-l7-bg` | `#2d1f5e` |
| `--node-l7-bg-deep` | `#3b0764` |
| `--node-l7-text` | `#e9d5ff` (purple-200) |
| `--node-l7-glow` | `rgba(167,139,250,0.3)` |

### INFRA (인프라/DB)
| 변수 | 값 |
|------|----|
| `--node-infra-color` | `#22d3ee` (cyan-400) |
| `--node-infra-bg` | `#0e3a4a` |
| `--node-infra-bg-deep` | `#0c2040` |
| `--node-infra-bg-light` | `#f0f9ff` (아이콘 패널 대비용) |
| `--node-infra-text` | `#7dd3fc` (sky-300) |
| `--node-infra-glow` | `rgba(34,211,238,0.3)` |

### EXT (외부 서비스)
| 변수 | 값 |
|------|----|
| `--node-ext-color` | `#22c55e` (green-500) |
| `--node-ext-bg` | `#0f3a23` |
| `--node-ext-bg-deep` | `#052e16` |
| `--node-ext-text` | `#86efac` (green-300) |
| `--node-ext-glow` | `rgba(34,197,94,0.3)` |

---

## 역할(Role) 뱃지

| 역할 | 색상 변수 | 배경 변수 | 의미 |
|------|----------|----------|------|
| MASTER | `--role-master` `#f59e0b` | `--role-master-bg` | 최상위 권한 (금색) |
| ADMIN | `--role-admin` `#3b82f6` | `--role-admin-bg` | 관리자 (파랑) |
| WRITER | `--role-writer` `#22c55e` | `--role-writer-bg` | 편집자 (초록) |
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

### 카드 hover lift
```css
.card { transition: transform 0.15s, box-shadow 0.15s; }
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
}
```

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
const nodeColor = cssVar('--node-srv-color')  // '#3b82f6'
```
