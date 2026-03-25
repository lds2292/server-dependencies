<template>
  <div ref="container" class="graph-container">
    <svg ref="svgRef" class="graph-svg">
      <defs>
        <marker
          v-for="m in markerDefs"
          :key="m.id"
          :id="m.id"
          viewBox="0 -5 10 10"
          refX="10"
          refY="0"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,-5L10,0L0,5" :fill="m.fill" />
        </marker>
      </defs>
      <g ref="gRef">
        <!-- L7 멤버 연결선 (의존성 라인보다 먼저 렌더링) -->
        <line
          v-for="ml in l7MemberLines"
          :key="ml.key"
          :x1="ml.x1" :y1="ml.y1"
          :x2="ml.x2" :y2="ml.y2"
          stroke="#7c3aed"
          stroke-width="1"
          stroke-dasharray="4,3"
          opacity="0.45"
          pointer-events="none"
        />

        <!-- 의존성 링크 -->
        <line
          v-for="link in computedLinks"
          :key="link.id"
          :x1="link.x1" :y1="link.y1"
          :x2="link.x2" :y2="link.y2"
          :stroke="impactedLinks.has(link.id) ? '#ef4444' : '#94a3b8'"
          stroke-width="1.5"
          :marker-end="`url(#${impactedLinks.has(link.id) ? 'arrow-red' : 'arrow-default'})`"
        />

        <!-- 드래그 미리보기 화살표 -->
        <line
          v-if="arrowPreview"
          :x1="arrowPreview.x1" :y1="arrowPreview.y1"
          :x2="arrowPreview.x2" :y2="arrowPreview.y2"
          stroke="#60a5fa" stroke-width="2" stroke-dasharray="7,4"
          marker-end="url(#arrow-preview)"
          pointer-events="none"
        />

        <!-- 노드 -->
        <g
          v-for="node in renderedNodes"
          :key="node.id"
          :transform="`translate(${node.x ?? 0},${node.y ?? 0})`"
          class="graph-node"
          :class="{
            selected: selectedId === node.id,
            impacted: impactedNodes.has(node.id),
            'connect-source': arrowSource?.id === node.id,
            'connect-target': connectTarget?.id === node.id,
          }"
          :filter="selectedId === node.id ? 'url(#glow-blue)' : impactedNodes.has(node.id) ? 'url(#glow-red)' : undefined"
          @mousedown.stop="onNodeMouseDown($event, node)"
          @click.stop="onNodeClick(node)"
          @contextmenu.prevent="onNodeContextMenu($event, node)"
        >
          <rect
            x="-65" y="-28" width="130" height="56" rx="6"
            :fill="nodeColor(node)"
            :stroke="nodeStroke(node)"
            :stroke-width="isHighlighted(node) ? 3 : 1.5"
          />

          <!-- 타입 아이콘 (좌측 상단) -->
          <g :transform="`translate(-58,-22)`" opacity="0.8" pointer-events="none">
            <!-- Server -->
            <template v-if="!node.nodeKind || node.nodeKind === 'server'">
              <rect x="0" y="0" width="11" height="8" rx="1.5" stroke="white" stroke-width="0.9" fill="none"/>
              <line x1="0" y1="3.2" x2="11" y2="3.2" stroke="white" stroke-width="0.7"/>
              <circle cx="8.5" cy="5.8" r="0.9" fill="white"/>
              <circle cx="6.5" cy="5.8" r="0.9" fill="white"/>
            </template>
            <!-- L7 -->
            <template v-else-if="node.nodeKind === 'l7'">
              <circle cx="5.5" cy="3.5" r="3" stroke="white" stroke-width="0.9" fill="none"/>
              <line x1="5.5" y1="6.5" x2="2" y2="10" stroke="white" stroke-width="0.9"/>
              <line x1="5.5" y1="6.5" x2="9" y2="10" stroke="white" stroke-width="0.9"/>
              <line x1="2.5" y1="3.5" x2="8.5" y2="3.5" stroke="white" stroke-width="0.8"/>
            </template>
            <!-- DB -->
            <template v-else-if="node.nodeKind === 'db'">
              <ellipse cx="5.5" cy="1.8" rx="5" ry="1.8" stroke="white" stroke-width="0.9" fill="none"/>
              <line x1="0.5" y1="1.8" x2="0.5" y2="7.5" stroke="white" stroke-width="0.9"/>
              <line x1="10.5" y1="1.8" x2="10.5" y2="7.5" stroke="white" stroke-width="0.9"/>
              <ellipse cx="5.5" cy="7.5" rx="5" ry="1.8" stroke="white" stroke-width="0.9" fill="none"/>
            </template>
            <!-- External -->
            <template v-else-if="node.nodeKind === 'external'">
              <circle cx="5.5" cy="5" r="4.5" stroke="white" stroke-width="0.9" fill="none"/>
              <ellipse cx="5.5" cy="5" rx="2.2" ry="4.5" stroke="white" stroke-width="0.7" fill="none"/>
              <line x1="1" y1="5" x2="10" y2="5" stroke="white" stroke-width="0.7"/>
              <line x1="1.5" y1="2.5" x2="9.5" y2="2.5" stroke="white" stroke-width="0.5"/>
              <line x1="1.5" y1="7.5" x2="9.5" y2="7.5" stroke="white" stroke-width="0.5"/>
            </template>
          </g>

          <!-- 노드 텍스트 -->
          <text dy="-9" text-anchor="middle" class="node-label">{{ node.name }}</text>

          <template v-if="node.nodeKind === 'l7'">
            <text dy="6" text-anchor="middle" class="node-sub">L7 Load Balancer</text>
            <text dy="19" text-anchor="middle" class="node-meta">{{ (node as any).ip || '' }}{{ (node as any).ip && (node as any).memberServerIds?.length ? ' · ' : '' }}{{ (node as any).memberServerIds?.length ?? 0 }}개 서버</text>
          </template>
          <template v-else-if="node.nodeKind === 'db'">
            <text dy="6" text-anchor="middle" class="node-sub">{{ (node as any).dbType || 'Database' }}</text>
            <text dy="19" text-anchor="middle" class="node-meta">{{ (node as any).host || '-' }}{{ (node as any).port ? ':' + (node as any).port : '' }}</text>
          </template>
          <template v-else-if="node.nodeKind === 'external'">
            <text dy="6" text-anchor="middle" class="node-sub">외부 서비스</text>
            <text dy="19" text-anchor="middle" class="node-meta">담당자 {{ (node as any).contacts?.length ?? 0 }}명</text>
          </template>
          <template v-else>
            <text dy="6" text-anchor="middle" class="node-ip">{{ (node as any).internalIp || '-' }}</text>
            <text dy="19" text-anchor="middle" class="node-meta">NAT: {{ (node as any).natIp || '-' }}</text>
          </template>
        </g>

        <!-- glow 필터 (defs 내에 정의) -->
        <defs>
          <filter id="glow-blue" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <marker id="arrow-preview" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,-5L10,0L0,5" fill="#60a5fa"/>
          </marker>
        </defs>
      </g>
    </svg>

    <!-- 하단 힌트 -->
    <div v-if="!readOnly" class="mode-hint">일반 드래그: 노드 이동 &nbsp;|&nbsp; Ctrl + 드래그: 의존성 연결</div>
    <div v-else class="mode-hint readonly-hint">읽기 전용 모드 — 노드 이동만 가능</div>

    <!-- 연결 힌트 -->
    <div v-if="connectTarget && arrowSource" class="drop-hint">
      <span class="hint-source">{{ arrowSource.name }}</span> →
      <span class="hint-target">{{ connectTarget.name }}</span>
      (놓으면 의존관계 생성)
    </div>
    <div v-else-if="arrowSource && arrowPreview && !connectTarget" class="drag-hint">
      다른 노드 위에서 놓으면 의존관계를 생성합니다
    </div>

    <!-- 컨텍스트 메뉴 -->
    <div v-if="contextMenu.visible" class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
      <template v-if="!readOnly">
        <button @click="onEditNode">수정</button>
        <button @click="onAddDep">의존성 추가</button>
        <button class="danger" @click="onDeleteNode">삭제</button>
      </template>
      <template v-else>
        <button class="disabled-item" disabled>읽기 전용 모드</button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { AnyNode, D3Node, D3Link } from '../types'

const props = defineProps<{
  nodes: AnyNode[]
  links: D3Link[]
  impactedNodes: Set<string>
  impactedLinks: Set<string>
  selectedId: string | null
  readOnly: boolean
}>()

const emit = defineEmits<{
  nodeClick: [node: AnyNode]
  editNode: [node: AnyNode]
  deleteNode: [node: AnyNode]
  addDependency: [source: AnyNode]
  quickConnect: [source: AnyNode, target: AnyNode]
}>()

const container = ref<HTMLDivElement>()
const svgRef = ref<SVGSVGElement>()
const gRef = ref<SVGGElement>()

const renderedNodes = ref<D3Node[]>([])
const renderedLinks = ref<D3Link[]>([])

const markerDefs = [
  { id: 'arrow-default', fill: '#94a3b8' },
  { id: 'arrow-red', fill: '#ef4444' },
]

let simulation: d3.Simulation<D3Node, D3Link> | null = null
let zoomSetup = false

// 드래그 상태
const arrowSource = ref<D3Node | null>(null)
const arrowPreview = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
const connectTarget = ref<D3Node | null>(null)

// 컨텍스트 메뉴
const contextMenu = ref({ visible: false, x: 0, y: 0, node: null as AnyNode | null })

// ─── 색상 ───────────────────────────────────────────────
function nodeColor(node: D3Node): string {
  const env = (node as any).environment
  if (node.nodeKind === 'l7') return env === 'prod' ? '#3b0764' : env === 'staging' ? '#4a1942' : '#1e1b4b'
  if (node.nodeKind === 'db') return '#0c2040'
  if (node.nodeKind === 'external') return '#052e16'
  return env === 'prod' ? '#1e3a8a' : env === 'staging' ? '#7c2d12' : '#064e3b'
}

function nodeStroke(node: D3Node): string {
  if (connectTarget.value?.id === node.id) return '#22c55e'
  if (arrowSource.value?.id === node.id) return '#60a5fa'
  if (props.selectedId === node.id) {
    if (node.nodeKind === 'l7') return '#a78bfa'
    if (node.nodeKind === 'db') return '#38bdf8'
    if (node.nodeKind === 'external') return '#4ade80'
    return '#2563eb'
  }
  if (props.impactedNodes.has(node.id)) return '#ef4444'
  if (node.nodeKind === 'l7') return '#7c3aed'
  if (node.nodeKind === 'db') return '#0369a1'
  if (node.nodeKind === 'external') return '#16a34a'
  return '#475569'
}

function isHighlighted(node: D3Node): boolean {
  return props.selectedId === node.id || props.impactedNodes.has(node.id)
    || connectTarget.value?.id === node.id || arrowSource.value?.id === node.id
}

// ─── 링크 끝점 계산 (노드 경계까지) ────────────────────
const computedLinks = computed(() => {
  return renderedLinks.value.map(link => {
    const src = link.source as D3Node
    const tgt = link.target as D3Node
    const sx = src.x ?? 0, sy = src.y ?? 0
    const tx = tgt.x ?? 0, ty = tgt.y ?? 0
    const dx = tx - sx, dy = ty - sy
    const len = Math.hypot(dx, dy)
    if (len < 1) return { ...link, x1: sx, y1: sy, x2: tx, y2: ty }
    const ux = dx / len, uy = dy / len
    const hw = 65, hh = 28
    const tEdge = Math.min(
      Math.abs(ux) > 0.001 ? hw / Math.abs(ux) : Infinity,
      Math.abs(uy) > 0.001 ? hh / Math.abs(uy) : Infinity
    )
    return {
      ...link,
      x1: sx, y1: sy,
      x2: tx - ux * (tEdge + 2),
      y2: ty - uy * (tEdge + 2),
    }
  })
})

// ─── L7 멤버 연결선 ──────────────────────────────────────
const l7MemberLines = computed(() => {
  const nodeMap = new Map(renderedNodes.value.map(n => [n.id, n]))
  const lines: { key: string; x1: number; y1: number; x2: number; y2: number }[] = []
  for (const node of renderedNodes.value) {
    if (node.nodeKind !== 'l7') continue
    const memberIds: string[] = (node as any).memberServerIds ?? []
    for (const mid of memberIds) {
      const member = nodeMap.get(mid)
      if (member) {
        lines.push({
          key: `${node.id}-${mid}`,
          x1: node.x ?? 0, y1: node.y ?? 0,
          x2: member.x ?? 0, y2: member.y ?? 0,
        })
      }
    }
  }
  return lines
})

// ─── SVG 좌표 변환 ───────────────────────────────────────
function getSvgPoint(event: MouseEvent): { x: number; y: number } {
  if (!svgRef.value) return { x: 0, y: 0 }
  const rect = svgRef.value.getBoundingClientRect()
  const transform = d3.zoomTransform(svgRef.value)
  const [wx, wy] = transform.invert([event.clientX - rect.left, event.clientY - rect.top])
  return { x: wx, y: wy }
}

function findNodeAt(worldX: number, worldY: number, excludeId: string): D3Node | null {
  return renderedNodes.value.find(n => {
    if (n.id === excludeId) return false
    return Math.abs(worldX - (n.x ?? 0)) < 65 && Math.abs(worldY - (n.y ?? 0)) < 28
  }) ?? null
}

// ─── 시뮬레이션 ─────────────────────────────────────────
function buildSimulation() {
  const width = container.value?.clientWidth ?? 800
  const height = container.value?.clientHeight ?? 600

  const nodeMap = new Map(props.nodes.map(n => [n.id, { ...n } as D3Node]))
  // 기존 위치 복원
  renderedNodes.value.forEach(existing => {
    const n = nodeMap.get(existing.id)
    if (n) { n.x = existing.x; n.y = existing.y; n.fx = existing.fx; n.fy = existing.fy }
  })

  const nodes: D3Node[] = Array.from(nodeMap.values())
  const links: D3Link[] = props.links.map(l => ({
    ...l,
    source: nodeMap.get(l.source as string) ?? l.source,
    target: nodeMap.get(l.target as string) ?? l.target,
  }))

  renderedNodes.value = nodes
  renderedLinks.value = links

  simulation?.stop()

  // 신규 노드(위치 없는 것)가 없으면 alpha 낮게 시작 → 기존 노드 흔들림 방지
  const hasNewNodes = nodes.some(n => n.x == null)

  simulation = d3.forceSimulation<D3Node, D3Link>(nodes)
    .alpha(hasNewNodes ? 0.6 : 0.05)
    .alphaDecay(0.04)
    .velocityDecay(0.6)
    .force('link', d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(200))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide(80))
    .on('tick', () => {
      renderedNodes.value = [...nodes]
      renderedLinks.value = [...links]
    })
    .on('end', () => {
      // 시뮬레이션 완료 후 모든 노드 위치 고정 → 이후 환경 필터 토글시 흔들림 없음
      nodes.forEach(n => {
        n.fx = n.x ?? 0
        n.fy = n.y ?? 0
      })
      renderedNodes.value = [...nodes]
    })
}

function setupZoom() {
  if (zoomSetup || !svgRef.value || !gRef.value) return
  zoomSetup = true
  const svg = d3.select(svgRef.value)
  const g = d3.select(gRef.value)
  svg.call(
    d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 4])
      .on('zoom', e => g.attr('transform', e.transform.toString()))
  )
}

// ─── 노드 이동 드래그 ────────────────────────────────────
function startNodeDrag(event: MouseEvent, node: D3Node) {
  event.preventDefault()
  const startWorld = getSvgPoint(event)
  const startX = node.x ?? 0, startY = node.y ?? 0
  node.fx = startX; node.fy = startY
  simulation?.alphaTarget(0.3).restart()

  const handleMove = (e: MouseEvent) => {
    const { x, y } = getSvgPoint(e)
    node.fx = startX + (x - startWorld.x)
    node.fy = startY + (y - startWorld.y)
    node.x = node.fx; node.y = node.fy
    renderedNodes.value = [...renderedNodes.value]
  }
  const handleUp = () => {
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
    simulation?.alphaTarget(0)
  }
  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleUp)
}

// ─── 화살표 드래그 (의존성 연결) ─────────────────────────
function startArrowDrag(event: MouseEvent, node: D3Node) {
  let isDragging = false
  const startPos = getSvgPoint(event)
  arrowSource.value = node

  const handleMove = (e: MouseEvent) => {
    const { x, y } = getSvgPoint(e)
    if (!isDragging) {
      if (Math.hypot(x - startPos.x, y - startPos.y) < 8) return
      isDragging = true
    }
    arrowPreview.value = { x1: node.x ?? 0, y1: node.y ?? 0, x2: x, y2: y }
    connectTarget.value = findNodeAt(x, y, node.id)
  }
  const handleUp = () => {
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
    if (isDragging && connectTarget.value) emit('quickConnect', node, connectTarget.value)
    arrowPreview.value = null
    arrowSource.value = null
    connectTarget.value = null
  }
  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleUp)
}

function onNodeMouseDown(event: MouseEvent, node: D3Node) {
  contextMenu.value.visible = false
  if (!props.readOnly && (event.ctrlKey || event.metaKey)) startArrowDrag(event, node)
  else startNodeDrag(event, node)
}

watch(() => [props.nodes, props.links], buildSimulation, { deep: true })
onMounted(() => { buildSimulation(); setupZoom() })
onUnmounted(() => simulation?.stop())

function onNodeClick(node: AnyNode) {
  if (arrowPreview.value) return
  contextMenu.value.visible = false
  emit('nodeClick', node)
}
function onNodeContextMenu(event: MouseEvent, node: AnyNode) {
  contextMenu.value = { visible: true, x: event.offsetX, y: event.offsetY, node }
}
function onEditNode() { if (contextMenu.value.node) emit('editNode', contextMenu.value.node); contextMenu.value.visible = false }
function onDeleteNode() { if (contextMenu.value.node) emit('deleteNode', contextMenu.value.node); contextMenu.value.visible = false }
function onAddDep() { if (contextMenu.value.node) emit('addDependency', contextMenu.value.node); contextMenu.value.visible = false }

function closeContextMenu() { contextMenu.value.visible = false }
onMounted(() => document.addEventListener('click', closeContextMenu))
onUnmounted(() => document.removeEventListener('click', closeContextMenu))
</script>

<style scoped>
.graph-container {
  position: relative; width: 100%; height: 100%;
  background: #0f172a; border-radius: 8px; overflow: hidden;
  user-select: none;
}
.graph-svg { width: 100%; height: 100%; }
.node-label { font-size: 12px; fill: #fff; pointer-events: none; font-weight: 700; }
.node-ip { font-size: 10px; fill: rgba(255,255,255,0.75); pointer-events: none; }
.node-sub { font-size: 9px; fill: rgba(255,255,255,0.65); pointer-events: none; font-weight: 600; letter-spacing: 0.02em; }
.node-meta { font-size: 9.5px; fill: rgba(255,255,255,0.5); pointer-events: none; }
.graph-node { cursor: grab; }
.graph-node:active { cursor: grabbing; }
.graph-node.connect-source rect { filter: brightness(1.3); }
.graph-node.connect-target rect { filter: brightness(1.5); }

.mode-hint {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  background: #1e293b; border: 1px solid #334155; border-radius: 20px;
  padding: 5px 14px; font-size: 11px; color: #64748b;
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.readonly-hint { background: #1c1217; border-color: #7c3aed; color: #a78bfa; }
.drop-hint {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  background: #052e16; border: 1px solid #22c55e; border-radius: 20px;
  padding: 6px 16px; font-size: 13px; color: #86efac;
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.drag-hint {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  background: #0f2044; border: 1px solid #3b82f6; border-radius: 20px;
  padding: 6px 16px; font-size: 13px; color: #93c5fd;
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.hint-source { color: #60a5fa; font-weight: 700; }
.hint-target { color: #22c55e; font-weight: 700; }
.context-menu {
  position: absolute; background: #1e293b; border: 1px solid #334155;
  border-radius: 6px; padding: 4px 0; z-index: 100; min-width: 120px;
}
.context-menu button {
  display: block; width: 100%; padding: 6px 16px; background: none;
  border: none; color: #e2e8f0; text-align: left; cursor: pointer; font-size: 13px;
}
.context-menu button:hover { background: #334155; }
.context-menu button.danger { color: #ef4444; }
.context-menu button.disabled-item { color: #475569; cursor: not-allowed; font-style: italic; }
.context-menu button.disabled-item:hover { background: none; }
</style>
