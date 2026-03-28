<template>
  <div class="audit-page">
    <div class="audit-topbar">
      <button class="back-btn" @click="router.push({ name: 'project', params: { id: projectId } })">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        돌아가기
      </button>
      <span class="audit-title">감사 로그</span>
      <span class="project-name">{{ projectName }}</span>
    </div>

    <div class="audit-body">
      <template v-if="!loading && !error && logs.length > 0">
        <!-- 카테고리 필터 탭 -->
        <div class="audit-tabs">
          <button
            v-for="tab in TABS" :key="tab.key"
            :class="['audit-tab', { active: activeTab === tab.key }]"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span class="tab-count">{{ tabCount(tab.key) }}</span>
          </button>
        </div>

        <!-- 날짜 필터 -->
        <div class="audit-date-filter">
          <div class="date-quick-btns">
            <button
              v-for="q in QUICK_DATES" :key="q.label"
              :class="['quick-btn', { active: quickActive === q.label }]"
              @click="applyQuick(q)"
            >{{ q.label }}</button>
          </div>
          <div class="date-range">
            <input type="date" v-model="dateFrom" class="date-input" :max="dateTo || undefined" @change="quickActive = ''" />
            <span class="date-sep">~</span>
            <input type="date" v-model="dateTo" class="date-input" :min="dateFrom || undefined" @change="quickActive = ''" />
            <button v-if="dateFrom || dateTo" class="date-reset" @click="clearDate">초기화</button>
          </div>
        </div>
      </template>

      <div v-if="loading" class="audit-skeleton">
        <div v-for="i in 8" :key="i" class="audit-row-skeleton">
          <div class="skeleton sk-avatar"></div>
          <div class="sk-content">
            <div class="skeleton sk-line-main"></div>
            <div class="skeleton sk-line-sub"></div>
          </div>
        </div>
      </div>
      <div v-else-if="error" class="audit-state error">{{ error }}</div>
      <div v-else-if="logs.length === 0" class="audit-empty">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="26" cy="26" r="18" stroke="#1e2a3a" stroke-width="1.6"/>
          <line x1="26" y1="14" x2="26" y2="26" stroke="#2e3f55" stroke-width="1.8" stroke-linecap="round"/>
          <line x1="26" y1="26" x2="33" y2="31" stroke="#2e3f55" stroke-width="1.6" stroke-linecap="round"/>
          <circle cx="26" cy="26" r="1.8" fill="#2e3f55"/>
        </svg>
        <p class="audit-empty-title">감사 로그가 없습니다</p>
        <p class="audit-empty-desc">프로젝트 변경 내역이 여기에 기록됩니다</p>
      </div>
      <template v-else>
        <div v-if="filteredLogs.length === 0" class="audit-state">필터 조건에 맞는 로그가 없습니다</div>
        <div v-else class="audit-timeline">
          <template v-for="(item, i) in filteredLogs" :key="item.id">
            <!-- 날짜 구분선 — 타임라인을 끊는 형태 -->
            <div
              v-if="i === 0 || dateLabel(item.createdAt) !== dateLabel(filteredLogs[i - 1].createdAt)"
              class="timeline-date-divider"
            >
              {{ dateLabel(item.createdAt) }}
            </div>
            <div
              :class="['timeline-item', {
                failed: item.status !== 'SUCCESS',
                expanded: expandedId === item.id,
                clickable: !!parseDetail(item)
              }]"
              @click="parseDetail(item) && toggleRow(item.id)"
            >
              <div class="audit-row-main">
                <span class="audit-time">{{ timeLabel(item.createdAt) }}</span>
                <span :class="['audit-action-badge', actionCategory(item.action)]">{{ actionLabel(item.action) }}</span>
                <span class="audit-user">{{ displayUser(item) }}</span>
                <span :class="['audit-status', item.status === 'SUCCESS' ? 'success' : 'failed']">
                  {{ item.status === 'SUCCESS' ? '성공' : '실패' }}
                </span>
                <!-- 상세 정보가 있으면 펼치기 화살표 -->
                <svg
                  v-if="parseDetail(item)"
                  :class="['expand-icon', { open: expandedId === item.id }]"
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                >
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>

              <!-- 상세 패널 -->
              <div v-if="expandedId === item.id" class="audit-detail-panel">
                <div v-for="row in parseDetail(item)!.rows" :key="row.label" class="detail-row">
                  <span class="detail-label">{{ row.label }}</span>
                  <span class="detail-value">{{ row.value }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
        <div class="audit-footer">{{ filteredLogs.length }}건</div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { projectApi, type AuditLog } from '../api/projectApi'
import { useProjectStore } from '../stores/project'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()

const projectId = route.params.id as string
const projectName = computed(() => projectStore.currentProject?.name ?? '')

const logs = ref<AuditLog[]>([])
const loading = ref(true)
const error = ref('')
const activeTab = ref('all')
const dateFrom = ref('')
const dateTo = ref('')
const quickActive = ref('')
const expandedId = ref<string | null>(null)

// ─── 날짜 유틸 ───────────────────────────────────────────
function toDateStr(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function todayStr(): string { return toDateStr(new Date()) }

// ─── 빠른 날짜 버튼 ──────────────────────────────────────
const QUICK_DATES = [
  { label: '오늘',   days: 0 },
  { label: '일주일', days: 6 },
  { label: '한달',   days: 29 },
]

function applyQuick(q: { label: string; days: number }) {
  const today = new Date()
  dateTo.value = todayStr()
  const from = new Date(today)
  from.setDate(today.getDate() - q.days)
  dateFrom.value = toDateStr(from)
  quickActive.value = q.label
}

function clearDate() {
  dateFrom.value = ''
  dateTo.value = ''
  quickActive.value = ''
}

// ─── 탭 정의 ─────────────────────────────────────────────
type TabKey = 'all' | 'security' | 'member' | 'failed'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',      label: '전체' },
  { key: 'security', label: '보안' },
  { key: 'member',   label: '멤버 관리' },
  { key: 'failed',   label: '실패' },
]

const SECURITY_ACTIONS = new Set([
  'UNMASK_CONTACTS',
])
const MEMBER_ACTIONS = new Set([
  'MEMBER_ADDED', 'MEMBER_REMOVED', 'MEMBER_ROLE_CHANGED', 'OWNERSHIP_TRANSFERRED',
  'INVITATION_SENT', 'INVITATION_CANCELLED', 'INVITATION_ACCEPTED', 'INVITATION_REJECTED',
])

function actionCategory(action: string): string {
  if (SECURITY_ACTIONS.has(action)) return 'security'
  if (MEMBER_ACTIONS.has(action))   return 'member'
  return 'other'
}

// ─── 액션 레이블 ──────────────────────────────────────────
const ACTION_LABELS: Record<string, string> = {
  UNMASK_CONTACTS:       '연락처 마스킹 해제',
  LOGIN_SUCCESS:         '로그인',
  LOGIN_FAILED:          '로그인 실패',
  LOGOUT:                '로그아웃',
  MEMBER_ADDED:          '멤버 추가',
  MEMBER_REMOVED:        '멤버 제거',
  MEMBER_ROLE_CHANGED:   '역할 변경',
  OWNERSHIP_TRANSFERRED: '소유권 이전',
  INVITATION_SENT:       '멤버 초대',
  INVITATION_CANCELLED:  '초대 취소',
  INVITATION_ACCEPTED:   '초대 수락',
  INVITATION_REJECTED:   '초대 거절',
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

function displayUser(log: AuditLog): string {
  if (log.user?.username) {
    const id = log.user.email || log.email
    return id ? `${log.user.username}(${id})` : log.user.username
  }
  return log.email || '알 수 없음'
}

function dateLabel(iso: string): string {
  return toDateStr(new Date(iso))
}

function timeLabel(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ─── 아코디언 ─────────────────────────────────────────────
function toggleRow(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

interface DetailRow { label: string; value: string }
interface ParsedDetail { rows: DetailRow[] }

function parseDetail(log: AuditLog): ParsedDetail | null {
  const rows: DetailRow[] = []

  if (log.user?.email) rows.push({ label: '이메일', value: log.user.email })
  if (log.ipAddress)   rows.push({ label: 'IP', value: log.ipAddress })
  if (log.failReason)  rows.push({ label: '실패 사유', value: log.failReason })

  if (log.detail) {
    try {
      const d = JSON.parse(log.detail)
      if (log.action === 'INVITATION_SENT' && d.identifier)
        rows.push({ label: '초대 대상', value: d.identifier })
      if (log.action === 'UNMASK_CONTACTS') {
        if (d.nodeName)        rows.push({ label: '노드', value: d.nodeName })
        if (d.contacts?.length) rows.push({ label: '담당자', value: d.contacts.join(', ') })
      }
    } catch { /* ignore */ }
  }

  return rows.length ? { rows } : null
}

// ─── 필터링 ───────────────────────────────────────────────
const filteredLogs = computed(() => {
  return logs.value.filter(log => {
    if (activeTab.value === 'security' && !SECURITY_ACTIONS.has(log.action)) return false
    if (activeTab.value === 'member'   && !MEMBER_ACTIONS.has(log.action))   return false
    if (activeTab.value === 'failed'   && log.status === 'SUCCESS')           return false

    if (dateFrom.value) {
      const from = new Date(dateFrom.value)
      from.setHours(0, 0, 0, 0)
      if (new Date(log.createdAt) < from) return false
    }
    if (dateTo.value) {
      const to = new Date(dateTo.value)
      to.setHours(23, 59, 59, 999)
      if (new Date(log.createdAt) > to) return false
    }

    return true
  })
})

function tabCount(key: TabKey): number {
  return logs.value.filter(log => {
    if (key === 'all')      return true
    if (key === 'security') return SECURITY_ACTIONS.has(log.action)
    if (key === 'member')   return MEMBER_ACTIONS.has(log.action)
    if (key === 'failed')   return log.status !== 'SUCCESS'
    return false
  }).length
}

onMounted(async () => {
  if (!projectStore.currentProject) {
    try { await projectStore.loadProject(projectId) } catch { /* ignore */ }
  }

  if (!projectStore.canAdmin) {
    error.value = '접근 권한이 없습니다'
    loading.value = false
    return
  }

  applyQuick(QUICK_DATES[0])

  try {
    const res = await projectApi.getAuditLogs(projectId)
    logs.value = res.data.logs
  } catch (err: unknown) {
    const e = err as { response?: { status?: number } }
    error.value = e.response?.status === 403 ? '접근 권한이 없습니다' : '로그를 불러오지 못했습니다'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.audit-page {
  min-height: 100vh;
  background: var(--bg-base);
  display: flex;
  flex-direction: column;
}

/* 상단 바 */
.audit-topbar {
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

.audit-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
}

.project-name {
  font-size: 12px;
  color: var(--border-strong);
}

/* 본문 */
.audit-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 860px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px 40px;
}

/* 탭 */
.audit-tabs {
  display: flex;
  gap: 2px;
  padding: 16px 0 0;
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
}
.audit-tab {
  background: none;
  border: none;
  color: var(--text-disabled);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
}
.audit-tab:hover { color: var(--text-tertiary); }
.audit-tab.active { color: var(--accent-soft); border-bottom-color: var(--accent-focus); }
.tab-count {
  background: var(--border-default);
  color: var(--text-tertiary);
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  padding: 0 5px;
  min-width: 16px;
  text-align: center;
}
.audit-tab.active .tab-count { background: var(--accent-bg); color: var(--accent-light); }

/* 날짜 필터 */
.audit-date-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-default);
  flex-shrink: 0;
  flex-wrap: wrap;
}

.date-quick-btns {
  display: flex;
  gap: 4px;
}

.quick-btn {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 5px;
  color: var(--text-disabled);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.quick-btn:hover { color: var(--text-secondary); border-color: var(--border-strong); }
.quick-btn.active { background: var(--accent-bg); border-color: var(--accent-focus); color: var(--accent-soft); }

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
}

.date-input {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  padding: 5px 8px;
  outline: none;
  cursor: pointer;
}
.date-input:focus { border-color: var(--accent-focus); }
.date-input::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
.date-sep { font-size: 12px; color: var(--border-strong); }
.date-reset {
  background: none;
  border: 1px solid var(--border-default);
  border-radius: 5px;
  color: var(--text-disabled);
  font-size: 11px;
  padding: 4px 10px;
  cursor: pointer;
  margin-left: 2px;
}
.date-reset:hover { border-color: var(--accent-soft); color: var(--accent-light); }

/* 상태 */
.audit-state {
  padding: 60px;
  text-align: center;
  font-size: 13px;
  color: var(--border-strong);
}
.audit-state.error { color: #f87171; }

/* 빈 상태 */
.audit-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 72px 0; text-align: center; }
.audit-empty-title { font-size: 15px; font-weight: 600; color: var(--text-disabled); margin: 4px 0 0; }
.audit-empty-desc  { font-size: 13px; color: var(--border-strong); margin: 0; }

/* 스켈레톤 */
.audit-skeleton { display: flex; flex-direction: column; gap: 2px; padding: 8px 0; }
.audit-row-skeleton {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
}
.sk-avatar    { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
.sk-content   { flex: 1; display: flex; flex-direction: column; gap: 7px; }
.sk-line-main { height: 13px; width: 60%; border-radius: 4px; }
.sk-line-sub  { height: 10px; width: 35%; border-radius: 4px; }

/* ─── 타임라인 ─── */
.audit-timeline {
  flex: 1;
  position: relative;
  padding-left: 36px;
}

/* 연속 세로선 */
.audit-timeline::before {
  content: '';
  position: absolute;
  left: 14px;
  top: 0; bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, transparent 0%, var(--border-default) 3%, var(--border-default) 97%, transparent 100%);
}

/* 날짜 구분선 — 타임라인을 끊는 형태 */
.timeline-date-divider {
  position: sticky;
  top: 0;
  z-index: 2;
  margin: 4px -36px 2px;
  padding: 12px 0 8px 36px;
  display: flex; align-items: center; gap: 10px;
  font-size: 11px; font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.06em; text-transform: uppercase;
  background: var(--bg-base);
}
/* 다이아몬드 마커 — 타임라인 선 위에 표시 */
.timeline-date-divider::before {
  content: '';
  position: absolute;
  left: 9px;
  top: 50%; transform: translateY(-50%) rotate(45deg);
  width: 10px; height: 10px;
  background: var(--border-strong);
  border-radius: 2px;
  border: 2px solid var(--bg-base);
}
/* 날짜 라벨 우측 수평선 */
.timeline-date-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border-default);
  margin-right: 36px;
}

/* 로그 행 */
.timeline-item {
  position: relative;
  padding: 10px 0 10px 4px;
  border-radius: 0 6px 6px 0;
  transition: background 0.12s;
}
.timeline-item + .timeline-item { border-top: 1px solid var(--border-subtle); }
.timeline-item.clickable { cursor: pointer; }
.timeline-item.clickable:hover { background: #0c1825; }
.timeline-item.expanded { background: #0c1825; }

/* 각 항목 dot */
.timeline-item::before {
  content: '';
  position: absolute;
  left: -27px;
  top: 50%; transform: translateY(-50%);
  width: 10px; height: 10px;
  border-radius: 50%;
  background: var(--accent-focus);
  border: 2px solid var(--bg-base);
  transition: box-shadow 0.15s;
}
.timeline-item.clickable:hover::before { box-shadow: 0 0 0 3px rgba(6,182,212,0.2); }
.timeline-item.expanded::before        { box-shadow: 0 0 0 3px rgba(6,182,212,0.25); }

/* 실패 행 — dot 빨간색, border-left 제거 */
.timeline-item.failed { background: rgba(239,68,68,0.03); }
.timeline-item.failed::before { background: var(--color-danger); }
.timeline-item.failed.clickable:hover { background: rgba(239,68,68,0.07); }
.timeline-item.failed.expanded        { background: rgba(239,68,68,0.07); }
.timeline-item.failed.clickable:hover::before { box-shadow: 0 0 0 3px rgba(239,68,68,0.2); }
.timeline-item.failed.expanded::before        { box-shadow: 0 0 0 3px rgba(239,68,68,0.25); }

.audit-row-main {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.audit-time {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  flex-shrink: 0;
  min-width: 40px;
}
.audit-action-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  flex-shrink: 0;
}
.audit-action-badge.security { background: #1c1a36; color: #a78bfa; }
.audit-action-badge.member   { background: #0f2340; color: var(--accent-soft); }
.audit-action-badge.other    { background: var(--bg-surface); color: var(--text-tertiary); border: 1px solid var(--border-default); }

.audit-user {
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 1;
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.audit-status {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 10px;
  flex-shrink: 0;
  margin-left: auto;
}
.audit-status.success { background: var(--node-ext-bg-deep); color: var(--color-success-light); }
.audit-status.failed  { background: #450a0a; color: #f87171; }

.expand-icon {
  color: var(--border-strong);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.expand-icon.open { transform: rotate(180deg); }

/* 상세 패널 */
.audit-detail-panel {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--accent-bg);
  display: grid;
  grid-template-columns: 72px 1fr;
  row-gap: 5px;
  column-gap: 12px;
}

.detail-row {
  display: contents;
}

.detail-label {
  font-size: 11px;
  color: var(--border-strong);
  white-space: nowrap;
  padding-top: 1px;
}

.detail-value {
  font-size: 12px;
  color: var(--text-muted);
  overflow-wrap: break-word;
  min-width: 0;
}

.audit-footer {
  padding: 12px 0;
  border-top: 1px solid var(--border-default);
  font-size: 11px;
  color: var(--border-strong);
  text-align: right;
  flex-shrink: 0;
}
</style>
