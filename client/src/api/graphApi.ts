import { http } from './http'
import type { GraphData, ExternalContact } from '../types'

export type PositionMap = Record<string, { x: number; y: number }>

export type GraphDataWithVersion = GraphData & { version: number }

export type SaveGraphConflict = {
  code: 'CONFLICT'
  current: GraphDataWithVersion
}

export const graphApi = {
  getGraph(projectId: string) {
    return http.get<GraphDataWithVersion>(`/projects/${projectId}/graph`)
  },
  saveGraph(projectId: string, data: GraphData, version: number) {
    return http.put<{ version: number }>(`/projects/${projectId}/graph`, { ...data, version })
  },
  getPositions(projectId: string) {
    return http.get<PositionMap>(`/projects/${projectId}/graph/positions`)
  },
  savePositions(projectId: string, positions: PositionMap) {
    return http.put(`/projects/${projectId}/graph/positions`, positions)
  },
  getNodeContacts(projectId: string, nodeId: string) {
    return http.get<{ contacts: ExternalContact[] }>(`/projects/${projectId}/nodes/${nodeId}/contacts`)
  },
  saveNodeContacts(projectId: string, nodeId: string, contacts: ExternalContact[]) {
    return http.put<{ ok: boolean }>(`/projects/${projectId}/nodes/${nodeId}/contacts`, { contacts })
  },
}
