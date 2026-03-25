<template>
  <div class="server-panel">
    <div class="panel-header">
      <h2>노드 목록 <span class="count-badge">{{ allItems.length }}</span></h2>

      <!-- 단일 추가 버튼 + 드롭다운 -->
      <div v-if="!readOnly" class="add-wrap" ref="addWrapRef">
        <button class="btn-add" @click.stop="toggleMenu">+ 추가 ▾</button>
        <div v-if="showMenu" class="add-menu" @click.stop>
          <button @click="emit('addServer'); showMenu=false">
            <svg width="13" height="13" viewBox="0 0 11 9" fill="none" class="menu-icon">
              <rect x="0.5" y="0.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="0.9"/>
              <line x1="0.5" y1="3.7" x2="10.5" y2="3.7" stroke="currentColor" stroke-width="0.7"/>
              <circle cx="8.5" cy="6.2" r="0.9" fill="currentColor"/>
              <circle cx="6.5" cy="6.2" r="0.9" fill="currentColor"/>
            </svg>
            서버
          </button>
          <button @click="emit('addL7'); showMenu=false">
            <svg width="13" height="13" viewBox="0 0 11 11" fill="none" class="menu-icon">
              <circle cx="5.5" cy="4" r="3" stroke="currentColor" stroke-width="0.9"/>
              <line x1="5.5" y1="7" x2="2" y2="10.5" stroke="currentColor" stroke-width="0.9"/>
              <line x1="5.5" y1="7" x2="9" y2="10.5" stroke="currentColor" stroke-width="0.9"/>
              <line x1="2.5" y1="4" x2="8.5" y2="4" stroke="currentColor" stroke-width="0.8"/>
            </svg>
            L7
          </button>
          <button @click="emit('addDB'); showMenu=false">
            <svg width="13" height="13" viewBox="0 0 11 10" fill="none" class="menu-icon">
              <ellipse cx="5.5" cy="2" rx="5" ry="2" stroke="currentColor" stroke-width="0.9"/>
              <line x1="0.5" y1="2" x2="0.5" y2="8" stroke="currentColor" stroke-width="0.9"/>
              <line x1="10.5" y1="2" x2="10.5" y2="8" stroke="currentColor" stroke-width="0.9"/>
              <ellipse cx="5.5" cy="8" rx="5" ry="2" stroke="currentColor" stroke-width="0.9"/>
            </svg>
            DB
          </button>
          <button @click="emit('addExternal'); showMenu=false">
            <svg width="13" height="13" viewBox="0 0 11 11" fill="none" class="menu-icon">
              <circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9"/>
              <ellipse cx="5.5" cy="5.5" rx="2.2" ry="5" stroke="currentColor" stroke-width="0.7"/>
              <line x1="0.5" y1="5.5" x2="10.5" y2="5.5" stroke="currentColor" stroke-width="0.7"/>
              <line x1="1" y1="3" x2="10" y2="3" stroke="currentColor" stroke-width="0.5"/>
              <line x1="1" y1="8" x2="10" y2="8" stroke="currentColor" stroke-width="0.5"/>
            </svg>
            외부서비스
          </button>
        </div>
      </div>
    </div>

    <div class="search-box">
      <input v-model="search" placeholder="노드 검색..." />
    </div>

    <ul class="node-list">
      <li
        v-for="item in filteredItems"
        :key="item.id"
        :class="['node-card', { selected: selectedId === item.id }]"
        @click="emit('select', item)"
      >
        <!-- 행1: 타입/환경 뱃지 + 편집/삭제 -->
        <div class="card-row1">
          <div class="badges">
            <span :class="['type-badge', item.nodeKind ?? 'server']">{{ typeLabel(item) }}</span>
            <span v-if="(item as any).environment" :class="['env-badge', (item as any).environment]">
              {{ envLabel((item as any).environment) }}
            </span>
          </div>
          <div v-if="!readOnly" class="card-actions">
            <button title="수정" @click.stop="emit('edit', item)">✎</button>
            <button title="삭제" class="danger" @click.stop="emit('delete', item)">✕</button>
          </div>
        </div>
        <!-- 행2: 노드명 -->
        <div class="card-name">{{ item.name }}</div>
        <!-- 행3: 서브정보 -->
        <div class="card-sub">{{ subText(item) }}</div>
      </li>
      <li v-if="filteredItems.length === 0" class="empty">노드가 없습니다</li>
    </ul>

    <div v-if="!readOnly" class="panel-footer">
      <button class="btn-secondary" @click="emit('exportJSON')">Export JSON</button>
      <label class="btn-secondary">
        Import JSON
        <input type="file" accept=".json" style="display:none" @change="onImport" />
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Server, L7Node, DBNode, ExternalServiceNode, AnyNode } from '../types'

const ENV_LABELS: Record<string, string> = { prod: 'Production', staging: 'Staging', dev: 'Develop' }
function envLabel(env: string) { return ENV_LABELS[env] ?? env }
function typeLabel(node: AnyNode): string {
  if (node.nodeKind === 'l7') return 'L7'
  if (node.nodeKind === 'db') return 'DB'
  if (node.nodeKind === 'external') return 'EXT'
  return 'SRV'
}
function subText(node: AnyNode): string {
  if (node.nodeKind === 'l7') {
    const ip = (node as L7Node).ip
    const cnt = (node as L7Node).memberServerIds?.length ?? 0
    return [ip, `${cnt}개 서버`].filter(Boolean).join(' / ')
  }
  if (node.nodeKind === 'db') {
    const n = node as DBNode
    const conn = [n.host, n.port ? `:${n.port}` : ''].filter(Boolean).join('')
    return [n.dbType, conn].filter(Boolean).join(' · ')
  }
  if (node.nodeKind === 'external') {
    const cnt = (node as ExternalServiceNode).contacts?.length ?? 0
    return `담당자 ${cnt}명`
  }
  const s = node as Server
  return [s.internalIp, s.natIp].filter(Boolean).join(' / ')
}

const props = defineProps<{
  servers: Server[]
  l7Nodes: L7Node[]
  dbNodes: DBNode[]
  externalNodes: ExternalServiceNode[]
  selectedId: string | null
  readOnly: boolean
}>()

const emit = defineEmits<{
  select: [node: AnyNode]
  addServer: []
  addL7: []
  addDB: []
  addExternal: []
  edit: [node: AnyNode]
  delete: [node: AnyNode]
  exportJSON: []
  importJSON: [file: File]
}>()

const search = ref('')
const showMenu = ref(false)
const addWrapRef = ref<HTMLDivElement>()

const allItems = computed<AnyNode[]>(() => [
  ...props.servers,
  ...props.l7Nodes,
  ...props.dbNodes,
  ...props.externalNodes,
])

const filteredItems = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return allItems.value
  return allItems.value.filter(item => {
    if (item.name.toLowerCase().includes(q)) return true
    if (item.nodeKind !== 'l7' && item.nodeKind !== 'db' && item.nodeKind !== 'external') {
      return (item as Server).team?.toLowerCase().includes(q)
    }
    return false
  })
})

function toggleMenu() { showMenu.value = !showMenu.value }
function closeMenu(e: MouseEvent) {
  if (!addWrapRef.value?.contains(e.target as Node)) showMenu.value = false
}
onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))

function onImport(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('importJSON', file)
}
</script>

<style scoped>
.server-panel {
  display: flex; flex-direction: column; height: 100%;
  background: #1e293b; border-right: 1px solid #334155;
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid #334155; gap: 8px;
}
.panel-header h2 {
  font-size: 14px; font-weight: 700; color: #f1f5f9; margin: 0;
  display: flex; align-items: center; gap: 6px;
}
.count-badge {
  background: #334155; color: #94a3b8; border-radius: 10px;
  padding: 1px 6px; font-size: 11px; font-weight: 600;
}
.add-wrap { position: relative; }
.btn-add {
  background: #2563eb; color: #fff; border: none; border-radius: 6px;
  padding: 5px 10px; font-size: 12px; cursor: pointer; font-weight: 600; white-space: nowrap;
}
.btn-add:hover { background: #1d4ed8; }
.add-menu {
  position: absolute; right: 0; top: calc(100% + 4px);
  background: #1e293b; border: 1px solid #334155; border-radius: 8px;
  padding: 4px 0; z-index: 300; min-width: 130px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.add-menu button {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 14px; background: none; border: none;
  color: #e2e8f0; font-size: 13px; cursor: pointer; text-align: left;
}
.add-menu button:hover { background: #273549; }
.menu-icon { color: #94a3b8; flex-shrink: 0; }
.search-box {
  padding: 8px 12px; border-bottom: 1px solid #334155;
}
.search-box input {
  width: 100%; background: #0f172a; border: 1px solid #334155;
  border-radius: 6px; padding: 6px 10px; color: #e2e8f0; font-size: 12px; box-sizing: border-box;
}
.node-list {
  list-style: none; margin: 0; padding: 8px 0; flex: 1; overflow-y: auto;
}
.node-card {
  margin: 0 10px 6px; padding: 9px 10px;
  background: #0f172a; border: 1px solid #334155; border-radius: 8px;
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
  display: flex; flex-direction: column; gap: 3px;
}
.node-card:hover { border-color: #475569; background: #111c2d; }
.node-card.selected { border-color: #3b82f6; background: #0f1f3d; }
.card-row1 { display: flex; align-items: center; justify-content: space-between; }
.badges { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.type-badge {
  font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 800; letter-spacing: 0.03em;
}
.type-badge.server, .type-badge.undefined { background: #1e3a5f; color: #93c5fd; }
.type-badge.l7 { background: #3b0764; color: #e9d5ff; }
.type-badge.db { background: #0c2040; color: #7dd3fc; }
.type-badge.external { background: #052e16; color: #86efac; }
.env-badge {
  font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 700;
}
.env-badge.prod { background: #1d4ed8; color: #bfdbfe; }
.env-badge.staging { background: #b45309; color: #fef3c7; }
.env-badge.dev { background: #065f46; color: #a7f3d0; }
.card-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.node-card:hover .card-actions { opacity: 1; }
.card-actions button {
  background: none; border: none; color: #64748b; cursor: pointer;
  padding: 1px 4px; font-size: 13px; border-radius: 3px;
}
.card-actions button:hover { background: #334155; color: #e2e8f0; }
.card-actions button.danger:hover { color: #ef4444; }
.card-name {
  font-size: 13px; font-weight: 600; color: #f1f5f9;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-sub {
  font-size: 10px; color: #475569;
  font-family: 'Menlo', 'Consolas', monospace;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.empty {
  padding: 16px; color: #475569; font-size: 13px; text-align: center;
}
.panel-footer {
  display: flex; gap: 8px; padding: 10px 12px; border-top: 1px solid #334155;
}
.btn-secondary {
  background: #334155; color: #e2e8f0; border: none; border-radius: 6px;
  padding: 6px 10px; font-size: 11px; cursor: pointer; flex: 1; text-align: center;
}
.btn-secondary:hover { background: #475569; }
</style>
