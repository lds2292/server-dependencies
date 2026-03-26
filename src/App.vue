<template>
  <div class="app-layout">
    <aside class="sidebar">
      <ServerPanel
        :servers="store.servers"
        :l7-nodes="store.l7Nodes"
        :db-nodes="store.dbNodes"
        :external-nodes="store.externalNodes"
        :selected-id="selectedNode?.id ?? null"
        :read-only="readOnly"
        @select="onSelectNode"
        @add-server="openAddServerModal"
        @add-l7="openAddL7Modal"
        @add-d-b="openAddDBModal"
        @add-external="openAddExternalModal"
        @edit="onEditNode"
        @delete="onDeleteNode"
        @export-j-s-o-n="store.exportJSON"
        @import-j-s-o-n="store.importJSON"
      />
    </aside>

    <main class="main-area">
      <div class="toolbar">
        <span class="app-title">Server Dependencies</span>
        <div class="toolbar-right">
          <button class="btn-sample" @click="onSampleClick">Sample</button>
          <button
            :class="['btn-readonly', { active: readOnly }]"
            @click="readOnly = !readOnly"
            :data-tooltip="readOnly ? '편집 모드로 전환' : '읽기 전용으로 전환'"
            data-shortcut="E"
          >{{ readOnly ? 'Read Only' : 'Edit' }}</button>
        </div>
      </div>
      <div class="graph-wrap">
        <GraphCanvas
          ref="graphCanvasRef"
          :nodes="allNodes"
          :links="filteredLinks"
          :impacted-nodes="impactedNodeIds"
          :impacted-links="impactedLinkIds"
          :outgoing-links="outgoingLinkIds"
          :selected-id="selectedNode?.id ?? null"
          :read-only="readOnly"
          @node-click="onSelectNode"
          @edit-node="onEditNode"
          @delete-node="onDeleteNode"
          @add-dependency="openAddDepModal"
          @quick-connect="onQuickConnect"
          @add-node-at="onAddNodeAt"
        />
      </div>
    </main>

    <aside class="detail-panel">
      <ImpactPanel
        :selected-node="selectedNode"
        :all-nodes="allNodes"
        :dependencies="store.dependencies"
        :impacted-ids="impactedNodeIds"
        :read-only="readOnly"
        @remove-dependency="store.removeDependency"
        @add-dependency="openAddDepModal"
        @clear-selection="selectedNode = null"
      />
    </aside>

    <!-- 모달들 -->
    <ServerModal
      v-if="serverModal.visible"
      :server="serverModal.editing"
      :teams="existingTeams"
      :taken-names="allNodeNames"
      @close="serverModal.visible = false"
      @submit="onServerModalSubmit"
    />
    <L7Modal
      v-if="l7Modal.visible"
      :node="l7Modal.editing"
      :servers="store.servers"
      :taken-names="allNodeNames"
      @close="l7Modal.visible = false"
      @submit="onL7ModalSubmit"
    />
    <DBModal
      v-if="dbModal.visible"
      :node="dbModal.editing"
      :taken-names="allNodeNames"
      @close="dbModal.visible = false"
      @submit="onDBModalSubmit"
    />
    <ExternalServiceModal
      v-if="externalModal.visible"
      :node="externalModal.editing"
      :taken-names="allNodeNames"
      @close="externalModal.visible = false"
      @submit="onExternalModalSubmit"
    />
    <!-- Sample 로드 확인 다이얼로그 -->
    <transition name="toast-fade">
      <div v-if="sampleConfirm" class="delete-overlay" @click.self="sampleConfirm = false">
        <div class="delete-dialog">
          <div class="delete-dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1" stroke="#60a5fa" stroke-width="1.5"/>
              <rect x="14" y="3" width="7" height="7" rx="1" stroke="#60a5fa" stroke-width="1.5"/>
              <rect x="3" y="14" width="7" height="7" rx="1" stroke="#60a5fa" stroke-width="1.5"/>
              <rect x="14" y="14" width="7" height="7" rx="1" stroke="#60a5fa" stroke-width="1.5"/>
            </svg>
          </div>
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">샘플 데이터 불러오기</div>
            <div class="delete-dialog-desc">
              현재 데이터가 샘플로 교체됩니다.<br/>기존 작업 내용은 사라집니다.
            </div>
          </div>
          <div class="delete-dialog-actions">
            <button class="delete-btn-cancel" @click="sampleConfirm = false">취소</button>
            <button class="delete-btn-confirm" style="background:#0f2044;border-color:#3b82f6;color:#93c5fd" @click="loadSample">불러오기</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 노드 삭제 확인 다이얼로그 -->
    <transition name="toast-fade">
      <div v-if="deleteConfirm.visible" class="delete-overlay" @click.self="cancelDelete">
        <div class="delete-dialog">
          <div class="delete-dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">노드 삭제</div>
            <div class="delete-dialog-desc">
              <span class="delete-node-kind">{{ nodeKindLabel(deleteConfirm.node!) }}</span>
              <span class="delete-node-name">{{ deleteConfirm.node!.name }}</span>
              을(를) 삭제합니다.<br/>연결된 의존성도 함께 제거됩니다.
            </div>
          </div>
          <div class="delete-dialog-actions">
            <button class="delete-btn-cancel" @click="cancelDelete">취소</button>
            <button class="delete-btn-confirm" @click="confirmDelete">삭제</button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="toast-fade">
      <div v-if="toastMsg" class="app-toast">{{ toastMsg }}</div>
    </transition>
    <DependencyModal
      v-if="depModal.visible"
      :nodes="allNodes"
      :default-source="depModal.defaultSource"
      :default-target="depModal.defaultTarget"
      :existing-dependencies="store.dependencies"
      @close="depModal.visible = false"
      @submit="onDepModalSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGraphStore } from './stores/graph'
import { sampleData } from './data/sampleData'
import GraphCanvas from './components/GraphCanvas.vue'
import ServerPanel from './components/ServerPanel.vue'
import ServerModal from './components/ServerModal.vue'
import L7Modal from './components/L7Modal.vue'
import DBModal from './components/DBModal.vue'
import ExternalServiceModal from './components/ExternalServiceModal.vue'
import DependencyModal from './components/DependencyModal.vue'
import ImpactPanel from './components/ImpactPanel.vue'
import type { Server, L7Node, DBNode, ExternalServiceNode, AnyNode, Dependency, D3Link } from './types'

const store = useGraphStore()
const selectedNode = ref<AnyNode | null>(null)
const readOnly = ref(false)
const graphCanvasRef = ref<InstanceType<typeof GraphCanvas> | null>(null)

const allNodes = computed<AnyNode[]>(() => [
  ...store.servers, ...store.l7Nodes, ...store.dbNodes, ...store.externalNodes,
])

const d3Links = computed<D3Link[]>(() =>
  store.dependencies.map(d => ({ id: d.id, source: d.source, target: d.target, type: d.type, description: d.description }))
)

const filteredLinks = computed<D3Link[]>(() => {
  const ids = new Set(allNodes.value.map(n => n.id))
  return d3Links.value.filter(l => ids.has(l.source as string) && ids.has(l.target as string))
})

const impactedNodeIds = computed(() =>
  selectedNode.value ? store.getImpactedNodes(selectedNode.value.id) : new Set<string>()
)
const impactedLinkIds = computed(() => {
  if (!selectedNode.value) return new Set<string>()
  const ids = impactedNodeIds.value
  const tid = selectedNode.value.id
  return new Set(store.dependencies.filter(d => ids.has(d.source) && (ids.has(d.target) || d.target === tid)).map(d => d.id))
})

const outgoingLinkIds = computed(() => {
  if (!selectedNode.value) return new Set<string>()
  const sid = selectedNode.value.id
  return new Set(store.dependencies.filter(d => d.source === sid).map(d => d.id))
})

const existingTeams = computed(() => [...new Set(store.servers.map(s => s.team).filter(Boolean))])

const allNodeNames = computed(() => new Set([
  ...store.servers.map(s => s.name),
  ...store.l7Nodes.map(n => n.name),
  ...store.dbNodes.map(n => n.name),
  ...store.externalNodes.map(n => n.name),
]))

function onSelectNode(node: AnyNode) {
  selectedNode.value = selectedNode.value?.id === node.id ? null : node
}
function onEditNode(node: AnyNode) {
  if (node.nodeKind === 'l7') openEditL7Modal(node as L7Node)
  else if (node.nodeKind === 'db') openEditDBModal(node as DBNode)
  else if (node.nodeKind === 'external') openEditExternalModal(node as ExternalServiceNode)
  else openEditServerModal(node as Server)
}
// ─── 노드 삭제 확인 다이얼로그 ───────────────────────────
const deleteConfirm = ref<{ visible: boolean; node: AnyNode | null }>({ visible: false, node: null })

function onDeleteNode(node: AnyNode) {
  deleteConfirm.value = { visible: true, node }
}

function confirmDelete() {
  const node = deleteConfirm.value.node
  if (!node) return
  if (node.nodeKind === 'l7') store.deleteL7Node(node.id)
  else if (node.nodeKind === 'db') store.deleteDBNode(node.id)
  else if (node.nodeKind === 'external') store.deleteExternalNode(node.id)
  else store.deleteServer(node.id)
  if (selectedNode.value?.id === node.id) selectedNode.value = null
  deleteConfirm.value = { visible: false, node: null }
}

function cancelDelete() {
  deleteConfirm.value = { visible: false, node: null }
}

function nodeKindLabel(node: AnyNode): string {
  if (node.nodeKind === 'l7') return 'L7 로드밸런서'
  if (node.nodeKind === 'db') return 'DB'
  if (node.nodeKind === 'external') return '외부 서비스'
  return '서버'
}

// Server Modal
const serverModal = ref<{ visible: boolean; editing: Server | null }>({ visible: false, editing: null })
function openAddServerModal() { serverModal.value = { visible: true, editing: null } }
function openEditServerModal(s: Server) { serverModal.value = { visible: true, editing: s } }
function onServerModalSubmit(data: Omit<Server, 'id'>) {
  if (serverModal.value.editing) store.updateServer(serverModal.value.editing.id, data)
  else store.addServer(data)
  serverModal.value.visible = false
}

// L7 Modal
const l7Modal = ref<{ visible: boolean; editing: L7Node | null }>({ visible: false, editing: null })
function openAddL7Modal() { l7Modal.value = { visible: true, editing: null } }
function openEditL7Modal(n: L7Node) { l7Modal.value = { visible: true, editing: n } }
function onL7ModalSubmit(data: Omit<L7Node, 'id'>) {
  if (l7Modal.value.editing) store.updateL7Node(l7Modal.value.editing.id, data)
  else store.addL7Node(data)
  l7Modal.value.visible = false
}

// DB Modal
const dbModal = ref<{ visible: boolean; editing: DBNode | null }>({ visible: false, editing: null })
function openAddDBModal() { dbModal.value = { visible: true, editing: null } }
function openEditDBModal(n: DBNode) { dbModal.value = { visible: true, editing: n } }
function onDBModalSubmit(data: Omit<DBNode, 'id'>) {
  if (dbModal.value.editing) store.updateDBNode(dbModal.value.editing.id, data)
  else store.addDBNode(data)
  dbModal.value.visible = false
}

// External Modal
const externalModal = ref<{ visible: boolean; editing: ExternalServiceNode | null }>({ visible: false, editing: null })
function openAddExternalModal() { externalModal.value = { visible: true, editing: null } }
function openEditExternalModal(n: ExternalServiceNode) { externalModal.value = { visible: true, editing: n } }
function onExternalModalSubmit(data: Omit<ExternalServiceNode, 'id'>) {
  if (externalModal.value.editing) store.updateExternalNode(externalModal.value.editing.id, data)
  else store.addExternalNode(data)
  externalModal.value.visible = false
}

// Toast
const toastMsg = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2500)
}

// Dependency Modal
const depModal = ref<{ visible: boolean; defaultSource: string; defaultTarget: string }>({ visible: false, defaultSource: '', defaultTarget: '' })
function onAddNodeAt(nodeKind: 'server' | 'l7' | 'db' | 'external') {
  if (nodeKind === 'l7') openAddL7Modal()
  else if (nodeKind === 'db') openAddDBModal()
  else if (nodeKind === 'external') openAddExternalModal()
  else openAddServerModal()
}

function openAddDepModal(node?: AnyNode) { depModal.value = { visible: true, defaultSource: node?.id ?? '', defaultTarget: '' } }
function onQuickConnect(source: AnyNode, target: AnyNode) {
  const isDuplicate = store.dependencies.some(d => d.source === source.id && d.target === target.id)
  if (isDuplicate) {
    showToast('이미 동일한 의존성이 존재합니다')
    return
  }
  depModal.value = { visible: true, defaultSource: source.id, defaultTarget: target.id }
}
function onDepModalSubmit(data: Omit<Dependency, 'id'>) {
  const result = store.addDependency(data)
  if (!result) showToast('이미 동일한 의존성이 존재합니다')
  depModal.value.visible = false
}

// ─── 샘플 데이터 ─────────────────────────────────────────
const sampleConfirm = ref(false)
const hasData = computed(() =>
  store.servers.length + store.l7Nodes.length + store.dbNodes.length + store.externalNodes.length > 0
)

function onSampleClick() {
  if (hasData.value) {
    sampleConfirm.value = true
  } else {
    loadSample()
  }
}

function loadSample() {
  localStorage.removeItem('server-dependencies-positions')
  store.loadData(sampleData)
  selectedNode.value = null
  sampleConfirm.value = false
}

// ─── 키보드 단축키 ───────────────────────────────────────
function handleKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
  if (e.key === 'e' || e.key === 'E') {
    readOnly.value = !readOnly.value
  }
  if (e.key === 'f' || e.key === 'F') {
    graphCanvasRef.value?.toggleTracking()
  }
  if (e.key === 'Delete' && selectedNode.value && !readOnly.value) {
    onDeleteNode(selectedNode.value)
  }
}
onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; }
</style>

<style scoped>
.app-layout { display: grid; grid-template-columns: 250px 1fr 270px; height: 100vh; overflow: hidden; }
.sidebar, .detail-panel { height: 100vh; overflow: hidden; }
.main-area { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; border-bottom: 1px solid #1e293b; flex-shrink: 0;
}
.app-title { font-size: 15px; font-weight: 700; color: #f1f5f9; letter-spacing: 0.02em; }
.toolbar-right { display: flex; align-items: center; gap: 10px; }
.btn-sample {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;
  border: 1px solid #1d4ed8; background: #0f2044; color: #60a5fa;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-sample:hover { background: #1e3a8a; border-color: #3b82f6; color: #93c5fd; }
.btn-readonly {
  position: relative;
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;
  border: 1px solid #334155; background: #1e293b; color: #94a3b8;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-readonly:hover { border-color: #475569; color: #e2e8f0; }
.btn-readonly.active { background: #2d1b69; border-color: #7c3aed; color: #c4b5fd; }

/* 단축키 툴팁 */
[data-tooltip] { position: relative; }
[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 400;
  padding: 5px 9px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 300;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
[data-tooltip][data-shortcut]::after {
  content: attr(data-shortcut);
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  margin-top: 22px;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 4px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 300;
  letter-spacing: 0.05em;
}
[data-tooltip]:hover::before,
[data-tooltip]:hover::after { opacity: 1; }
.graph-wrap { flex: 1; padding: 16px; overflow: hidden; }
.app-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 10px;
  padding: 12px 24px; font-size: 14px; color: #fca5a5; font-weight: 600;
  z-index: 500; white-space: nowrap; box-shadow: 0 4px 20px rgba(239,68,68,0.25);
  pointer-events: none;
}
.toast-fade-enter-active { transition: opacity 0.2s; }
.toast-fade-leave-active { transition: opacity 0.4s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }

.delete-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 600;
  backdrop-filter: blur(2px);
}
.delete-dialog {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 24px;
  width: 340px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; gap: 16px;
}
.delete-dialog-icon {
  display: flex; justify-content: center;
}
.delete-dialog-body {
  display: flex; flex-direction: column; gap: 8px; text-align: center;
}
.delete-dialog-title {
  font-size: 16px; font-weight: 700; color: #f1f5f9;
}
.delete-dialog-desc {
  font-size: 13px; color: #94a3b8; line-height: 1.6;
}
.delete-node-kind {
  color: #64748b; font-size: 11px; font-weight: 600;
  background: #0f172a; border: 1px solid #334155;
  border-radius: 4px; padding: 1px 6px; margin-right: 4px;
  vertical-align: middle;
}
.delete-node-name {
  color: #f1f5f9; font-weight: 700;
}
.delete-dialog-actions {
  display: flex; gap: 8px;
}
.delete-btn-cancel {
  flex: 1; padding: 8px; border-radius: 7px;
  background: #0f172a; border: 1px solid #334155;
  color: #94a3b8; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.delete-btn-cancel:hover { border-color: #475569; color: #e2e8f0; }
.delete-btn-confirm {
  flex: 1; padding: 8px; border-radius: 7px;
  background: #450a0a; border: 1px solid #ef4444;
  color: #fca5a5; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.15s;
}
.delete-btn-confirm:hover { background: #7f1d1d; color: #fecaca; }
</style>
