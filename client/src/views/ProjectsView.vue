<template>
  <div class="projects-page">
    <header class="projects-header">
      <div class="projects-logo">
        <img src="/seraph_logo.svg" alt="Seraph" width="42" height="42" />
        <span>Seraph</span>
      </div>
      <div class="header-right">
        <UserProfileDropdown @logout="showLogoutConfirm = true" />
      </div>
    </header>

    <!-- 초대 알림 배너 -->
    <div v-if="projectStore.myInvitations.length > 0" class="invitations-banner">
      <div class="invitations-banner-inner">
        <div class="invitations-banner-title">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L8.5 5H13L9.5 7.5L11 11.5L7 9L3 11.5L4.5 7.5L1 5H5.5L7 1Z" stroke="#f97316" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
          </svg>
          {{ $t('projects.invitations.title', { count: projectStore.myInvitations.length }) }}
        </div>
        <div class="invitations-list">
          <div
            v-for="inv in projectStore.myInvitations"
            :key="inv.id"
            class="invitation-item"
          >
            <div class="invitation-info">
              <span class="invitation-project">{{ inv.project.name }}</span>
              <span class="invitation-meta">{{ $t('projects.invitations.invitedBy', { username: inv.inviter.username }) }} · {{ roleLabel(inv.role) }}</span>
            </div>
            <div class="invitation-actions">
              <button class="btn-primary btn-sm" @click="onAcceptInvitation(inv.id)">{{ $t('projects.invitations.accept') }}</button>
              <button class="btn-ghost btn-sm btn-reject" @click="onRejectInvitation(inv.id)">{{ $t('projects.invitations.reject') }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="projects-body">
      <div class="projects-top">
        <h1 class="projects-title">{{ $t('projects.title') }}</h1>
        <button class="btn-outline btn-sm" @click="showCreate = true">{{ $t('projects.newProject') }}</button>
      </div>

      <div v-if="!loaded" class="projects-grid" aria-busy="true" aria-label="Loading projects">
        <div v-for="n in 6" :key="n" class="project-card-skeleton">
          <div class="sk-graph skeleton"></div>
          <div class="sk-body">
            <div class="sk-title skeleton"></div>
            <div class="sk-desc skeleton"></div>
            <div class="sk-meta">
              <div class="sk-badge skeleton"></div>
              <div class="sk-date skeleton"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="projectStore.projects.length === 0" class="projects-empty-wrapper">
        <!-- 온보딩 가이드 (스텝 바이 스텝) -->
        <div v-if="showOnboarding" class="onboarding-guide">
          <div class="onboarding-header">
            <div class="onboarding-header-text">
              <h2 class="onboarding-title">{{ $t('projects.onboarding.title') }}</h2>
              <p class="onboarding-subtitle">{{ $t('projects.onboarding.subtitle') }}</p>
            </div>
            <button class="btn-ghost btn-sm" @click="dismissOnboarding">{{ $t('projects.onboarding.dismiss') }}</button>
          </div>

          <!-- 스텝 인디케이터 -->
          <div class="onboarding-indicators">
            <button
              v-for="(step, idx) in onboardingSteps"
              :key="idx"
              class="onboarding-indicator"
              :class="{ active: idx === currentStep }"
              @click="currentStep = idx"
            >
              {{ step.number }}
            </button>
          </div>

          <!-- 현재 스텝 콘텐츠 -->
          <div class="onboarding-content">
            <div class="onboarding-visual">
              <GuideStepVisual :step="currentStep" />
            </div>
            <div class="onboarding-text">
              <h3 class="onboarding-step-title">{{ onboardingSteps[currentStep].title }}</h3>
              <p class="onboarding-step-desc">{{ onboardingSteps[currentStep].description }}</p>
              <ul class="onboarding-highlights">
                <li v-for="(item, i) in onboardingSteps[currentStep].highlights" :key="i">{{ item }}</li>
              </ul>
            </div>
          </div>

          <!-- 하단 네비게이션 -->
          <div class="onboarding-footer">
            <router-link to="/guide" class="onboarding-guide-link">
              {{ $t('projects.onboarding.fullGuide') }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </router-link>
            <div class="onboarding-nav">
              <button class="btn-ghost btn-sm" :disabled="currentStep === 0" @click="currentStep--">
                {{ $t('projects.onboarding.prev') }}
              </button>
              <button class="btn-outline btn-sm" v-if="currentStep < onboardingSteps.length - 1" @click="currentStep++">
                {{ $t('projects.onboarding.next') }}
              </button>
              <button class="btn-outline btn-sm" v-else @click="dismissOnboarding">
                {{ $t('projects.onboarding.done') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 기존 empty state -->
        <div class="projects-empty">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="36" cy="36" r="10" stroke="#3a3a42" stroke-width="1.8"/>
            <circle cx="12" cy="18" r="6" stroke="#2a2a30" stroke-width="1.4"/>
            <circle cx="60" cy="18" r="6" stroke="#2a2a30" stroke-width="1.4"/>
            <circle cx="12" cy="54" r="6" stroke="#2a2a30" stroke-width="1.4"/>
            <circle cx="60" cy="54" r="6" stroke="#2a2a30" stroke-width="1.4"/>
            <line x1="18" y1="22" x2="28" y2="29" stroke="#2a2a30" stroke-width="1.2"/>
            <line x1="54" y1="22" x2="44" y2="29" stroke="#2a2a30" stroke-width="1.2"/>
            <line x1="18" y1="50" x2="28" y2="43" stroke="#2a2a30" stroke-width="1.2"/>
            <line x1="54" y1="50" x2="44" y2="43" stroke="#2a2a30" stroke-width="1.2"/>
            <circle cx="36" cy="36" r="3" fill="#3a3a42"/>
          </svg>
          <p class="empty-title">{{ $t('projects.empty.title') }}</p>
          <p class="empty-desc">{{ $t('projects.empty.desc') }}</p>
          <button class="btn-outline btn-sm" @click="showCreate = true">{{ $t('projects.empty.create') }}</button>
        </div>
      </div>

      <template v-else>
        <div class="section-group">
          <h2 class="section-header">{{ $t('projects.myProjects', { count: myProjects.length }) }}</h2>
          <div v-if="myProjects.length > 0" class="projects-grid">
            <div
              v-for="project in myProjects"
              :key="project.id"
              class="project-card"
              @click="router.push({ name: 'project', params: { id: project.id } })"
            >
              <div class="project-card-graph">
                <svg width="72" height="80" viewBox="0 0 72 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="16" y="6" width="40" height="14" rx="3" fill="#0d3340" stroke="#3ec6d6" stroke-width="1"/>
                  <line x1="20" y1="13" x2="28" y2="13" stroke="#3ec6d6" stroke-width="0.8" opacity="0.5"/>
                  <line x1="20" y1="10" x2="32" y2="10" stroke="#3ec6d6" stroke-width="0.7" opacity="0.4"/>
                  <rect x="2" y="34" width="30" height="13" rx="3" fill="#292117" stroke="#d97706" stroke-width="1"/>
                  <line x1="6" y1="40" x2="12" y2="40" stroke="#d97706" stroke-width="0.8" opacity="0.5"/>
                  <rect x="40" y="34" width="30" height="13" rx="3" fill="#0d2e1c" stroke="#42b883" stroke-width="1"/>
                  <line x1="44" y1="40" x2="50" y2="40" stroke="#42b883" stroke-width="0.8" opacity="0.5"/>
                  <rect x="16" y="62" width="40" height="13" rx="3" fill="#1a1a1e" stroke="#2a2a30" stroke-width="1"/>
                  <line x1="20" y1="68" x2="28" y2="68" stroke="#787878" stroke-width="0.8" opacity="0.4"/>
                  <line x1="28" y1="20" x2="17" y2="34" stroke="#3ec6d6" stroke-width="1" opacity="0.5" class="card-edge" stroke-dasharray="5 3"/>
                  <polygon points="14,32 20,31 18,37" fill="#3ec6d6" opacity="0.5"/>
                  <line x1="44" y1="20" x2="55" y2="34" stroke="#3ec6d6" stroke-width="1" opacity="0.5" class="card-edge card-edge-rev" stroke-dasharray="5 3"/>
                  <polygon points="58,32 52,31 54,37" fill="#3ec6d6" opacity="0.5"/>
                  <line x1="17" y1="47" x2="28" y2="62" stroke="#525252" stroke-width="1" opacity="0.5" class="card-edge card-edge-slow" stroke-dasharray="5 3"/>
                  <polygon points="31,60 25,59 26,65" fill="#525252" opacity="0.5"/>
                  <line x1="55" y1="47" x2="44" y2="62" stroke="#525252" stroke-width="1" opacity="0.5" class="card-edge card-edge-rev" stroke-dasharray="5 3"/>
                  <polygon points="41,60 47,59 46,65" fill="#525252" opacity="0.5"/>
                </svg>
              </div>
              <div class="project-card-content">
                <div class="project-card-header">
                  <span class="project-name">{{ project.name }}</span>
                  <button
                    v-if="isAdminOf(project)"
                    class="btn-card-settings"
                    @click.stop="router.push({ name: 'projectSettings', params: { id: project.id } })"
                    :title="$t('projects.projectSettings')"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </button>
                </div>
                <p v-if="project.description" class="project-desc">{{ project.description }}</p>
                <div class="project-meta">
                  <span :class="['role-badge', myRoleIn(project).toLowerCase()]">{{ roleLabel(myRoleIn(project)) }}</span>
                  <span class="project-members">{{ $t('projects.members', { count: project.members.length }) }}</span>
                  <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="section-empty">
            <p class="section-empty-text">{{ $t('projects.myProjectsEmpty') }}</p>
            <button class="btn-outline btn-sm" @click="showCreate = true">{{ $t('projects.empty.create') }}</button>
          </div>
        </div>

        <div v-if="sharedProjects.length > 0" class="section-group">
          <h2 class="section-header">{{ $t('projects.sharedProjects', { count: sharedProjects.length }) }}</h2>
          <div class="projects-grid">
            <div
              v-for="project in sharedProjects"
              :key="project.id"
              class="project-card"
              @click="router.push({ name: 'project', params: { id: project.id } })"
            >
              <div class="project-card-graph">
                <svg width="72" height="80" viewBox="0 0 72 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="16" y="6" width="40" height="14" rx="3" fill="#0d3340" stroke="#3ec6d6" stroke-width="1"/>
                  <line x1="20" y1="13" x2="28" y2="13" stroke="#3ec6d6" stroke-width="0.8" opacity="0.5"/>
                  <line x1="20" y1="10" x2="32" y2="10" stroke="#3ec6d6" stroke-width="0.7" opacity="0.4"/>
                  <rect x="2" y="34" width="30" height="13" rx="3" fill="#292117" stroke="#d97706" stroke-width="1"/>
                  <line x1="6" y1="40" x2="12" y2="40" stroke="#d97706" stroke-width="0.8" opacity="0.5"/>
                  <rect x="40" y="34" width="30" height="13" rx="3" fill="#0d2e1c" stroke="#42b883" stroke-width="1"/>
                  <line x1="44" y1="40" x2="50" y2="40" stroke="#42b883" stroke-width="0.8" opacity="0.5"/>
                  <rect x="16" y="62" width="40" height="13" rx="3" fill="#1a1a1e" stroke="#2a2a30" stroke-width="1"/>
                  <line x1="20" y1="68" x2="28" y2="68" stroke="#787878" stroke-width="0.8" opacity="0.4"/>
                  <line x1="28" y1="20" x2="17" y2="34" stroke="#3ec6d6" stroke-width="1" opacity="0.5" class="card-edge" stroke-dasharray="5 3"/>
                  <polygon points="14,32 20,31 18,37" fill="#3ec6d6" opacity="0.5"/>
                  <line x1="44" y1="20" x2="55" y2="34" stroke="#3ec6d6" stroke-width="1" opacity="0.5" class="card-edge card-edge-rev" stroke-dasharray="5 3"/>
                  <polygon points="58,32 52,31 54,37" fill="#3ec6d6" opacity="0.5"/>
                  <line x1="17" y1="47" x2="28" y2="62" stroke="#525252" stroke-width="1" opacity="0.5" class="card-edge card-edge-slow" stroke-dasharray="5 3"/>
                  <polygon points="31,60 25,59 26,65" fill="#525252" opacity="0.5"/>
                  <line x1="55" y1="47" x2="44" y2="62" stroke="#525252" stroke-width="1" opacity="0.5" class="card-edge card-edge-rev" stroke-dasharray="5 3"/>
                  <polygon points="41,60 47,59 46,65" fill="#525252" opacity="0.5"/>
                </svg>
              </div>
              <div class="project-card-content">
                <div class="project-card-header">
                  <span class="project-name">{{ project.name }}</span>
                  <button
                    v-if="isAdminOf(project)"
                    class="btn-card-settings"
                    @click.stop="router.push({ name: 'projectSettings', params: { id: project.id } })"
                    :title="$t('projects.projectSettings')"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/>
                      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                  </button>
                </div>
                <p v-if="project.description" class="project-desc">{{ project.description }}</p>
                <div class="project-meta">
                  <span :class="['role-badge', myRoleIn(project).toLowerCase()]">{{ roleLabel(myRoleIn(project)) }}</span>
                  <span class="project-owner">{{ ownerName(project) }}</span>
                  <span class="project-members">{{ $t('projects.members', { count: project.members.length }) }}</span>
                  <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 로그아웃 확인 모달 -->
    <transition name="fade">
      <div v-if="showLogoutConfirm" class="modal-overlay" @click.self="showLogoutConfirm = false">
        <div class="modal-card" style="max-width:340px">
          <h2 class="modal-title">{{ $t('common.logout') }}</h2>
          <p style="font-size: var(--text-sm);color:var(--text-tertiary);margin:0 0 20px">{{ $t('common.logoutConfirm') }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-ghost" @click="showLogoutConfirm = false">{{ $t('common.cancel') }}</button>
            <button type="button" class="btn-danger" @click="onLogout">{{ $t('common.logout') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 프로젝트 생성 모달 -->
    <transition name="fade">
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
        <div class="modal-card">
          <h2 class="modal-title">{{ $t('projects.createModal.title') }}</h2>
          <form @submit.prevent="onCreateProject">
            <div class="form-group">
              <label class="form-label">{{ $t('projects.createModal.name') }}</label>
              <input v-model="createForm.name" class="form-input" :placeholder="$t('projects.createModal.namePlaceholder')" required autofocus />
            </div>
            <div class="form-group">
              <label class="form-label">{{ $t('projects.createModal.description') }}</label>
              <input v-model="createForm.description" class="form-input" :placeholder="$t('projects.createModal.descPlaceholder')" />
            </div>
            <div v-if="createError" class="form-error">{{ createError }}</div>
            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="showCreate = false">{{ $t('common.cancel') }}</button>
              <button type="submit" class="btn-primary" :disabled="creating">
                {{ creating ? $t('projects.createModal.submitting') : $t('projects.createModal.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { useProjectStore } from '../stores/project'
import { getLocale } from '../i18n'
import type { ProjectMemberRole } from '../api/projectApi'
import UserProfileDropdown from '../components/UserProfileDropdown.vue'
import GuideStepVisual from '../components/GuideStepVisual.vue'

const { t, tm } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const projectStore = useProjectStore()

const loading = ref(true)
const showCreate = ref(false)
const showLogoutConfirm = ref(false)
const createForm = ref({ name: '', description: '' })
const createError = ref('')
const creating = ref(false)

// ─── 온보딩 가이드 ──────────────────────────────────────
const ONBOARDING_DISMISSED_KEY = 'seraph_onboarding_dismissed'
const onboardingDismissed = ref(localStorage.getItem(ONBOARDING_DISMISSED_KEY) === 'true')

const showOnboarding = computed(() =>
  loaded.value && projectStore.projects.length === 0 && !onboardingDismissed.value
)

function dismissOnboarding() {
  onboardingDismissed.value = true
  localStorage.setItem(ONBOARDING_DISMISSED_KEY, 'true')
}

const currentStep = ref(0)
const STEP_NUMBERS = ['01', '02', '03', '04', '05', '06']
const onboardingSteps = computed(() => {
  const raw = tm('guide.sections') as Array<{ title: string; description: string; highlights: string[] }>
  return raw.map((s, i) => ({
    number: STEP_NUMBERS[i],
    title: s.title,
    description: s.description,
    highlights: s.highlights as unknown as string[],
  }))
})

const loaded = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      projectStore.loadProjects(),
      projectStore.loadMyInvitations(),
    ])
  } finally {
    loading.value = false
    loaded.value = true
  }
})

function roleLabel(role: ProjectMemberRole): string {
  const map: Record<ProjectMemberRole, string> = {
    MASTER: t('roles.master'), ADMIN: t('roles.admin'), WRITER: t('roles.writer'), READONLY: t('roles.readonly'),
  }
  return map[role] ?? role
}

async function onAcceptInvitation(invId: string) {
  try {
    await projectStore.acceptInvitation(invId)
    await projectStore.loadProjects()
  } catch { /* ignore */ }
}

async function onRejectInvitation(invId: string) {
  try {
    await projectStore.rejectInvitation(invId)
  } catch { /* ignore */ }
}

async function onLogout() {
  await auth.logout()
}

async function onCreateProject() {
  createError.value = ''
  creating.value = true
  try {
    const project = await projectStore.createProject(createForm.value.name, createForm.value.description || undefined)
    showCreate.value = false
    createForm.value = { name: '', description: '' }
    router.push({ name: 'project', params: { id: project.id } })
  } catch {
    createError.value = t('projects.createModal.error')
  } finally {
    creating.value = false
  }
}

function isAdminOf(project: { members: { userId: string; role: string }[] }): boolean {
  return project.members.some(m => m.userId === auth.user?.id && (m.role === 'MASTER' || m.role === 'ADMIN'))
}

function myRoleIn(project: { members: { userId: string; role: string }[] }): ProjectMemberRole {
  return (project.members.find(m => m.userId === auth.user?.id)?.role ?? 'READONLY') as ProjectMemberRole
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(getLocale() === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const myProjects = computed(() =>
  projectStore.projects
    .filter(p => p.ownerId === auth.user?.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
)

const sharedProjects = computed(() =>
  projectStore.projects
    .filter(p => p.ownerId !== auth.user?.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
)

function ownerName(project: { members: { role: string; user: { username: string } }[] }): string {
  const master = project.members.find(m => m.role === 'MASTER')
  return master?.user.username ?? ''
}
</script>

<style scoped>
.projects-page { min-height: 100vh; background: var(--bg-base); }
.projects-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 32px; border-bottom: 1px solid var(--bg-surface);
}
.projects-logo {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--text-xl); font-weight: 700; color: var(--accent-soft); letter-spacing: 0.04em;
}
.header-right { display: flex; align-items: center; gap: 12px; }
.projects-body { max-width: 960px; margin: 0 auto; padding: 40px 32px; }
.section-group { margin-bottom: 32px; }
.section-group:last-child { margin-bottom: 0; }
.section-header {
  font-size: var(--text-sm); font-weight: 600; color: var(--text-tertiary);
  margin: 0 0 12px 0; padding-left: 10px;
  border-left: 2px solid var(--accent-primary);
}
.project-owner {
  font-size: var(--text-xs); color: var(--text-disabled);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px;
}
.section-empty { padding: 24px 0; text-align: center; }
.section-empty-text { font-size: var(--text-sm); color: var(--text-disabled); margin: 0 0 12px 0; }
.projects-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.projects-title { font-size: var(--text-xl); font-weight: 700; color: var(--text-primary); margin: 0; }
/* 프로젝트 비어있음 + 온보딩 래퍼 */
.projects-empty-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

/* 온보딩 가이드 */
.onboarding-guide {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 8px;
  width: 100%;
}
.onboarding-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}
.onboarding-header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.onboarding-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.onboarding-subtitle {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  margin: 0;
}

/* 스텝 인디케이터 */
.onboarding-indicators {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
}
.onboarding-indicator {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: var(--text-xs);
  font-weight: 700;
  font-family: var(--font-mono);
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s;
}
.onboarding-indicator:hover {
  border-color: var(--border-strong);
  color: var(--text-secondary);
}
.onboarding-indicator.active {
  background: color-mix(in srgb, var(--accent-primary) 15%, transparent);
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

/* 스텝 콘텐츠 */
.onboarding-content {
  display: flex;
  gap: 24px;
  height: 240px;
}
.onboarding-visual {
  flex: 0 0 45%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  overflow: hidden;
}
.onboarding-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 8px;
  overflow: hidden;
}
.onboarding-step-title {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.onboarding-step-desc {
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: 1.6;
  margin: 0;
}
.onboarding-highlights {
  list-style: none;
  padding: 0;
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.onboarding-highlights li {
  font-size: var(--text-xs);
  color: var(--text-muted);
  padding-left: 14px;
  position: relative;
}
.onboarding-highlights li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 6px;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-primary);
  opacity: 0.6;
}

/* 하단 네비게이션 */
.onboarding-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}
.onboarding-guide-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--accent-soft);
  text-decoration: none;
  transition: color 0.15s;
}
.onboarding-guide-link:hover {
  color: var(--accent-light);
}
.onboarding-nav {
  display: flex;
  gap: 8px;
}

.projects-empty { text-align: center; padding: 72px 0; color: var(--border-strong); font-size: var(--text-base); display: flex; flex-direction: column; align-items: center; gap: 10px; }
.empty-title { font-size: var(--text-base); font-weight: 600; color: var(--text-tertiary); margin: 6px 0 0; }
.empty-desc  { font-size: var(--text-sm); color: var(--border-strong); margin: 0 0 6px; }
.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.project-card-skeleton {
  display: flex; gap: 16px; align-items: flex-start;
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 10px;
  padding: 16px;
}
.sk-graph  { width: 72px; height: 80px; border-radius: 6px; flex-shrink: 0; }
.sk-body   { flex: 1; display: flex; flex-direction: column; gap: 8px; padding-top: 4px; }
.sk-title  { height: 16px; width: 55%; border-radius: 4px; }
.sk-desc   { height: 11px; width: 80%; border-radius: 4px; }
.sk-meta   { display: flex; gap: 8px; margin-top: 12px; }
.sk-badge  { height: 18px; width: 52px; border-radius: 10px; }
.sk-date   { height: 11px; width: 70px; border-radius: 4px; align-self: center; }
.project-card {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 10px;
  cursor: pointer; transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
  display: flex; flex-direction: row; overflow: hidden; min-height: 110px;
}
.project-card:hover {
  border-color: var(--accent-focus); background: var(--accent-bg-subtle);
  box-shadow: 0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(217,119,6,0.08);
}
.project-card-graph {
  width: 88px; flex-shrink: 0;
  background: var(--bg-base); border-right: 1px solid var(--border-default);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.2s;
  overflow: hidden;
}
.project-card-graph svg { transition: transform 0.25s ease, opacity 0.25s ease; opacity: 0.75; }
.project-card:hover .project-card-graph { background: var(--accent-bg-deep); }
.project-card:hover .project-card-graph svg { transform: scale(1.1); opacity: 1; }
@keyframes marchDash { to { stroke-dashoffset: -8; } }
@keyframes marchDashRev { to { stroke-dashoffset: 8; } }
.card-edge { animation: none; }
.project-card:hover .card-edge { animation: marchDash 1.4s linear infinite; }
.project-card:hover .card-edge-rev { animation: marchDashRev 1.4s linear infinite; }
.project-card:hover .card-edge-slow { animation: marchDash 2.2s linear infinite; }
.project-card-content { flex: 1; padding: 16px 18px; display: flex; flex-direction: column; justify-content: space-between; min-width: 0; }
.project-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.project-name { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn-card-settings {
  color: var(--text-tertiary); background: transparent; border: none; cursor: pointer;
  padding: 2px; border-radius: 4px; transition: color 0.15s; display: flex; align-items: center; flex-shrink: 0;
}
.btn-card-settings:hover { color: var(--text-secondary); }
.project-desc { font-size: var(--text-xs); color: var(--text-disabled); margin: 0 0 10px 0; line-height: 1.5; flex: 1; }
.project-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.project-members { font-size: var(--text-xs); color: var(--text-tertiary); margin-left: auto; }
.project-date { font-size: var(--text-xs); color: var(--text-tertiary); }
.role-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  border: 1px solid transparent; flex-shrink: 0;
}
.role-badge.master   { background: var(--role-master-bg); border-color: var(--role-master); color: var(--accent-light); }
.role-badge.admin    { background: var(--role-admin-bg); border-color: var(--role-admin); color: var(--role-admin-text); }
.role-badge.writer   { background: var(--role-writer-bg); border-color: var(--role-writer); color: var(--node-ext-text); }
.role-badge.readonly { background: var(--role-readonly-bg); border-color: var(--role-readonly); color: var(--text-muted); }
/* 모달 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 12px;
  padding: 28px; width: 100%; max-width: 380px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
}
.modal-title { font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); margin: 0 0 20px 0; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-label { font-size: var(--text-xs); font-weight: 600; color: var(--text-tertiary); }
.form-input {
  background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 7px;
  padding: 9px 12px; font-size: var(--text-base); color: var(--text-secondary); outline: none; transition: border-color 0.15s;
}
.form-input:focus { border-color: var(--accent-focus); }
.form-input::placeholder { color: var(--border-strong); }
.form-error { font-size: var(--text-xs); color: #f87171; margin-bottom: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
/* 초대 배너 */
.invitations-banner {
  background: var(--bg-elevated); border-bottom: 1px solid var(--border-default);
}
.invitations-banner-inner {
  max-width: 960px; margin: 0 auto; padding: 16px 32px;
}
.invitations-banner-title {
  display: flex; align-items: center; gap: 6px;
  font-size: var(--text-xs); font-weight: 700; color: #f97316; margin-bottom: 12px;
}
.invitations-list { display: flex; flex-direction: column; gap: 8px; }
.invitation-item {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 8px;
  padding: 10px 14px;
}
.invitation-info { display: flex; flex-direction: column; gap: 2px; }
.invitation-project { font-size: var(--text-sm); font-weight: 700; color: var(--text-secondary); }
.invitation-meta { font-size: var(--text-xs); color: var(--text-disabled); }
.invitation-actions { display: flex; gap: 6px; }
.btn-reject:hover { border-color: var(--color-danger); color: var(--color-danger-muted); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
