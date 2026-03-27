<template>
  <div class="projects-page">
    <header class="projects-header">
      <div class="projects-logo">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- 좌상단 → 우하단 방향 화살표 (파랑) -->
          <line x1="4" y1="4" x2="22" y2="22" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="14,22 22,22 22,14" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <!-- 우하단 → 좌상단 방향 화살표 (주황) -->
          <line x1="28" y1="28" x2="10" y2="10" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="18,10 10,10 10,18" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <!-- 웹 로고 (좌하단) -->
          <circle cx="6" cy="26" r="3.5" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
          <line x1="6" y1="22.5" x2="6" y2="29.5" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>
          <line x1="2.5" y1="26" x2="9.5" y2="26" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>
          <path d="M3.5 23.8 Q6 25 8.5 23.8" stroke="#94a3b8" stroke-width="1" fill="none" stroke-linecap="round"/>
          <path d="M3.5 28.2 Q6 27 8.5 28.2" stroke="#94a3b8" stroke-width="1" fill="none" stroke-linecap="round"/>
          <!-- DB 로고 (우상단) -->
          <ellipse cx="26" cy="5" rx="4" ry="1.8" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
          <line x1="22" y1="5" x2="22" y2="9" stroke="#94a3b8" stroke-width="1.4"/>
          <line x1="30" y1="5" x2="30" y2="9" stroke="#94a3b8" stroke-width="1.4"/>
          <path d="M22 9 Q26 11 30 9" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
        </svg>
        <span>Server Dependencies</span>
      </div>
      <div class="header-right">
        <span class="user-info">{{ auth.user?.username }}</span>
        <button class="btn-logout" @click="showLogoutConfirm = true">로그아웃</button>
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
              <button class="btn-accept" @click="onAcceptInvitation(inv.id)">수락</button>
              <button class="btn-reject" @click="onRejectInvitation(inv.id)">거절</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="projects-body">
      <div class="projects-top">
        <h1 class="projects-title">프로젝트</h1>
        <button class="btn-new" @click="showCreate = true">+ 새 프로젝트</button>
      </div>

      <div v-if="loading" class="projects-empty">불러오는 중...</div>

      <div v-else-if="projectStore.projects.length === 0" class="projects-empty">
        <p>아직 프로젝트가 없습니다.</p>
        <button class="btn-new" @click="showCreate = true">첫 번째 프로젝트 만들기</button>
      </div>

      <div v-else class="projects-grid">
        <div
          v-for="project in projectStore.projects"
          :key="project.id"
          class="project-card"
          @click="router.push({ name: 'project', params: { id: project.id } })"
        >
          <div class="project-card-header">
            <span class="project-name">{{ project.name }}</span>
            <button
              v-if="project.ownerId === auth.user?.id"
              class="btn-delete-project"
              @click.stop="onDeleteProject(project.id)"
              title="프로젝트 삭제"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <p v-if="project.description" class="project-desc">{{ project.description }}</p>
          <div class="project-meta">
            <span class="project-members">멤버 {{ project.members.length }}명</span>
            <span class="project-date">{{ formatDate(project.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 로그아웃 확인 모달 -->
    <transition name="fade">
      <div v-if="showLogoutConfirm" class="modal-overlay" @click.self="showLogoutConfirm = false">
        <div class="modal-card" style="max-width:340px">
          <h2 class="modal-title">로그아웃</h2>
          <p style="font-size:13px;color:#94a3b8;margin:0 0 20px">로그아웃 하시겠습니까?</p>
          <div class="modal-actions">
            <button type="button" class="btn-cancel" @click="showLogoutConfirm = false">취소</button>
            <button type="button" class="btn-confirm btn-confirm-danger" @click="onLogout">로그아웃</button>
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
              <button type="button" class="btn-cancel" @click="showCreate = false">취소</button>
              <button type="submit" class="btn-confirm" :disabled="creating">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useProjectStore } from '../stores/project'
import type { ProjectMemberRole } from '../api/projectApi'

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
  router.push({ name: 'hero' })
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

async function onDeleteProject(id: string) {
  if (!confirm('프로젝트를 삭제하면 모든 그래프 데이터가 함께 삭제됩니다.')) return
  try { await projectStore.deleteProject(id) } catch { /* ignore */ }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.projects-page { min-height: 100vh; background: #0f172a; }
.projects-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 32px; border-bottom: 1px solid #1e293b;
}
.projects-logo {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: #60a5fa; letter-spacing: 0.04em;
}
.header-right { display: flex; align-items: center; gap: 12px; }
.user-info { font-size: 12px; color: #64748b; }
.btn-logout {
  font-size: 11px; padding: 4px 10px; border-radius: 6px;
  border: 1px solid #334155; background: transparent; color: #64748b;
  cursor: pointer; transition: all 0.15s;
}
.btn-logout:hover { border-color: #ef4444; color: #f87171; }
.projects-body { max-width: 960px; margin: 0 auto; padding: 40px 32px; }
.projects-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.projects-title { font-size: 22px; font-weight: 700; color: #f1f5f9; margin: 0; }
.btn-new {
  font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 7px;
  border: 1px solid #1d4ed8; background: #1e3a5f; color: #60a5fa;
  cursor: pointer; transition: all 0.15s;
}
.btn-new:hover { background: #1e3a8a; color: #93c5fd; }
.projects-empty { text-align: center; padding: 60px 0; color: #475569; font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
.projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.project-card {
  background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 20px;
  cursor: pointer; transition: border-color 0.15s, background 0.15s;
}
.project-card:hover { border-color: #3b82f6; background: #243044; }
.project-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.project-name { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.btn-delete-project {
  color: #475569; background: transparent; border: none; cursor: pointer;
  padding: 2px; border-radius: 4px; transition: color 0.15s;
}
.btn-delete-project:hover { color: #ef4444; }
.project-desc { font-size: 12px; color: #64748b; margin: 0 0 12px 0; line-height: 1.5; }
.project-meta { display: flex; align-items: center; justify-content: space-between; }
.project-members { font-size: 11px; color: #475569; }
.project-date { font-size: 11px; color: #475569; }
/* 모달 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-card {
  background: #1e293b; border: 1px solid #334155; border-radius: 12px;
  padding: 28px; width: 100%; max-width: 380px;
}
.modal-title { font-size: 16px; font-weight: 700; color: #f1f5f9; margin: 0 0 20px 0; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-label { font-size: 12px; font-weight: 600; color: #94a3b8; }
.form-input {
  background: #0f172a; border: 1px solid #334155; border-radius: 7px;
  padding: 9px 12px; font-size: 14px; color: #e2e8f0; outline: none; transition: border-color 0.15s;
}
.form-input:focus { border-color: #3b82f6; }
.form-input::placeholder { color: #475569; }
.form-error { font-size: 12px; color: #f87171; margin-bottom: 12px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.btn-cancel {
  padding: 8px 16px; border-radius: 6px; font-size: 13px;
  border: 1px solid #334155; background: transparent; color: #94a3b8; cursor: pointer;
}
.btn-cancel:hover { border-color: #475569; color: #e2e8f0; }
.btn-confirm {
  padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 700;
  border: none; background: #2563eb; color: #fff; cursor: pointer; transition: background 0.15s;
}
.btn-confirm:hover:not(:disabled) { background: #1d4ed8; }
.btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-confirm-danger { background: #991b1b; }
.btn-confirm-danger:hover:not(:disabled) { background: #b91c1c; }
/* 초대 배너 */
.invitations-banner {
  background: #1a1f2e; border-bottom: 1px solid #2a3347;
}
.invitations-banner-inner {
  max-width: 960px; margin: 0 auto; padding: 16px 32px;
}
.invitations-banner-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #f97316; margin-bottom: 12px;
}
.invitations-list { display: flex; flex-direction: column; gap: 8px; }
.invitation-item {
  display: flex; align-items: center; justify-content: space-between;
  background: #0f172a; border: 1px solid #2a3347; border-radius: 8px;
  padding: 10px 14px;
}
.invitation-info { display: flex; flex-direction: column; gap: 2px; }
.invitation-project { font-size: 13px; font-weight: 700; color: #e2e8f0; }
.invitation-meta { font-size: 11px; color: #64748b; }
.invitation-actions { display: flex; gap: 6px; }
.btn-accept {
  font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 5px;
  border: none; background: #1d4ed8; color: #fff; cursor: pointer; transition: background 0.15s;
}
.btn-accept:hover { background: #2563eb; }
.btn-reject {
  font-size: 11px; font-weight: 700; padding: 5px 12px; border-radius: 5px;
  border: 1px solid #334155; background: transparent; color: #64748b; cursor: pointer; transition: all 0.15s;
}
.btn-reject:hover { border-color: #ef4444; color: #f87171; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
