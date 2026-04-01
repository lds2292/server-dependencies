<template>
  <div class="settings-page">
    <div class="settings-topbar">
      <button class="back-btn" @click="router.push({ name: 'projects' })">
        <Icon name="chevron-left" :size="16" />
        {{ t('common.back') }}
      </button>
      <span class="topbar-title">{{ t('settings.topbarTitle') }}</span>
      <span class="topbar-sep">&gt;</span>
      <span class="topbar-project">{{ projectStore.currentProject?.name }}</span>
      <span class="topbar-spacer"></span>
      <UserProfileDropdown @logout="showLogoutConfirm = true" />
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
            <Icon name="project-info" :size="13" class="section-icon" />
            {{ t('settings.projectInfo') }}
          </h2>
          <div class="form-group">
            <label class="form-label">{{ t('settings.name') }}</label>
            <input v-model="editName" class="form-input" maxlength="100" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.description') }}</label>
            <textarea v-model="editDescription" class="form-input form-textarea" rows="3" :placeholder="t('settings.descPlaceholder')" />
          </div>
          <button class="btn-outline btn-sm" @click="onSaveInfo" :disabled="savingInfo || !editName.trim()">
            {{ savingInfo ? t('common.saving') : t('common.save') }}
          </button>
        </section>

        <!-- 멤버 관리 -->
        <section class="settings-section">
          <h2 class="section-title">
            <Icon name="members" :size="13" class="section-icon" />
            {{ t('settings.memberManagement') }}
          </h2>
          <div class="members-list">
            <div v-for="member in projectStore.currentProject?.members" :key="member.userId" class="member-row">
              <div class="member-info">
                <span class="member-name">{{ member.user.username }}</span>
                <span class="member-email">{{ member.user.email }}</span>
              </div>
              <div class="member-actions">
                <span v-if="member.userId === authStore.user?.id" :class="['role-badge', member.role.toLowerCase()]">
                  {{ roleLabel(member.role) }} {{ t('settings.roleSuffix') }}
                </span>
                <CustomSelect
                  v-else-if="canChangeRole(member.role)"
                  class="role-select"
                  :model-value="member.role"
                  :options="assignableRoles(member.role).map(r => ({ value: r, label: roleLabel(r) }))"
                  @update:model-value="onChangeRole(member.userId, $event)"
                />
                <span v-else :class="['role-badge', member.role.toLowerCase()]">{{ roleLabel(member.role) }}</span>
                <button
                  v-if="canRemoveMember(member.role, member.userId)"
                  class="btn-danger-ghost btn-sm"
                  @click="onRemoveMember(member.userId)"
                  :title="t('settings.removeMember')"
                >{{ t('settings.removeMember') }}</button>
              </div>
            </div>
          </div>

          <div v-if="projectStore.canAdmin" class="member-add-form">
            <input
              v-model="addMemberIdentifier"
              class="form-input member-input"
              :placeholder="t('settings.emailPlaceholder')"
              @keydown.enter="onSendInvitation"
            />
            <CustomSelect
              v-model="addMemberRole"
              class="role-select"
              :options="addableRoles.map(r => ({ value: r, label: roleLabel(r) }))"
            />
            <button class="btn-outline btn-sm" @click="onSendInvitation" :disabled="!addMemberIdentifier.trim()">{{ t('settings.invite') }}</button>
          </div>
          <div v-if="memberError" class="member-error">{{ memberError }}</div>

          <div v-if="projectStore.canAdmin && projectStore.projectInvitations.length > 0" class="pending-invitations">
            <div class="pending-invitations-title">{{ t('settings.pendingInvitations') }}</div>
            <div v-for="inv in projectStore.projectInvitations" :key="inv.id" class="pending-inv-row">
              <div class="pending-inv-info">
                <span class="member-name">{{ inv.invitee.email }}</span>
                <span :class="['role-badge', inv.role.toLowerCase()]">{{ roleLabel(inv.role) }}</span>
                <span class="pending-status">{{ t('settings.pendingStatus') }}</span>
              </div>
              <button class="btn-danger-ghost btn-sm" @click="onCancelInvitation(inv.id)" :title="t('settings.cancelInvite')">{{ t('common.cancel') }}</button>
            </div>
          </div>
        </section>

        <!-- 위험 영역 (MASTER only) -->
        <section v-if="projectStore.isMaster" class="settings-section danger-zone">
          <h2 class="section-title danger-title">
            <Icon name="warning-triangle-alt" :size="13" class="section-icon" />
            {{ t('settings.dangerZone') }}
          </h2>
          <div class="danger-item">
            <div class="danger-desc">
              <span class="danger-label">{{ t('settings.transferOwnership') }}</span>
              <span class="danger-hint">{{ t('settings.transferDesc') }}</span>
            </div>
            <button
              class="btn-danger"
              @click="showTransferConfirm = true"
              :disabled="transferableMembers.length === 0"
              :title="transferableMembers.length === 0 ? t('settings.transferNoMembers') : ''"
            >{{ t('settings.transferButton') }}</button>
          </div>
          <div class="danger-divider"></div>
          <div class="danger-item">
            <div class="danger-desc">
              <span class="danger-label">{{ t('settings.deleteProject') }}</span>
              <span class="danger-hint">{{ t('settings.deleteProjectDesc') }}</span>
            </div>
            <button class="btn-danger" @click="showDeleteConfirm = true">{{ t('settings.deleteProject') }}</button>
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
            <div class="delete-dialog-title">{{ t('settings.deleteModal.title') }}</div>
            <div class="delete-dialog-desc" v-html="t('settings.deleteModal.desc', { name: projectStore.currentProject?.name })"></div>
          </div>
          <input
            v-model="deleteConfirmInput"
            class="delete-name-input"
            :placeholder="t('settings.deleteModal.placeholder')"
            @keydown.enter="deleteConfirmInput === projectStore.currentProject?.name && !deleting && onDeleteProject()"
          />
          <div class="delete-dialog-actions">
            <button class="btn-ghost delete-dialog-btn" @click="showDeleteConfirm = false; deleteConfirmInput = ''">{{ t('common.cancel') }}</button>
            <button class="btn-danger delete-dialog-btn" @click="onDeleteProject"
              :disabled="deleting || deleteConfirmInput !== projectStore.currentProject?.name">
              {{ deleting ? t('common.deleting') : t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 권한 위임 확인 다이얼로그 -->
    <transition name="toast-fade">
      <div v-if="showTransferConfirm" class="delete-overlay" @click.self="closeTransferModal">
        <div class="delete-dialog" style="width: 380px">
          <div class="delete-dialog-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4M12 17h.01" stroke="var(--color-warning)" stroke-width="2" stroke-linecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="var(--color-warning)" stroke-width="1.5" fill="none"/>
            </svg>
          </div>
          <div class="delete-dialog-body">
            <div class="delete-dialog-title">{{ t('settings.transferModal.title') }}</div>
            <div class="delete-dialog-desc">{{ t('settings.transferModal.desc') }}</div>
          </div>
          <div class="transfer-field">
            <label class="transfer-field-label">{{ t('settings.transferModal.target') }}</label>
            <CustomSelect
              v-model="transferTargetUserId"
              class="transfer-select"
              :placeholder="t('settings.transferModal.selectMember')"
              :options="transferableMembers.map(m => ({ value: m.userId, label: `${m.user.username} (${m.user.email})` }))"
            />
          </div>
          <div class="transfer-field">
            <label class="transfer-field-label">{{ t('settings.transferModal.password') }}</label>
            <input
              v-model="transferPassword"
              type="password"
              class="form-input"
              :placeholder="t('settings.transferModal.passwordPlaceholder')"
              @keydown.enter="onTransferOwnership"
            />
          </div>
          <div v-if="transferError" class="transfer-error">{{ transferError }}</div>
          <div class="delete-dialog-actions">
            <button class="btn-ghost delete-dialog-btn" @click="closeTransferModal">{{ t('common.cancel') }}</button>
            <button
              class="btn-outline delete-dialog-btn"
              @click="onTransferOwnership"
              :disabled="transferring || !transferTargetUserId || !transferPassword"
            >{{ transferring ? t('settings.transferModal.submitting') : t('settings.transferModal.submit') }}</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 토스트 -->
    <transition name="toast-fade">
      <div v-if="toastMsg" :class="['app-toast', toastType]">{{ toastMsg }}</div>
    </transition>

    <!-- 로그아웃 확인 모달 -->
    <transition name="fade">
      <div v-if="showLogoutConfirm" class="modal-overlay" @click.self="showLogoutConfirm = false">
        <div class="modal-card" style="max-width:340px">
          <h2 class="modal-title">{{ t('common.logout') }}</h2>
          <p style="font-size: var(--text-sm);color:var(--text-tertiary);margin:0 0 20px">{{ t('common.logoutConfirm') }}</p>
          <div class="modal-actions">
            <button type="button" class="btn-ghost" @click="showLogoutConfirm = false">{{ t('common.cancel') }}</button>
            <button type="button" class="btn-danger" @click="onLogout">{{ t('common.logout') }}</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project'
import { useAuthStore } from '../stores/auth'
import type { ProjectMemberRole } from '../api/projectApi'
import UserProfileDropdown from '../components/UserProfileDropdown.vue'
import Icon from '../components/Icon.vue'
import CustomSelect from '../components/CustomSelect.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()
const projectId = route.params.id as string

const loading = ref(true)
const showLogoutConfirm = ref(false)
async function onLogout() {
  await authStore.logout()
}

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
    showToast(t('settings.toast.saved'), 'success')
  } catch {
    showToast(t('settings.toast.saveFailed'))
  } finally {
    savingInfo.value = false
  }
}

// ─── 멤버 관리 ────────────────────────────────────────────
const addMemberIdentifier = ref('')
const addMemberRole = ref<ProjectMemberRole>('READONLY')
const memberError = ref('')

const ROLE_LABEL_KEYS: Record<ProjectMemberRole, string> = {
  MASTER: 'roles.master', ADMIN: 'roles.admin', WRITER: 'roles.writer', READONLY: 'roles.readonly',
}
function roleLabel(role: string): string {
  const key = ROLE_LABEL_KEYS[role as ProjectMemberRole]
  return key ? t(key) : role
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
    showToast(t('settings.toast.inviteSent'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? t('settings.toast.inviteFailed')
  }
}

async function onCancelInvitation(invId: string) {
  memberError.value = ''
  try {
    await projectStore.cancelInvitation(projectId, invId)
    showToast(t('settings.toast.inviteCancelled'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? t('settings.toast.inviteCancelFailed')
  }
}

async function onRemoveMember(targetUserId: string) {
  memberError.value = ''
  try {
    await projectStore.removeMember(projectId, targetUserId)
    showToast(t('settings.toast.memberRemoved'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? t('settings.toast.memberRemoveFailed')
  }
}

async function onChangeRole(targetUserId: string, newRole: string) {
  memberError.value = ''
  try {
    await projectStore.updateMemberRole(projectId, targetUserId, newRole as ProjectMemberRole)
    showToast(t('settings.toast.roleChanged'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    memberError.value = e.response?.data?.error ?? t('settings.toast.roleChangeFailed')
  }
}

// ─── 권한 위임 ──────────────────────────────────────────────
const showTransferConfirm = ref(false)
const transferTargetUserId = ref('')
const transferPassword = ref('')
const transferring = ref(false)
const transferError = ref('')

const transferableMembers = computed(() => {
  if (!projectStore.currentProject) return []
  return projectStore.currentProject.members.filter(m => m.role !== 'MASTER')
})

function closeTransferModal() {
  showTransferConfirm.value = false
  transferTargetUserId.value = ''
  transferPassword.value = ''
  transferError.value = ''
}

async function onTransferOwnership() {
  if (!transferTargetUserId.value || !transferPassword.value) return
  transferring.value = true
  transferError.value = ''
  try {
    await projectStore.transferOwnership(projectId, transferTargetUserId.value, transferPassword.value)
    closeTransferModal()
    showToast(t('settings.toast.transferred'), 'success')
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string; code?: string } } }
    if (e.response?.data?.code === 'INVALID_CREDENTIALS') {
      transferError.value = t('settings.toast.transferPasswordError')
    } else {
      closeTransferModal()
      showToast(e.response?.data?.error ?? t('settings.toast.transferFailed'))
    }
  } finally {
    transferring.value = false
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
    showToast(t('settings.toast.deleteFailed'))
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
  height: 36px;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
  padding: 0 12px;
  border-radius: 6px;
  transition: all 0.15s;
}
.back-btn:hover { color: var(--text-secondary); border-color: var(--border-strong); background: var(--bg-elevated); }
.topbar-title { font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); }
.topbar-sep { font-size: var(--text-sm); color: var(--text-disabled); font-weight: 400; }
.topbar-project { font-size: var(--text-sm); font-weight: 700; color: var(--text-disabled); }
.topbar-spacer { flex: 1; }

/* 로그아웃 모달 */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 1000;
  display: flex; align-items: center; justify-content: center;
}
.modal-card {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 12px;
  padding: 20px; width: 100%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
}
.modal-title { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); margin: 0 0 12px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

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
  font-size: var(--text-base);
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
  font-size: var(--text-xs);
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
.form-label { font-size: var(--text-xs); font-weight: 600; color: var(--text-disabled); }
.form-input {
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 7px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
  width: 100%;
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--accent-focus); }
.form-input::placeholder { color: var(--border-strong); }
.form-textarea { resize: vertical; min-height: 72px; font-family: inherit; }


/* 멤버 관리 */
.members-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.member-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 8px;
}
.member-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.member-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-email { font-size: var(--text-xs); color: var(--text-disabled); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.member-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.role-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 999px;
  border: 1px solid transparent;
}
.role-badge.master   { background: var(--role-master-bg); border-color: var(--role-master); color: var(--accent-light); }
.role-badge.admin    { background: var(--role-admin-bg); border-color: var(--role-admin); color: var(--role-admin-text); }
.role-badge.writer   { background: var(--role-writer-bg); border-color: var(--role-writer); color: var(--node-ext-text); }
.role-badge.readonly { background: var(--role-readonly-bg); border-color: var(--role-readonly); color: var(--text-muted); }
.role-select { width: 130px; }
.transfer-select { width: 100%; }
.member-add-form { display: flex; gap: 8px; align-items: center; }
.member-input {
  flex: 1;
}
.member-error { font-size: var(--text-xs); color: #f87171; margin-top: 8px; }
.pending-invitations { margin-top: 16px; border-top: 1px solid var(--border-default); padding-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.pending-invitations-title { font-size: var(--text-xs); font-weight: 600; color: var(--text-disabled); text-transform: uppercase; letter-spacing: 0.06em; }
.pending-inv-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 8px; }
.pending-inv-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
.pending-status { font-size: var(--text-xs); font-weight: 600; color: var(--text-disabled); }

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
.danger-label { font-size: var(--text-sm); font-weight: 700; color: #f87171; }
.danger-hint { font-size: var(--text-xs); color: var(--text-disabled); }
.btn-danger { flex-shrink: 0; }

/* 위험 영역 구분선 */
.danger-divider {
  height: 1px;
  background: rgba(239, 68, 68, 0.15);
  margin: 16px 0;
}

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
  padding: 24px; width: 340px; box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  display: flex; flex-direction: column; gap: 16px;
}
.delete-dialog-icon { display: flex; justify-content: center; }
.delete-dialog-body { display: flex; flex-direction: column; gap: 8px; text-align: center; }
.delete-dialog-title { font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); }
.delete-dialog-desc { font-size: var(--text-sm); color: var(--text-tertiary); line-height: 1.6; }
.delete-dialog-desc :deep(strong) { color: var(--text-primary); font-weight: 700; }
.delete-name-input {
  background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 7px;
  color: var(--text-secondary); font-size: var(--text-sm); padding: 8px 12px; outline: none;
  width: 100%; box-sizing: border-box; transition: border-color 0.15s;
}
.delete-name-input:focus { border-color: #ef4444; }
.delete-name-input::placeholder { color: var(--border-strong); }
.delete-dialog-actions { display: flex; gap: 8px; }
.delete-dialog-btn { flex: 1; }

/* 권한 위임 모달 */
.transfer-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.transfer-field-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--text-disabled);
}
.transfer-error { font-size: var(--text-xs); color: #f87171; text-align: center; }

/* 토스트 */
.app-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 10px;
  padding: 12px 24px; font-size: var(--text-base); color: #fca5a5; font-weight: 600;
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
