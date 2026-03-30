# 캔버스 노드 호버 툴팁 UX 개선 기획서

## 개요

GraphCanvas에서 노드 Hover 시 나타나는 SVG 툴팁의 **간격(offset)** 과 **시각 디자인**을 개선한다. 현재 툴팁이 노드에 너무 밀착되어 있고, 단순한 `rect + text` 구조로 되어 있어 정보 가독성과 시각적 완성도가 낮다.

---

## 1. 현황 분석

### 현재 구현 상태

**파일**: `client/src/components/GraphCanvas.vue`

**툴팁 구조** (308~330줄): SVG `<g>` 요소로 구현. `<rect>` 배경 + `<text>` 반복.

**현재 위치 계산** (309줄):
```
translate(${(tooltipNode.x ?? 0) + 100}, ${(tooltipNode.y ?? 0) - 37})
```

**노드 크기** (176줄): `x="-86" y="-37" width="187" height="74"` (노드 중심 기준 좌측 -86 ~ 우측 +101)

따라서 현재 툴팁 x 위치 = `node.x + 100`이고 노드 오른쪽 끝 = `node.x + 101`이므로, 툴팁이 노드 오른쪽 끝에 **1px 간격**으로 거의 밀착되어 있다.

**현재 디자인 요소**:
- 배경: `--bg-surface` (`#1a1a1e`)
- 테두리: 노드 타입별 색상 1px stroke
- 텍스트: `--text-primary`, font-size `9px`, opacity `0.85`
- 크기: 고정 width `180px`, height는 줄 수 x 16 + 12
- 모서리: `rx="4"` (4px 라운딩)
- 애니메이션: 0.15s fade-in만 존재

**정보 내용** (`getTooltipLines` 함수, 1017~1050줄):
- server: 팀, 내부IP, NAT IP, 설명
- l7: IP, NAT IP, 멤버 수, 설명
- infra: infraType, host:port, 설명
- external: 방화벽/화이트리스트 여부, 담당자, 설명
- dns: dnsType, recordValue, TTL, 설명

### 문제점

| 항목 | 문제 |
|------|------|
| 간격 | 노드와 툴팁 사이 1px 간격 -- 노드와 구분이 어려움 |
| 배경색 | `--bg-surface`를 사용하지만 스타일 가이드에 따르면 툴팁은 `--bg-elevated` 레이어를 사용해야 함 |
| 그림자 | box-shadow 없음 -- 캔버스 위에서 떠있는 느낌이 없음 |
| 폰트 크기 | 9px 하드코딩 -- CSS 변수 시스템(`--text-xs: 11px`)보다 작아 가독성 저하 |
| 정보 구조 | 모든 줄이 동일한 스타일로 렌더링 -- 레이블과 값의 구분 없음 |
| 글래스 엣지 | 스타일 가이드의 "글래스 엣지" 패턴 미적용 |
| 노드 타입 | 타입 구분이 테두리 색상 하나뿐 -- 시각적 힌트 부족 |
| IP/기술 데이터 | mono 폰트 미적용 (스타일 가이드: IP, 포트 등에는 `--font-mono` 적용 필수) |

---

## 2. 데이터 모델 & 로직 설계

### 백엔드 변경 없음

프론트엔드만 수정한다.

### `getTooltipLines` 함수 변경 -- 구조화된 데이터 반환

현재 `string[]`을 반환하는 구조에서, **레이블/값/타입**을 구분할 수 있는 구조로 변경한다.

```typescript
interface TooltipLine {
  label?: string       // 레이블 (예: "팀", "내부 IP", "타입")
  value: string        // 값
  isTech?: boolean     // true이면 mono 폰트 적용 (IP, 포트, 해시 등)
}

function getTooltipData(node: D3Node): TooltipLine[] {
  const lines: TooltipLine[] = []
  if (!node.nodeKind || node.nodeKind === 'server') {
    const s = node as unknown as Server
    if (s.team) lines.push({ label: '팀', value: s.team })
    s.internalIps?.forEach(ip => lines.push({ label: '내부', value: ip, isTech: true }))
    s.natIps?.forEach(ip => lines.push({ label: 'NAT', value: ip, isTech: true }))
    if (s.description) lines.push({ value: truncate(s.description, 30) })
  } else if (node.nodeKind === 'l7') {
    const l = node as unknown as L7Node
    if (l.ip) lines.push({ label: 'IP', value: l.ip, isTech: true })
    if (l.natIp) lines.push({ label: 'NAT', value: l.natIp, isTech: true })
    lines.push({ label: '멤버', value: `${l.memberServerIds?.length ?? 0}개 서버` })
    if (l.description) lines.push({ value: truncate(l.description, 30) })
  } else if (node.nodeKind === 'infra') {
    const i = node as unknown as InfraNode
    if (i.infraType) lines.push({ label: '타입', value: i.infraType })
    if (i.host) lines.push({ label: '호스트', value: `${i.host}${i.port ? ':' + i.port : ''}`, isTech: true })
    if (i.description) lines.push({ value: truncate(i.description, 30) })
  } else if (node.nodeKind === 'external') {
    const e = node as unknown as ExternalServiceNode
    if (e.hasFirewall) lines.push({ value: '방화벽 적용' })
    if (e.hasWhitelist) lines.push({ value: '화이트리스트 적용' })
    e.contacts?.forEach(c => lines.push({ label: '담당', value: c.name }))
    if (e.description) lines.push({ value: truncate(e.description, 30) })
  } else if (node.nodeKind === 'dns') {
    const d = node as unknown as DnsNode
    lines.push({ label: '타입', value: d.dnsType })
    if (d.recordValue) lines.push({ label: '값', value: d.recordValue, isTech: true })
    if (d.ttl != null) lines.push({ label: 'TTL', value: String(d.ttl), isTech: true })
    if (d.description) lines.push({ value: truncate(d.description, 30) })
  }
  return lines
}
```

### 노드 타입별 한글 레이블 매핑

툴팁 헤더에 노드 타입 명칭을 표시하기 위한 매핑:

```typescript
function nodeKindLabel(kind: string): string {
  if (kind === 'l7') return 'L7 로드밸런서'
  if (kind === 'infra') return '인프라'
  if (kind === 'external') return '외부 서비스'
  if (kind === 'dns') return 'DNS'
  return '서버'
}
```

### 기존 함수 수정 목록

| 함수 | 위치(줄) | 변경 내용 |
|------|----------|----------|
| `getTooltipLines` | 1017~1050 | `getTooltipData`로 대체. 반환 타입을 `TooltipLine[]`으로 변경 |
| (신규) `getTooltipData` | 1017 부근 | 위 코드 참조 |
| (신규) `nodeKindLabel` | 1057 부근 | 위 코드 참조 |

---

## 3. UI/UX 스펙

### 레이아웃

```
                       12px gap
    +-----------+     +--+------------------------------+
    |           |     |  |  [타입아이콘] 노드이름         |  <-- 헤더 (타입 컬러 바 + 이름)
    |   NODE    |     |  |  L7 로드밸런서                |  <-- 타입 레이블 (muted)
    |  (187x74) |     |  +------------------------------+
    |           |     |  | IP     192.168.1.1  (mono)    |  <-- 구조화된 정보 행
    +-----------+     |  | NAT    10.0.0.1     (mono)    |
                      |  | 멤버   3개 서버                |
                      |  | 설명문 텍스트...               |
                      +--+------------------------------+
                      ^
                      3px 좌측 타입 컬러 바
```

### 간격(Offset) 개선

```typescript
// 기존 (309줄)
:transform="`translate(${(tooltipNode.x ?? 0) + 100},${(tooltipNode.y ?? 0) - 37})`"

// 변경: 노드 우측 끝(+101)에서 12px 간격
:transform="`translate(${(tooltipNode.x ?? 0) + 113},${(tooltipNode.y ?? 0) - 20})`"
```

변경 근거:
- x: `+101 (노드 우측 끝) + 12 (간격) = +113`
- y: `-20` (노드 수직 중앙 근처에 툴팁 상단이 위치하도록 조정. 기존 `-37`은 노드 상단과 정렬되어 너무 높았음)

### SVG 툴팁 구조 (template 변경)

기존 308~330줄을 아래로 대체:

```html
<!-- 호버 툴팁 -->
<g v-if="tooltipNode && !arrowSource && !boxSelect"
   :transform="`translate(${(tooltipNode.x ?? 0) + 113},${(tooltipNode.y ?? 0) - 20})`"
   pointer-events="none"
   class="hover-tooltip"
>
  <!-- 그림자 레이어 -->
  <rect
    x="-2" y="-2"
    :width="tooltipWidth + 4"
    :height="getTooltipData(tooltipNode).length * 18 + 44"
    rx="8"
    fill="rgba(0,0,0,0.3)"
    filter="url(#tooltip-shadow)"
  />
  <!-- 배경 -->
  <rect
    x="0" y="0"
    :width="tooltipWidth"
    :height="getTooltipData(tooltipNode).length * 18 + 40"
    rx="7"
    :fill="cssVar('--bg-elevated')"
    :stroke="cssVar('--border-default')"
    stroke-width="1"
  />
  <!-- 좌측 타입 컬러 바 -->
  <rect
    x="0" y="3"
    width="3"
    :height="getTooltipData(tooltipNode).length * 18 + 34"
    :fill="nodeKindColor(tooltipNode.nodeKind ?? 'server')"
    rx="1.5"
  />
  <!-- 상단 글래스 엣지 (inset 느낌) -->
  <line
    x1="4" :x2="tooltipWidth - 4" y1="1" y2="1"
    stroke="rgba(255,255,255,0.06)"
    stroke-width="1"
  />
  <!-- 헤더: 노드 이름 -->
  <text
    x="12" y="16"
    text-anchor="start"
    :font-size="cssVar('--text-xs')"
    font-weight="700"
    :fill="nodeKindColor(tooltipNode.nodeKind ?? 'server')"
  >{{ tooltipNode.name }}</text>
  <!-- 헤더: 타입 레이블 -->
  <text
    x="12" y="28"
    text-anchor="start"
    font-size="9"
    font-weight="500"
    :fill="cssVar('--text-tertiary')"
  >{{ nodeKindLabel(tooltipNode.nodeKind ?? 'server') }}</text>
  <!-- 구분선 -->
  <line
    x1="8" :x2="tooltipWidth - 8"
    y1="34" y2="34"
    :stroke="cssVar('--border-subtle')"
    stroke-width="0.5"
  />
  <!-- 정보 행 -->
  <g v-for="(line, i) in getTooltipData(tooltipNode)" :key="i">
    <!-- 레이블 -->
    <text v-if="line.label"
      x="12" :y="50 + i * 18"
      text-anchor="start"
      font-size="9"
      font-weight="600"
      :fill="cssVar('--text-tertiary')"
    >{{ line.label }}</text>
    <!-- 값 -->
    <text
      :x="line.label ? 52 : 12"
      :y="50 + i * 18"
      text-anchor="start"
      font-size="10"
      :font-family="line.isTech ? cssVar('--font-mono') : cssVar('--font-sans')"
      font-weight="400"
      :fill="line.isTech ? cssVar('--color-ip-text') : cssVar('--text-secondary')"
    >{{ line.value }}</text>
  </g>
</g>
```

### SVG 필터 추가 (defs 내)

기존 `<defs>` 블록(332~370줄 부근)에 툴팁 그림자 필터를 추가:

```html
<filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
  <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.5)" flood-opacity="1"/>
</filter>
```

### 툴팁 너비

고정 width 180에서 200으로 변경. 스크립트 영역에 상수 추가:

```typescript
const tooltipWidth = 200
```

### 애니메이션 개선

기존 CSS (2055~2056줄):

```css
/* 기존 */
.hover-tooltip { opacity: 0; animation: tooltip-fade-in 0.15s ease forwards; }
@keyframes tooltip-fade-in { to { opacity: 1; } }
```

변경:

```css
.hover-tooltip {
  opacity: 0;
  transform: translateX(-4px);
  animation: tooltip-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes tooltip-fade-in {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

살짝 왼쪽에서 오른쪽으로 슬라이드하며 나타나는 효과. `cubic-bezier(0.16, 1, 0.3, 1)`은 "easeOutExpo" 느낌의 자연스러운 감속 커브.

### 빈 상태 처리

`getTooltipData`가 빈 배열을 반환할 경우 (모든 필드가 비어있는 노드), 툴팁 헤더(이름+타입)만 표시된다. 구분선 아래 정보 행이 없으면 높이가 자동으로 줄어든다.

빈 배열일 때 height 계산: `0 * 18 + 40 = 40px` (헤더만 보임)

---

## 4. 사용하는 CSS 변수

신규 CSS 변수 추가 없음. 기존 변수만으로 충족:

| 변수 | 용도 |
|------|------|
| `--bg-elevated` | 툴팁 배경 |
| `--border-default` | 툴팁 테두리 |
| `--border-subtle` | 내부 구분선 |
| `--text-tertiary` | 레이블 텍스트 |
| `--text-secondary` | 값 텍스트 |
| `--color-ip-text` | 기술 데이터 (IP 등) |
| `--font-mono` / `--font-sans` | 폰트 패밀리 |
| `--text-xs` | 헤더 폰트 크기 |

---

## 5. 수정 파일 체크리스트

| 파일 경로 | 작업 내용 |
|-----------|----------|
| `client/src/components/GraphCanvas.vue` (template, 308~330줄) | 툴팁 SVG 구조 전면 교체: 헤더(이름+타입), 좌측 컬러 바, 글래스 엣지 라인, 구조화된 정보 행 |
| `client/src/components/GraphCanvas.vue` (template, 309줄) | transform 좌표 변경: `+100, -37` -> `+113, -20` (12px 간격 확보) |
| `client/src/components/GraphCanvas.vue` (template, defs 블록 332줄 부근) | `<filter id="tooltip-shadow">` 추가 |
| `client/src/components/GraphCanvas.vue` (script, 1017~1050줄) | `getTooltipLines` -> `getTooltipData`로 리팩터링. `TooltipLine` 인터페이스 추가 |
| `client/src/components/GraphCanvas.vue` (script, 1057줄 부근) | `nodeKindLabel()` 함수 신규 추가 |
| `client/src/components/GraphCanvas.vue` (script) | `const tooltipWidth = 200` 상수 추가 |
| `client/src/components/GraphCanvas.vue` (style, 2055~2056줄) | `.hover-tooltip` CSS 개선: translateX 슬라이드 + easeOutExpo 커브 적용 |

---

## 6. 주의사항

- **색상 하드코딩 금지**: 모든 색상은 `cssVar()` 함수를 통해 CSS 변수에서 읽는다. 유일한 예외는 SVG 그림자/글래스 엣지에 사용하는 `rgba(0,0,0,*)`, `rgba(255,255,255,*)` 같은 투명도 기반 흑/백 값뿐이다.
- **기존 `getTooltipLines` 호출부**: template에서만 호출되므로 template 교체 시 함께 변경된다.
- **SVG 내 font-family**: SVG `<text>` 요소에서 CSS 변수를 직접 사용할 수 없으므로, `cssVar('--font-mono')` 등으로 JS에서 읽어 바인딩한다.
- **툴팁 캔버스 밖 벗어남 케이스**: 이번 스코프에서는 다루지 않는다. 향후 별도 기획으로 "화면 경계 감지 후 방향 전환" 로직을 추가할 수 있다.
- **`--text-xs` SVG 적용**: SVG `<text>`의 `font-size` 속성에 CSS 변수를 직접 넣으면 일부 브라우저에서 동작하지 않을 수 있다. `cssVar('--text-xs')`로 바인딩하여 문자열을 주입하는 방식을 사용한다.