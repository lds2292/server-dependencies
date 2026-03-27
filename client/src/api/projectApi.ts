import { http } from './http'
import type { ExternalContact } from '../types'

export type ProjectMemberRole = 'MASTER' | 'ADMIN' | 'WRITER' | 'READONLY'

export interface ProjectMember {
  userId: string
  role: ProjectMemberRole
  joinedAt: string
  user: { id: string; username: string; email: string }
}

export interface Project {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  members: ProjectMember[]
}

export const projectApi = {
  list() {
    return http.get<Project[]>('/projects')
  },
  get(id: string) {
    return http.get<Project>(`/projects/${id}`)
  },
  create(name: string, description?: string) {
    return http.post<Project>('/projects', { name, description })
  },
  update(id: string, patch: { name?: string; description?: string }) {
    return http.patch<Project>(`/projects/${id}`, patch)
  },
  remove(id: string) {
    return http.delete(`/projects/${id}`)
  },
  addMember(id: string, identifier: string, role: ProjectMemberRole) {
    return http.post<Project>(`/projects/${id}/members`, { identifier, role })
  },
  removeMember(id: string, userId: string) {
    return http.delete<Project>(`/projects/${id}/members/${userId}`)
  },
  leaveProject(id: string) {
    return http.delete(`/projects/${id}/members/me`)
  },
  updateMemberRole(id: string, userId: string, role: ProjectMemberRole) {
    return http.patch<Project>(`/projects/${id}/members/${userId}/role`, { role })
  },
  unmasksContacts(projectId: string, nodeId: string, password: string) {
    return http.post<{ contacts: ExternalContact[] }>(`/projects/${projectId}/contacts/unmask`, { nodeId, password })
  },
}
