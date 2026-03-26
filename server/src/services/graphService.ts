import prisma from '../prisma'
import type { GraphDataJson } from '../types'
import { encrypt, decrypt, encryptStringArray, decryptStringArray } from './cryptoService'

interface ServerNode {
  internalIps?: string[]
  natIps?: string[]
  [key: string]: unknown
}

interface L7Node {
  ip?: string
  [key: string]: unknown
}

interface InfraNode {
  host?: string
  [key: string]: unknown
}

function encryptGraphData(data: GraphDataJson): GraphDataJson {
  return {
    ...data,
    servers: (data.servers as ServerNode[]).map(s => ({
      ...s,
      internalIps: s.internalIps ? encryptStringArray(s.internalIps) : s.internalIps,
      natIps: s.natIps ? encryptStringArray(s.natIps) : s.natIps,
    })),
    l7Nodes: (data.l7Nodes as L7Node[]).map(n => ({
      ...n,
      ip: n.ip ? encrypt(n.ip) : n.ip,
    })),
    infraNodes: (data.infraNodes as InfraNode[]).map(n => ({
      ...n,
      host: n.host ? encrypt(n.host) : n.host,
    })),
  }
}

function decryptGraphData(data: GraphDataJson): GraphDataJson {
  return {
    ...data,
    servers: (data.servers as ServerNode[]).map(s => ({
      ...s,
      internalIps: s.internalIps ? decryptStringArray(s.internalIps) : s.internalIps,
      natIps: s.natIps ? decryptStringArray(s.natIps) : s.natIps,
    })),
    l7Nodes: (data.l7Nodes as L7Node[]).map(n => ({
      ...n,
      ip: n.ip ? decrypt(n.ip) : n.ip,
    })),
    infraNodes: (data.infraNodes as InfraNode[]).map(n => ({
      ...n,
      host: n.host ? decrypt(n.host) : n.host,
    })),
  }
}

export async function getGraph(projectId: string) {
  const record = await prisma.graphData.findUnique({ where: { projectId } })
  if (!record) return { servers: [], l7Nodes: [], infraNodes: [], externalNodes: [], dependencies: [] }
  return decryptGraphData(record.data as GraphDataJson)
}

export async function saveGraph(projectId: string, data: GraphDataJson) {
  const encrypted = encryptGraphData(data)
  return prisma.graphData.upsert({
    where: { projectId },
    update: { data: encrypted as object },
    create: { projectId, data: encrypted as object },
  })
}

export async function getPositions(projectId: string) {
  const record = await prisma.graphData.findUnique({ where: { projectId } })
  return (record?.positions ?? {}) as Record<string, { x: number; y: number }>
}

export async function savePositions(projectId: string, positions: Record<string, { x: number; y: number }>) {
  return prisma.graphData.upsert({
    where: { projectId },
    update: { positions: positions as object },
    create: {
      projectId,
      data: { servers: [], l7Nodes: [], infraNodes: [], externalNodes: [], dependencies: [] },
      positions: positions as object,
    },
  })
}
