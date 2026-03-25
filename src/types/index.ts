export type Environment = 'prod' | 'dev' | 'staging'
export type DependencyType = 'http' | 'db' | 'queue' | 'other'

export interface Server {
  id: string
  nodeKind?: 'server'
  name: string
  environment: Environment
  team: string
  internalIp: string
  natIp: string
  description: string
  hasFirewall?: boolean
  firewallUrl?: string
}

export interface L7Node {
  id: string
  nodeKind: 'l7'
  name: string
  environment: Environment
  ip?: string
  memberServerIds: string[]
  description?: string
}

export interface DBNode {
  id: string
  nodeKind: 'db'
  name: string
  environment: Environment
  dbType?: string
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
  environment: Environment
  hasFirewall?: boolean
  hasWhitelist?: boolean
  contacts: ExternalContact[]
  description?: string
}

export type AnyNode = Server | L7Node | DBNode | ExternalServiceNode

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
  dbNodes?: DBNode[]
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
