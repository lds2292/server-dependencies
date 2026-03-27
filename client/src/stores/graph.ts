import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { Server, L7Node, InfraNode, ExternalServiceNode, AnyNode, Dependency, GraphData } from '../types'
import { graphApi, type PositionMap } from '../api/graphApi'

type Snapshot = {
  data: GraphData
  positions: PositionMap
}

function generateId(): string {
  return crypto.randomUUID()
}

function migrateDependencyTypes(data: GraphData): GraphData {
  const typeMap: Record<string, string> = { db: 'tcp', queue: 'other' }
  return {
    ...data,
    dependencies: data.dependencies.map(d =>
      typeMap[d.type] ? { ...d, type: typeMap[d.type] as 'http' | 'tcp' | 'websocket' | 'other' } : d
    ),
  }
}

export const useGraphStore = defineStore('graph', () => {
  const currentProjectId = ref<string | null>(null)
  const servers = ref<Server[]>([])
  const l7Nodes = ref<L7Node[]>([])
  const infraNodes = ref<InfraNode[]>([])
  const externalNodes = ref<ExternalServiceNode[]>([])
  const dependencies = ref<Dependency[]>([])
  const currentPositions = ref<PositionMap>({})

  // --- Undo / Redo ---
  const MAX_HISTORY = 100
  const undoStack = ref<Snapshot[]>([])
  const redoStack = ref<Snapshot[]>([])
  let batchActive = false

  const canUndo = computed(() => undoStack.value.length > 0)
  const canRedo = computed(() => redoStack.value.length > 0)

  function currentSnapshot(): Snapshot {
    return {
      data: {
        servers: JSON.parse(JSON.stringify(servers.value)),
        l7Nodes: JSON.parse(JSON.stringify(l7Nodes.value)),
        infraNodes: JSON.parse(JSON.stringify(infraNodes.value)),
        externalNodes: JSON.parse(JSON.stringify(externalNodes.value)),
        dependencies: JSON.parse(JSON.stringify(dependencies.value)),
      },
      positions: JSON.parse(JSON.stringify(currentPositions.value)),
    }
  }

  function saveSnapshot() {
    if (batchActive) return
    undoStack.value.push(currentSnapshot())
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
  }

  function restoreSnapshot(snap: Snapshot) {
    currentPositions.value = snap.positions
    servers.value = snap.data.servers ?? []
    l7Nodes.value = snap.data.l7Nodes ?? []
    infraNodes.value = snap.data.infraNodes ?? []
    externalNodes.value = snap.data.externalNodes ?? []
    dependencies.value = snap.data.dependencies ?? []
  }

  function undo(): boolean {
    if (undoStack.value.length === 0) return false
    redoStack.value.push(currentSnapshot())
    restoreSnapshot(undoStack.value.pop()!)
    return true
  }

  function redo(): boolean {
    if (redoStack.value.length === 0) return false
    undoStack.value.push(currentSnapshot())
    restoreSnapshot(redoStack.value.pop()!)
    return true
  }

  function beginBatch() {
    saveSnapshot()
    batchActive = true
  }

  function endBatch() {
    batchActive = false
  }

  // --- API 저장 (debounced) ---
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function scheduleSave() {
    if (!currentProjectId.value) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => { saveGraph() }, 1500)
  }

  async function saveGraph(): Promise<void> {
    if (!currentProjectId.value) return
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null }
    await graphApi.saveGraph(currentProjectId.value, {
      servers: servers.value,
      l7Nodes: l7Nodes.value,
      infraNodes: infraNodes.value,
      externalNodes: externalNodes.value,
      dependencies: dependencies.value,
    })
  }

  async function savePositions(positions: PositionMap): Promise<void> {
    currentPositions.value = positions
    if (!currentProjectId.value) return
    await graphApi.savePositions(currentProjectId.value, positions)
  }

  function getPositions(): PositionMap {
    return currentPositions.value
  }

  watch(
    [servers, l7Nodes, infraNodes, externalNodes, dependencies],
    () => { scheduleSave() },
    { deep: true }
  )

  // --- 프로젝트 로드 ---
  async function setProject(projectId: string): Promise<void> {
    currentProjectId.value = projectId
    const [graphRes, posRes] = await Promise.all([
      graphApi.getGraph(projectId),
      graphApi.getPositions(projectId),
    ])
    servers.value = graphRes.data.servers ?? []
    l7Nodes.value = graphRes.data.l7Nodes ?? []
    infraNodes.value = graphRes.data.infraNodes ?? []
    externalNodes.value = graphRes.data.externalNodes ?? []
    dependencies.value = graphRes.data.dependencies ?? []
    currentPositions.value = posRes.data
    undoStack.value = []
    redoStack.value = []
  }

  // --- Server CRUD ---
  function addServer(data: Omit<Server, 'id'>): Server {
    saveSnapshot()
    const s: Server = { ...data, id: generateId() }
    servers.value.push(s)
    return s
  }
  function updateServer(id: string, data: Partial<Omit<Server, 'id'>>) {
    saveSnapshot()
    const idx = servers.value.findIndex(s => s.id === id)
    if (idx !== -1) Object.assign(servers.value[idx], data)
  }
  function deleteServer(id: string) {
    saveSnapshot()
    servers.value = servers.value.filter(s => s.id !== id)
    l7Nodes.value = l7Nodes.value.map(n => ({
      ...n, memberServerIds: n.memberServerIds.filter(mid => mid !== id),
    }))
    dependencies.value = dependencies.value.filter(d => d.source !== id && d.target !== id)
  }

  // --- L7 CRUD ---
  function addL7Node(data: Omit<L7Node, 'id'>): L7Node {
    saveSnapshot()
    const n: L7Node = { ...data, id: generateId() }
    l7Nodes.value.push(n)
    return n
  }
  function updateL7Node(id: string, data: Partial<Omit<L7Node, 'id'>>) {
    saveSnapshot()
    const idx = l7Nodes.value.findIndex(n => n.id === id)
    if (idx !== -1) Object.assign(l7Nodes.value[idx], data)
  }
  function deleteL7Node(id: string) {
    saveSnapshot()
    l7Nodes.value = l7Nodes.value.filter(n => n.id !== id)
    dependencies.value = dependencies.value.filter(d => d.source !== id && d.target !== id)
  }

  // --- Infra CRUD ---
  function addInfraNode(data: Omit<InfraNode, 'id'>): InfraNode {
    saveSnapshot()
    const n: InfraNode = { ...data, id: generateId() }
    infraNodes.value.push(n)
    return n
  }
  function updateInfraNode(id: string, data: Partial<Omit<InfraNode, 'id'>>) {
    saveSnapshot()
    const idx = infraNodes.value.findIndex(n => n.id === id)
    if (idx !== -1) Object.assign(infraNodes.value[idx], data)
  }
  function deleteInfraNode(id: string) {
    saveSnapshot()
    infraNodes.value = infraNodes.value.filter(n => n.id !== id)
    dependencies.value = dependencies.value.filter(d => d.source !== id && d.target !== id)
  }

  // --- External CRUD ---
  function addExternalNode(data: Omit<ExternalServiceNode, 'id'>): ExternalServiceNode {
    saveSnapshot()
    const n: ExternalServiceNode = { ...data, id: generateId() }
    externalNodes.value.push(n)
    return n
  }
  function updateExternalNode(id: string, data: Partial<Omit<ExternalServiceNode, 'id'>>) {
    saveSnapshot()
    const idx = externalNodes.value.findIndex(n => n.id === id)
    if (idx !== -1) Object.assign(externalNodes.value[idx], data)
  }
  function deleteExternalNode(id: string) {
    saveSnapshot()
    externalNodes.value = externalNodes.value.filter(n => n.id !== id)
    dependencies.value = dependencies.value.filter(d => d.source !== id && d.target !== id)
  }

  // --- Dependency CRUD ---
  function addDependency(data: Omit<Dependency, 'id'>): Dependency | null {
    const exists = dependencies.value.some(d => d.source === data.source && d.target === data.target)
    if (exists) return null
    saveSnapshot()
    const dep: Dependency = { ...data, id: generateId() }
    dependencies.value.push(dep)
    return dep
  }
  function removeDependency(id: string) {
    saveSnapshot()
    dependencies.value = dependencies.value.filter(d => d.id !== id)
  }

  function findNodeById(id: string): AnyNode | undefined {
    return servers.value.find(s => s.id === id)
      ?? l7Nodes.value.find(n => n.id === id)
      ?? infraNodes.value.find(n => n.id === id)
      ?? externalNodes.value.find(n => n.id === id)
  }

  function getImpactedNodes(targetId: string): Set<string> {
    const impacted = new Set<string>()
    const queue = [targetId]
    while (queue.length > 0) {
      const current = queue.shift()!
      dependencies.value.forEach(d => {
        if (d.target === current && !impacted.has(d.source)) {
          impacted.add(d.source)
          queue.push(d.source)
        }
      })
    }
    return impacted
  }

  function getCycleNodes(): Set<string> {
    const allIds = [
      ...servers.value.map(n => n.id),
      ...l7Nodes.value.map(n => n.id),
      ...infraNodes.value.map(n => n.id),
      ...externalNodes.value.map(n => n.id),
    ]
    const adj = new Map<string, string[]>()
    for (const id of allIds) adj.set(id, [])
    for (const dep of dependencies.value) {
      const neighbors = adj.get(dep.source)
      if (neighbors) neighbors.push(dep.target)
    }
    const visited = new Set<string>()
    const inStack = new Set<string>()
    const stackPath: string[] = []
    const cycleNodes = new Set<string>()
    function dfs(nodeId: string): void {
      visited.add(nodeId)
      inStack.add(nodeId)
      stackPath.push(nodeId)
      for (const neighbor of (adj.get(nodeId) ?? [])) {
        if (!visited.has(neighbor)) {
          dfs(neighbor)
        } else if (inStack.has(neighbor)) {
          const idx = stackPath.indexOf(neighbor)
          if (idx !== -1) {
            for (let i = idx; i < stackPath.length; i++) cycleNodes.add(stackPath[i])
          }
        }
      }
      stackPath.pop()
      inStack.delete(nodeId)
    }
    for (const id of allIds) {
      if (!visited.has(id)) dfs(id)
    }
    return cycleNodes
  }

  function findPath(sourceId: string, targetId: string): string[] | null {
    if (sourceId === targetId) return [sourceId]
    // L7 memberServerIds 역방향 맵: serverId -> l7Id
    const serverToL7 = new Map<string, string>()
    for (const l7 of l7Nodes.value) {
      for (const memberId of l7.memberServerIds) {
        serverToL7.set(memberId, l7.id)
      }
    }
    const visited = new Set<string>([sourceId])
    const queue: Array<[string, string[]]> = [[sourceId, [sourceId]]]
    while (queue.length > 0) {
      const [current, path] = queue.shift()!
      // dependency 엣지 탐색
      for (const dep of dependencies.value) {
        if (dep.source !== current) continue
        const next = dep.target
        if (next === targetId) return [...path, next]
        if (!visited.has(next)) {
          visited.add(next)
          queue.push([next, [...path, next]])
        }
      }
      // 현재 노드가 L7이면 memberServerIds도 탐색
      const l7 = l7Nodes.value.find(n => n.id === current)
      if (l7) {
        for (const memberId of l7.memberServerIds) {
          if (memberId === targetId) return [...path, memberId]
          if (!visited.has(memberId)) {
            visited.add(memberId)
            queue.push([memberId, [...path, memberId]])
          }
        }
      }
      // 현재 노드가 L7에 속한 멤버라면 해당 L7도 탐색 경로에 포함
      const parentL7Id = serverToL7.get(current)
      if (parentL7Id && !visited.has(parentL7Id)) {
        visited.add(parentL7Id)
        queue.push([parentL7Id, [...path, parentL7Id]])
      }
    }
    return null
  }

  function exportJSON() {
    const data: GraphData = {
      servers: servers.value, l7Nodes: l7Nodes.value,
      infraNodes: infraNodes.value, externalNodes: externalNodes.value,
      dependencies: dependencies.value,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'server-dependencies.json'; a.click()
    URL.revokeObjectURL(url)
  }

  function loadData(data: GraphData) {
    saveSnapshot()
    servers.value = data.servers ?? []
    l7Nodes.value = data.l7Nodes ?? []
    infraNodes.value = data.infraNodes ?? []
    externalNodes.value = data.externalNodes ?? []
    dependencies.value = data.dependencies ?? []
  }

  function importJSON(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const data = migrateDependencyTypes(JSON.parse(e.target!.result as string) as GraphData)
          saveSnapshot()
          servers.value = data.servers ?? []
          l7Nodes.value = data.l7Nodes ?? []
          infraNodes.value = data.infraNodes ?? []
          externalNodes.value = data.externalNodes ?? []
          dependencies.value = data.dependencies ?? []
          resolve()
        } catch { reject(new Error('유효하지 않은 JSON 파일입니다.')) }
      }
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsText(file)
    })
  }

  return {
    servers, l7Nodes, infraNodes, externalNodes, dependencies, currentProjectId,
    addServer, updateServer, deleteServer,
    addL7Node, updateL7Node, deleteL7Node,
    addInfraNode, updateInfraNode, deleteInfraNode,
    addExternalNode, updateExternalNode, deleteExternalNode,
    addDependency, removeDependency,
    findNodeById, getImpactedNodes, getCycleNodes, findPath, exportJSON, importJSON, loadData,
    undo, redo, beginBatch, endBatch, canUndo, canRedo,
    setProject, saveGraph, savePositions, getPositions,
  }
})
