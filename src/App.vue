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
          <button
            :class="['btn-readonly', { active: readOnly }]"
            @click="readOnly = !readOnly"
          >{{ readOnly ? '🔒 Read Only' : '✏️ Edit' }}</button>
        </div>
      </div>
      <div class="graph-wrap">
        <GraphCanvas
          ref="graphCanvasRef"
          :nodes="allNodes"
          :links="filteredLinks"
          :impacted-nodes="impactedNodeIds"
          :impacted-links="impactedLinkIds"
          :selected-id="selectedNode?.id ?? null"
          :read-only="readOnly"
          @node-click="onSelectNode"
          @edit-node="onEditNode"
          @delete-node="onDeleteNode"
          @add-dependency="openAddDepModal"
          @quick-connect="onQuickConnect"
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
    <DependencyModal
      v-if="depModal.visible"
      :nodes="allNodes"
      :default-source="depModal.defaultSource"
      :default-target="depModal.defaultTarget"
      @close="depModal.visible = false"
      @submit="onDepModalSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGraphStore } from './stores/graph'
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
function onDeleteNode(node: AnyNode) {
  if (node.nodeKind === 'l7') store.deleteL7Node(node.id)
  else if (node.nodeKind === 'db') store.deleteDBNode(node.id)
  else if (node.nodeKind === 'external') store.deleteExternalNode(node.id)
  else store.deleteServer(node.id)
  if (selectedNode.value?.id === node.id) selectedNode.value = null
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

// Dependency Modal
const depModal = ref<{ visible: boolean; defaultSource: string; defaultTarget: string }>({ visible: false, defaultSource: '', defaultTarget: '' })
function openAddDepModal(node?: AnyNode) { depModal.value = { visible: true, defaultSource: node?.id ?? '', defaultTarget: '' } }
function onQuickConnect(source: AnyNode, target: AnyNode) { depModal.value = { visible: true, defaultSource: source.id, defaultTarget: target.id } }
function onDepModalSubmit(data: Omit<Dependency, 'id'>) {
  store.addDependency(data)
  depModal.value.visible = false
}
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
.btn-readonly {
  font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 6px;
  border: 1px solid #334155; background: #1e293b; color: #94a3b8;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-readonly:hover { border-color: #475569; color: #e2e8f0; }
.btn-readonly.active { background: #2d1b69; border-color: #7c3aed; color: #c4b5fd; }
.graph-wrap { flex: 1; padding: 16px; overflow: hidden; }
</style>
