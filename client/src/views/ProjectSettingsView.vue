<template>
  <div class="settings-page">
    <div class="settings-topbar">
      <button class="back-btn" @click="router.push({ name: 'projects' })">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        돌아가기
      </button>
      <span class="settings-title">프로젝트 설정</span>
      <span class="project-name-label">{{ projectStore.currentProject?.name }}</span>
    </div>

    <div class="settings-body">
      <div v-if="loading" class="settings-skeleton">
        <div class="sk-section-block">
          <div class="skeleton sk-section-title"></div>
          <div class="skeleton sk-field"></div>
          <div class="skeleton sk-field sk-field-tall"></div>
        </div>
        <div class="sk-section-block">
          <div class="skeleton sk-section-title"></div>
          <div v-for="i in 3" :key="i" class="sk-member-row">
            <div class="skeleton sk-circle"></div>
            <div class="sk-member-info">
              <div class="skeleton sk-line-lg"></div>
              <div class="skeleton sk-line-sm"></div>
            </div>
          </div>
        </div>
      </div>
      <template v-else>

        <!-- 프로젝트 정보 -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="section-icon">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M5 6h6M5 9h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            프로젝트 정보
          </h2>
          <div class="form-group">
            <label class="form-label">이름</label>
            <input v-model="editName" class="form-input" maxlength="100" />
          </div>
          <div class="form-group">
            <label class="form-label">설명</label>
            <textarea v-model="editDescription" class="form-input form-textarea" rows="3" placeholder="프로젝트 설명 (선택)" />
          </div>
          <button class="btn-save" @click="onSaveInfo" :disabled="savingInfo || !editName.trim()">
            {{ savingInfo ? '저장 중...' : '저장' }}
          </button>
        </section>

        <!-- 멤버 관리 -->
        <section class="settings-section">
          <h2 class="section-title">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="section-icon">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
              <path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="12.5" cy="5" r="2" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12.5 10c1.66 0 3 1.34 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            멤버 관리
          </h2>
          <div class="members-list">
            <div v-for="member in projectStore.currentProject?.members" :key="member.userId" class="member-row">
              <div class="member-info">
                <span class="member-name">{{ member.user.username }}</span>
                <span class="member-email">{{ member.user.email }}</span>
              </div>
              <div class="member-actions">
                <span v-if="member.userId === authStore.user?.id" :class="['role-badge', member.role.toLowerCase()]">
                  {{ roleLabel(member.role) }} (나)
                </span>
                <select
                  v-else-if="canChangeRole(member.role)"
                  class="role-select"
                  :value="member.role"
                  @change="onChangeRole(member.userId, ($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="r in assignableRoles(member.role)" :key="r" :value="r">{{ roleLabel(r) }}</option>
                </select>
                <span v-else :class="['role-badge', member.role.toLowerCase()]">{{ roleLabel(member.role) }}</span>
                <button
                  v-if="canRemoveMember(member.role, member.userId)"
                  class="member-remove-btn"
                  @click="onRemoveMember(member.userId)"
                  title="멤버 제거"
                >x</button>
              </div>
            </div>
          </div>

          <div v-if="projectStore.canAdmin" class="member-add-form">
            <input
              v-model="addMemberIdentifier"
              class="member-input"
              placeholder="이메일"
              @keydown.enter="onSendInvitation"
            />
            <select v-model="addMemberRole" class="role-select">
              <option v-for="r in addableRoles" :key="r" :value="r">{{ roleLabel(r) }}</option>
            </select>
            <button class="btn-primary" @click="onSendInvitation" :disabled="!addMemberIdentifier.trim()">초대</button>
          </div>
          <div v-if="memberError" class="member-error">{{ memberError }}</div>

          <div v-if="projectStore.canAdmin && projectStore.projectInvitations.length > 0" class="pending-invitations">
            <div class="pending-invitations-title">대기 중인 초대</div>
            <div v-for="inv in projectStore.projectInvitations" :key="inv.id" class="pending-inv-row">
              <div class="pending-inv-info">
                <span class="member-name">{{ inv.invitee.email }}</span>
                <span :class="['role-badge', inv.role.toLowerCase()]">{{ roleLabel(inv.role) }}</span>
              </div>
              <button class="member-remove-btn" @click="onCancelInvitation(inv.id)" title="초대 취소">x</button>
            </div>
          </div>
        </section>

        <!-- 위험 영역 (MASTER only) -->
        <section v-if="projectStore.isMaster" class="settings-section danger-zone">
          <h2 class="section-title danger-title">
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" class="section-icon">
              <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8 6.5v2.5M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            위험 영역
          </h2>
          <div class="danger-item">
            <div class="danger-desc">
              <span class="danger-label">프로젝트 삭제</span>
              <span class="danger-hint">프로젝트와 모든 그래프 데이터가 영구적으로 삭제됩니다.</span>
            </div>
            <button class="btn-danger" @click="showDeleteConfirm = true">프로젝트 삭제</button>
          </div>
        </section>

      </template>
    </div>

    <!-- 삭제 확인 다이얼로그 -->
    <transition name="toast-fade">
      <div v-if="showDeleteConfirm" class="delete-overlay" @click.self="showDeleteConfirm = false; deleteConfirmInput = ''">
        <div class="delete-dialog">
          <div class="delete-dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="#ef4444" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">프로젝트 삭제</div>
            <div class="delete-dialog-desc">
              삭제하려면 프로젝트 이름 <strong style="color:#f1f5f9">{{ projectStore.currentProject?.name }}</strong>을 입력하세요.<br/>
              모든 그래프 데이터가 영구적으로 삭제됩니다.
            </div>
          </div>
          <input
            v-model="deleteConfirmInput"
            class="delete-name-input"
            placeholder="프로젝트 이름 입력"
            @keydown.enter="deleteConfirmInput === projectStore.currentProject?.name && !deleting && onDeleteProject()"
          />
          <div class="delete-dialog-actions">
            <button class="delete-btn-cancel" @click="showDeleteConfirm = false; deleteConfirmInput = ''">취소</button>
            <button class="delete-btn-confirm" @click="onDeleteProject"
              :disabled="deleting || deleteConfirmInput !== projectStore.currentProject?.name">
              {{ deleting ? '삭제 중...' : '삭제' }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 토스트 -->
    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['app-toast', toastType]">{{ toastMsg }}</div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project'
import { useAuthStore } from '../stores/auth'
import type { ProjectMemberRole } from '../api/projectApi'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const projectId = route.params.id as string

const loading = ref(true)

// ─── 토스트 ───────────────────────────────────────────────
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('error')
let toastTimer: ReturnType<typeof setTimeout> | null = null
function showToast(msg: string, type: 'success' | 'error' = 'error') {
  toastMsg.value = msg
  toastType.value = type
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 2500)
}

// ─── 프로젝트 정보 ────────────────────────────────────────
const editName = ref('')
const editDescription = ref('')
const savingInfo = ref(false)

async function onSaveInfo() {
  if (!editName.value.trim()) return
  savingInfo.value = true
  try {
    await projectStore.updateProject(projectId, {
      name: editName.value.trim(),
      description: editDescription.value.trim() || undefined,
    })
    showToast('저장되었습니다.', 'success')
  } catch {
    showToast('저장에 실패했습니다.')
  } finally {
    savingInfo.value = false
  }
}

// ─── 멤버 관리 ────────────────────────────────────────────
const addMemberIdentifier = ref('')
const addMemberRole = ref<ProjectMemberRole>('READONLY')
const memberError = ref('')

const ROLE_LABELS: Record<ProjectMemberRole, string> = {
  MASTER: 'Master', ADMIN: 'Admin', WRITER: 'Writer', READONLY: 'ReadOnly',
}
function roleLabel(role: string): string {
  return ROLE_LABELS[role as ProjectMemberRole] ?? role
}

const ALL_ROLES: ProjectMemberRole[] = ['ADMIN', 'WRITER', 'READONLY']

const addableRoles = computed<ProjectMemberRole[]>(() =>
  projectStore.isMaster ? ALL_ROLES : ['WRITER', 'READONLY']
)

function canChangeRole(targetRole: ProjectMemberRole): boolean {
  const my = projectStore.myRole
  if (!my) return false
  if (my === 'MASTER') return targetRole !== 'MASTER'
  if (my === 'ADMIN') return targetRole === 'WRITER' || targetRole === 'READONLY'
  return false
}

function canRemoveMember(targetRole: ProjectMemberRole, targetUserId: string): boolean {
  if (targetUserId === authStore.user?.id) return false
  return canChangeRole(targetRole)
}

function assignableRoles(_currentRole: ProjectMemberRole): ProjectMemberRole[] {
  if (projectStore.isMaster) return ALL_ROLES
  return ['WRITER', 'READONLY']
}

async function onSendInvitation() {
  if (!addMemberIdentifier.value.trim()) return
  memberError.value = ''
  try {
    await projectStore.sendInvitation(projectId, addMemberIdentifier.value.trim(), addMemberRole.value)
    await projectStore.loadProjectInvitations(projectId)
    addMemberIdentifier.value = ''
    showToast('초대가 전송되었습니다.', 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? '초대 전송에 실패했습니다.'
  }
}

async function onCancelInvitation(invId: string) {
  memberError.value = ''
  try {
    await projectStore.cancelInvitation(projectId, invId)
    showToast('초대가 취소되었습니다.', 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? '초대 취소에 실패했습니다.'
  }
}

async function onRemoveMember(targetUserId: string) {
  memberError.value = ''
  try {
    await projectStore.removeMember(projectId, targetUserId)
    showToast('멤버가 제거되었습니다.', 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? '멤버 제거에 실패했습니다.'
  }
}

async function onChangeRole(targetUserId: string, newRole: string) {
  memberError.value = ''
  try {
    await projectStore.updateMemberRole(projectId, targetUserId, newRole as ProjectMemberRole)
    showToast('역할이 변경되었습니다.', 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? '역할 변경에 실패했습니다.'
  }
}

// ─── 위험 영역 ────────────────────────────────────────────
const showDeleteConfirm = ref(false)
const deleteConfirmInput = ref('')
const deleting = ref(false)

async function onDeleteProject() {
  if (deleteConfirmInput.value !== projectStore.currentProject?.name) return
  deleting.value = true
  try {
    await projectStore.deleteProject(projectId)
    router.push({ name: 'projects' })
  } catch {
    showToast('프로젝트 삭제에 실패했습니다.')
    deleting.value = false
  }
}

// ─── 초기화 ───────────────────────────────────────────────
onMounted(async () => {
  try {
    if (!projectStore.currentProject || projectStore.currentProject.id !== projectId) {
      await projectStore.loadProject(projectId)
    }
    if (!projectStore.canAdmin) {
      router.push({ name: 'project', params: { id: projectId } })
      return
    }
    editName.value = projectStore.currentProject!.name
    editDescription.value = projectStore.currentProject!.description ?? ''
    await projectStore.loadProjectInvitations(projectId).catch(() => {})
  } catch {
    router.push({ name: 'projects' })
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.settings-page {
  min-height: 100vh;
  background: var(--bg-base);
  display: flex;
  flex-direction: column;
}

/* 상단 바 */
.settings-topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  height: 52px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}
.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-disabled);
  font-size: 13px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 5px;
  transition: color 0.15s, background 0.15s;
}
.back-btn:hover { color: var(--text-secondary); background: var(--border-default); }
.settings-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.project-name-label { font-size: 12px; color: var(--border-strong); }

/* 본문 */
.settings-body {
  flex: 1;
  max-width: 720px;
  width: 100%;
  margin: 0 auto;
  padding: 24px 24px 60px;
  display: flex; flex-direction: column; gap: 16px;
}
.settings-state {
  padding: 60px 0;
  text-align: center;
  color: var(--border-strong);
  font-size: 14px;
}

/* 스켈레톤 */
.settings-skeleton { max-width: 720px; margin: 0 auto; padding: 0 24px 60px; display: flex; flex-direction: column; gap: 40px; }
.sk-section-block  { display: flex; flex-direction: column; gap: 10px; }
.sk-section-title  { height: 18px; width: 120px; border-radius: 4px; margin-bottom: 6px; }
.sk-field          { height: 38px; border-radius: 6px; }
.sk-field-tall     { height: 76px; }
.sk-member-row     { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1px solid var(--border-default); }
.sk-circle         { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; }
.sk-member-info    { flex: 1; display: flex; flex-direction: column; gap: 7px; }
.sk-line-lg        { height: 13px; width: 50%; border-radius: 4px; }
.sk-line-sm        { height: 10px; width: 30%; border-radius: 4px; }

/* 섹션 */
.settings-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 24px 28px;
}
.section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin: 0 0 18px 0;
  display: flex;
  align-items: center;
  gap: 7px;
  padding-left: 10px;
  position: relative;
}
.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  border-radius: 1px;
  background: var(--accent-primary);
}
.section-icon {
  color: var(--accent-soft);
  flex-shrink: 0;
}
.danger-title::before { background: var(--color-danger); }
.danger-title .section-icon { color: #f87171; }

/* 폼 */
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-disabled); }
.form-input {
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 7px;
  color: var(--text-secondary);
  font-size: 13px;
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--accent-focus); }
.form-input::placeholder { color: var(--border-strong); }
.form-textarea { resize: vertical; min-height: 72px; font-family: inherit; }

.btn-save {
  font-size: 12px; font-weight: 700; padding: 7px 20px; border-radius: 7px;
  border: 1px solid var(--accent-hover); background: var(--accent-bg); color: var(--accent-soft);
  cursor: pointer; transition: all 0.15s;
}
.btn-save:hover:not(:disabled) { background: var(--accent-bg-medium); color: var(--accent-light); }
.btn-save:disabled { opacity: 0.4; cursor: not-allowed; }

/* 멤버 관리 */
.members-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.member-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 8px;
}
.member-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.member-name { font-size: 13px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-email { font-size: 11px; color: var(--text-disabled); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.role-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  border: 1px solid transparent;
}
.role-badge.master  { background: #2d1b69; border-color: var(--node-l7-color); color: #c4b5fd; }
.role-badge.admin   { background: var(--accent-bg-deep); border-color: var(--accent-hover); color: var(--accent-soft); }
.role-badge.writer  { background: var(--node-ext-bg-deep); border-color: var(--node-ext-color); color: var(--color-success-light); }
.role-badge.readonly { background: #1c1a09; border-color: #ca8a04; color: var(--color-warning-light); }
.role-select {
  font-size: 11px; font-weight: 600; padding: 3px 7px; border-radius: 6px;
  background: var(--bg-base); border: 1px solid var(--border-default); color: var(--text-tertiary); cursor: pointer;
}
.role-select:hover { border-color: var(--border-strong); }
.member-remove-btn {
  width: 20px; height: 20px; border-radius: 4px; border: 1px solid #ef444433;
  background: transparent; color: #ef4444; font-size: 13px; line-height: 1;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.member-remove-btn:hover { background: #ef444422; border-color: #ef4444; }
.member-add-form { display: flex; gap: 8px; align-items: center; }
.member-input {
  flex: 1; padding: 7px 10px; background: var(--bg-base); border: 1px solid var(--border-default);
  border-radius: 6px; color: var(--text-secondary); font-size: 12px; outline: none;
}
.member-input:focus { border-color: var(--accent-focus); }
.member-error { font-size: 12px; color: #f87171; margin-top: 8px; }
.btn-primary {
  font-size: 12px; font-weight: 700; padding: 7px 14px; border-radius: 6px;
  border: 1px solid var(--accent-hover); background: var(--accent-bg); color: var(--accent-soft); cursor: pointer;
}
.btn-primary:hover { background: var(--accent-hover); color: #dbeafe; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.pending-invitations { margin-top: 16px; border-top: 1px solid var(--bg-surface); padding-top: 16px; }
.pending-invitations-title { font-size: 11px; font-weight: 600; color: var(--text-disabled); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.pending-inv-row { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; }
.pending-inv-info { display: flex; align-items: center; gap: 8px; }

/* 위험 영역 */
.danger-zone {
  border: 1px solid #450a0a !important;
  background: #0f0505 !important;
  border-radius: 10px;
  padding: 24px 28px;
}
.danger-title { color: #f87171 !important; }
.danger-item { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.danger-desc { display: flex; flex-direction: column; gap: 4px; }
.danger-label { font-size: 13px; font-weight: 700; color: #f87171; }
.danger-hint { font-size: 12px; color: var(--text-disabled); }
.btn-danger {
  font-size: 12px; font-weight: 700; padding: 7px 16px; border-radius: 7px;
  border: 1px solid #ef4444; background: #450a0a; color: #fca5a5;
  cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.btn-danger:hover { background: #7f1d1d; color: #fecaca; }

/* 삭제 다이얼로그 */
.delete-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 600;
  backdrop-filter: blur(2px);
}
.delete-dialog {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 12px;
  padding: 24px; width: 340px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  display: flex; flex-direction: column; gap: 16px;
}
.delete-dialog-icon { display: flex; justify-content: center; }
.delete-dialog-body { display: flex; flex-direction: column; gap: 8px; text-align: center; }
.delete-dialog-title { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.delete-dialog-desc { font-size: 13px; color: var(--text-tertiary); line-height: 1.6; }
.delete-name-input {
  background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 7px;
  color: var(--text-secondary); font-size: 13px; padding: 8px 12px; outline: none;
  width: 100%; box-sizing: border-box; transition: border-color 0.15s;
}
.delete-name-input:focus { border-color: #ef4444; }
.delete-name-input::placeholder { color: var(--border-strong); }
.delete-dialog-actions { display: flex; gap: 8px; }
.delete-btn-cancel {
  flex: 1; padding: 8px; border-radius: 7px;
  background: var(--bg-base); border: 1px solid var(--border-default);
  color: var(--text-tertiary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.delete-btn-cancel:hover { border-color: var(--border-strong); color: var(--text-secondary); }
.delete-btn-confirm {
  flex: 1; padding: 8px; border-radius: 7px;
  background: #450a0a; border: 1px solid #ef4444;
  color: #fca5a5; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s;
}
.delete-btn-confirm:hover:not(:disabled) { background: #7f1d1d; color: #fecaca; }
.delete-btn-confirm:disabled { opacity: 0.5; cursor: not-allowed; }

/* 토스트 */
.app-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 10px;
  padding: 12px 24px; font-size: 14px; color: #fca5a5; font-weight: 600;
  z-index: 700; white-space: nowrap; box-shadow: 0 4px 20px rgba(239,68,68,0.25);
  pointer-events: none;
}
.app-toast.success {
  background: #022c22; border-color: #059669; color: #6ee7b7;
  box-shadow: 0 4px 20px rgba(5,150,105,0.25);
}
.toast-fade-enter-active { transition: opacity 0.2s; }
.toast-fade-leave-active { transition: opacity 0.4s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; }
</style>
