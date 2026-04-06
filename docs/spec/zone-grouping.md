# Zone (시각적 그룹핑) 구현 기획서

캔버스에서 노드를 시각적으로 묶어 인프라 토폴로지의 논리적 영역(VPC, 데이터센터, 환경 등)을 표현하는 Zone 기능을 추가한다. MVP 범위는 시각적 그룹핑과 그룹 드래그만 포함하며, 접기(collapse)나 Zone 단위 일괄 삭제 등 고급 기능은 제외한다.

---

## 1. 현황 분석

### 1.1 현재 그래프 데이터 구조

`GraphData` 인터페이스(`client/src/types/index.ts`)는 5종 노드 배열과 의존성 배열로 구성된다.

```typescript
interface GraphData {
  servers: Server[]
  l7Nodes?: L7Node[]
  infraNodes?: InfraNode[]
  externalNodes?: ExternalServiceNode[]
  dnsNodes?: DnsNode[]
  dependencies: Dependency[]
}
```

서버측 `GraphDataJson`(`server/src/types/index.ts`)은 동일 구조를 `unknown[]`로 정의한다. `zones` 필드는 현재 없다.

### 1.2 관련 기존 패턴

| 패턴 | 참조 위치 | 설명 |
|------|-----------|------|
| L7 그룹 시각 영역 | `GraphCanvas.vue:1340` `l7GroupHulls` computed | 멤버 노드들의 convex hull을 계산해 반투명 배경+테두리로 렌더링. Zone도 유사한 레이어에 그려짐 |
| 노드 CRUD 패턴 | `graph.ts:399~489` | `addXxx / updateXxx / deleteXxx` + `saveSnapshot()` + 배열 push/filter 패턴 |
| 위치 저장 | `GraphCanvas.vue:943` `savePositions()` | `renderedNodes`에서 `{id: {x,y}}` 맵 생성 후 store에 저장 |
| 더블클릭 메뉴 | `GraphCanvas.vue:1038` `onCanvasDblClick` | 빈 영역 더블클릭 시 `addNodeMenu` 팝업 |
| 캔버스 우클릭 메뉴 | `GraphCanvas.vue:1052` `onCanvasContextMenu` | 서브메뉴 포함 컨텍스트 메뉴 |
| 다중 선택 드래그 | `GraphCanvas.vue:1655` `startNodeDrag` | `multiSelectedIds` 기반 그룹 드래그 |
| 충돌 병합 | `graph.ts:131` `mergeGraphData` | 노드 타입별 3-way 머지 |
| 미니맵 | `GraphCanvas.vue:1992` `minimapNodes` | 노드를 점으로 표시 |

### 1.3 현재 문제점

- 논리적 그룹 표현 수단이 L7 멤버 관계뿐이라 VPC/서브넷/환경 등 범용 그룹핑이 불가능
- L7 그룹은 데이터 모델상의 관계이고, 순수 시각적 그룹핑은 지원하지 않음
- 노드가 많아질수록 토폴로지 가독성이 급격히 저하됨

---

## 2. 데이터 모델 & 로직 설계

### 2.1 Zone 타입 정의

`client/src/types/index.ts`에 추가:

```typescript
export interface Zone {
  id: string
  name: string
  color: ZoneColor
  description?: string
  nodeIds: string[]      // 소속 노드 ID 목록
}

export type ZoneColor = 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'cyan'
```

### 2.2 GraphData 확장

`client/src/types/index.ts`의 `GraphData` 인터페이스 수정:

```typescript
export interface GraphData {
  servers: Server[]
  l7Nodes?: L7Node[]
  infraNodes?: InfraNode[]
  externalNodes?: ExternalServiceNode[]
  dnsNodes?: DnsNode[]
  dependencies: Dependency[]
  zones?: Zone[]    // 신규 추가 (optional로 하위 호환성 보장)
}
```

`server/src/types/index.ts`의 `GraphDataJson` 수정:

```typescript
export interface GraphDataJson {
  servers: unknown[]
  l7Nodes: unknown[]
  infraNodes: unknown[]
  externalNodes: unknown[]
  dnsNodes: unknown[]
  dependencies: unknown[]
  zones: unknown[]     // 신규 추가
}
```

### 2.3 Zone 위치/크기 저장

Zone 자체의 위치는 별도 저장하지 않는다. Zone의 bounds는 소속 노드 위치로부터 매 프레임 계산(auto-fit)하므로, 기존 `PositionMap`(노드별 `{x, y}`)만으로 충분하다.

Zone에 노드가 0개인 경우(생성 직후 등)에는 생성 시점의 좌표를 임시로 사용해야 하므로, `PositionMap`에 Zone ID도 기록한다.

```typescript
// 기존 PositionMap = Record<string, { x: number; y: number }>
// Zone ID도 같은 맵에 저장 (빈 Zone의 중심 좌표)
```

### 2.4 Store 변경사항 (`graph.ts`)

#### State 추가

```typescript
const zones = ref<Zone[]>([])
```

#### CRUD Actions

```typescript
// --- Zone CRUD ---
function addZone(data: Omit<Zone, 'id'>): Zone {
  saveSnapshot()
  const z: Zone = { ...data, id: generateId() }
  zones.value.push(z)
  return z
}

function updateZone(id: string, data: Partial<Omit<Zone, 'id'>>) {
  saveSnapshot()
  const idx = zones.value.findIndex(z => z.id === id)
  if (idx !== -1) Object.assign(zones.value[idx], data)
}

function deleteZone(id: string) {
  saveSnapshot()
  zones.value = zones.value.filter(z => z.id !== id)
}

function addNodeToZone(zoneId: string, nodeId: string) {
  // 중첩 불가: 다른 Zone에서 먼저 제거
  for (const z of zones.value) {
    z.nodeIds = z.nodeIds.filter(nid => nid !== nodeId)
  }
  const zone = zones.value.find(z => z.id === zoneId)
  if (zone && !zone.nodeIds.includes(nodeId)) {
    zone.nodeIds.push(nodeId)
  }
}

function removeNodeFromZone(nodeId: string) {
  for (const z of zones.value) {
    z.nodeIds = z.nodeIds.filter(nid => nid !== nodeId)
  }
}

function getZoneByNodeId(nodeId: string): Zone | undefined {
  return zones.value.find(z => z.nodeIds.includes(nodeId))
}
```

#### 기존 함수 수정 목록

| 함수 | 변경 내용 |
|------|-----------|
| `currentSnapshot()` (line 196) | `data` 객체에 `zones` 포함 |
| `currentGraphData()` (line 210) | `zones` 포함 |
| `restoreSnapshot(snap)` (line 228) | `zones.value = snap.data.zones ?? []` 추가 |
| `applyGraphData(data)` (line 239) | `zones.value = data.zones ?? []` 추가 |
| `setProject(projectId)` (line 371) | `zones.value = (graphData as GraphData).zones ?? []` 추가 |
| `loadData(data)` (line 754) | `zones.value = data.zones ?? []` 추가 |
| `importJSON(file)` (line 764) | `zones.value = data.zones ?? []` 추가 |
| `exportJSON()` (line 741) | data 객체에 `zones` 포함 |
| `resetGraph()` (line 791) | `zones.value = []` 추가 |
| `deleteServer(id)` (line 410) | `removeNodeFromZone(id)` 호출 추가 |
| `deleteL7Node(id)` (line 431) | `removeNodeFromZone(id)` 호출 추가 |
| `deleteInfraNode(id)` (line 449) | `removeNodeFromZone(id)` 호출 추가 |
| `deleteExternalNode(id)` (line 467) | `removeNodeFromZone(id)` 호출 추가 |
| `deleteDnsNode(id)` (line 485) | `removeNodeFromZone(id)` 호출 추가 |
| `duplicateNodes(nodeIds)` (line 804) | 복제 노드의 Zone 소속은 복사하지 않음 (명시적 제외) |
| `mergeGraphData(base, mine, server)` (line 131) | zones 배열 머지 추가 |
| `baseSnapshot` 초기값 (line 182) | `zones: []` 추가 |
| return 객체 (line 894) | `zones`, `addZone`, `updateZone`, `deleteZone`, `addNodeToZone`, `removeNodeFromZone`, `getZoneByNodeId` 추가 |

#### ConflictItem 타입 확장

`ConflictItem.nodeType`에 `'zone'` 추가:

```typescript
export interface ConflictItem {
  id: string
  nodeType: 'server' | 'l7' | 'infra' | 'external' | 'dns' | 'dependency' | 'zone'
  label: string
  mine: unknown | null
  server: unknown | null
}
```

`mergeGraphData` 함수에 zones 머지 추가:

```typescript
const zones = mergeNodeArrays(
  asNL(base.zones ?? []),
  asNL(mine.zones ?? []),
  asNL(server.zones ?? []),
  'zone'
)
// merged 객체에 zones: cast<Zone>(zones.result) 추가
// conflicts에 ...zones.conflicts 추가
```

### 2.5 서버측 변경

**백엔드 코드 변경 불필요.** Zone 데이터는 `GraphData.data` JSON 필드 안에 `zones` 배열로 포함되므로, Prisma 스키마나 서버 서비스에 구조적 변경이 필요 없다. Zone에는 암호화 대상 민감 데이터가 없으므로 `encryptGraphData`/`decryptGraphData`도 수정 불필요하다.

단, `server/src/types/index.ts`의 `GraphDataJson`에 `zones: unknown[]`를 추가하여 타입 정합성을 맞춘다. `getGraph` 함수(line 112)의 기본 반환값에 `zones: []` 추가.

### 2.6 하위 호환성

- `zones` 필드는 optional(`zones?: Zone[]`)로 정의
- 기존 데이터에 `zones`가 없으면 `?? []`로 빈 배열 처리
- 서버에서 zones가 없는 JSON을 받아도 클라이언트가 정상 동작

---

## 3. UI/UX 스펙

### 3.1 Zone 색상 프리셋

| ZoneColor | CSS 변수명 (배경) | 값 | CSS 변수명 (테두리) | 값 | 라벨 텍스트 |
|-----------|-------------------|-----|---------------------|-----|-------------|
| `blue` | `--zone-blue-bg` | `rgba(59, 130, 246, 0.08)` | `--zone-blue-border` | `rgba(59, 130, 246, 0.35)` | `--zone-blue-text`: `#93b4f5` |
| `green` | `--zone-green-bg` | `rgba(34, 197, 94, 0.08)` | `--zone-green-border` | `rgba(34, 197, 94, 0.35)` | `--zone-green-text`: `#86efac` |
| `purple` | `--zone-purple-bg` | `rgba(168, 85, 247, 0.08)` | `--zone-purple-border` | `rgba(168, 85, 247, 0.35)` | `--zone-purple-text`: `#d8b4fe` |
| `orange` | `--zone-orange-bg` | `rgba(249, 115, 22, 0.08)` | `--zone-orange-border` | `rgba(249, 115, 22, 0.35)` | `--zone-orange-text`: `#fdba74` |
| `pink` | `--zone-pink-bg` | `rgba(236, 72, 153, 0.08)` | `--zone-pink-border` | `rgba(236, 72, 153, 0.35)` | `--zone-pink-text`: `#f9a8d4` |
| `cyan` | `--zone-cyan-bg` | `rgba(6, 182, 212, 0.08)` | `--zone-cyan-border` | `rgba(6, 182, 212, 0.35)` | `--zone-cyan-text`: `#67e8f9` |

### 3.2 Zone 렌더링 (SVG)

Zone은 SVG `<g>` 안에 `<rect>` + `<text>` + 리사이즈 핸들 없이(auto-fit) 렌더링된다. L7 그룹 hull보다 먼저(뒤에), 의존성 링크보다 먼저 렌더링하여 가장 아래 레이어에 위치한다.

#### 렌더링 순서 (gRef 내부)

```
1. 그리드 배경
2. 중심점 마커
3. *** Zone 영역 (신규) ***
4. L7 그룹 hull
5. L7 멤버 연결선
6. 의존성 링크
7. 드래그 프리뷰
8. 박스 선택
9. Copy ghosts
10. 노드
```

#### Zone Bounds 계산 (computed)

```typescript
interface ZoneRect {
  id: string
  name: string
  color: ZoneColor
  x: number        // 좌상단 x
  y: number        // 좌상단 y
  width: number
  height: number
  isEmpty: boolean  // 노드 0개 여부
}

const ZONE_PADDING = 40     // 노드 주변 여백
const ZONE_HEADER_H = 32    // 상단 라벨 영역 높이
const ZONE_MIN_W = 220      // 최소 너비
const ZONE_MIN_H = 120      // 최소 높이 (헤더 포함)
const NODE_HALF_W = 93.5    // 노드 rect 절반 너비 (187/2)
const NODE_HALF_H = 37      // 노드 rect 절반 높이

// computed zoneRects
const zoneRects = computed<ZoneRect[]>(() => {
  const nodeMap = new Map(renderedNodes.value.map(n => [n.id, n]))
  const positions = graphStore.getPositions()
  return graphStore.zones.map(zone => {
    const members = zone.nodeIds
      .map(nid => nodeMap.get(nid))
      .filter((n): n is D3Node => !!n)

    if (members.length === 0) {
      // 빈 Zone: positions에서 중심 좌표 사용
      const pos = positions[zone.id] ?? { x: 0, y: 0 }
      return {
        id: zone.id, name: zone.name, color: zone.color,
        x: pos.x - ZONE_MIN_W / 2, y: pos.y - ZONE_MIN_H / 2,
        width: ZONE_MIN_W, height: ZONE_MIN_H, isEmpty: true,
      }
    }

    const minX = Math.min(...members.map(n => (n.x ?? 0) - NODE_HALF_W))
    const maxX = Math.max(...members.map(n => (n.x ?? 0) + NODE_HALF_W))
    const minY = Math.min(...members.map(n => (n.y ?? 0) - NODE_HALF_H))
    const maxY = Math.max(...members.map(n => (n.y ?? 0) + NODE_HALF_H))

    return {
      id: zone.id, name: zone.name, color: zone.color,
      x: minX - ZONE_PADDING,
      y: minY - ZONE_PADDING - ZONE_HEADER_H,
      width: Math.max(maxX - minX + ZONE_PADDING * 2, ZONE_MIN_W),
      height: Math.max(maxY - minY + ZONE_PADDING * 2 + ZONE_HEADER_H, ZONE_MIN_H),
      isEmpty: false,
    }
  })
})
```

#### SVG 템플릿

```html
<!-- Zone 영역 (그리드 배경 아래, L7 hull 위) -->
<g v-for="zone in zoneRects" :key="'zone-' + zone.id"
  :opacity="(pathMode || pathNodes.size > 0) ? 0.15 : 1"
>
  <!-- 배경 -->
  <rect
    :x="zone.x" :y="zone.y"
    :width="zone.width" :height="zone.height"
    rx="8"
    :fill="cssVar(`--zone-${zone.color}-bg`)"
    :stroke="cssVar(`--zone-${zone.color}-border`)"
    stroke-width="1.5"
    stroke-dasharray="6,3"
  />
  <!-- 헤더 바 (드래그 핸들) -->
  <rect
    :x="zone.x" :y="zone.y"
    :width="zone.width" :height="ZONE_HEADER_H"
    rx="8"
    :fill="cssVar(`--zone-${zone.color}-bg`)"
    style="cursor: grab"
    @mousedown.stop="onZoneHeaderMouseDown($event, zone)"
    @dblclick.stop="onZoneNameDblClick(zone)"
    @contextmenu.prevent.stop="onZoneContextMenu($event, zone)"
  />
  <!-- 하단 모서리 각을 직각으로 만들기 위한 덮개 -->
  <rect
    :x="zone.x" :y="zone.y + ZONE_HEADER_H - 8"
    :width="zone.width" :height="8"
    :fill="cssVar(`--zone-${zone.color}-bg`)"
    pointer-events="none"
  />
  <!-- 구분선 -->
  <line
    :x1="zone.x" :y1="zone.y + ZONE_HEADER_H"
    :x2="zone.x + zone.width" :y2="zone.y + ZONE_HEADER_H"
    :stroke="cssVar(`--zone-${zone.color}-border`)"
    stroke-width="0.8"
    pointer-events="none"
  />
  <!-- Zone 이름 라벨 -->
  <text
    :x="zone.x + 14" :y="zone.y + ZONE_HEADER_H / 2 + 1"
    dominant-baseline="central"
    :fill="cssVar(`--zone-${zone.color}-text`)"
    :font-size="cssVar('--text-sm')"
    font-weight="600"
    :font-family="cssVar('--font-sans')"
    pointer-events="none"
  >{{ zone.name }}</text>
  <!-- 빈 Zone 안내 텍스트 -->
  <text v-if="zone.isEmpty && !readOnly"
    :x="zone.x + zone.width / 2"
    :y="zone.y + zone.height / 2 + ZONE_HEADER_H / 2"
    text-anchor="middle"
    dominant-baseline="central"
    :fill="cssVar('--text-disabled')"
    :font-size="cssVar('--text-xs')"
    pointer-events="none"
  >{{ t('graph.zone.emptyHint') }}</text>
</g>
```

### 3.3 와이어프레임

```
+============================================================+
|  [Graph Canvas]                                             |
|                                                             |
|  +--- Zone "Production VPC" (blue) ---------------------+  |
|  | Production VPC                                        |  |
|  |------------------------------------------------------|  |
|  |                                                       |  |
|  |  +----------+   +----------+   +-----------+         |  |
|  |  | Server A |-->| Server B |-->| Redis     |         |  |
|  |  +----------+   +----------+   +-----------+         |  |
|  |                                                       |  |
|  +-------------------------------------------------------+  |
|                           |                                  |
|                           v (의존성 화살표: Zone을 넘어감)   |
|  +--- Zone "Staging" (green) ---------------------------+   |
|  | Staging                                               |   |
|  |-------------------------------------------------------|  |
|  |                                                        |  |
|  |  +----------+   +----------+                           |  |
|  |  | Server C |   | DB Stage |                           |  |
|  |  +----------+   +----------+                           |  |
|  |                                                        |  |
|  +--------------------------------------------------------+  |
|                                                              |
|                +----------+  (Zone 미소속 노드)              |
|                | External |                                  |
|                +----------+                                  |
|                                                              |
|  [Minimap]                                                   |
+==============================================================+
```

### 3.4 Zone 헤더 드래그 (그룹 이동)

Zone 헤더 영역을 드래그하면 소속 노드 전체가 함께 이동한다. 기존 다중 선택 드래그(`startNodeDrag` line 1655)의 패턴을 참조한다.

```typescript
function onZoneHeaderMouseDown(event: MouseEvent, zone: ZoneRect) {
  if (props.readOnly) return
  event.preventDefault()
  graphStore.saveSnapshot()
  const startWorld = getSvgPoint(event)
  const zoneData = graphStore.zones.find(z => z.id === zone.id)
  if (!zoneData) return

  const memberNodes = renderedNodes.value.filter(n => zoneData.nodeIds.includes(n.id))
  const startPositions = new Map(memberNodes.map(n => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]))

  // fix 모든 멤버
  memberNodes.forEach(n => { n.fx = n.x ?? 0; n.fy = n.y ?? 0 })
  simulation?.alphaTarget(0.3).restart()

  const handleMove = (e: MouseEvent) => {
    const { x, y } = getSvgPoint(e)
    const dx = x - startWorld.x
    const dy = y - startWorld.y
    memberNodes.forEach(n => {
      const sp = startPositions.get(n.id)!
      n.fx = sp.x + dx; n.fy = sp.y + dy
      n.x = n.fx; n.y = n.fy
    })
    renderedNodes.value = [...renderedNodes.value]
  }

  const handleUp = () => {
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
    simulation?.alphaTarget(0)
    savePositions()
  }

  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleUp)
}
```

### 3.5 노드의 Zone 소속 자동 판정

노드 드래그 종료(`handleUp` in `startNodeDrag`) 시 노드의 최종 위치가 어떤 Zone rect 내부인지 판정하여 자동 소속시킨다.

```typescript
function resolveNodeZone(nodeId: string) {
  const node = renderedNodes.value.find(n => n.id === nodeId)
  if (!node) return
  const nx = node.x ?? 0
  const ny = node.y ?? 0

  for (const zone of zoneRects.value) {
    // 노드 중심이 Zone 내부(헤더 아래)에 있으면 소속
    if (nx >= zone.x + NODE_HALF_W &&
        nx <= zone.x + zone.width - NODE_HALF_W &&
        ny >= zone.y + ZONE_HEADER_H &&
        ny <= zone.y + zone.height) {
      graphStore.addNodeToZone(zone.id, nodeId)
      return
    }
  }
  // 어느 Zone에도 속하지 않으면 해제
  graphStore.removeNodeFromZone(nodeId)
}
```

기존 `startNodeDrag`의 `handleUp` 콜백과 다중 드래그의 `handleUp` 콜백에 `resolveNodeZone` 호출을 추가한다. 단, Zone 드래그(`onZoneHeaderMouseDown`)의 `handleUp`에서는 호출하지 않는다(이미 소속된 노드를 이동하는 것이므로).

### 3.6 Zone 생성 UI

#### 더블클릭 메뉴 확장

기존 `addNodeMenu`(line 706)에 Zone 추가 버튼을 맨 아래에 추가한다.

```html
<div class="add-node-menu-divider"></div>
<button @click="onAddZoneMenuSelect()">
  <svg class="menu-icon" viewBox="0 0 11 11" fill="none">
    <rect x="0.5" y="0.5" width="10" height="10" rx="2" stroke="currentColor" stroke-width="0.9" stroke-dasharray="2,1.5"/>
  </svg>
  {{ t('graph.zone.addZone') }}
</button>
```

#### 캔버스 우클릭 메뉴 확장

기존 `canvasContextMenu`(line 783)에 "Zone 추가" 항목을 "노드 추가" 서브메뉴 아래에 추가한다.

```html
<button @click="onCanvasAddZone()">
  <svg class="menu-icon" viewBox="0 0 11 11" fill="none">
    <rect x="0.5" y="0.5" width="10" height="10" rx="2" stroke="currentColor" stroke-width="0.9" stroke-dasharray="2,1.5"/>
  </svg>
  {{ t('graph.zone.addZone') }}
</button>
```

#### Zone 생성 핸들러

```typescript
function onAddZoneMenuSelect() {
  addNodeMenu.value.visible = false
  const pos = pendingNodePosition ?? { x: 0, y: 0 }
  const zone = graphStore.addZone({
    name: t('graph.zone.defaultName'),
    color: 'blue',
    nodeIds: [],
  })
  // 빈 Zone의 중심 좌표 저장
  const positions = { ...graphStore.getPositions(), [zone.id]: pos }
  graphStore.savePositions(positions)
}

function onCanvasAddZone() {
  canvasContextMenu.value.visible = false
  const pos = pendingNodePosition ?? { x: 0, y: 0 }
  const zone = graphStore.addZone({
    name: t('graph.zone.defaultName'),
    color: 'blue',
    nodeIds: [],
  })
  const positions = { ...graphStore.getPositions(), [zone.id]: pos }
  graphStore.savePositions(positions)
}
```

### 3.7 Zone 편집 (더블클릭)

Zone 헤더를 더블클릭하면 인라인 편집 모드에 진입한다. SVG `<foreignObject>`로 `<input>` 삽입.

```typescript
const editingZoneId = ref<string | null>(null)
const editingZoneName = ref('')

function onZoneNameDblClick(zone: ZoneRect) {
  if (props.readOnly) return
  editingZoneId.value = zone.id
  editingZoneName.value = zone.name
}

function commitZoneNameEdit() {
  if (editingZoneId.value && editingZoneName.value.trim()) {
    graphStore.updateZone(editingZoneId.value, { name: editingZoneName.value.trim() })
  }
  editingZoneId.value = null
}
```

SVG 인라인 편집 요소:

```html
<foreignObject v-if="editingZoneId === zone.id"
  :x="zone.x + 8" :y="zone.y + 4"
  :width="zone.width - 16" :height="ZONE_HEADER_H - 8">
  <input
    class="zone-name-input"
    v-model="editingZoneName"
    @blur="commitZoneNameEdit"
    @keydown.enter="commitZoneNameEdit"
    @keydown.escape="editingZoneId = null"
    autofocus
  />
</foreignObject>
```

### 3.8 Zone 우클릭 컨텍스트 메뉴

Zone 전용 컨텍스트 메뉴를 추가한다.

```typescript
const zoneContextMenu = ref({
  visible: false, x: 0, y: 0, zoneId: null as string | null
})

function onZoneContextMenu(event: MouseEvent, zone: ZoneRect) {
  zoneContextMenu.value = {
    visible: true, x: event.offsetX, y: event.offsetY, zoneId: zone.id
  }
}
```

메뉴 항목:
- 이름 변경 (인라인 편집 트리거)
- 색상 변경 (프리셋 6색 서브메뉴)
- 삭제 (확인 없이 즉시 삭제, 내부 노드는 유지)

```html
<div v-if="zoneContextMenu.visible" class="context-menu"
  :style="{ left: zoneContextMenu.x + 'px', top: zoneContextMenu.y + 'px' }" @click.stop>
  <button @click="onZoneRename">{{ t('graph.zone.rename') }}</button>
  <div class="submenu-item" @mouseenter="zoneContextMenu.activeSubmenu = 'color'" @mouseleave="zoneContextMenu.activeSubmenu = null">
    <span>{{ t('graph.zone.changeColor') }}</span>
    <span class="submenu-arrow">&#9654;</span>
    <div v-if="zoneContextMenu.activeSubmenu === 'color'" class="submenu zone-color-submenu">
      <button v-for="c in zoneColorPresets" :key="c"
        @click="onZoneChangeColor(c)"
        class="zone-color-option">
        <span class="zone-color-swatch" :style="{ background: cssVar(`--zone-${c}-border`) }"></span>
        {{ t(`graph.zone.colors.${c}`) }}
      </button>
    </div>
  </div>
  <div class="context-divider"></div>
  <button class="danger" @click="onZoneDelete">{{ t('common.delete') }}</button>
</div>
```

### 3.9 미니맵에 Zone 표시

`minimapNodes` computed 아래에 `minimapZones` computed를 추가하여 미니맵에 반투명 사각형으로 Zone을 표시한다.

```typescript
const minimapZones = computed(() => {
  const layout = minimapLayout.value
  if (!layout) return []
  return zoneRects.value.map(zone => ({
    ...zone,
    mx: layout.cx + zone.x * layout.scale,
    my: layout.cy + zone.y * layout.scale,
    mw: zone.width * layout.scale,
    mh: zone.height * layout.scale,
  }))
})
```

미니맵 SVG에 노드 점 앞에 추가:

```html
<!-- Zone 영역 -->
<rect v-for="mz in minimapZones" :key="'mz-' + mz.id"
  :x="mz.mx" :y="mz.my" :width="mz.mw" :height="mz.mh"
  rx="1"
  :fill="cssVar(`--zone-${mz.color}-bg`)"
  :stroke="cssVar(`--zone-${mz.color}-border`)"
  stroke-width="0.5"
  opacity="0.6"
/>
```

### 3.10 기존 기능 영향도

| 기능 | 영향 | 처리 |
|------|------|------|
| 의존성 화살표 | 영향 없음 | Zone 경계와 무관하게 정상 렌더링 |
| Shift+드래그 복사 | Zone 소속 복사하지 않음 | `duplicateNodes`에서 zones 처리 제외 |
| 다중 선택 삭제 | 삭제된 노드의 Zone 소속 자동 해제 | 각 `deleteXxx` 함수에서 `removeNodeFromZone` 호출 |
| CSV Import | Zone 미지원 (기존 데이터로 로드) | `loadData`에서 `zones ?? []` 처리 |
| Terraform Import | Zone 미지원 | 동일 |
| 영향도 분석 | 영향 없음 | Zone은 노드 관계에 영향 없음 |
| 경로 탐색 | 영향 없음 | 동일 |
| 경로/영향도 모드 | Zone 투명도 낮춤 | `opacity` 바인딩에 pathMode 조건 적용 (0.15) |
| Force simulation | 영향 없음 | Zone 경계에 constraint 걸지 않음 |
| 낙관적 잠금 충돌 | Zone 머지 추가 | `mergeGraphData`에 zones 머지 추가 |
| JSON Export/Import | zones 포함 | `exportJSON`, `importJSON` 수정 |

### 3.11 인터랙션 정리

| 동작 | 트리거 | 결과 |
|------|--------|------|
| Zone 생성 | 캔버스 빈 영역 더블클릭 > "Zone 추가" / 우클릭 > "Zone 추가" | 기본 이름+blue 색상의 빈 Zone 생성 |
| Zone 이름 수정 | Zone 헤더 더블클릭 | 인라인 input으로 편집 |
| Zone 이동 | Zone 헤더 드래그 | 소속 노드 전체 이동 |
| Zone 색상 변경 | Zone 우클릭 > 색상 변경 > 프리셋 선택 | 즉시 반영 |
| Zone 삭제 | Zone 우클릭 > 삭제 | Zone 제거, 노드는 유지 |
| 노드 -> Zone 소속 | 노드를 Zone 영역 위에 드래그 후 놓기 | 자동 소속 (다른 Zone에서 제거) |
| 노드 -> Zone 해제 | 노드를 Zone 밖으로 드래그 후 놓기 | 자동 해제 |

---

## 4. i18n 키

### ko

```typescript
graph: {
  zone: {
    addZone: 'Zone 추가',
    defaultName: '새 Zone',
    rename: '이름 변경',
    changeColor: '색상 변경',
    emptyHint: '노드를 여기로 드래그하세요',
    colors: {
      blue: '파랑',
      green: '초록',
      purple: '보라',
      orange: '주황',
      pink: '분홍',
      cyan: '청록',
    },
  },
}
```

### en

```typescript
graph: {
  zone: {
    addZone: 'Add Zone',
    defaultName: 'New Zone',
    rename: 'Rename',
    changeColor: 'Change Color',
    emptyHint: 'Drag nodes here',
    colors: {
      blue: 'Blue',
      green: 'Green',
      purple: 'Purple',
      orange: 'Orange',
      pink: 'Pink',
      cyan: 'Cyan',
    },
  },
}
```

---

## 5. 수정 파일 체크리스트

| 파일 경로 | 작업 내용 |
|-----------|-----------|
| `client/src/types/index.ts` | `Zone`, `ZoneColor` 인터페이스/타입 추가, `GraphData`에 `zones?: Zone[]` 추가 |
| `client/src/stores/graph.ts` | `zones` state, CRUD 함수 6개 추가, 기존 함수 15개 수정 (스냅샷, 로드, 삭제, 머지 등) |
| `client/src/components/GraphCanvas.vue` | Zone 렌더링(SVG), `zoneRects` computed, Zone 드래그/편집/컨텍스트 메뉴, 노드 드래그 후 소속 판정, 미니맵 Zone, 더블클릭/우클릭 메뉴에 Zone 추가 항목 |
| `client/src/style.css` | Zone 색상 CSS 변수 18개 추가 (6색 x bg/border/text), `.zone-name-input` 스타일, `.zone-color-swatch` 스타일, `.add-node-menu-divider` 스타일 |
| `client/src/i18n/locales/ko.ts` | `graph.zone` 키 추가 |
| `client/src/i18n/locales/en.ts` | `graph.zone` 키 추가 |
| `client/src/views/ProjectView.vue` | `allNodes` computed는 변경 없음 (Zone은 노드가 아님). 별도 수정 불필요 |
| `server/src/types/index.ts` | `GraphDataJson`에 `zones: unknown[]` 추가 |
| `server/src/services/graphService.ts` | `getGraph` 기본 반환값에 `zones: []` 추가 (line 115), `encryptGraphData`/`decryptGraphData`에서 zones passthrough |
| `docs/guide/style_guide.md` | Zone 색상 변수 섹션 추가 |

---

## 6. 제약 조건 / 주의사항

- CSS 색상 하드코딩 금지. Zone 색상은 반드시 `style.css`의 CSS 변수를 통해 사용하고, JS에서는 `cssVar()` 헬퍼로 읽는다
- 이모지 사용 금지
- `<select>` 대신 `CustomSelect` 사용 (Zone 색상 선택은 컨텍스트 메뉴 서브메뉴로 구현하므로 해당 없음)
- 버튼은 글로벌 클래스 사용 (컨텍스트 메뉴 항목은 기존 `.context-menu button` 패턴 따름)
- SVG 아이콘은 인라인 (Zone 아이콘은 메뉴에서 1회성 사용이므로 `Icon.vue` 불필요)
- Zone의 `nodeIds`에 존재하지 않는 노드 ID가 포함될 수 있음(삭제 후 정리가 비동기적). `zoneRects` computed에서 `nodeMap.get()`으로 필터링하므로 안전
- Zone 중첩 불가. `addNodeToZone`에서 기존 소속을 먼저 제거
- Zone 삭제 시 확인 다이얼로그 없음 (undo로 복구 가능)
- 빈 Zone의 위치는 `PositionMap`에 Zone ID 키로 저장. 노드가 추가되면 auto-fit으로 전환되며, positions에서 Zone ID 항목은 자연스럽게 무시됨
