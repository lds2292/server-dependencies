import { defineStore } from 'pinia'
import { ref } from 'vue'
import { projectApi, type Project } from '../api/projectApi'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)

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

  async function addMember(projectId: string, identifier: string): Promise<void> {
    const { data } = await projectApi.addMember(projectId, identifier)
    if (currentProject.value?.id === projectId) currentProject.value = data
  }

  async function removeMember(projectId: string, userId: string): Promise<void> {
    const { data } = await projectApi.removeMember(projectId, userId)
    if (currentProject.value?.id === projectId) currentProject.value = data
  }

  return { projects, currentProject, loadProjects, loadProject, createProject, updateProject, deleteProject, addMember, removeMember }
})
