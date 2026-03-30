# 검색 필터 자동완성 리스트 개선 기획서

## 개요

캔버스 상단 검색 바의 자동완성 드롭다운을 개선하여, 검색 결과 아이템에 서버명 외에 IP와 설명을 함께 표시하고, 드롭다운 가로 폭을 확장하여 정보 가독성을 높인다.

---

## 1단계: 현황 분석

### 현재 구조

**파일**: `client/src/components/GraphCanvas.vue`

**검색 바 HTML (line 452~495)**:
```html
<div class="search-bar">
  <div class="search-input-wrap">...</div>
  <ul class="search-dropdown">
    <li class="search-result-item">
      <span class="search-result-kind">SRV</span>     <!-- 노드 타입 라벨 -->
      <span class="search-result-name">{{ node.name }}</span>  <!-- 이름 -->
      <span class="search-result-ip">{{ searchNodeIp(node) }}</span> <!-- IP -->
    </li>
  </ul>
</div>
```

**현재 CSS**:
- `.search-bar`: `width: 280px` -- 가로 폭이 좁음
- `.search-result-item`: `display: flex; align-items: center; gap: 8px; padding: 7px 12px` -- 한 줄 레이아웃
- `.search-result-name`: `flex: 1` + ellipsis 처리
- `.search-result-ip`: `font-size: var(--text-xs); color: var(--text-disabled)` -- 오른쪽에 IP만 표시

**검색 로직 (line 1936~1947)**:
- `searchResults` computed: 이름, internalIps, natIps, ip, host로 필터링. 최대 8건.
- `searchNodeIp()`: internalIps + natIps + ip + host를 '/' 로 이어붙여 반환
- `searchNodeKindLabel()`: SRV / L7 / INFRA / EXT / DNS 반환
- `searchNodeColor()`: 노드 타입별 CSS 변수 색상 반환

### 문제점
1. 가로 폭 280px -- 이름이 길면 잘리고, IP/설명 공간 부족
2. description이 표시되지 않아 동일/유사 이름 노드 구분 불가
3. 한 줄 레이아웃으로 정보 밀도가 낮음

### 사용 가능한 데이터

`D3Node` = `AnyNode` (Server | L7Node | InfraNode | ExternalServiceNode | DnsNode)에 x/y 좌표 추가.

| 노드 타입 | 표시 가능 정보 |
|-----------|---------------|
| Server (SRV) | name, internalIps[0], description |
| L7Node | name, ip, description |
| InfraNode | name, host:port, description |
| ExternalServiceNode | name, description |
| DnsNode | name, recordValue, description |

---

## 2단계: 데이터 모델 & 로직 설계

### Store/타입 변경: 없음

기존 `D3Node` 타입과 `renderedNodes`에 이미 모든 필요한 데이터가 포함되어 있음.

### 새 함수 추가

```typescript
/** 검색 결과에 표시할 서브 정보 (IP 또는 host 등) */
function searchNodeSubInfo(node: D3Node): string {
  if (!node.nodeKind || node.nodeKind === 'server') {
    // Server: internalIps 첫 번째
    return (node as any).internalIps?.[0] ?? ''
  }
  if (node.nodeKind === 'l7') return (node as any).ip ?? ''
  if (node.nodeKind === 'infra') {
    const host = (node as any).host ?? ''
    const port = (node as any).port ?? ''
    return port ? `${host}:${port}` : host
  }
  if (node.nodeKind === 'dns') return (node as any).recordValue ?? ''
  // external: 서브 정보 없음
  return ''
}

/** 검색 결과에 표시할 설명 */
function searchNodeDescription(node: D3Node): string {
  return (node as any).description ?? ''
}
```

### 기존 함수 변경

- `searchNodeIp()`: **삭제** -- 새 `searchNodeSubInfo()`로 대체

---

## 3단계: UI/UX 스펙

### 변경 전 (한 줄)
```
+----------------------------------------------+
| [SRV] api-server           10.0.1.5          |
+----------------------------------------------+
```

### 변경 후 (2줄 구조)
```
+------------------------------------------------------+
| [SRV] api-server                        10.0.1.5     |
|       API 서버 - 메인 백엔드                          |
+------------------------------------------------------+
| [L7]  nginx-lb                          10.0.0.1     |
|       로드밸런서                                      |
+------------------------------------------------------+
| [EXT] AWS S3                                         |
|       오브젝트 스토리지                               |
+------------------------------------------------------+
```

### 컴포넌트 구조 변경

**검색 결과 아이템 HTML**:
```html
<li class="search-result-item">
  <span class="search-result-kind">SRV</span>
  <div class="search-result-body">
    <div class="search-result-main">
      <span class="search-result-name">{{ node.name }}</span>
      <span v-if="searchNodeSubInfo(node)" class="search-result-sub">{{ searchNodeSubInfo(node) }}</span>
    </div>
    <div v-if="searchNodeDescription(node)" class="search-result-desc">{{ searchNodeDescription(node) }}</div>
  </div>
</li>
```

### CSS 변경

| 셀렉터 | 변경 내용 |
|---------|----------|
| `.search-bar` | width: 280px -> 400px |
| `.search-result-item` | `align-items: center` -> `align-items: flex-start` (2줄이므로 상단 정렬) |
| `.search-result-kind` | `margin-top: 2px` 추가 (상단 정렬 보정) |
| `.search-result-body` | 새 클래스. `flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px` |
| `.search-result-main` | 새 클래스. `display: flex; align-items: center; gap: 8px` |
| `.search-result-name` | 기존 유지 |
| `.search-result-sub` | 기존 `.search-result-ip` 대체. 동일 스타일 + `color: var(--color-ip-text)` |
| `.search-result-desc` | 새 클래스. `font-size: var(--text-xs); color: var(--text-tertiary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap` |
| `.search-result-ip` | 삭제 |

### 디자이너에게 확인 필요한 항목
1. 드롭다운 가로 폭 400px이 적절한지 (캔버스 위에 떠있는 요소이므로 너무 넓으면 거슬릴 수 있음)
2. description 줄의 색상 (`--text-tertiary` vs `--text-disabled`)
3. sub info(IP 등)의 색상: `--color-ip-text`(#7dd3fc, 하늘색) vs `--text-disabled`(기존)

---

## 4단계: 수정 파일 체크리스트

| 파일 경로 | 작업 내용 |
|-----------|----------|
| client/src/components/GraphCanvas.vue | template: 검색 결과 아이템 2줄 구조로 변경 |
| client/src/components/GraphCanvas.vue | script: `searchNodeSubInfo()`, `searchNodeDescription()` 추가, `searchNodeIp()` 삭제 |
| client/src/components/GraphCanvas.vue | style: `.search-bar` 폭 확장, 새 CSS 클래스 추가, `.search-result-ip` 삭제 |

---

## 제약 조건

- **프론트엔드만 수정**. 백엔드/Prisma 변경 없음.
- 색상 하드코딩 금지 -- CSS 변수만 사용
- 이모지 사용 금지
- 기존 검색 필터링 로직(이름/IP 기반 검색) 변경 없음
- 기존 키보드 탐색(위/아래/Enter/Escape) 동작 유지
- 최대 표시 건수 8건 유지
