<template>
  <div class="projects-page">
    <header class="projects-header">
      <div class="projects-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 좌상단 → 우하단 방향 화살표 (파랑) -->
          <line x1="4" y1="4" x2="22" y2="22" stroke="#5b8def" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="14,22 22,22 22,14" stroke="#5b8def" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <!-- 우하단 → 좌상단 방향 화살표 (주황) -->
          <line x1="28" y1="28" x2="10" y2="10" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="18,10 10,10 10,18" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <!-- 웹 로고 (좌하단) -->
          <circle cx="6" cy="26" r="3.5" stroke="#787878" stroke-width="1.4" fill="none"/>
          <line x1="6" y1="22.5" x2="6" y2="29.5" stroke="#787878" stroke-width="1" stroke-linecap="round"/>
          <line x1="2.5" y1="26" x2="9.5" y2="26" stroke="#787878" stroke-width="1" stroke-linecap="round"/>
          <path d="M3.5 23.8 Q6 25 8.5 23.8" stroke="#787878" stroke-width="1" fill="none" stroke-linecap="round"/>
          <path d="M3.5 28.2 Q6 27 8.5 28.2" stroke="#787878" stroke-width="1" fill="none" stroke-linecap="round"/>
          <!-- DB 로고 (우상단) -->
          <ellipse cx="26" cy="5" rx="4" ry="1.8" stroke="#787878" stroke-width="1.4" fill="none"/>
          <line x1="22" y1="5" x2="22" y2="9" stroke="#787878" stroke-width="1.4"/>
          <line x1="30" y1="5" x2="30" y2="9" stroke="#787878" stroke-width="1.4"/>
          <path d="M22 9 Q26 11 30 9" stroke="#787878" stroke-width="1.4" fill="none"/>
        </svg>
        <span>Server Dependencies</span>
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
          대기 중인 초대 {{ projectStore.myInvitations.length }}건
        </div>
        <div class="invitations-list">
          <div
            v-for="inv in projectStore.myInvitations"
            :key="inv.id"
            class="invitation-item"
          >
            <div class="invitation-info">
              <span class="invitation-project">{{ inv.project.name }}</span>
              <span class="invitation-meta">{{ inv.inviter.username }} 님이 초대 · {{ roleLabel(inv.role) }}</span>
            </div>
            <div class="invitation-actions">
              <button class="btn-primary btn-sm" @click="onAcceptInvitation(inv.id)">수락</button>
              <button class="btn-ghost btn-sm btn-reject" @click="onRejectInvitation(inv.id)">거절</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="projects-body">
      <div class="projects-top">
        <h1 class="projects-title">프로젝트</h1>
        <button class="btn-outline btn-sm" @click="showCreate = true">+ 새 프로젝트</button>
      </div>

      <div v-if="loading" class="projects-grid">
        <div v-for="i in 4" :key="i" class="project-card-skeleton">
          <div class="skeleton sk-graph"></div>
          <div class="sk-body">
            <div class="skeleton sk-title"></div>
            <div class="skeleton sk-desc"></div>
            <div class="sk-meta">
              <div class="skeleton sk-badge"></div>
              <div class="skeleton sk-date"></div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="projectStore.projects.length === 0" class="projects-empty">
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
        <p class="empty-title">아직 프로젝트가 없습니다</p>
        <p class="empty-desc">팀과 함께 서버 의존성을 시각화해보세요</p>
        <button class="btn-outline btn-sm" @click="showCreate = true">첫 번째 프로젝트 만들기</button>
      </div>

      <template v-else>
        <div class="section-group">
          <h2 class="section-header">내 프로젝트 ({{ myProjects.length }})</h2>
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
                    title="프로젝트 설정"
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
                  <span class="project-members">멤버 {{ project.members.length }}명</span>
                  <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="section-empty">
            <p class="section-empty-text">아직 직접 만든 프로젝트가 없습니다</p>
            <button class="btn-outline btn-sm" @click="showCreate = true">첫 번째 프로젝트 만들기</button>
          </div>
        </div>

        <div v-if="sharedProjects.length > 0" class="section-group">
          <h2 class="section-header">공유받은 프로젝트 ({{ sharedProjects.length }})</h2>
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
                    title="프로젝트 설정"
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
                  <span class="project-members">멤버 {{ project.members.length }}명</span>
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
          <h2 class="modal-title">로그아웃</h2>
          <p style="font-size: var(--text-sm);color:var(--text-tertiary);margin:0 0 20px">로그아웃 하시겠습니까?</p>
          <div class="modal-actions">
            <button type="button" class="btn-ghost" @click="showLogoutConfirm = false">취소</button>
            <button type="button" class="btn-danger" @click="onLogout">로그아웃</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 프로젝트 생성 모달 -->
    <transition name="fade">
      <div v-if="showCreate" class="modal-overlay" @click.self="showCreate = false">
        <div class="modal-card">
          <h2 class="modal-title">새 프로젝트</h2>
          <form @submit.prevent="onCreateProject">
            <div class="form-group">
              <label class="form-label">이름</label>
              <input v-model="createForm.name" class="form-input" placeholder="프로젝트 이름" required autofocus />
            </div>
            <div class="form-group">
              <label class="form-label">설명 (선택)</label>
              <input v-model="createForm.description" class="form-input" placeholder="간단한 설명" />
            </div>
            <div v-if="createError" class="form-error">{{ createError }}</div>
            <div class="modal-actions">
              <button type="button" class="btn-ghost" @click="showCreate = false">취소</button>
              <button type="submit" class="btn-primary" :disabled="creating">
                {{ creating ? '생성 중...' : '생성' }}
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
import { useAuthStore } from '../stores/auth'
import { useProjectStore } from '../stores/project'
import type { ProjectMemberRole } from '../api/projectApi'
import UserProfileDropdown from '../components/UserProfileDropdown.vue'

const router = useRouter()
const auth = useAuthStore()
const projectStore = useProjectStore()

const loading = ref(false)
const showCreate = ref(false)
const showLogoutConfirm = ref(false)
const createForm = ref({ name: '', description: '' })
const createError = ref('')
const creating = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      projectStore.loadProjects(),
      projectStore.loadMyInvitations(),
    ])
  } finally {
    loading.value = false
  }
})

function roleLabel(role: ProjectMemberRole): string {
  const map: Record<ProjectMemberRole, string> = {
    MASTER: '마스터', ADMIN: '관리자', WRITER: '편집자', READONLY: '읽기전용',
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
    createError.value = '프로젝트 생성 중 오류가 발생했습니다.'
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
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
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
  font-size: var(--text-sm); font-weight: 700; color: var(--accent-soft); letter-spacing: 0.04em;
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
