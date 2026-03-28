import { http } from './http'
import type { ExternalContact } from '../types'

export type ProjectMemberRole = 'MASTER' | 'ADMIN' | 'WRITER' | 'READONLY'
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED'

export interface ProjectMember {
  userId: string
  role: ProjectMemberRole
  joinedAt: string
  user: { id: string; username: string; email: string }
}

export interface ProjectInvitation {
  id: string
  projectId: string
  inviterId: string
  inviteeId: string
  role: ProjectMemberRole
  status: InvitationStatus
  createdAt: string
  project: { id: string; name: string }
  inviter: { id: string; username: string }
}

export interface ProjectPendingInvitation {
  id: string
  projectId: string
  inviteeId: string
  role: ProjectMemberRole
  status: InvitationStatus
  createdAt: string
  invitee: { id: string; username: string; email: string }
}

export interface AuditLog {
  id: string
  action: string
  status: string
  nodeId?: string
  email?: string
  ipAddress?: string
  failReason?: string
  detail?: string
  createdAt: string
  user?: { id: string; username: string; email: string }
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
  sendInvitation(id: string, identifier: string, role: ProjectMemberRole) {
    return http.post<ProjectInvitation>(`/projects/${id}/invitations`, { identifier, role })
  },
  getProjectInvitations(id: string) {
    return http.get<ProjectPendingInvitation[]>(`/projects/${id}/invitations`)
  },
  cancelInvitation(id: string, invId: string) {
    return http.delete(`/projects/${id}/invitations/${invId}`)
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
  getMyInvitations() {
    return http.get<ProjectInvitation[]>('/invitations')
  },
  acceptInvitation(invId: string) {
    return http.patch(`/invitations/${invId}/accept`, {})
  },
  rejectInvitation(invId: string) {
    return http.patch(`/invitations/${invId}/reject`, {})
  },
  unmasksContacts(projectId: string, nodeId: string, password: string) {
    return http.post<{ contacts: ExternalContact[] }>(`/projects/${projectId}/contacts/unmask`, { nodeId, password })
  },
  getAuditLogs(id: string) {
    return http.get<{ logs: AuditLog[] }>(`/projects/${id}/audit-logs`)
  },
}
