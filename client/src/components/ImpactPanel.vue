<template>
  <div class="impact-panel">
    <template v-if="selectedNode">
      <div class="node-detail">
        <div class="detail-header">
          <span :class="['type-badge', selectedNode.nodeKind ?? 'server']">{{ typeLabel(selectedNode) }}</span>
          <span class="detail-name">{{ selectedNode.name }}</span>
        </div>

        <!-- 서버 전용 -->
        <template v-if="!selectedNode.nodeKind || selectedNode.nodeKind === 'server'">
          <p class="detail-row">팀: {{ (selectedNode as any).team || '-' }}</p>
          <div class="ip-group">
            <span class="ip-label">내부 IP</span>
            <div v-for="ip in (selectedNode as any).internalIps" :key="ip" class="ip-row">
              <span class="detail-row mono ip-chip">{{ ip }}</span>
              <button class="btn-copy" @click="copyText(ip)" :title="'복사'" type="button">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor"/><path d="M1 3.5H0.5V10.5H7.5V10" stroke="currentColor" stroke-linecap="round"/></svg>
              </button>
            </div>
            <span v-if="!(selectedNode as any).internalIps?.length" class="detail-row mono">-</span>
          </div>
          <div class="ip-group">
            <span class="ip-label">NAT IP</span>
            <div v-for="ip in (selectedNode as any).natIps" :key="ip" class="ip-row">
              <span class="detail-row mono ip-chip">{{ ip }}</span>
              <button class="btn-copy" @click="copyText(ip)" :title="'복사'" type="button">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor"/><path d="M1 3.5H0.5V10.5H7.5V10" stroke="currentColor" stroke-linecap="round"/></svg>
              </button>
            </div>
            <span v-if="!(selectedNode as any).natIps?.length" class="detail-row mono">-</span>
          </div>
        </template>

        <!-- L7 전용 -->
        <template v-else-if="selectedNode.nodeKind === 'l7'">
          <div v-if="(selectedNode as any).ip" class="ip-row">
            <span class="detail-row mono">IP: {{ (selectedNode as any).ip }}</span>
            <button class="btn-copy" @click="copyText((selectedNode as any).ip)" title="복사" type="button">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor"/><path d="M1 3.5H0.5V10.5H7.5V10" stroke="currentColor" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div v-if="(selectedNode as any).natIp" class="ip-row">
            <span class="detail-row mono">NAT IP: {{ (selectedNode as any).natIp }}</span>
            <button class="btn-copy" @click="copyText((selectedNode as any).natIp)" title="복사" type="button">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor"/><path d="M1 3.5H0.5V10.5H7.5V10" stroke="currentColor" stroke-linecap="round"/></svg>
            </button>
          </div>
        </template>

        <!-- DB 전용 -->
        <template v-else-if="selectedNode.nodeKind === 'infra'">
          <p class="detail-row">유형: {{ (selectedNode as any).infraType || '-' }}</p>
          <div v-if="(selectedNode as any).host" class="ip-row">
            <span class="detail-row mono">{{ (selectedNode as any).host }}{{ (selectedNode as any).port ? ':' + (selectedNode as any).port : '' }}</span>
            <button class="btn-copy" @click="copyText((selectedNode as any).host + ((selectedNode as any).port ? ':' + (selectedNode as any).port : ''))" title="복사" type="button">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor"/><path d="M1 3.5H0.5V10.5H7.5V10" stroke="currentColor" stroke-linecap="round"/></svg>
            </button>
          </div>
        </template>

        <!-- 외부서비스 전용 -->
        <template v-else-if="selectedNode.nodeKind === 'external'">
          <p v-if="(selectedNode as any).hasFirewall" class="detail-firewall">
            🔒 방화벽 오픈 필요
            <a v-if="(selectedNode as any).firewallUrl" :href="(selectedNode as any).firewallUrl" target="_blank" class="fw-link">요청 링크</a>
          </p>
          <p v-if="(selectedNode as any).hasWhitelist" class="detail-firewall">📋 화이트리스트 요청 필요</p>
        </template>

        <!-- DNS 전용 -->
        <template v-else-if="selectedNode.nodeKind === 'dns'">
          <p class="detail-row">레코드 타입: {{ (selectedNode as any).dnsType || '-' }}</p>
          <p class="detail-row">레코드 값: {{ (selectedNode as any).recordValue || '-' }}</p>
          <p class="detail-row">TTL: {{ (selectedNode as any).ttl ? (selectedNode as any).ttl + 's' : '-' }}</p>
          <p class="detail-row">관리: {{ (selectedNode as any).provider || '-' }}</p>
        </template>

      </div>

      <!-- 설명 -->
      <div v-if="selectedNode.description" class="section">
        <h4>설명</h4>
        <p class="desc-text">{{ selectedNode.description }}</p>
      </div>

      <!-- L7 구성 서버 -->
      <div v-if="selectedNode.nodeKind === 'l7'" class="section">
        <h4>구성 서버 <span class="count">{{ memberServers.length }}</span></h4>
        <ul>
          <li v-for="s in memberServers" :key="s.id" class="nav-item" @click="$emit('navigateTo', s.id)">
            {{ s.name }}
            <span class="sub-text">{{ s.team }}</span>
          </li>
          <li v-if="memberServers.length === 0" class="empty">없음</li>
        </ul>
      </div>

      <!-- 외부서비스 담당자 -->
      <div v-if="selectedNode.nodeKind === 'external' && (selectedNode as any).contacts?.length" class="section">
        <div class="section-header">
          <h4>담당자 <span class="count">{{ (selectedNode as any).contacts.length }}</span></h4>
          <button v-if="!unmaskedContacts" class="btn-unmask" @click="showPasswordModal = true">마스킹 해제</button>
          <span v-else class="unmask-badge">해제됨</span>
        </div>
        <ul>
          <li v-for="(c, i) in (unmaskedContacts ?? (selectedNode as any).contacts)" :key="i" class="contact-li">
            <span class="contact-name">{{ c.name }}</span>
            <div v-if="c.phone" class="contact-copy-row">
              <span class="contact-info">{{ unmaskedContacts ? formatPhone(c.phone) : c.phone }}</span>
              <button v-if="unmaskedContacts" class="btn-copy" @click="copyText(c.phone)" title="복사" type="button">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor"/><path d="M1 3.5H0.5V10.5H7.5V10" stroke="currentColor" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div v-if="c.email" class="contact-copy-row">
              <span class="contact-info">{{ c.email }}</span>
              <button v-if="unmaskedContacts" class="btn-copy" @click="copyText(c.email!)" title="복사" type="button">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor"/><path d="M1 3.5H0.5V10.5H7.5V10" stroke="currentColor" stroke-linecap="round"/></svg>
              </button>
            </div>
          </li>
        </ul>
      </div>

      <!-- 비밀번호 확인 모달 -->
      <Teleport to="body">
        <div v-if="showPasswordModal" class="mask-modal-backdrop" @click.self="closePasswordModal">
          <div class="mask-modal">
            <h4>비밀번호 확인</h4>
            <p class="mask-modal-desc">개인정보 확인을 위해 비밀번호를 입력해주세요.</p>
            <input type="password" v-model="passwordInput" class="mask-modal-input"
              placeholder="비밀번호" @keyup.enter="onUnmask" autofocus />
            <span v-if="verifyError" class="verify-error">{{ verifyError }}</span>
            <div class="mask-modal-actions">
              <button class="btn-ghost" @click="closePasswordModal">취소</button>
              <button class="btn-primary" @click="onUnmask" :disabled="verifyLoading || !passwordInput">
                {{ verifyLoading ? '확인 중...' : '확인' }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 의존 관계 -->
      <div class="section">
        <h4>의존하는 노드 <span class="count">{{ outgoing.length }}</span></h4>
        <ul>
          <li v-for="d in outgoing" :key="d.id" class="nav-item" @click="$emit('navigateTo', d.target)">
            <span :class="['dep-type', d.type]">{{ d.type }}</span>
            {{ getNodeName(d.target) }}
            <a v-if="d.hasFirewall && d.firewallUrl" :href="d.firewallUrl" target="_blank" class="fw-badge" @click.stop title="방화벽 오픈 필요">FW</a>
            <span v-else-if="d.hasFirewall" class="fw-badge no-link" title="방화벽 오픈 필요">FW</span>
            <button v-if="!readOnly" class="edit-dep" @click.stop="$emit('editDependency', d)" title="수정">✎</button>
            <button v-if="!readOnly" class="del-dep" @click.stop="$emit('removeDependency', d.id)">✕</button>
          </li>
          <li v-if="outgoing.length === 0" class="empty">없음</li>
        </ul>
      </div>

      <div class="section">
        <h4>의존받는 노드 <span class="count">{{ incoming.length }}</span></h4>
        <ul>
          <li v-for="d in incoming" :key="d.id" class="nav-item" @click="$emit('navigateTo', d.source)">
            <span :class="['dep-type', d.type]">{{ d.type }}</span>
            {{ getNodeName(d.source) }}
            <a v-if="d.hasFirewall && d.firewallUrl" :href="d.firewallUrl" target="_blank" class="fw-badge" @click.stop title="방화벽 오픈 필요">FW</a>
            <span v-else-if="d.hasFirewall" class="fw-badge no-link" title="방화벽 오픈 필요">FW</span>
            <button v-if="!readOnly" class="edit-dep" @click.stop="$emit('editDependency', d)" title="수정">✎</button>
            <button v-if="!readOnly" class="del-dep" @click.stop="$emit('removeDependency', d.id)">✕</button>
          </li>
          <li v-if="incoming.length === 0" class="empty">없음</li>
        </ul>
      </div>

      <div class="section">
        <h4>장애 영향 범위 <span class="count impact">{{ impactedList.length }}</span></h4>
        <p class="impact-desc">이 노드 장애 시 영향받는 노드</p>
        <ul>
          <li v-for="n in impactedList" :key="n.id" class="impact-item nav-item" @click="$emit('navigateTo', n.id)">
            <span :class="['type-badge', n.nodeKind ?? 'server']">{{ typeLabel(n) }}</span>
            {{ n.name }}
          </li>
          <li v-if="impactedList.length === 0" class="empty">영향 없음</li>
        </ul>
      </div>

      <div class="panel-actions">
        <button v-if="!readOnly" class="btn-dep" @click="$emit('addDependency', selectedNode)">+ 의존성 추가</button>
        <button class="btn-clear" @click="$emit('clearSelection')">선택 해제</button>
      </div>
    </template>

    <div v-else class="no-selection">
      <p>노드를 클릭하면<br />상세 정보가 표시됩니다</p>
    </div>

    <transition name="copy-fade">
      <div v-if="copyToast" class="copy-toast">{{ copyToast }}</div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Server, AnyNode, Dependency, ExternalContact } from '../types'
import { projectApi } from '../api/projectApi'
import { formatPhone } from '../composables/useContactValidation'

function typeLabel(node: AnyNode): string {
  if (node.nodeKind === 'l7') return 'L7'
  if (node.nodeKind === 'infra') return 'INFRA'
  if (node.nodeKind === 'external') return 'EXT'
  if (node.nodeKind === 'dns') return 'DNS'
  return 'SRV'
}

const props = defineProps<{
  selectedNode: AnyNode | null
  allNodes: AnyNode[]
  dependencies: Dependency[]
  impactedIds: Set<string>
  readOnly: boolean
  currentProjectId: string
}>()

const unmaskedContacts = ref<ExternalContact[] | null>(null)
const showPasswordModal = ref(false)
const passwordInput = ref('')
const verifyError = ref('')
const verifyLoading = ref(false)
const copyToast = ref('')
let copyToastTimer: ReturnType<typeof setTimeout> | null = null

function copyText(value: string) {
  navigator.clipboard.writeText(value).then(() => {
    copyToast.value = '복사됨'
    if (copyToastTimer) clearTimeout(copyToastTimer)
    copyToastTimer = setTimeout(() => { copyToast.value = '' }, 1500)
  })
}

watch(() => props.selectedNode?.id, () => {
  unmaskedContacts.value = null
  showPasswordModal.value = false
  passwordInput.value = ''
  verifyError.value = ''
})

function closePasswordModal() {
  showPasswordModal.value = false
  passwordInput.value = ''
  verifyError.value = ''
}

async function onUnmask() {
  if (!props.selectedNode || !passwordInput.value) return
  verifyLoading.value = true
  verifyError.value = ''
  try {
    const res = await projectApi.unmasksContacts(props.currentProjectId, props.selectedNode.id, passwordInput.value)
    unmaskedContacts.value = res.data.contacts
    showPasswordModal.value = false
    passwordInput.value = ''
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } }
    verifyError.value = e.response?.data?.error ?? '비밀번호가 올바르지 않습니다.'
  } finally {
    verifyLoading.value = false
  }
}

defineEmits<{
  removeDependency: [id: string]
  editDependency: [dep: Dependency]
  addDependency: [node: AnyNode]
  clearSelection: []
  navigateTo: [id: string]
}>()

const outgoing = computed(() => props.dependencies.filter(d => d.source === props.selectedNode?.id))
const incoming = computed(() => props.dependencies.filter(d => d.target === props.selectedNode?.id))
const impactedList = computed(() => props.allNodes.filter(n => props.impactedIds.has(n.id)))
const memberServers = computed<Server[]>(() => {
  if (!props.selectedNode || props.selectedNode.nodeKind !== 'l7') return []
  const ids = new Set(props.selectedNode.memberServerIds)
  return props.allNodes.filter(n => (!n.nodeKind || n.nodeKind === 'server') && ids.has(n.id)) as Server[]
})

function getNodeName(id: string) {
  const n = props.allNodes.find(n => n.id === id)
  if (!n) return id
  const prefix = n.nodeKind === 'l7' ? '[L7] ' : n.nodeKind === 'infra' ? '[INFRA] ' : n.nodeKind === 'external' ? '[EXT] ' : n.nodeKind === 'dns' ? '[DNS] ' : ''
  return prefix + n.name
}
</script>

<style scoped>
.impact-panel {
  background: var(--bg-surface); border-left: 1px solid var(--border-default);
  height: 100%; overflow-y: auto; display: flex; flex-direction: column;
  position: relative;
}
.no-selection {
  display: flex; align-items: center; justify-content: center;
  height: 100%; color: var(--border-strong); text-align: center; font-size: var(--text-sm); line-height: 1.8;
}
.node-detail { padding: 14px; border-bottom: 1px solid var(--border-default); }
.detail-header {
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;
}
.detail-name { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
.detail-row { margin: 3px 0; font-size: var(--text-xs); color: var(--text-disabled); }
.detail-row.mono { font-family: var(--font-mono); color: var(--color-ip-text); }
.desc-text { font-size: var(--text-xs); color: var(--text-tertiary); line-height: 1.6; margin: 0; word-break: break-word; }
.detail-firewall { margin: 3px 0; font-size: var(--text-xs); color: var(--color-warning-light); display: flex; align-items: center; gap: 6px; }
.fw-link { color: var(--accent-soft); text-decoration: underline; font-size: var(--text-xs); }
.section { padding: 10px 14px; border-bottom: 1px solid var(--border-default); }
.section h4 {
  font-size: var(--text-xs); font-weight: 700; color: var(--text-disabled); margin: 0 0 7px;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.impact-desc { font-size: var(--text-xs); color: var(--border-strong); margin: -3px 0 7px; }
.count {
  background: var(--border-default); color: var(--text-secondary); border-radius: 10px;
  padding: 1px 6px; font-size: 10px; font-weight: 600; margin-left: 4px;
}
.count.impact { background: #7f1d1d; color: #fca5a5; }
ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
li {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
  font-size: var(--text-xs); color: var(--text-muted); padding: 3px 5px; border-radius: 4px;
}
li:hover { background: var(--bg-elevated); }
.sub-text { font-size: 10px; color: var(--text-tertiary); }
.contact-li { align-items: flex-start; flex-direction: column; gap: 2px; padding: 5px 6px; }
.contact-name { font-weight: 600; color: var(--text-secondary); font-size: var(--text-xs); }
.contact-info { font-size: var(--text-xs); color: var(--text-tertiary); }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
.section-header h4 { margin: 0; }
.btn-unmask {
  font-size: 10px; padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-default);
  background: none; color: var(--text-tertiary); cursor: pointer;
}
.btn-unmask:hover { border-color: #f59e0b; color: #f59e0b; }
.unmask-badge { font-size: 10px; color: #34d399; font-weight: 600; }
.mask-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 500;
}
.mask-modal {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 10px;
  padding: 24px; width: 300px; display: flex; flex-direction: column; gap: 12px;
}
.mask-modal h4 { margin: 0; color: var(--text-primary); font-size: var(--text-base); }
.mask-modal-desc { margin: 0; font-size: var(--text-xs); color: var(--text-tertiary); }
.mask-modal-input {
  width: 100%; padding: 8px 10px; background: var(--bg-base); border: 1px solid var(--border-default);
  border-radius: 6px; color: var(--text-secondary); font-size: var(--text-sm); box-sizing: border-box;
}
.mask-modal-input:focus { outline: none; border-color: var(--accent-focus); }
.verify-error { font-size: var(--text-xs); color: #f87171; }
.mask-modal-actions { display: flex; gap: 8px; justify-content: flex-end; }
.dep-type {
  font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight: 700; flex-shrink: 0;
}
.dep-type.http { background: var(--accent-bg); color: var(--accent-light); }
.dep-type.tcp { background: #1e1b4b; color: #a5b4fc; }
.dep-type.websocket { background: #14290a; color: var(--color-success-lighter); }
.dep-type.other { background: #1c1917; color: #9ca3af; }
.fw-badge {
  font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px;
  background: #422006; color: #fb923c; flex-shrink: 0; text-decoration: none;
}
a.fw-badge:hover { background: #7c2d12; color: #fdba74; }
.fw-badge.no-link { cursor: default; }
.edit-dep {
  background: none; border: none; color: var(--accent-focus);
  cursor: pointer; font-size: var(--text-xs); padding: 2px 4px; border-radius: 3px;
  opacity: 0; transition: opacity 0.1s, background 0.1s;
}
li:hover .edit-dep { opacity: 1; }
.edit-dep:hover { color: var(--accent-light); background: var(--accent-bg); }
.del-dep {
  margin-left: auto; background: none; border: none; color: #ef4444;
  cursor: pointer; font-size: var(--text-xs); padding: 2px 4px; border-radius: 3px;
  opacity: 0; transition: opacity 0.1s, background 0.1s;
}
li:hover .del-dep { opacity: 1; }
.del-dep:hover { color: #fca5a5; background: #3f1f1f; }
.impact-item { color: #fca5a5; }
.empty { color: var(--border-strong); font-size: var(--text-xs); padding: 2px 5px; }
.nav-item { cursor: pointer; }
.ip-group { display: flex; flex-direction: column; gap: 2px; margin: 2px 0; }
.ip-label { font-size: var(--text-xs); color: var(--border-strong); font-weight: 600; }
.ip-chip { font-size: var(--text-xs); color: var(--color-ip-text); font-family: var(--font-mono); padding-left: 6px; }
.ip-row { display: flex; align-items: center; gap: 4px; }
.contact-copy-row { display: flex; align-items: center; gap: 4px; }
.btn-copy {
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 3px;
  color: var(--text-tertiary); cursor: pointer; padding: 2px 3px; flex-shrink: 0;
  transition: color 0.1s, border-color 0.1s, background 0.1s;
}
.btn-copy:hover { color: var(--node-infra-color); border-color: var(--node-infra-color); background: var(--node-infra-bg); }
.copy-toast {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  background: var(--node-infra-bg); border: 1px solid var(--node-infra-color); border-radius: 6px;
  padding: 5px 14px; font-size: var(--text-xs); color: var(--color-ip-text); font-weight: 600;
  pointer-events: none; white-space: nowrap; z-index: 10;
}
.copy-fade-enter-active { transition: opacity 0.15s; }
.copy-fade-leave-active { transition: opacity 0.3s; }
.copy-fade-enter-from, .copy-fade-leave-to { opacity: 0; }
.type-badge {
  font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 800; flex-shrink: 0;
}
.type-badge.server, .type-badge.undefined { background: var(--accent-bg); color: var(--accent-light); }
.type-badge.l7 { background: var(--node-l7-bg-deep); color: var(--node-l7-text); }
.type-badge.infra { background: var(--node-infra-bg-deep); color: var(--color-ip-text); }
.type-badge.dns { background: var(--node-dns-bg-deep); color: var(--node-dns-text); }
.type-badge.external { background: var(--node-ext-bg-deep); color: var(--color-success-lighter); }
.panel-actions {
  padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; margin-top: auto;
}
.btn-dep {
  background: var(--accent-primary); color: #fff; border: none;
  border-radius: 6px; padding: 8px; font-size: var(--text-xs); cursor: pointer; font-weight: 600;
}
.btn-dep:hover { background: var(--accent-hover); }
.btn-clear {
  background: var(--border-default); color: var(--text-tertiary); border: none;
  border-radius: 6px; padding: 8px; font-size: var(--text-xs); cursor: pointer;
}
.btn-clear:hover { background: var(--border-strong); }
</style>
