<template>
  <div class="app-layout" :style="{ gridTemplateColumns: `250px 1fr ${detailPanelOpen ? '270px' : '28px'}` }">
    <aside class="sidebar">
      <ServerPanel
        :servers="store.servers"
        :l7-nodes="store.l7Nodes"
        :infra-nodes="store.infraNodes"
        :external-nodes="store.externalNodes"
        :selected-id="selectedNode?.id ?? null"
        :read-only="readOnly"
        @select="onSelectNode"
        @add-server="openAddServerModal"
        @add-l7="openAddL7Modal"
        @add-infra="openAddInfraModal"
        @add-external="openAddExternalModal"
        @edit="onEditNode"
        @delete="onDeleteNode"
        @export-j-s-o-n="store.exportJSON"
        @import-j-s-o-n="store.importJSON"
      />
    </aside>

    <main class="main-area">
      <div class="toolbar">
        <div class="title-group">
          <span class="app-title">Server Dependencies</span>
          <button class="btn-help" @click="showHelp = true" title="사용 방법">?</button>
        </div>
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
          :path-nodes="pathNodeIds"
          :path-links="pathLinkIds"
          :path-source-name="pathSource?.name ?? ''"
          :path-mode="pathMode"
          :cycle-nodes="cycleNodeIds"
          @node-click="onSelectNode"
          @deselect="selectedNode = null"
          @edit-node="onEditNode"
          @delete-node="onDeleteNode"
          @delete-nodes="onDeleteNodes"
          @add-dependency="openAddDepModal"
          @quick-connect="onQuickConnect"
          @add-node-at="onAddNodeAt"
          @start-path-from="onStartPathFrom"
          @cancel-path-mode="onCancelPathMode"
        />
      </div>
    </main>

    <aside :class="['detail-panel', { collapsed: !detailPanelOpen }]">
      <button class="detail-toggle" @click="detailPanelOpen = !detailPanelOpen" :title="detailPanelOpen ? '패널 접기' : '패널 열기'">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path :d="detailPanelOpen ? 'M3 2l6 4-6 4' : 'M9 2L3 6l6 4'" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-if="detailPanelOpen" class="detail-panel-content">
        <ImpactPanel
          :selected-node="selectedNode"
          :all-nodes="allNodes"
          :dependencies="store.dependencies"
          :impacted-ids="impactedNodeIds"
          :read-only="readOnly"
          @remove-dependency="store.removeDependency"
          @add-dependency="openAddDepModal"
          @clear-selection="selectedNode = null"
          @navigate-to="graphCanvasRef?.navigateTo($event)"
        />
      </div>
    </aside>

    <!-- 단축키 오버레이 -->
    <transition name="shortcuts-fade">
      <div v-if="showShortcuts" class="shortcuts-overlay" @click.self="showShortcuts = false">
        <div class="shortcuts-modal">
          <div class="shortcuts-header">
            <span class="shortcuts-title">키보드 단축키</span>
            <button class="shortcuts-close" @click="showShortcuts = false">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div class="shortcuts-section-title">전역</div>
          <div class="shortcuts-grid">
            <div class="shortcut-row"><kbd>Cmd+Z</kbd><span>실행 취소</span></div>
            <div class="shortcut-row"><kbd>Cmd+Shift+Z</kbd><span>다시 실행</span></div>
            <div class="shortcut-row"><kbd>E</kbd><span>Edit / Read Only 전환</span></div>
            <div class="shortcut-row"><kbd>F</kbd><span>노드 트래킹 ON/OFF</span></div>
            <div class="shortcut-row"><kbd>Delete</kbd><span>선택 노드 삭제</span></div>
            <div class="shortcut-row"><kbd>?</kbd><span>이 창 열기/닫기</span></div>
            <div class="shortcut-row"><kbd>Esc</kbd><span>이 창 닫기 / 선택 해제</span></div>
          </div>
          <div class="shortcuts-section-title">그래프 캔버스</div>
          <div class="shortcuts-grid">
            <div class="shortcut-row"><kbd>더블클릭</kbd><span>노드 추가 메뉴</span></div>
            <div class="shortcut-row"><kbd>Ctrl</kbd><span>+ 드래그로 의존성 연결</span></div>
            <div class="shortcut-row"><kbd>빈 공간 클릭</kbd><span>선택 해제</span></div>
            <div class="shortcut-row"><kbd>우클릭</kbd><span>노드 컨텍스트 메뉴</span></div>
          </div>
          <div class="shortcuts-section-title">미니맵</div>
          <div class="shortcuts-grid">
            <div class="shortcut-row"><kbd>클릭 / 드래그</kbd><span>해당 위치로 이동</span></div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 도움말 팝업 -->
    <transition name="shortcuts-fade">
      <div v-if="showHelp" class="shortcuts-overlay" @click.self="showHelp = false">
        <div class="help-modal">
          <div class="shortcuts-header">
            <span class="shortcuts-title">사용 방법</span>
            <button class="shortcuts-close" @click="showHelp = false">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <div class="help-body">
            <div class="help-col">
              <div class="shortcuts-section-title">노드 종류</div>
              <div class="help-node-list">
                <div class="help-node-item">
                  <span class="help-node-badge server">SRV</span>
                  <div>
                    <div class="help-node-name">서버</div>
                    <div class="help-node-desc">API, 웹, 배치 등 일반 서버</div>
                  </div>
                </div>
                <div class="help-node-item">
                  <span class="help-node-badge l7">L7</span>
                  <div>
                    <div class="help-node-name">L7 로드밸런서</div>
                    <div class="help-node-desc">여러 서버를 묶는 로드밸런서</div>
                  </div>
                </div>
                <div class="help-node-item">
                  <span class="help-node-badge infra">DB</span>
                  <div>
                    <div class="help-node-name">인프라</div>
                    <div class="help-node-desc">DB, 캐시, 메시지큐 등</div>
                  </div>
                </div>
                <div class="help-node-item">
                  <span class="help-node-badge ext">EXT</span>
                  <div>
                    <div class="help-node-name">외부 서비스</div>
                    <div class="help-node-desc">외부 API, SaaS 등 외부 의존</div>
                  </div>
                </div>
              </div>

              <div class="shortcuts-section-title">의존성 분석</div>
              <div class="help-desc-list">
                <div class="help-desc-item">
                  <span class="help-dot red"></span>
                  노드 선택 시 해당 노드에 의존하는 서버를 빨간색으로 표시 (영향 범위)
                </div>
                <div class="help-desc-item">
                  <span class="help-dot green"></span>
                  선택 노드에서 나가는 의존성을 초록색으로 표시
                </div>
                <div class="help-desc-item">
                  <span class="help-dot amber"></span>
                  우클릭 > 경로 탐색으로 두 노드 간 의존 경로를 추적
                </div>
              </div>
            </div>

            <div class="help-divider"></div>

            <div class="help-col">
              <div class="shortcuts-section-title">그래프 조작</div>
              <div class="shortcuts-grid">
                <div class="shortcut-row"><kbd>드래그 (빈 공간)</kbd><span>다중 노드 박스 선택</span></div>
                <div class="shortcut-row"><kbd>Space</kbd><span>+ 드래그로 캔버스 이동</span></div>
                <div class="shortcut-row"><kbd>Ctrl</kbd><span>+ 노드 드래그로 의존성 연결</span></div>
                <div class="shortcut-row"><kbd>더블클릭</kbd><span>빈 공간에 노드 추가</span></div>
                <div class="shortcut-row"><kbd>우클릭</kbd><span>노드 컨텍스트 메뉴</span></div>
                <div class="shortcut-row"><kbd>휠</kbd><span>줌 인 / 아웃</span></div>
                <div class="shortcut-row"><kbd>미니맵 클릭</kbd><span>해당 위치로 이동</span></div>
              </div>

              <div class="shortcuts-section-title">키보드 단축키</div>
              <div class="shortcuts-grid">
                <div class="shortcut-row"><kbd>Cmd+Z</kbd><span>실행 취소 (Undo)</span></div>
                <div class="shortcut-row"><kbd>Cmd+Shift+Z</kbd><span>다시 실행 (Redo)</span></div>
                <div class="shortcut-row"><kbd>E</kbd><span>Edit / Read Only 전환</span></div>
                <div class="shortcut-row"><kbd>F</kbd><span>노드 트래킹 ON / OFF</span></div>
                <div class="shortcut-row"><kbd>Delete</kbd><span>선택 노드 삭제</span></div>
                <div class="shortcut-row"><kbd>?</kbd><span>단축키 목록 열기</span></div>
                <div class="shortcut-row"><kbd>Esc</kbd><span>선택 해제 / 팝업 닫기</span></div>
              </div>

              <div class="shortcuts-section-title">사이드바</div>
              <div class="shortcuts-grid">
                <div class="shortcut-row"><kbd>+ 버튼</kbd><span>노드 추가</span></div>
                <div class="shortcut-row"><kbd>JSON 내보내기</kbd><span>현재 그래프 저장</span></div>
                <div class="shortcut-row"><kbd>JSON 불러오기</kbd><span>저장된 그래프 복원</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

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
    <InfraModal
      v-if="infraModal.visible"
      :node="infraModal.editing"
      :taken-names="allNodeNames"
      @close="infraModal.visible = false"
      @submit="onInfraModalSubmit"
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

    <!-- 다중 노드 삭제 확인 다이얼로그 -->
    <transition name="toast-fade">
      <div v-if="deleteMultiConfirm.visible" class="delete-overlay" @click.self="cancelDeleteMulti">
        <div class="delete-dialog">
          <div class="delete-dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">노드 {{ deleteMultiConfirm.nodeIds.length }}개 삭제</div>
            <div class="delete-dialog-desc">
              선택된 <strong style="color:#f1f5f9">{{ deleteMultiConfirm.nodeIds.length }}개</strong>의 노드를 삭제합니다.<br/>연결된 의존성도 함께 제거됩니다.
            </div>
          </div>
          <div class="delete-dialog-actions">
            <button class="delete-btn-cancel" @click="cancelDeleteMulti">취소</button>
            <button class="delete-btn-confirm" @click="confirmDeleteMulti">삭제</button>
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
import InfraModal from './components/InfraModal.vue'
import ExternalServiceModal from './components/ExternalServiceModal.vue'
import DependencyModal from './components/DependencyModal.vue'
import ImpactPanel from './components/ImpactPanel.vue'
import type { Server, L7Node, InfraNode, ExternalServiceNode, AnyNode, Dependency, D3Link } from './types'

const store = useGraphStore()
const selectedNode = ref<AnyNode | null>(null)
const readOnly = ref(false)
const showShortcuts = ref(false)
const showHelp = ref(false)
const detailPanelOpen = ref(true)
const pathSource = ref<AnyNode | null>(null)
const pathMode = ref(false)
const pathNodeIds = ref(new Set<string>())
const pathLinkIds = ref(new Set<string>())
const graphCanvasRef = ref<InstanceType<typeof GraphCanvas> | null>(null)

const allNodes = computed<AnyNode[]>(() => [
  ...store.servers, ...store.l7Nodes, ...store.infraNodes, ...store.externalNodes,
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

const cycleNodeIds = computed(() => store.getCycleNodes())
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
  ...store.infraNodes.map(n => n.name),
  ...store.externalNodes.map(n => n.name),
]))

function onSelectNode(node: AnyNode) {
  if (pathMode.value) {
    if (node.id === pathSource.value?.id) { onCancelPathMode(); return }
    applyPath(node)
    return
  }
  if (pathNodeIds.value.size > 0) onCancelPathMode()
  selectedNode.value = selectedNode.value?.id === node.id ? null : node
}

function onStartPathFrom(node: AnyNode) {
  if (node.nodeKind === 'l7') return
  pathSource.value = node
  pathMode.value = true
  pathNodeIds.value = new Set()
  pathLinkIds.value = new Set()
  selectedNode.value = null
}

function onCancelPathMode() {
  pathSource.value = null
  pathMode.value = false
  pathNodeIds.value = new Set()
  pathLinkIds.value = new Set()
}

function applyPath(targetNode: AnyNode) {
  if (!pathSource.value) return
  if (targetNode.nodeKind === 'l7') { showToast('L7 노드는 경로 탐색에 사용할 수 없습니다'); return }
  const path = store.findPath(pathSource.value.id, targetNode.id)
  if (!path || path.length < 2) {
    showToast('연결된 경로가 없습니다')
    return
  }
  pathNodeIds.value = new Set(path)
  const linkIds = new Set<string>()
  for (let i = 0; i < path.length - 1; i++) {
    const dep = store.dependencies.find(d => d.source === path[i] && d.target === path[i + 1])
    if (dep) linkIds.add(dep.id)
  }
  pathLinkIds.value = linkIds
  pathMode.value = false
}
function onEditNode(node: AnyNode) {
  if (node.nodeKind === 'l7') openEditL7Modal(node as L7Node)
  else if (node.nodeKind === 'infra') openEditInfraModal(node as InfraNode)
  else if (node.nodeKind === 'external') openEditExternalModal(node as ExternalServiceNode)
  else openEditServerModal(node as Server)
}
// ─── 노드 삭제 확인 다이얼로그 ───────────────────────────
const deleteConfirm = ref<{ visible: boolean; node: AnyNode | null }>({ visible: false, node: null })
const deleteMultiConfirm = ref<{ visible: boolean; nodeIds: string[] }>({ visible: false, nodeIds: [] })

function onDeleteNode(node: AnyNode) {
  deleteConfirm.value = { visible: true, node }
}

function confirmDelete() {
  const node = deleteConfirm.value.node
  if (!node) return
  if (node.nodeKind === 'l7') store.deleteL7Node(node.id)
  else if (node.nodeKind === 'infra') store.deleteInfraNode(node.id)
  else if (node.nodeKind === 'external') store.deleteExternalNode(node.id)
  else store.deleteServer(node.id)
  if (selectedNode.value?.id === node.id) selectedNode.value = null
  deleteConfirm.value = { visible: false, node: null }
}

function cancelDelete() {
  deleteConfirm.value = { visible: false, node: null }
}

function onDeleteNodes(nodeIds: string[]) {
  deleteMultiConfirm.value = { visible: true, nodeIds }
}

function confirmDeleteMulti() {
  store.beginBatch()
  for (const id of deleteMultiConfirm.value.nodeIds) {
    const node = allNodes.value.find(n => n.id === id)
    if (!node) continue
    if (node.nodeKind === 'l7') store.deleteL7Node(id)
    else if (node.nodeKind === 'infra') store.deleteInfraNode(id)
    else if (node.nodeKind === 'external') store.deleteExternalNode(id)
    else store.deleteServer(id)
  }
  store.endBatch()
  if (selectedNode.value && deleteMultiConfirm.value.nodeIds.includes(selectedNode.value.id)) {
    selectedNode.value = null
  }
  deleteMultiConfirm.value = { visible: false, nodeIds: [] }
}

function cancelDeleteMulti() {
  deleteMultiConfirm.value = { visible: false, nodeIds: [] }
}

function nodeKindLabel(node: AnyNode): string {
  if (node.nodeKind === 'l7') return 'L7 로드밸런서'
  if (node.nodeKind === 'infra') return '인프라'
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

// Infra Modal
const infraModal = ref<{ visible: boolean; editing: InfraNode | null }>({ visible: false, editing: null })
function openAddInfraModal() { infraModal.value = { visible: true, editing: null } }
function openEditInfraModal(n: InfraNode) { infraModal.value = { visible: true, editing: n } }
function onInfraModalSubmit(data: Omit<InfraNode, 'id'>) {
  if (infraModal.value.editing) store.updateInfraNode(infraModal.value.editing.id, data)
  else store.addInfraNode(data)
  infraModal.value.visible = false
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
function onAddNodeAt(nodeKind: 'server' | 'l7' | 'infra' | 'external') {
  if (nodeKind === 'l7') openAddL7Modal()
  else if (nodeKind === 'infra') openAddInfraModal()
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
  store.servers.length + store.l7Nodes.length + store.infraNodes.length + store.externalNodes.length > 0
)

function onSampleClick() {
  if (hasData.value) {
    sampleConfirm.value = true
  } else {
    loadSample()
  }
}

function loadSample() {
  // 타입별 레이어 배치: L7 → Web서버 → API LB → API서버 → 플랫폼/배치 → 인프라 → 외부
  const samplePositions: Record<string, { x: number; y: number }> = {
    // L7 — 각 서버 그룹 앞에 배치
    'sample-l2': { x: -900, y:    0 },  // web-lb
    'sample-l1': { x: -330, y:    0 },  // api-lb
    // 웹 서버 (Frontend)
    'sample-s3': { x: -620, y:  -80 },  // web-server-1
    'sample-s4': { x: -620, y:   80 },  // web-server-2
    // API 서버 (Backend)
    'sample-s1': { x:  -40, y:  -80 },  // api-server-1
    'sample-s2': { x:  -40, y:   80 },  // api-server-2
    // 플랫폼 / 배치 서버
    'sample-s5': { x:  250, y: -160 },  // auth-server
    'sample-s7': { x:  250, y:    0 },  // notification-server
    'sample-s6': { x:  250, y:  160 },  // batch-server
    // 인프라 (DB/Cache)
    'sample-d1': { x:  530, y: -220 },  // user-db
    'sample-d2': { x:  530, y:  -80 },  // product-db
    'sample-d3': { x:  530, y:   70 },  // session-db
    'sample-d4': { x:  530, y:  210 },  // analytics-db
    // 외부 서비스
    'sample-e2': { x:  800, y: -100 },  // Payment Gateway
    'sample-e1': { x:  800, y:   60 },  // Slack
    'sample-e3': { x:  800, y:  220 },  // SMS Gateway
  }
  localStorage.setItem('server-dependencies-positions', JSON.stringify(samplePositions))
  store.loadData(sampleData)
  selectedNode.value = null
  sampleConfirm.value = false
}

// ─── 키보드 단축키 ───────────────────────────────────────
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (pathMode.value || pathNodeIds.value.size > 0) { onCancelPathMode(); return }
    showShortcuts.value = false; return
  }
  if (e.key === '?') { showShortcuts.value = !showShortcuts.value; return }
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    if (store.undo()) showToast('실행 취소')
    return
  }
  if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    if (store.redo()) showToast('다시 실행')
    return
  }
  if (e.key === 'e' || e.key === 'E') {
    readOnly.value = !readOnly.value
  }
  if (e.key === 'f' || e.key === 'F') {
    graphCanvasRef.value?.toggleTracking()
  }
  if (e.key === 'Delete' && !readOnly.value) {
    const multiIds = graphCanvasRef.value?.multiSelectedIds
    if (multiIds && multiIds.size > 1) {
      onDeleteNodes(Array.from(multiIds))
    } else if (selectedNode.value) {
      onDeleteNode(selectedNode.value)
    }
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
.app-layout { display: grid; grid-template-columns: 250px 1fr 270px; height: 100vh; overflow: hidden; transition: grid-template-columns 0.25s ease; }
.sidebar { height: 100vh; overflow: hidden; }
.detail-panel {
  height: 100vh; overflow: hidden; position: relative;
  border-left: 1px solid #1e293b;
  transition: width 0.25s ease;
}
.detail-panel.collapsed { overflow: visible; }
.detail-panel-content { height: 100%; overflow: hidden; }
.detail-toggle {
  position: absolute; top: 50%; left: -12px; transform: translateY(-50%);
  width: 24px; height: 48px; z-index: 10;
  background: #1e293b; border: 1px solid #334155; border-radius: 6px;
  color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: color 0.15s, background 0.15s;
}
.detail-toggle:hover { background: #273549; color: #94a3b8; }
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

/* 단축키 오버레이 */
.shortcuts-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
}
.shortcuts-modal {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 14px; padding: 24px 28px; min-width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.shortcuts-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.shortcuts-title { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.shortcuts-close {
  background: none; border: none; cursor: pointer;
  color: #64748b; padding: 4px; display: flex; align-items: center;
}
.shortcuts-close:hover { color: #94a3b8; }
.shortcuts-section-title {
  font-size: 10px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #475569;
  margin: 16px 0 8px; padding-bottom: 5px;
  border-bottom: 1px solid #293548;
}
.shortcuts-section-title:first-of-type { margin-top: 0; }
.shortcuts-grid { display: flex; flex-direction: column; gap: 6px; }
.shortcut-row {
  display: flex; align-items: center; gap: 12px;
  font-size: 13px; color: #94a3b8;
}
.shortcut-row kbd {
  display: inline-block; background: #0f172a; border: 1px solid #334155;
  border-radius: 5px; padding: 2px 7px; font-size: 11px; font-weight: 600;
  color: #cbd5e1; font-family: inherit; white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 2px 0 #1e293b;
}
.shortcuts-fade-enter-active { transition: opacity 0.15s; }
.shortcuts-fade-leave-active { transition: opacity 0.15s; }
.shortcuts-fade-enter-from, .shortcuts-fade-leave-to { opacity: 0; }

/* 타이틀 + 도움말 버튼 */
.title-group { display: flex; align-items: center; gap: 8px; }
.btn-help {
  width: 20px; height: 20px; border-radius: 50%;
  border: 1px solid #334155; background: #1e293b;
  color: #64748b; font-size: 11px; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s; flex-shrink: 0; line-height: 1;
}
.btn-help:hover { border-color: #60a5fa; color: #60a5fa; background: #0f2044; }

/* 도움말 모달 */
.help-modal {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 14px; padding: 24px 28px;
  width: 700px; max-width: calc(100vw - 40px);
  max-height: calc(100vh - 60px); overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.help-body { display: flex; gap: 0; }
.help-col { flex: 1; min-width: 0; }
.help-divider {
  width: 1px; background: #293548; margin: 0 24px; flex-shrink: 0;
}
.help-node-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
.help-node-item { display: flex; align-items: flex-start; gap: 10px; }
.help-node-badge {
  font-size: 9px; font-weight: 800; letter-spacing: 0.05em;
  padding: 3px 6px; border-radius: 4px; flex-shrink: 0; margin-top: 1px;
}
.help-node-badge.server { background: #1e3a8a; color: #93c5fd; border: 1px solid #1d4ed8; }
.help-node-badge.l7    { background: #3b0764; color: #d8b4fe; border: 1px solid #7c3aed; }
.help-node-badge.infra { background: #f0f9ff; color: #0369a1; border: 1px solid #7dd3fc; }
.help-node-badge.ext   { background: #052e16; color: #86efac; border: 1px solid #16a34a; }
.help-node-name { font-size: 12px; font-weight: 600; color: #e2e8f0; margin-bottom: 2px; }
.help-node-desc { font-size: 11px; color: #64748b; line-height: 1.4; }
.help-desc-list { display: flex; flex-direction: column; gap: 7px; }
.help-desc-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: #94a3b8; line-height: 1.5;
}
.help-dot {
  width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
}
.help-dot.red   { background: #ef4444; }
.help-dot.green { background: #22c55e; }
.help-dot.amber { background: #f59e0b; }
</style>
