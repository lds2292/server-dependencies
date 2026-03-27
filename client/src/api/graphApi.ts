import { http } from './http'
import type { GraphData, ExternalContact } from '../types'

export type PositionMap = Record<string, { x: number; y: number }>

export const graphApi = {
  getGraph(projectId: string) {
    return http.get<GraphData>(`/projects/${projectId}/graph`)
  },
  saveGraph(projectId: string, data: GraphData) {
    return http.put(`/projects/${projectId}/graph`, data)
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
