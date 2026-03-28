import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectStore } from '../stores/project'

async function checkProjectAccess(id: string): Promise<true | { name: string }> {
  try {
    const projectStore = useProjectStore()
    await projectStore.loadProject(id)
    return true
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status
    return status === 403 ? { name: 'forbidden' } : { name: 'projects' }
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'hero', component: () => import('../views/HeroView.vue') },
    { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
    { path: '/register', name: 'register', component: () => import('../views/RegisterView.vue') },
    { path: '/projects', name: 'projects', component: () => import('../views/ProjectsView.vue'), meta: { requiresAuth: true } },
    {
      path: '/projects/:id', name: 'project',
      component: () => import('../views/ProjectView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: async to => checkProjectAccess(to.params.id as string),
    },
    {
      path: '/projects/:id/audit-logs', name: 'auditLogs',
      component: () => import('../views/AuditLogView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: async to => checkProjectAccess(to.params.id as string),
    },
    {
      path: '/projects/:id/settings', name: 'projectSettings',
      component: () => import('../views/ProjectSettingsView.vue'),
      meta: { requiresAuth: true },
      beforeEnter: async to => checkProjectAccess(to.params.id as string),
    },
    { path: '/forbidden', name: 'forbidden', component: () => import('../views/ForbiddenView.vue'), meta: { requiresAuth: true } },
  ],
})

router.beforeEach(async to => {
  const auth = useAuthStore()
  await auth.initializeSession()

  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const publicOnly = ['hero', 'login', 'register']
  if (publicOnly.includes(to.name as string) && auth.isLoggedIn) {
    return { name: 'projects' }
  }
})

export default router
