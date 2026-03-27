import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { projectApi, type Project, type ProjectMemberRole, type ProjectInvitation, type ProjectPendingInvitation } from '../api/projectApi'
import { useAuthStore } from './auth'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const myInvitations = ref<ProjectInvitation[]>([])
  const projectInvitations = ref<ProjectPendingInvitation[]>([])

  const myRole = computed<ProjectMemberRole | null>(() => {
    const auth = useAuthStore()
    if (!currentProject.value || !auth.user) return null
    const me = currentProject.value.members.find(m => m.userId === auth.user!.id)
    return me?.role ?? null
  })

  const canWrite = computed(() => myRole.value === 'MASTER' || myRole.value === 'ADMIN' || myRole.value === 'WRITER')
  const canAdmin = computed(() => myRole.value === 'MASTER' || myRole.value === 'ADMIN')
  const isMaster = computed(() => myRole.value === 'MASTER')

  async function loadProjects(): Promise<void> {
    const { data } = await projectApi.list()
    projects.value = data
  }

  async function loadProject(projectId: string): Promise<void> {
    const { data } = await projectApi.get(projectId)
    currentProject.value = data
  }

  async function createProject(name: string, description?: string): Promise<Project> {
    const { data } = await projectApi.create(name, description)
    projects.value.unshift(data)
    return data
  }

  async function updateProject(id: string, patch: { name?: string; description?: string }): Promise<void> {
    const { data } = await projectApi.update(id, patch)
    const idx = projects.value.findIndex(p => p.id === id)
    if (idx !== -1) projects.value[idx] = data
    if (currentProject.value?.id === id) currentProject.value = data
  }

  async function deleteProject(id: string): Promise<void> {
    await projectApi.remove(id)
    projects.value = projects.value.filter(p => p.id !== id)
    if (currentProject.value?.id === id) currentProject.value = null
  }

  async function sendInvitation(projectId: string, identifier: string, role: ProjectMemberRole): Promise<void> {
    await projectApi.sendInvitation(projectId, identifier, role)
  }

  async function loadProjectInvitations(projectId: string): Promise<void> {
    const { data } = await projectApi.getProjectInvitations(projectId)
    projectInvitations.value = data
  }

  async function cancelInvitation(projectId: string, invId: string): Promise<void> {
    await projectApi.cancelInvitation(projectId, invId)
    projectInvitations.value = projectInvitations.value.filter(i => i.id !== invId)
  }

  async function removeMember(projectId: string, userId: string): Promise<void> {
    const { data } = await projectApi.removeMember(projectId, userId)
    if (currentProject.value?.id === projectId) currentProject.value = data
  }

  async function updateMemberRole(projectId: string, userId: string, role: ProjectMemberRole): Promise<void> {
    const { data } = await projectApi.updateMemberRole(projectId, userId, role)
    if (currentProject.value?.id === projectId) currentProject.value = data
  }

  async function leaveProject(projectId: string): Promise<void> {
    await projectApi.leaveProject(projectId)
    projects.value = projects.value.filter(p => p.id !== projectId)
    if (currentProject.value?.id === projectId) currentProject.value = null
  }

  async function loadMyInvitations(): Promise<void> {
    const { data } = await projectApi.getMyInvitations()
    myInvitations.value = data
  }

  async function acceptInvitation(invId: string): Promise<void> {
    await projectApi.acceptInvitation(invId)
    myInvitations.value = myInvitations.value.filter(i => i.id !== invId)
  }

  async function rejectInvitation(invId: string): Promise<void> {
    await projectApi.rejectInvitation(invId)
    myInvitations.value = myInvitations.value.filter(i => i.id !== invId)
  }

  return {
    projects, currentProject, myInvitations, projectInvitations,
    myRole, canWrite, canAdmin, isMaster,
    loadProjects, loadProject, createProject, updateProject, deleteProject,
    sendInvitation, loadProjectInvitations, cancelInvitation,
    removeMember, updateMemberRole, leaveProject,
    loadMyInvitations, acceptInvitation, rejectInvitation,
  }
})
