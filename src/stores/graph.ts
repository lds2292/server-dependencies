import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Server, L7Node, InfraNode, ExternalServiceNode, AnyNode, Dependency, GraphData } from '../types'

const STORAGE_KEY = 'server-dependencies-data'

function generateId(): string {
  return crypto.randomUUID()
}

function migrateDependencyTypes(data: GraphData): GraphData {
  const typeMap: Record<string, string> = { db: 'tcp', queue: 'other' }
  return {
    ...data,
    dependencies: data.dependencies.map(d =>
      typeMap[d.type] ? { ...d, type: typeMap[d.type] as any } : d
    ),
  }
}

function loadFromStorage(): GraphData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return migrateDependencyTypes(JSON.parse(raw) as GraphData)
  } catch { /* ignore */ }
  return { servers: [], l7Nodes: [], infraNodes: [], externalNodes: [], dependencies: [] }
}

export const useGraphStore = defineStore('graph', () => {
  const initial = loadFromStorage()
  const servers = ref<Server[]>(initial.servers)
  const l7Nodes = ref<L7Node[]>(initial.l7Nodes ?? [])
  const infraNodes = ref<InfraNode[]>(initial.infraNodes ?? [])
  const externalNodes = ref<ExternalServiceNode[]>(initial.externalNodes ?? [])
  const dependencies = ref<Dependency[]>(initial.dependencies)

  watch(
    [servers, l7Nodes, infraNodes, externalNodes, dependencies],
    () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        servers: servers.value,
        l7Nodes: l7Nodes.value,
        infraNodes: infraNodes.value,
        externalNodes: externalNodes.value,
        dependencies: dependencies.value,
      }))
    },
    { deep: true }
  )

  // --- Server CRUD ---
  function addServer(data: Omit<Server, 'id'>): Server {
    const s: Server = { ...data, id: generateId() }
    servers.value.push(s)
    return s
  }
  function updateServer(id: string, data: Partial<Omit<Server, 'id'>>) {
    const idx = servers.value.findIndex(s => s.id === id)
    if (idx !== -1) Object.assign(servers.value[idx], data)
  }
  function deleteServer(id: string) {
    servers.value = servers.value.filter(s => s.id !== id)
    l7Nodes.value = l7Nodes.value.map(n => ({
      ...n, memberServerIds: n.memberServerIds.filter(mid => mid !== id),
    }))
    dependencies.value = dependencies.value.filter(d => d.source !== id && d.target !== id)
  }

  // --- L7 CRUD ---
  function addL7Node(data: Omit<L7Node, 'id'>): L7Node {
    const n: L7Node = { ...data, id: generateId() }
    l7Nodes.value.push(n)
    return n
  }
  function updateL7Node(id: string, data: Partial<Omit<L7Node, 'id'>>) {
    const idx = l7Nodes.value.findIndex(n => n.id === id)
    if (idx !== -1) Object.assign(l7Nodes.value[idx], data)
  }
  function deleteL7Node(id: string) {
    l7Nodes.value = l7Nodes.value.filter(n => n.id !== id)
    dependencies.value = dependencies.value.filter(d => d.source !== id && d.target !== id)
  }

  // --- Infra CRUD ---
  function addInfraNode(data: Omit<InfraNode, 'id'>): InfraNode {
    const n: InfraNode = { ...data, id: generateId() }
    infraNodes.value.push(n)
    return n
  }
  function updateInfraNode(id: string, data: Partial<Omit<InfraNode, 'id'>>) {
    const idx = infraNodes.value.findIndex(n => n.id === id)
    if (idx !== -1) Object.assign(infraNodes.value[idx], data)
  }
  function deleteInfraNode(id: string) {
    infraNodes.value = infraNodes.value.filter(n => n.id !== id)
    dependencies.value = dependencies.value.filter(d => d.source !== id && d.target !== id)
  }

  // --- External CRUD ---
  function addExternalNode(data: Omit<ExternalServiceNode, 'id'>): ExternalServiceNode {
    const n: ExternalServiceNode = { ...data, id: generateId() }
    externalNodes.value.push(n)
    return n
  }
  function updateExternalNode(id: string, data: Partial<Omit<ExternalServiceNode, 'id'>>) {
    const idx = externalNodes.value.findIndex(n => n.id === id)
    if (idx !== -1) Object.assign(externalNodes.value[idx], data)
  }
  function deleteExternalNode(id: string) {
    externalNodes.value = externalNodes.value.filter(n => n.id !== id)
    dependencies.value = dependencies.value.filter(d => d.source !== id && d.target !== id)
  }

  // --- Dependency CRUD ---
  function addDependency(data: Omit<Dependency, 'id'>): Dependency | null {
    const exists = dependencies.value.some(d => d.source === data.source && d.target === data.target)
    if (exists) return null
    const dep: Dependency = { ...data, id: generateId() }
    dependencies.value.push(dep)
    return dep
  }
  function removeDependency(id: string) {
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
    servers, l7Nodes, infraNodes, externalNodes, dependencies,
    addServer, updateServer, deleteServer,
    addL7Node, updateL7Node, deleteL7Node,
    addInfraNode, updateInfraNode, deleteInfraNode,
    addExternalNode, updateExternalNode, deleteExternalNode,
    addDependency, removeDependency,
    findNodeById, getImpactedNodes, getCycleNodes, findPath, exportJSON, importJSON, loadData,
  }
})
