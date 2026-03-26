export type DependencyType = 'http' | 'tcp' | 'websocket' | 'other'

export interface Server {
  id: string
  nodeKind?: 'server'
  name: string
  team: string
  internalIps: string[]
  natIps: string[]
  description: string
  hasFirewall?: boolean
  firewallUrl?: string
}

export interface L7Node {
  id: string
  nodeKind: 'l7'
  name: string
  ip?: string
  natIp?: string
  memberServerIds: string[]
  description?: string
}

export interface InfraNode {
  id: string
  nodeKind: 'infra'
  name: string
  infraType?: string
  host?: string
  port?: string
  description?: string
}

export interface ExternalContact {
  name: string
  phone?: string
  email?: string
}

export interface ExternalServiceNode {
  id: string
  nodeKind: 'external'
  name: string
  hasFirewall?: boolean
  firewallUrl?: string
  hasWhitelist?: boolean
  contacts: ExternalContact[]
  description?: string
}

export type AnyNode = Server | L7Node | InfraNode | ExternalServiceNode

export function isL7(node: AnyNode): node is L7Node {
  return node.nodeKind === 'l7'
}

export interface Dependency {
  id: string
  source: string
  target: string
  type: DependencyType
  description?: string
}

export interface GraphData {
  servers: Server[]
  l7Nodes?: L7Node[]
  infraNodes?: InfraNode[]
  externalNodes?: ExternalServiceNode[]
  dependencies: Dependency[]
}

export type D3Node = AnyNode & {
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

export interface D3Link {
  id: string
  source: string | D3Node
  target: string | D3Node
  type: DependencyType
  description?: string
}
