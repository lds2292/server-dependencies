# 검색 필터 자동완성 리스트 개선 - 디자인 가이드

## 개요

검색 드롭다운의 결과 아이템을 2줄 구조로 개선하고, 타입 뱃지 색상과 서브 정보/설명을 표시한다.
기존 "엔지니어링 블루프린트" 컨셉과 투명 글래스 배경을 유지하면서 정보 밀도를 높인다.

---

## 디자인 결정 사항

### 1. 드롭다운 가로 폭: 400px

기존 280px에서 400px으로 확장한다. 캔버스 위에 떠있는 플로팅 요소이므로 이 이상 넓히지 않는다.
검색 바(input) 자체도 400px로 함께 확장하여 드롭다운과 정렬을 맞춘다.

### 2. description 줄 색상: `var(--text-tertiary)`

`--text-disabled`(#525252)는 스타일 가이드 기준 "눈에 띄면 안 되는" 수준이므로,
설명문은 "조용히 있어야 하는" `--text-tertiary`(#787878)를 사용한다.

### 3. 서브 정보(IP 등) 색상: `var(--color-ip-text)`

기술 데이터(IP, 포트, 호스트)에는 스타일 가이드에 명시된 `--color-ip-text`(#7dd3fc, sky-300)을 사용한다.
기존 `--text-disabled`보다 가독성이 높고, 기술 데이터 전용 색상으로 시맨틱이 정확하다.

### 4. 타입 뱃지 스타일

기존 텍스트 전용 뱃지에 배경색을 추가하여 시각적 구분을 강화한다.

| 노드 타입 | 텍스트 색상 | 배경 색상 |
|-----------|-----------|----------|
| SRV | `var(--node-srv-color)` | `var(--node-srv-bg)` |
| L7 | `var(--node-l7-color)` | `var(--node-l7-bg)` |
| INFRA | `var(--node-infra-color)` | `var(--node-infra-bg)` |
| EXT | `var(--node-ext-color)` | `var(--node-ext-bg)` |
| DNS | `var(--node-dns-color)` | `var(--node-dns-bg)` |

---

## CSS 스펙

### 검색 바 폭 변경

```css
.search-bar {
  /* 기존 유지 */
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  z-index: 60;
  /* 변경 */
  width: 400px;
}
```

### 검색 결과 아이템 (2줄 구조)

```css
.search-result-item {
  display: flex;
  align-items: flex-start;  /* center -> flex-start (2줄이므로 상단 정렬) */
  gap: 8px;
  padding: 8px 12px;        /* 7px -> 8px (2줄 구조 여유 확보) */
  cursor: pointer;
  transition: background 0.1s;
}

.search-result-item:hover,
.search-result-item.active {
  background: rgba(96, 165, 250, 0.1);  /* 기존 유지 */
}
```

### 타입 뱃지

```css
.search-result-kind {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  flex-shrink: 0;
  /* 추가: 뱃지 배경 */
  padding: 2px 6px;
  border-radius: 3px;
  text-align: center;
  min-width: 34px;
  margin-top: 1px;  /* 상단 정렬 미세 보정 */
  line-height: 1.4;
}
```

배경색은 인라인 style로 동적 바인딩한다 (타입별 CSS 변수).

### 결과 본문 영역 (신규)

```css
.search-result-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
```

### 메인 라인 (신규)

```css
.search-result-main {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### 노드명 (기존 유지)

```css
.search-result-name {
  flex: 1;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

### 서브 정보 - IP/호스트 (기존 `.search-result-ip` 대체)

```css
.search-result-sub {
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--color-ip-text);
  white-space: nowrap;
  flex-shrink: 0;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

`font-family: var(--font-mono)` -- 스타일 가이드에 따라 기술 데이터(IP, 포트, 호스트)는 모노 폰트를 사용한다.
`max-width: 140px` -- 긴 IP/호스트가 노드명을 과도하게 압축하지 않도록 제한.

### 설명 라인 (신규)

```css
.search-result-desc {
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}
```

### 드롭다운 max-height 조정

2줄 구조로 각 아이템 높이가 늘어나므로, 최대 높이를 조정한다.

```css
.search-dropdown {
  /* 기존 유지 */
  list-style: none; margin: 4px 0 0; padding: 4px 0;
  background: rgba(15, 23, 42, 0.96); border: 1px solid var(--border-default);
  border-radius: 8px; backdrop-filter: blur(6px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  /* 변경: 280px -> 360px */
  max-height: 360px;
  overflow-y: auto;
}
```

---

## HTML 구조 (template)

```html
<li
  v-for="(node, i) in searchResults"
  :key="node.id"
  class="search-result-item"
  :class="{ active: i === searchActiveIndex }"
  @mousedown.prevent="navigateToNode(node)"
  @mouseenter="searchActiveIndex = i"
>
  <span
    class="search-result-kind"
    :style="{
      color: searchNodeColor(node),
      backgroundColor: searchNodeBgColor(node)
    }"
  >{{ searchNodeKindLabel(node) }}</span>
  <div class="search-result-body">
    <div class="search-result-main">
      <span class="search-result-name">{{ node.name }}</span>
      <span v-if="searchNodeSubInfo(node)" class="search-result-sub">
        {{ searchNodeSubInfo(node) }}
      </span>
    </div>
    <div v-if="searchNodeDescription(node)" class="search-result-desc">
      {{ searchNodeDescription(node) }}
    </div>
  </div>
</li>
```

---

## Script 추가 사항

### 새 함수: `searchNodeSubInfo()`

노드 타입별 핵심 서브 정보 1개를 반환한다.

```typescript
function searchNodeSubInfo(node: D3Node): string {
  if (!node.nodeKind || node.nodeKind === 'server') {
    return (node as any).internalIps?.[0] ?? ''
  }
  if (node.nodeKind === 'l7') return (node as any).ip ?? ''
  if (node.nodeKind === 'infra') {
    const host = (node as any).host ?? ''
    const port = (node as any).port ?? ''
    return port ? `${host}:${port}` : host
  }
  if (node.nodeKind === 'dns') return (node as any).recordValue ?? ''
  return ''
}
```

### 새 함수: `searchNodeDescription()`

```typescript
function searchNodeDescription(node: D3Node): string {
  return (node as any).description ?? ''
}
```

### 새 함수: `searchNodeBgColor()`

뱃지 배경색을 반환한다.

```typescript
function searchNodeBgColor(node: D3Node): string {
  if (node.nodeKind === 'l7') return cssVar('--node-l7-bg')
  if (node.nodeKind === 'infra') return cssVar('--node-infra-bg')
  if (node.nodeKind === 'external') return cssVar('--node-ext-bg')
  if (node.nodeKind === 'dns') return cssVar('--node-dns-bg')
  return cssVar('--node-srv-bg')
}
```

### 삭제: `searchNodeIp()`

`searchNodeSubInfo()`로 완전 대체된다.

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `client/src/components/GraphCanvas.vue` (template) | 검색 결과 아이템 2줄 구조 변경 |
| `client/src/components/GraphCanvas.vue` (script) | `searchNodeSubInfo`, `searchNodeDescription`, `searchNodeBgColor` 추가, `searchNodeIp` 삭제 |
| `client/src/components/GraphCanvas.vue` (style) | `.search-bar` 폭, `.search-result-item` 정렬, 신규 클래스 4개, `.search-result-ip` 삭제 |

---

## 피해야 할 것

- 검색어 하이라이트는 이번 단계에서 구현하지 않는다 (기획서에 미포함)
- 색상 하드코딩 금지 -- 모든 색상은 CSS 변수 사용
- 이모지 사용 금지
- 기존 키보드 탐색(위/아래/Enter/Escape) 로직 변경 금지
