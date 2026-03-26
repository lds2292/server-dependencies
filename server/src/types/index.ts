export interface AuthTokenPayload {
  userId: string
  email: string
  username: string
}

export interface GraphDataJson {
  servers: unknown[]
  l7Nodes: unknown[]
  infraNodes: unknown[]
  externalNodes: unknown[]
  dependencies: unknown[]
}
