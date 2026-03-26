import { http } from './http'

export interface ProjectMember {
  userId: string
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
  addMember(id: string, identifier: string) {
    return http.post<Project>(`/projects/${id}/members`, { identifier })
  },
  removeMember(id: string, userId: string) {
    return http.delete<Project>(`/projects/${id}/members/${userId}`)
  },
}
