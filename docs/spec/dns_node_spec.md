# DNS 노드 추가 구현 기획서

## 개요

서버 의존성 관리 캔버스에 **DNS 노드** 타입을 추가한다. DNS는 서버/L7 앞단에서 도메인을 실제 엔드포인트로 연결하는 핵심 인프라이며, 장애 시 영향 범위 파악에 필수적이다.

---

## 1. 데이터 모델

### 1-1. 타입 정의 (`client/src/types/index.ts`)

```typescript
export interface DnsNode {
  id: string
  nodeKind: 'dns'
  name: string           // 도메인명 (예: api.example.com)
  dnsType: string        // A, CNAME, SRV, AAAA, TXT, MX
  recordValue?: string   // 레코드 값 (IP, 대상 도메인 등)
  ttl?: number           // TTL (초)
  provider?: string      // 관리 주체 (Route53, CloudFlare, 사내DNS, Gabia, etc.)
  description?: string
}
```

수정 사항:
- `AnyNode` union에 `DnsNode` 추가
- `GraphData.dnsNodes?: DnsNode[]` 추가
- `D3Node` union에 `DnsNode` 포함 확인

### 1-2. 서버 타입 (`server/src/types/index.ts`)

`GraphDataJson`에 `dnsNodes: unknown[]` 추가

---

## 2. Store (`client/src/stores/graph.ts`)

기존 Infra 노드와 동일한 CRUD 패턴을 따른다.

### State
```typescript
const dnsNodes = ref<DnsNode[]>([])
```

### Actions
- `addDnsNode(data: Omit<DnsNode, 'id'>): DnsNode` -- generateId() 사용
- `updateDnsNode(id: string, data: Partial<Omit<DnsNode, 'id'>>)`
- `deleteDnsNode(id: string)` -- 연관 dependency도 함께 제거

### 수정 필요한 기존 함수
- `applyGraphData()`: `dnsNodes` 로드
- `restoreSnapshot()`: `dnsNodes` 복원
- `saveSnapshot()`: `dnsNodes` 스냅샷 포함
- `findNodeById()`: dns 노드 탐색 추가
- `getImpactedNodes()`: dns 노드 포함
- `getCycleNodes()`: dns 노드 포함
- `mergeGraphData()`: `mergeNodeArrays(..., 'dns')` 호출 추가
- `resolveConflicts()`: `conflict.nodeType === 'dns'` 분기 추가
- `graphData` computed: `dnsNodes: dnsNodes.value` 포함
- 반환 객체에 `dnsNodes`, `addDnsNode`, `updateDnsNode`, `deleteDnsNode` 노출

---

## 3. Modal 컴포넌트 (`client/src/components/DnsModal.vue`)

### 신규 파일 생성

### Props & Emit
```typescript
defineProps<{ node?: DnsNode | null; takenNames: Set<string> }>()
defineEmits<{ close: []; submit: [data: Omit<DnsNode, 'id'>] }>()
```

### Form 필드

| 필드 | 라벨 | 컴포넌트 | 기본값 | 비고 |
|------|------|----------|--------|------|
| name | 도메인 | text input | '' | placeholder: "api.example.com" |
| dnsType | 레코드 타입 | CustomSelect | 'A' | 옵션: A, CNAME, AAAA, SRV, MX, TXT |
| recordValue | 레코드 값 | text input | '' | placeholder는 dnsType에 따라 변경 |
| ttl | TTL (초) | number input | 300 | |
| provider | DNS 관리 | CustomSelect | '' | 옵션: Route53, CloudFlare, Google Cloud DNS, 사내 DNS, Gabia, Other |
| description | 설명 | textarea | '' | |

### recordValue placeholder 규칙
- A: "192.168.1.1"
- CNAME: "origin.example.com"
- AAAA: "2001:db8::1"
- SRV: "0 5 5060 sip.example.com"
- MX: "10 mail.example.com"
- TXT: "v=spf1 include:..."

### 검증
- name 필수, 중복 불가 (takenNames 기반)
- name에 공백 포함 시 경고

### UI 패턴
기존 InfraModal.vue와 동일한 레이아웃/스타일 패턴을 따른다:
- backdrop + modal-card 구조
- CustomSelect, CustomCombobox 컴포넌트 재사용
- transition 애니메이션 동일

---

## 4. 캔버스 렌더링 (`client/src/components/GraphCanvas.vue`)

### 4-1. SVG 노드 디자인

기존 노드들은 가로 187 x 세로 74 크기의 둥근 사각형(rx=6)이며, 좌측 아이콘 영역 + 우측 텍스트 영역으로 분할된다. DNS 노드도 동일한 레이아웃을 따른다.

**좌측 아이콘 영역**:
- provider별 배지 표시 (getInfraIconInfo와 유사한 getDnsIconInfo 함수)
- 알려진 provider가 없으면 기본 DNS 아이콘 (지구본 모양 또는 "DNS" 텍스트)

**우측 텍스트 영역** (3행):
- 1행: 도메인명 (node.name) -- 볼드
- 2행: 레코드 타입 (node.dnsType) -- sub 스타일
- 3행: 레코드 값 (node.recordValue) -- meta 스타일

### 4-2. getDnsIconInfo 함수

```typescript
function getDnsIconInfo(provider?: string): { abbr: string; color: string; textColor: string; bgColor: string } | null {
  if (!provider) return null
  const p = provider.toLowerCase()
  if (p.includes('route53') || p.includes('aws'))      return { abbr: 'R53', color: '#8b5cf6', textColor: '#fff', bgColor: '#ede9fe' }
  if (p.includes('cloudflare'))                          return { abbr: 'CF',  color: '#f59e0b', textColor: '#fff', bgColor: '#fef3c7' }
  if (p.includes('google'))                              return { abbr: 'GC',  color: '#4285f4', textColor: '#fff', bgColor: '#dbeafe' }
  if (p.includes('gabia') || p.includes('가비아'))        return { abbr: 'GA',  color: '#2563eb', textColor: '#fff', bgColor: '#dbeafe' }
  return null // 기본 DNS 아이콘으로 폴백
}
```

### 4-3. 색상 체계 (CSS 변수)

```css
--node-dns-color: #8b5cf6;           /* 보라 계열 -- 네트워크/이름해석 느낌 */
--node-dns-bg: #1e1b4b;
--node-dns-bg-deep: #0f0a2e;
--node-dns-bg-light: #f5f3ff;
--node-dns-text: #a78bfa;
--node-dns-glow: rgba(139, 92, 246, 0.3);
```

### 4-4. 수정 필요 함수
- `nodeColor()`: `'dns'` 분기 추가
- `nodeStroke()`: `'dns'` 분기 추가
- `getNodeGlow()`: `url(#glow-purple)` 추가 (SVG defs에 glow 필터 추가 필요)
- 범례에 `.legend-dns` 항목 추가
- 기본 아이콘 (provider 미지정 시): 지구본 또는 "@" 형태의 간단한 SVG path

---

## 5. 의존성 규칙 (`client/src/components/DependencyModal.vue`, `GraphCanvas.vue`)

### 5-1. 연결 방향 제약

DNS 노드의 의존성 규칙:

| Source | Target | 허용 | 비고 |
|--------|--------|------|------|
| DNS | Server | O | 도메인이 서버를 가리킴 (A 레코드 등) |
| DNS | L7 | O | 도메인이 L7을 가리킴 |
| DNS | DNS | O | CNAME 체인 |
| DNS | Infra | X | DNS가 직접 DB를 가리키진 않음 |
| DNS | External | O | 외부 서비스 도메인 매핑 |
| Server | DNS | X | 서버가 DNS에 의존하는 방향은 부자연스러움 |
| L7 | DNS | X | 동일 |
| Infra | DNS | X | 동일 |
| External | DNS | X | 동일 |

구현: `isConnectionBlocked()`에 DNS 관련 규칙 추가, `DependencyModal.vue`의 `targetOptions` 필터링에도 반영

### 5-2. 기본 의존성 타입
DNS 노드가 target일 때: 해당 없음 (DNS가 target이 되는 케이스는 차단)
DNS 노드가 source일 때: `defaultTypeForTarget()`에서 target 종류에 따라 기존 로직 유지

---

## 6. 패널 연동

### 6-1. ServerPanel.vue

- `typeLabel()`: `'dns'` -> `'DNS'` 반환
- `subText()`: `[dnsType, provider].filter(Boolean).join(' . ')` 형식
- 필터 드롭다운에 DNS 체크박스 추가 (`.kf-dns` 스타일)
- 추가(+) 메뉴에 "DNS" 항목 추가
  - 아이콘: 지구본 SVG (간단한 원 + 가로/세로 선)
- Props에 `dnsNodes` 추가, `allItems` computed에 `...props.dnsNodes` 포함

### 6-2. ImpactPanel.vue

- `getNodeName()`: `'dns'` -> `'[DNS] '` 접두사
- `typeLabel()`: `'dns'` -> `'DNS'`
- 상세 정보 템플릿:
  ```html
  <template v-else-if="selectedNode.nodeKind === 'dns'">
    <p class="detail-row">레코드 타입: {{ selectedNode.dnsType || '-' }}</p>
    <p class="detail-row">레코드 값: {{ selectedNode.recordValue || '-' }}</p>
    <p class="detail-row">TTL: {{ selectedNode.ttl ? selectedNode.ttl + 's' : '-' }}</p>
    <p class="detail-row">관리: {{ selectedNode.provider || '-' }}</p>
  </template>
  ```

---

## 7. 충돌 처리 (`client/src/components/GraphConflictModal.vue`)

- `ConflictItem.nodeType` union에 `'dns'` 추가 (`client/src/stores/graph.ts`의 ConflictItem 인터페이스)
- `nodeTypeLabel()`: `dns: 'DNS'` 추가
- `FIELD_LABELS`: `dnsType: 'DNS 레코드 타입'`, `recordValue: '레코드 값'`, `ttl: 'TTL'`, `provider: 'DNS 관리'` 추가

---

## 8. ProjectView.vue 통합

```typescript
// State
const dnsModal = ref<{ visible: boolean; editing: DnsNode | null }>({ visible: false, editing: null })

// Open/Close
function openAddDnsModal() { dnsModal.value = { visible: true, editing: null } }
function openEditDnsModal(n: DnsNode) { dnsModal.value = { visible: true, editing: n } }

// Submit
function onDnsModalSubmit(data: Omit<DnsNode, 'id'>) {
  if (dnsModal.value.editing) store.updateDnsNode(dnsModal.value.editing.id, data)
  else store.addDnsNode(data)
  dnsModal.value.visible = false
}

// Delete (onDeleteNode 함수에 추가)
else if (node.nodeKind === 'dns') store.deleteDnsNode(node.id)

// Edit (onEditNode 함수에 추가)
else if (node.nodeKind === 'dns') openEditDnsModal(node as DnsNode)

// Canvas 노드 추가 핸들러
else if (nodeKind === 'dns') openAddDnsModal()
```

Template에 `<DnsModal>` 추가, ServerPanel에 `:dns-nodes` prop과 `@add-dns` emit 연결

---

## 9. 샘플 데이터 (`client/src/data/sampleData.ts`)

```typescript
dnsNodes: [
  {
    id: 'sample-dns1',
    nodeKind: 'dns',
    name: 'api.example.com',
    dnsType: 'A',
    recordValue: '10.0.1.100',
    ttl: 300,
    provider: 'Route53',
    description: 'API 도메인'
  },
  {
    id: 'sample-dns2',
    nodeKind: 'dns',
    name: 'www.example.com',
    dnsType: 'CNAME',
    recordValue: 'cdn.example.com',
    ttl: 3600,
    provider: 'CloudFlare',
    description: '웹 프론트 도메인'
  },
],
```

샘플 의존성 추가:
```typescript
{ id: 'sample-dep-dns1', source: 'sample-dns1', target: 'sample-l1', type: 'dns', description: 'API 도메인 -> L7' },
{ id: 'sample-dep-dns2', source: 'sample-dns2', target: 'sample-s1', type: 'dns', description: '웹 도메인 -> 웹서버' },
```

---

## 10. CSS (`client/src/style.css`)

DNS 노드용 CSS 변수 6종 추가 (4-3 참조), 범례/뱃지/필터 스타일 추가:

```css
.legend-dns  { background: var(--node-dns-color); }
.type-badge.dns { background: var(--node-dns-bg); color: var(--node-dns-text); }
.kf-dns { color: var(--node-dns-color); }
.kind-dns { border-left-color: var(--node-dns-color); }
```

---

## 11. 수정 파일 체크리스트

| # | 파일 | 작업 |
|---|------|------|
| 1 | `client/src/types/index.ts` | DnsNode 인터페이스, AnyNode/GraphData 확장 |
| 2 | `client/src/stores/graph.ts` | state, CRUD, merge, conflict, computed 전부 |
| 3 | `client/src/components/DnsModal.vue` | **신규 생성** |
| 4 | `client/src/components/GraphCanvas.vue` | SVG 렌더링, 색상, glow, 범례, getDnsIconInfo |
| 5 | `client/src/components/ServerPanel.vue` | 필터, 라벨, 메뉴, subText |
| 6 | `client/src/components/ImpactPanel.vue` | 상세 정보, 접두사, 라벨 |
| 7 | `client/src/components/DependencyModal.vue` | 노드 라벨, 연결 제약, target 필터 |
| 8 | `client/src/components/GraphConflictModal.vue` | 필드 라벨, 노드타입 라벨 |
| 9 | `client/src/views/ProjectView.vue` | Modal 통합, 이벤트 핸들러 |
| 10 | `client/src/data/sampleData.ts` | 샘플 DNS 노드 + 의존성 |
| 11 | `client/src/style.css` | CSS 변수 6종, 뱃지/범례/필터 스타일 |
| 12 | `server/src/types/index.ts` | GraphDataJson에 dnsNodes 추가 |

---

## 12. 주의사항

- 이모지 사용 금지 (CLAUDE.md 규칙)
- 모든 색상은 CSS 변수로 정의하고 `var(--)`로 참조 (하드코딩 금지)
- JS/TS에서 CSS 색상이 필요하면 `getComputedStyle`로 읽거나 기존 `cssVar()` 헬퍼 사용
- 기존 InfraNode 구현 패턴을 최대한 따를 것 (일관성 유지)
- `nodeKind` 값은 반드시 `'dns'`로 통일
- ConflictItem의 `nodeType` union도 `'dns'` 추가 필수
