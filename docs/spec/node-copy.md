# 노드 복사 구현 기획서

## 개요

그래프 캔버스에서 노드를 Shift+드래그로 복제하는 기능을 추가한다. 단일 노드 및 다중 선택 노드 복사를 지원하며, 복제된 노드 간의 내부 의존성을 유지한다. 반복적인 서버 구성을 빠르게 만들 수 있도록 하여 편집 효율을 높인다.

---

## 1. 현황 분석

### 현재 드래그 키 바인딩

| 키 조합 | 동작 |
|---------|------|
| 일반 드래그 | 노드 이동 (`startNodeDrag`) |
| Ctrl/Cmd + 드래그 | 의존성 연결 (`startArrowDrag`) |
| Space + 드래그 | 캔버스 패닝 (zoom behavior) |
| **Shift + 드래그** | **미사용 (할당 가능)** |

### 현재 노드 추가 패턴

- `graph.ts` Store에 노드 타입별 `add*` 함수 존재: `addServer`, `addL7Node`, `addInfraNode`, `addExternalNode`, `addDnsNode`
- 각 `add*` 함수는 `Omit<NodeType, 'id'>`를 받아 `generateId()`로 새 ID를 부여하고 배열에 push
- 호출 전 `saveSnapshot()`으로 undo 스냅샷을 저장

### 다중 선택 구조

- `GraphCanvas.vue`의 `multiSelectedIds` (`ref<Set<string>>`)로 다중 선택 관리
- 박스 선택(드래그)으로 다중 선택 가능
- 다중 선택 상태에서 드래그하면 선택된 모든 노드가 함께 이동 (`isMultiDrag` 분기)
- 우클릭 컨텍스트 메뉴에서 다중 삭제 가능

### 위치 관리

- `PositionMap = Record<string, { x: number; y: number }>` 형태
- `savePositions()` 함수가 `renderedNodes`의 좌표를 수집하여 Store에 저장
- 새 노드는 `pendingNodePosition` 또는 뷰포트 중심에 배치됨

### nodeKind 결정 규칙

- `Server` 타입은 `nodeKind`가 optional (`'server'` 또는 undefined) -- 코드에서 `node.nodeKind ?? 'server'`로 처리
- 나머지 타입(`L7Node`, `InfraNode`, `DnsNode`, `ExternalServiceNode`)은 `nodeKind`가 필수

---

## 2. 데이터 모델 및 로직 설계

### 2.1 타입 변경

타입 변경 없음. 기존 `AnyNode`, `Dependency` 타입을 그대로 활용한다.

### 2.2 Store 변경: `duplicateNodes` 액션 추가

`client/src/stores/graph.ts`에 단일 함수를 추가한다.

```typescript
/**
 * 노드 목록을 복제한다.
 * - 각 노드에 새 ID를 부여하고 이름에 " (copy)" 접미사를 추가한다.
 * - 복제 대상 노드 간의 내부 의존성을 새 ID로 매핑하여 복제한다.
 * - 외부 의존성(복제 대상이 아닌 노드와의 연결)도 복제한다.
 * - L7 노드의 memberServerIds가 복제 대상에 포함된 경우 새 ID로 매핑한다.
 * @returns 원본 ID -> 복제 ID 매핑
 */
function duplicateNodes(nodeIds: string[]): Map<string, string> {
  saveSnapshot()
  const idMap = new Map<string, string>() // oldId -> newId

  // 1단계: 노드 복제
  for (const id of nodeIds) {
    const node = findNodeById(id)
    if (!node) continue
    const newId = generateId()
    idMap.set(id, newId)
    const kind = node.nodeKind ?? 'server'

    if (kind === 'server') {
      const src = node as Server
      servers.value.push({
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        name: src.name + ' (copy)',
      })
    } else if (kind === 'l7') {
      const src = node as L7Node
      l7Nodes.value.push({
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        name: src.name + ' (copy)',
        memberServerIds: [], // 2단계에서 재매핑
      })
    } else if (kind === 'infra') {
      const src = node as InfraNode
      infraNodes.value.push({
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        name: src.name + ' (copy)',
      })
    } else if (kind === 'external') {
      const src = node as ExternalServiceNode
      externalNodes.value.push({
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        name: src.name + ' (copy)',
      })
    } else if (kind === 'dns') {
      const src = node as DnsNode
      dnsNodes.value.push({
        ...JSON.parse(JSON.stringify(src)),
        id: newId,
        name: src.name + ' (copy)',
      })
    }
  }

  // 2단계: L7 memberServerIds 재매핑
  for (const id of nodeIds) {
    const node = findNodeById(id)
    if (!node || node.nodeKind !== 'l7') continue
    const src = node as L7Node
    const newL7Id = idMap.get(id)!
    const newL7 = l7Nodes.value.find(n => n.id === newL7Id)
    if (!newL7) continue
    newL7.memberServerIds = src.memberServerIds.map(mid =>
      idMap.get(mid) ?? mid // 복제 대상이면 새 ID, 아니면 원본 ID 유지
    )
  }

  // 3단계: 의존성 복제
  const targetSet = new Set(nodeIds)
  for (const dep of [...dependencies.value]) {
    const srcInSet = targetSet.has(dep.source)
    const tgtInSet = targetSet.has(dep.target)

    if (srcInSet || tgtInSet) {
      const newSource = idMap.get(dep.source) ?? dep.source
      const newTarget = idMap.get(dep.target) ?? dep.target
      // 중복 검사
      const exists = dependencies.value.some(
        d => d.source === newSource && d.target === newTarget
      )
      if (!exists && newSource !== newTarget) {
        dependencies.value.push({
          ...JSON.parse(JSON.stringify(dep)),
          id: generateId(),
          source: newSource,
          target: newTarget,
        })
      }
    }
  }

  return idMap
}
```

Store의 return 객체에 `duplicateNodes`를 추가한다.

### 2.3 의존성 복제 규칙

| 시나리오 | source | target | 복제 동작 |
|---------|--------|--------|----------|
| 내부 의존성 | 복제 대상 | 복제 대상 | source/target 모두 새 ID로 매핑 |
| 외부 발신 | 복제 대상 | 비대상 | source만 새 ID, target은 원본 유지 |
| 외부 수신 | 비대상 | 복제 대상 | source 원본, target만 새 ID |
| 무관 | 비대상 | 비대상 | 복제하지 않음 |

### 2.4 L7 memberServerIds 복제 규칙

- L7 노드가 복제 대상이고, 그 멤버 서버도 복제 대상인 경우: 새 L7의 memberServerIds에 새 서버 ID를 매핑
- L7 노드가 복제 대상이고, 멤버 서버가 복제 대상이 아닌 경우: 원본 서버 ID를 그대로 참조

---

## 3. UI/UX 스펙

### 3.1 인터랙션: Shift+드래그 복제

#### 단일 노드 복사

1. 사용자가 노드 위에서 Shift를 누른 채 마우스를 드래그
2. 드래그 시작 시 원본 노드는 제자리에 유지
3. 반투명 복제 노드가 커서를 따라 이동 (고스트 프리뷰)
4. 마우스를 놓으면 해당 위치에 복제 노드가 생성

#### 다중 노드 복사

1. 박스 선택으로 여러 노드를 선택 (multiSelectedIds 활성)
2. 선택된 노드 중 하나 위에서 Shift를 누른 채 드래그
3. 선택된 모든 노드의 복제본이 상대 위치를 유지하며 커서를 따라 이동
4. 마우스를 놓으면 해당 위치에 모든 복제 노드가 생성

#### 커서 변경

- Shift를 누른 상태에서 노드 위에 마우스를 올리면 커서를 `copy`로 변경하여 복제 가능 상태를 시각적으로 안내

### 3.2 고스트 프리뷰

드래그 중 복제될 노드의 위치를 반투명으로 표시한다.

```
+- - - - - - - - - - - - - - - -+
|  [원본 노드]                    |   (원래 자리, 불투명)
|                                |
|          ~~~~ drag ~~~~>       |
|                                |
|              [고스트 노드]       |   (커서 위치, opacity: 0.4)
+- - - - - - - - - - - - - - - -+
```

고스트 노드는 SVG `<g>` 그룹으로 렌더링하며, `opacity: 0.4`를 적용한다. 기존 노드 렌더링 로직을 재사용하되 상호작용(클릭, 호버)은 비활성화한다.

### 3.3 컨텍스트 메뉴에 "복사" 항목 추가

Shift+드래그 외에도, 우클릭 컨텍스트 메뉴에서도 복사를 지원한다.

#### 단일 노드 컨텍스트 메뉴 (readOnly가 아닐 때)

```
+---------------------+
| 경로 탐색            |
|---------------------|
| 편집                 |
| 의존성 추가           |
| 복사                 |    <-- 새로 추가
| 삭제                 |
+---------------------+
```

#### 다중 선택 컨텍스트 메뉴

```
+---------------------+
| 3개 선택됨           |
|---------------------|
| 복사                 |    <-- 새로 추가
| 삭제                 |
+---------------------+
```

컨텍스트 메뉴의 "복사" 클릭 시, 원본 노드 위치에서 (40, 40) 오프셋된 위치에 복제 노드를 생성한다.

### 3.4 드래그 힌트 메시지

기존 드래그 힌트 영역에 Shift+드래그 복사에 대한 안내 텍스트를 추가한다. 이미 `dragHint` i18n 키가 존재하므로 여기에 `copy` 키를 추가한다.

### 3.5 빈 상태/에러 처리

| 상황 | 처리 |
|------|------|
| readOnly 모드 | Shift+드래그 무시 (기존 일반 드래그와 동일하게 이동만) |
| pathMode 활성 | Shift+드래그 무시 |
| 복제 후 이름 중복 | 허용 (이름은 unique 제약이 없음) |

---

## 4. 구현 상세: GraphCanvas.vue 변경

### 4.1 `onNodeMouseDown` 분기 추가

현재 코드 (1775-1783행):

```typescript
function onNodeMouseDown(event: MouseEvent, node: D3Node) {
  contextMenu.value.visible = false
  if (props.readOnly) return
  if (spaceHeld.value) return
  event.stopPropagation()
  if (props.pathMode || props.pathNodes.size > 0) return
  if (event.ctrlKey || event.metaKey) startArrowDrag(event, node)
  else startNodeDrag(event, node)
}
```

변경 후:

```typescript
function onNodeMouseDown(event: MouseEvent, node: D3Node) {
  contextMenu.value.visible = false
  if (props.readOnly) return
  if (spaceHeld.value) return
  event.stopPropagation()
  if (props.pathMode || props.pathNodes.size > 0) return
  if (event.ctrlKey || event.metaKey) startArrowDrag(event, node)
  else if (event.shiftKey) startCopyDrag(event, node)
  else startNodeDrag(event, node)
}
```

### 4.2 `startCopyDrag` 함수 신규 작성

```typescript
// ─── 노드 복사 드래그 ────────────────────────────────────
const copyGhosts = ref<Array<{ id: string; x: number; y: number; node: D3Node }>>([])

function startCopyDrag(event: MouseEvent, node: D3Node) {
  event.preventDefault()
  const startWorld = getSvgPoint(event)
  let hasMoved = false

  // 복사 대상 결정: 다중 선택 중이면 전체, 아니면 단일 노드
  const isMulti = multiSelectedIds.value.size > 1 && multiSelectedIds.value.has(node.id)
  const targetIds = isMulti ? Array.from(multiSelectedIds.value) : [node.id]

  // 원본 노드들의 시작 위치 기록
  const startPositions = new Map<string, { x: number; y: number }>()
  for (const id of targetIds) {
    const n = renderedNodes.value.find(rn => rn.id === id)
    if (n) startPositions.set(id, { x: n.x ?? 0, y: n.y ?? 0 })
  }

  // 드래그된 노드의 원본 위치 (오프셋 기준)
  const dragOrigin = { x: node.x ?? 0, y: node.y ?? 0 }

  const handleMove = (e: MouseEvent) => {
    const { x, y } = getSvgPoint(e)
    if (!hasMoved) {
      if (Math.hypot(x - startWorld.x, y - startWorld.y) < 5) return
      hasMoved = true
    }
    const dx = x - startWorld.x
    const dy = y - startWorld.y

    // 고스트 위치 업데이트
    const ghosts: typeof copyGhosts.value = []
    for (const id of targetIds) {
      const sp = startPositions.get(id)
      if (!sp) continue
      const srcNode = renderedNodes.value.find(rn => rn.id === id)
      if (!srcNode) continue
      ghosts.push({
        id,
        x: sp.x + dx,
        y: sp.y + dy,
        node: srcNode,
      })
    }
    copyGhosts.value = ghosts
  }

  const handleUp = (e: MouseEvent) => {
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)

    if (!hasMoved) {
      copyGhosts.value = []
      return
    }

    const { x, y } = getSvgPoint(e)
    const dx = x - startWorld.x
    const dy = y - startWorld.y

    // Store에서 노드 복제
    const idMap = graphStore.duplicateNodes(targetIds)

    // 복제된 노드의 위치 설정
    const positions = { ...graphStore.getPositions() }
    for (const [oldId, newId] of idMap) {
      const sp = startPositions.get(oldId)
      if (sp) {
        positions[newId] = { x: sp.x + dx, y: sp.y + dy }
      }
    }
    graphStore.savePositions(positions)

    copyGhosts.value = []
  }

  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleUp)
}
```

### 4.3 고스트 노드 SVG 렌더링

기존 노드 렌더링 `<g>` 루프 아래에 고스트 노드를 렌더링하는 `<g>` 블록을 추가한다. 기존의 노드 shape 렌더링 로직(서버 rect, L7 circle, infra diamond 등)은 이미 `v-for="node in renderedNodes"` 내부에서 `nodeKind`에 따라 분기되므로, 고스트에서는 간단한 형태로 표현한다.

```html
<!-- 복사 고스트 -->
<g v-for="ghost in copyGhosts" :key="'ghost-' + ghost.id"
   :transform="`translate(${ghost.x}, ${ghost.y})`"
   opacity="0.4" pointer-events="none">
  <!-- 기존 노드 shape를 재사용 (nodeKind별 분기) -->
  <!-- 실제 구현 시 기존 노드 shape 템플릿을 컴포넌트 또는 함수로 추출하거나,
       간단하게 circle로 통일하여 표현해도 무방 -->
  <circle r="24" :fill="nodeKindColor(ghost.node.nodeKind ?? 'server')" />
  <text text-anchor="middle" dy="40"
        :font-size="cssVar('--text-xs')"
        :fill="cssVar('--text-secondary')">
    {{ ghost.node.name }}
  </text>
</g>
```

> 구현 시 판단: 기존 노드 shape 렌더링이 인라인 SVG로 상당히 복잡하므로(nodeKind별 path가 다름), 고스트에서는 **nodeKind별 색상이 적용된 원(circle)**으로 단순화하는 것을 권장한다. 정확한 shape 복제가 필요하다면, 노드 shape 부분을 별도 컴포넌트로 추출하는 리팩터링이 선행되어야 한다.

### 4.4 커서 변경

노드 `<g>` 요소의 스타일에 Shift 키 감지를 추가한다.

```typescript
// 기존 spaceHeld와 동일한 패턴으로 shiftHeld를 추가
const shiftHeld = ref(false)

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault()
    spaceHeld.value = true
  }
  if (e.key === 'Shift') shiftHeld.value = true
}
function onKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') spaceHeld.value = false
  if (e.key === 'Shift') shiftHeld.value = false
}
```

노드 `<g>` 요소에 커서 스타일 바인딩:

```html
<g ... :style="{ cursor: shiftHeld && !readOnly ? 'copy' : 'grab' }">
```

### 4.5 컨텍스트 메뉴 복사 버튼

#### 단일 노드 메뉴 (기존 746-750행 사이에 추가)

```html
<button @click="onEditNode">{{ t('common.edit') }}</button>
<button @click="onAddDep">{{ t('graph.contextMenu.addDep') }}</button>
<button @click="onCopyNode">{{ t('graph.contextMenu.copy') }}</button>   <!-- 추가 -->
<button class="danger" @click="onDeleteNode">{{ t('common.delete') }}</button>
```

#### 다중 선택 메뉴 (기존 741행 앞에 추가)

```html
<button v-if="!readOnly" @click="onCopyMultiNodes">{{ t('graph.contextMenu.copy') }}</button>
<button v-if="!readOnly" class="danger" @click="onDeleteMultiNodes">{{ t('common.delete') }}</button>
```

#### 핸들러 함수

```typescript
function onCopyNode() {
  if (!contextMenu.value.node) return
  const node = contextMenu.value.node
  const idMap = graphStore.duplicateNodes([node.id])
  // 오프셋 위치에 배치
  const positions = { ...graphStore.getPositions() }
  const newId = idMap.get(node.id)
  if (newId) {
    const srcPos = positions[node.id]
    positions[newId] = {
      x: (srcPos?.x ?? 0) + 40,
      y: (srcPos?.y ?? 0) + 40,
    }
    graphStore.savePositions(positions)
  }
  contextMenu.value.visible = false
}

function onCopyMultiNodes() {
  const ids = Array.from(multiSelectedIds.value)
  const idMap = graphStore.duplicateNodes(ids)
  const positions = { ...graphStore.getPositions() }
  for (const [oldId, newId] of idMap) {
    const srcPos = positions[oldId]
    positions[newId] = {
      x: (srcPos?.x ?? 0) + 40,
      y: (srcPos?.y ?? 0) + 40,
    }
  }
  graphStore.savePositions(positions)
  contextMenu.value.visible = false
}
```

### 4.6 emit 추가: 불필요

복사 로직은 GraphCanvas 내부에서 Store를 직접 호출하여 처리한다. 기존 패턴에서도 `savePositions`는 GraphCanvas가 직접 호출하고 있으므로, 노드 복제도 동일하게 처리한다. ProjectView.vue에 새 emit을 전파할 필요가 없다.

> 단, 기존 패턴에서 노드 삭제는 emit으로 ProjectView에 위임하고 있다. 일관성을 위해 emit 패턴을 사용할 수도 있으나, 복사는 확인 모달이 불필요하므로 직접 호출이 더 간결하다.

---

## 5. i18n 키 추가

### `client/src/i18n/locales/ko.ts`

```typescript
// graph.contextMenu 하위에 추가
copy: '복사',

// graph.dragHint 하위에 추가
copy: '(놓으면 노드 복제)',
```

### `client/src/i18n/locales/en.ts`

```typescript
// graph.contextMenu 하위에 추가
copy: 'Copy',

// graph.dragHint 하위에 추가
copy: '(Release to duplicate node)',
```

---

## 6. 수정 파일 체크리스트

| 파일 경로 | 작업 내용 |
|-----------|----------|
| `client/src/stores/graph.ts` | `duplicateNodes` 함수 추가, return 객체에 포함 |
| `client/src/components/GraphCanvas.vue` | `onNodeMouseDown`에 `event.shiftKey` 분기 추가 |
| `client/src/components/GraphCanvas.vue` | `startCopyDrag` 함수 신규 작성 |
| `client/src/components/GraphCanvas.vue` | `copyGhosts` ref 추가 및 SVG 고스트 렌더링 |
| `client/src/components/GraphCanvas.vue` | `shiftHeld` ref 추가, `onKeyDown`/`onKeyUp` 수정 |
| `client/src/components/GraphCanvas.vue` | 노드 `<g>` 커서 스타일 바인딩 추가 |
| `client/src/components/GraphCanvas.vue` | 컨텍스트 메뉴에 "복사" 버튼 추가 (단일/다중) |
| `client/src/components/GraphCanvas.vue` | `onCopyNode`, `onCopyMultiNodes` 핸들러 추가 |
| `client/src/i18n/locales/ko.ts` | `graph.contextMenu.copy`, `graph.dragHint.copy` 추가 |
| `client/src/i18n/locales/en.ts` | `graph.contextMenu.copy`, `graph.dragHint.copy` 추가 |

> 백엔드 변경 없음 (프론트엔드만 수정). 복제된 노드는 기존 저장 플로우(autosave/수동 저장)를 통해 서버에 반영된다.

---

## 7. 제약 조건 및 주의사항

1. **CLAUDE.md 규칙 준수**: 색상 하드코딩 금지. 고스트 노드의 fill 색상은 `nodeKindColor()` 함수(내부에서 CSS 변수를 읽음)를 사용할 것.
2. **이모지 사용 금지**: UI 텍스트 및 코드 주석에 이모지 없음.
3. **Undo/Redo 호환**: `duplicateNodes` 함수 시작 시 `saveSnapshot()`을 호출하므로, Ctrl+Z로 복사를 되돌릴 수 있다. 다중 노드 복사 시 하나의 스냅샷으로 묶인다.
4. **readOnly 모드**: Shift+드래그 시 복사가 아닌 일반 이동으로 fallback. 컨텍스트 메뉴의 복사 버튼은 `!readOnly` 조건 내부에 배치.
5. **기존 Shift 사용 충돌 없음**: 현재 Shift 키는 드래그 중 미사용 상태임을 확인 완료.
6. **L7 멤버 의존성 차단 규칙**: 복제된 의존성도 기존 `isL7MemberDependency` 검증을 통과해야 한다. `duplicateNodes`에서 의존성 추가 시 이 검증을 적용하지 않으나(내부 로직이므로), 필요 시 검증 추가를 고려할 것. 단, 원본이 유효한 의존성이었으므로 복제본도 유효할 가능성이 높다.
7. **infra 노드 source 차단**: infra 노드가 source인 의존성은 원래 생성이 차단되나, 복제 시에는 원본에 이미 존재하는 의존성이므로 그대로 복제한다.
