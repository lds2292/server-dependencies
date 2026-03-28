import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Server, L7Node, InfraNode, ExternalServiceNode, AnyNode, Dependency, GraphData } from '../types'
import { graphApi, type PositionMap, type GraphDataWithVersion } from '../api/graphApi'

type Snapshot = {
  data: GraphData
  positions: PositionMap
}

export interface ConflictItem {
  id: string
  nodeType: 'server' | 'l7' | 'infra' | 'external' | 'dependency'
  label: string
  mine: unknown | null
  server: unknown | null
}

export interface ConflictState {
  conflicts: ConflictItem[]
  merged: GraphData
  serverVersion: number
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
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

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

type NodeLike = { id: string; name?: string }

function mergeNodeArrays<T extends NodeLike>(
  base: T[],
  mine: T[],
  server: T[],
  nodeType: ConflictItem['nodeType']
): { result: T[]; conflicts: ConflictItem[] } {
  const baseMap = new Map(base.map(n => [n.id, n]))
  const mineMap = new Map(mine.map(n => [n.id, n]))
  const serverMap = new Map(server.map(n => [n.id, n]))

  const allIds = new Set([...baseMap.keys(), ...mineMap.keys(), ...serverMap.keys()])
  const result: T[] = []
  const conflicts: ConflictItem[] = []

  for (const id of allIds) {
    const b = baseMap.get(id)
    const m = mineMap.get(id)
    const s = serverMap.get(id)

    if (!b) {
      // 새로 추가된 노드
      if (m && s) {
        if (deepEqual(m, s)) {
          result.push(m)
        } else {
          conflicts.push({ id, nodeType, label: m.name ?? id, mine: m, server: s })
          result.push(m)
        }
      } else if (m) {
        result.push(m)
      } else if (s) {
        result.push(s)
      }
      continue
    }

    const mineChanged = m !== undefined && !deepEqual(b, m)
    const serverChanged = s !== undefined && !deepEqual(b, s)
    const iDeletedIt = m === undefined
    const serverDeletedIt = s === undefined

    if (iDeletedIt && serverDeletedIt) {
      continue
    }
    if (iDeletedIt && serverChanged) {
      conflicts.push({ id, nodeType, label: (s as T).name ?? id, mine: null, server: s ?? null })
      result.push(s!)
      continue
    }
    if (serverDeletedIt && mineChanged) {
      conflicts.push({ id, nodeType, label: (m as T).name ?? id, mine: m ?? null, server: null })
      result.push(m!)
      continue
    }
    if (iDeletedIt) {
      continue
    }
    if (serverDeletedIt) {
      continue
    }

    if (!mineChanged && !serverChanged) {
      result.push(b)
    } else if (!mineChanged && serverChanged) {
      result.push(s!)
    } else if (mineChanged && !serverChanged) {
      result.push(m!)
    } else {
      if (deepEqual(m, s)) {
        result.push(m!)
      } else {
        conflicts.push({ id, nodeType, label: (m as T).name ?? id, mine: m ?? null, server: s ?? null })
        result.push(m!)
      }
    }
  }

  return { result, conflicts }
}

function mergeGraphData(
  base: GraphData,
  mine: GraphData,
  server: GraphData
): { merged: GraphData; conflicts: ConflictItem[] } {
  const cast = <T>(arr: unknown[]): T[] => arr as T[]
  const asNL = <T extends NodeLike>(arr: T[]): NodeLike[] => arr as unknown as NodeLike[]

  const servers = mergeNodeArrays(asNL(base.servers ?? []), asNL(mine.servers ?? []), asNL(server.servers ?? []), 'server')
  const l7Nodes = mergeNodeArrays(asNL(base.l7Nodes ?? []), asNL(mine.l7Nodes ?? []), asNL(server.l7Nodes ?? []), 'l7')
  const infraNodes = mergeNodeArrays(asNL(base.infraNodes ?? []), asNL(mine.infraNodes ?? []), asNL(server.infraNodes ?? []), 'infra')
  const externalNodes = mergeNodeArrays(asNL(base.externalNodes ?? []), asNL(mine.externalNodes ?? []), asNL(server.externalNodes ?? []), 'external')
  const dependencies = mergeNodeArrays(
    asNL(base.dependencies ?? []),
    asNL(mine.dependencies ?? []),
    asNL(server.dependencies ?? []),
    'dependency'
  )

  return {
    merged: {
      servers: cast<Server>(servers.result),
      l7Nodes: cast<L7Node>(l7Nodes.result),
      infraNodes: cast<InfraNode>(infraNodes.result),
      externalNodes: cast<ExternalServiceNode>(externalNodes.result),
      dependencies: cast<Dependency>(dependencies.result),
    },
    conflicts: [
      ...servers.conflicts,
      ...l7Nodes.conflicts,
      ...infraNodes.conflicts,
      ...externalNodes.conflicts,
      ...dependencies.conflicts,
    ],
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

  const currentVersion = ref<number>(0)
  const baseSnapshot = ref<GraphData>({ servers: [], l7Nodes: [], infraNodes: [], externalNodes: [], dependencies: [] })
  const conflictState = ref<ConflictState | null>(null)
  const saveError = ref<string | null>(null)

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

  function currentGraphData(): GraphData {
    return {
      servers: JSON.parse(JSON.stringify(servers.value)),
      l7Nodes: JSON.parse(JSON.stringify(l7Nodes.value)),
      infraNodes: JSON.parse(JSON.stringify(infraNodes.value)),
      externalNodes: JSON.parse(JSON.stringify(externalNodes.value)),
      dependencies: JSON.parse(JSON.stringify(dependencies.value)),
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

  function applyGraphData(data: GraphData) {
    servers.value = data.servers ?? []
    l7Nodes.value = data.l7Nodes ?? []
    infraNodes.value = data.infraNodes ?? []
    externalNodes.value = data.externalNodes ?? []
    dependencies.value = data.dependencies ?? []
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

  // --- API 저장 ---
  async function saveGraph(): Promise<void> {
    if (!currentProjectId.value) return
    if (conflictState.value) return

    const data = currentGraphData()
    if (deepEqual(data, baseSnapshot.value)) return

    try {
      const res = await graphApi.saveGraph(currentProjectId.value, data, currentVersion.value)
      currentVersion.value = res.data.version
      baseSnapshot.value = data
      saveError.value = null
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { code?: string; current?: GraphDataWithVersion } } }
      if (e.response?.status === 409 && e.response.data?.code === 'CONFLICT') {
        const serverData = e.response.data.current!
        const { version: serverVersion, ...serverGraphData } = serverData
        const { merged, conflicts } = mergeGraphData(baseSnapshot.value, data, serverGraphData)

        if (conflicts.length === 0) {
          // 자동 병합 성공 - 재저장
          applyGraphData(merged)
          currentVersion.value = serverVersion
          await saveGraph()
        } else {
          conflictState.value = { conflicts, merged, serverVersion }
        }
        return
      }
      saveError.value = '저장 중 오류가 발생했습니다.'
      throw err
    }
  }

  function resolveConflicts(resolutions: Record<string, 'mine' | 'server'>): void {
    if (!conflictState.value) return
    const { conflicts, merged, serverVersion } = conflictState.value
    const finalData: GraphData = JSON.parse(JSON.stringify(merged))

    for (const conflict of conflicts) {
      const chosen = (resolutions[conflict.id] ?? 'mine') === 'mine' ? conflict.mine : conflict.server

      if (conflict.nodeType === 'dependency') {
        finalData.dependencies = (finalData.dependencies ?? []).filter(d => d.id !== conflict.id)
        if (chosen !== null) finalData.dependencies.push(chosen as Dependency)
      } else {
        const arrayKey = (conflict.nodeType === 'server' ? 'servers'
          : conflict.nodeType === 'l7' ? 'l7Nodes'
          : conflict.nodeType === 'infra' ? 'infraNodes'
          : 'externalNodes') as 'servers' | 'l7Nodes' | 'infraNodes' | 'externalNodes'
        const arr = (finalData[arrayKey] ?? []) as unknown as NodeLike[]
        const idx = arr.findIndex(n => n.id === conflict.id)
        if (idx !== -1) arr.splice(idx, 1)
        if (chosen !== null) arr.push(chosen as unknown as NodeLike)
      }
    }

    applyGraphData(finalData)
    currentVersion.value = serverVersion
    conflictState.value = null
    saveGraph()
  }

  function dismissConflict(): void {
    conflictState.value = null
  }

  // --- 포지션 저장 (메모리 버퍼링) ---
  const positionsDirty = ref(false)
  const autosaveEnabled = ref(localStorage.getItem('autosave_enabled') !== 'false')
  const autosaveInterval = ref(Number(localStorage.getItem('autosave_interval') || 30))

  function savePositions(positions: PositionMap): void {
    currentPositions.value = positions
    positionsDirty.value = true
  }

  async function flushPositions(): Promise<void> {
    if (!positionsDirty.value || !currentProjectId.value) return
    await graphApi.savePositions(currentProjectId.value, currentPositions.value)
    positionsDirty.value = false
  }

  function setAutosaveEnabled(val: boolean): void {
    autosaveEnabled.value = val
    localStorage.setItem('autosave_enabled', String(val))
  }

  function setAutosaveInterval(val: number): void {
    autosaveInterval.value = val
    localStorage.setItem('autosave_interval', String(val))
  }

  function getPositions(): PositionMap {
    return currentPositions.value
  }

  // --- 프로젝트 로드 ---
  async function setProject(projectId: string): Promise<void> {
    currentProjectId.value = projectId
    conflictState.value = null
    const [graphRes, posRes] = await Promise.all([
      graphApi.getGraph(projectId),
      graphApi.getPositions(projectId),
    ])
    const { version, ...graphData } = graphRes.data
    servers.value = graphData.servers ?? []
    l7Nodes.value = graphData.l7Nodes ?? []
    infraNodes.value = graphData.infraNodes ?? []
    externalNodes.value = graphData.externalNodes ?? []
    dependencies.value = graphData.dependencies ?? []
    currentPositions.value = posRes.data
    currentVersion.value = version
    baseSnapshot.value = JSON.parse(JSON.stringify(graphData))
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
  function updateDependency(id: string, data: Partial<Omit<Dependency, 'id' | 'source' | 'target'>>) {
    const idx = dependencies.value.findIndex(d => d.id === id)
    if (idx === -1) return
    saveSnapshot()
    dependencies.value[idx] = { ...dependencies.value[idx], ...data }
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
    const visited = new Set<string>([sourceId])
    const queue: Array<[string, string[]]> = [[sourceId, [sourceId]]]
    while (queue.length > 0) {
      const [current, path] = queue.shift()!
      for (const dep of dependencies.value) {
        if (dep.source !== current) continue
        const next = dep.target
        if (next === targetId) return [...path, next]
        if (!visited.has(next)) {
          visited.add(next)
          queue.push([next, [...path, next]])
        }
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

  async function syncExternalNodes(): Promise<void> {
    if (!currentProjectId.value) return
    const res = await graphApi.getGraph(currentProjectId.value)
    externalNodes.value = res.data.externalNodes ?? []
  }

  return {
    servers, l7Nodes, infraNodes, externalNodes, dependencies, currentProjectId,
    conflictState, saveError,
    addServer, updateServer, deleteServer,
    addL7Node, updateL7Node, deleteL7Node,
    addInfraNode, updateInfraNode, deleteInfraNode,
    addExternalNode, updateExternalNode, deleteExternalNode,
    addDependency, removeDependency, updateDependency,
    findNodeById, getImpactedNodes, getCycleNodes, findPath, exportJSON, importJSON, loadData,
    undo, redo, beginBatch, endBatch, canUndo, canRedo,
    setProject, saveGraph, savePositions, flushPositions, getPositions, syncExternalNodes,
    resolveConflicts, dismissConflict,
    positionsDirty, autosaveEnabled, autosaveInterval, setAutosaveEnabled, setAutosaveInterval,
  }
})
