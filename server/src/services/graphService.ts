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

export interface ExternalContact {
  name: string
  phone?: string
  email?: string
}

interface ExternalNode {
  id: string
  contacts?: ExternalContact[]
  [key: string]: unknown
}

function maskEmail(email: string): string {
  const atIdx = email.indexOf('@')
  if (atIdx < 1) return email
  return `${email[0]}**${email.slice(atIdx)}`
}

function maskPhone(phone: string): string {
  // Mobile: 01XXXXXXXXXX (10-11자리) → 010-****-5678
  if (/^01[016789]\d{7,8}$/.test(phone))
    return `${phone.slice(0, 3)}-****-${phone.slice(-4)}`
  // Seoul: 02XXXXXXX(X) (9-10자리) → 02-****-4567
  if (/^02\d{7,8}$/.test(phone))
    return `${phone.slice(0, 2)}-****-${phone.slice(-4)}`
  // Regional: 0[3-9]XXXXXXXXX (10-11자리) → 031-****-4567
  if (/^0[3-9]\d{8,9}$/.test(phone))
    return `${phone.slice(0, 3)}-****-${phone.slice(-4)}`
  // Service: 1[5-6]XXXXXX (8자리) → 1544-****
  if (/^1[5-6]\d{6}$/.test(phone))
    return `${phone.slice(0, 4)}-****`
  return phone
}

function maskGraphContacts(data: GraphDataJson): GraphDataJson {
  return {
    ...data,
    externalNodes: ((data.externalNodes ?? []) as ExternalNode[]).map(node => ({
      ...node,
      contacts: (node.contacts ?? []).map(c => ({
        ...c,
        email: c.email ? maskEmail(c.email) : c.email,
        phone: c.phone ? maskPhone(c.phone) : c.phone,
      })),
    })),
  }
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
  const graphData = decryptGraphData(record.data as unknown as GraphDataJson)
  const contactsMap = (record.contacts ?? {}) as unknown as Record<string, ExternalContact[]>
  const merged: GraphDataJson = {
    ...graphData,
    externalNodes: ((graphData.externalNodes ?? []) as ExternalNode[]).map(node => ({
      ...node,
      contacts: contactsMap[node.id] ?? [],
    })),
  }
  return maskGraphContacts(merged)
}

export async function getRawNodeContacts(projectId: string, nodeId: string): Promise<ExternalContact[] | null> {
  const record = await prisma.graphData.findUnique({ where: { projectId }, select: { contacts: true } })
  if (!record) return null
  const contacts = (record.contacts ?? {}) as unknown as Record<string, ExternalContact[]>
  return contacts[nodeId] ?? null
}

export async function saveNodeContacts(projectId: string, nodeId: string, contacts: ExternalContact[]) {
  const record = await prisma.graphData.findUnique({ where: { projectId }, select: { contacts: true } })
  const existing = (record?.contacts ?? {}) as unknown as Record<string, ExternalContact[]>
  existing[nodeId] = contacts
  return prisma.graphData.update({
    where: { projectId },
    data: { contacts: existing as object },
  })
}

export async function saveGraph(projectId: string, data: GraphDataJson) {
  // contacts를 data에서 strip (contacts 컬럼에서 별도 관리)
  const strippedData: GraphDataJson = {
    ...data,
    externalNodes: ((data.externalNodes ?? []) as ExternalNode[]).map(
      ({ contacts: _c, ...rest }) => rest as ExternalNode
    ),
  }
  const encrypted = encryptGraphData(strippedData)

  // 삭제된 노드의 고아 contacts 정리
  const activeNodeIds = new Set(((data.externalNodes ?? []) as ExternalNode[]).map(n => n.id))
  const record = await prisma.graphData.findUnique({ where: { projectId }, select: { contacts: true } })
  let contactsUpdate: Record<string, ExternalContact[]> | undefined
  if (record?.contacts) {
    const existing = record.contacts as unknown as Record<string, ExternalContact[]>
    const cleaned = Object.fromEntries(
      Object.entries(existing).filter(([id]) => activeNodeIds.has(id))
    )
    contactsUpdate = cleaned
  }

  return prisma.graphData.upsert({
    where: { projectId },
    update: {
      data: encrypted as object,
      ...(contactsUpdate !== undefined ? { contacts: contactsUpdate as object } : {}),
    },
    create: {
      projectId,
      data: encrypted as object,
      contacts: {},
    },
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
      contacts: {},
      positions: positions as object,
    },
  })
}
