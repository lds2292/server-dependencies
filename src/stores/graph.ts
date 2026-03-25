import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Server, L7Node, DBNode, ExternalServiceNode, AnyNode, Dependency, GraphData } from '../types'

const STORAGE_KEY = 'server-dependencies-data'

function generateId(): string {
  return crypto.randomUUID()
}

function loadFromStorage(): GraphData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as GraphData
  } catch { /* ignore */ }
  return { servers: [], l7Nodes: [], dbNodes: [], externalNodes: [], dependencies: [] }
}

export const useGraphStore = defineStore('graph', () => {
  const initial = loadFromStorage()
  const servers = ref<Server[]>(initial.servers)
  const l7Nodes = ref<L7Node[]>(initial.l7Nodes ?? [])
  const dbNodes = ref<DBNode[]>(initial.dbNodes ?? [])
  const externalNodes = ref<ExternalServiceNode[]>(initial.externalNodes ?? [])
  const dependencies = ref<Dependency[]>(initial.dependencies)

  watch(
    [servers, l7Nodes, dbNodes, externalNodes, dependencies],
    () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        servers: servers.value,
        l7Nodes: l7Nodes.value,
        dbNodes: dbNodes.value,
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

  // --- DB CRUD ---
  function addDBNode(data: Omit<DBNode, 'id'>): DBNode {
    const n: DBNode = { ...data, id: generateId() }
    dbNodes.value.push(n)
    return n
  }
  function updateDBNode(id: string, data: Partial<Omit<DBNode, 'id'>>) {
    const idx = dbNodes.value.findIndex(n => n.id === id)
    if (idx !== -1) Object.assign(dbNodes.value[idx], data)
  }
  function deleteDBNode(id: string) {
    dbNodes.value = dbNodes.value.filter(n => n.id !== id)
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
  function addDependency(data: Omit<Dependency, 'id'>): Dependency {
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
      ?? dbNodes.value.find(n => n.id === id)
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

  function exportJSON() {
    const data: GraphData = {
      servers: servers.value, l7Nodes: l7Nodes.value,
      dbNodes: dbNodes.value, externalNodes: externalNodes.value,
      dependencies: dependencies.value,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'server-dependencies.json'; a.click()
    URL.revokeObjectURL(url)
  }

  function importJSON(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target!.result as string) as GraphData
          servers.value = data.servers ?? []
          l7Nodes.value = data.l7Nodes ?? []
          dbNodes.value = data.dbNodes ?? []
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
    servers, l7Nodes, dbNodes, externalNodes, dependencies,
    addServer, updateServer, deleteServer,
    addL7Node, updateL7Node, deleteL7Node,
    addDBNode, updateDBNode, deleteDBNode,
    addExternalNode, updateExternalNode, deleteExternalNode,
    addDependency, removeDependency,
    findNodeById, getImpactedNodes, exportJSON, importJSON,
  }
})
