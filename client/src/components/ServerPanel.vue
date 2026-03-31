<template>
  <div class="server-panel">
    <div class="panel-header">
      <h2>{{ $t('serverPanel.title') }} <span class="count-badge">{{ allItems.length }}</span></h2>

      <!-- 단일 추가 버튼 + 드롭다운 -->
      <div v-if="!readOnly" class="add-wrap" ref="addWrapRef">
        <button class="btn-add" @click.stop="toggleMenu">{{ $t('serverPanel.addMenu') }} ▾</button>
        <div v-if="showMenu" class="add-menu" @click.stop>
          <button @click="emit('addServer'); showMenu=false">
            <Icon name="node-server" :size="13" class="menu-icon" />
            {{ $t('nodes.server') }}
          </button>
          <button @click="emit('addL7'); showMenu=false">
            <Icon name="node-l7" :size="13" class="menu-icon" />
            {{ $t('nodes.l7Short') }}
          </button>
          <button @click="emit('addInfra'); showMenu=false">
            <Icon name="node-infra" :size="13" class="menu-icon" />
            {{ $t('nodes.infra') }}
          </button>
          <button @click="emit('addDns'); showMenu=false">
            <Icon name="node-dns" :size="13" class="menu-icon" />
            {{ $t('nodes.dns') }}
          </button>
          <button @click="emit('addExternal'); showMenu=false">
            <Icon name="node-external" :size="13" class="menu-icon" />
            {{ $t('nodes.externalShort') }}
          </button>
        </div>
      </div>
    </div>

    <div class="search-box">
      <input v-model="search" :placeholder="$t('serverPanel.search')" />
    </div>

    <!-- 카테고리 필터 드롭다운 -->
    <div class="kf-wrap" ref="kfWrapRef">
      <button class="kf-trigger" :class="{ active: !allKindsChecked }" @click.stop="showKfMenu = !showKfMenu">
        <Icon name="filter" :size="12" />
        {{ $t('serverPanel.filter') }}
        <span v-if="!allKindsChecked" class="kf-active-count">{{ activeKindCount }}/5</span>
        <Icon name="chevron-down-sm" :size="10" class="kf-chevron" :class="{ open: showKfMenu }" />
      </button>

      <div v-if="showKfMenu" class="kf-menu" @click.stop>
        <label class="kf-menu-item kf-menu-all">
          <input
            type="checkbox"
            :checked="allKindsChecked"
            :indeterminate="someKindsChecked && !allKindsChecked"
            @change="toggleAllKinds"
          />
          {{ $t('serverPanel.selectAll') }}
        </label>
        <div class="kf-divider"></div>
        <label class="kf-menu-item">
          <input type="checkbox" v-model="filterKinds.server" />
          <span class="kf-dot kf-server">SRV</span>
          {{ $t('nodes.server') }}
        </label>
        <label class="kf-menu-item">
          <input type="checkbox" v-model="filterKinds.l7" />
          <span class="kf-dot kf-l7">L7</span>
          {{ $t('nodes.l7') }}
        </label>
        <label class="kf-menu-item">
          <input type="checkbox" v-model="filterKinds.infra" />
          <span class="kf-dot kf-infra">INFRA</span>
          {{ $t('nodes.infra') }}
        </label>
        <label class="kf-menu-item">
          <input type="checkbox" v-model="filterKinds.dns" />
          <span class="kf-dot kf-dns">DNS</span>
          {{ $t('nodes.dns') }}
        </label>
        <label class="kf-menu-item">
          <input type="checkbox" v-model="filterKinds.external" />
          <span class="kf-dot kf-ext">EXT</span>
          {{ $t('nodes.external') }}
        </label>
      </div>
    </div>

    <ul class="node-list">
      <li
        v-for="item in filteredItems"
        :key="item.id"
        :class="['node-card', `kind-${item.nodeKind ?? 'server'}`, { selected: selectedId === item.id }]"
        @click="emit('select', item)"
      >
        <!-- 행1: 타입/환경 뱃지 + 편집/삭제 -->
        <div class="card-row1">
          <div class="badges">
            <span :class="['type-badge', item.nodeKind ?? 'server']">{{ typeLabel(item) }}</span>
          </div>
          <div v-if="!readOnly" class="card-actions">
            <button :title="$t('common.edit')" @click.stop="emit('edit', item)">✎</button>
            <button :title="$t('common.delete')" class="danger" @click.stop="emit('delete', item)">✕</button>
          </div>
        </div>
        <!-- 행2: 노드명 -->
        <div class="card-name">{{ item.name }}</div>
        <!-- 행3: 서브정보 -->
        <div class="card-sub">{{ subText(item) }}</div>
      </li>
      <li v-if="filteredItems.length === 0" class="empty">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="8" width="32" height="10" rx="2.5" stroke="#2a2a30" stroke-width="1.4"/>
          <line x1="8" y1="13" x2="14" y2="13" stroke="#2a2a30" stroke-width="1"/>
          <rect x="4" y="23" width="32" height="10" rx="2.5" stroke="#2a2a30" stroke-width="1.4"/>
          <line x1="8" y1="28" x2="14" y2="28" stroke="#2a2a30" stroke-width="1"/>
          <circle cx="30" cy="13" r="1.5" fill="#3a3a42"/>
          <circle cx="30" cy="28" r="1.5" fill="#3a3a42"/>
        </svg>
        <span class="empty-label">{{ $t('serverPanel.empty') }}</span>
        <span v-if="!readOnly" class="empty-hint">{{ $t('serverPanel.emptyHint') }}</span>
      </li>
    </ul>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Server, L7Node, InfraNode, ExternalServiceNode, DnsNode, AnyNode } from '../types'
import Icon from './Icon.vue'

function typeLabel(node: AnyNode): string {
  if (node.nodeKind === 'l7') return 'L7'
  if (node.nodeKind === 'infra') return 'INFRA'
  if (node.nodeKind === 'external') return 'EXT'
  if (node.nodeKind === 'dns') return 'DNS'
  return 'SRV'
}
function subText(node: AnyNode): string {
  if (node.nodeKind === 'l7') {
    const ip = (node as L7Node).ip
    const cnt = (node as L7Node).memberServerIds?.length ?? 0
    return [ip, `${cnt}개 서버`].filter(Boolean).join(' / ')
  }
  if (node.nodeKind === 'infra') {
    const n = node as InfraNode
    const conn = [n.host, n.port ? `:${n.port}` : ''].filter(Boolean).join('')
    return [n.infraType, conn].filter(Boolean).join(' · ')
  }
  if (node.nodeKind === 'external') {
    const cnt = (node as ExternalServiceNode).contacts?.length ?? 0
    return `담당자 ${cnt}명`
  }
  if (node.nodeKind === 'dns') {
    const d = node as DnsNode
    return [d.dnsType, d.provider].filter(Boolean).join(' · ')
  }
  const s = node as Server
  const first = s.internalIps?.[0] ?? ''
  const natFirst = s.natIps?.[0] ?? ''
  const extra = (s.internalIps?.length ?? 0) + (s.natIps?.length ?? 0) - (first ? 1 : 0) - (natFirst ? 1 : 0)
  const base = [first, natFirst].filter(Boolean).join(' / ')
  return extra > 0 ? `${base} 외 ${extra}개` : base
}

const props = defineProps<{
  servers: Server[]
  l7Nodes: L7Node[]
  infraNodes: InfraNode[]
  externalNodes: ExternalServiceNode[]
  dnsNodes: DnsNode[]
  selectedId: string | null
  readOnly: boolean
}>()

const emit = defineEmits<{
  select: [node: AnyNode]
  addServer: []
  addL7: []
  addInfra: []
  addDns: []
  addExternal: []
  edit: [node: AnyNode]
  delete: [node: AnyNode]
}>()

const search = ref('')
const showMenu = ref(false)
const addWrapRef = ref<HTMLDivElement>()

// ─── 카테고리 필터 ───────────────────────────────────────
const filterKinds = ref({ server: true, l7: true, infra: true, dns: true, external: true })
const showKfMenu = ref(false)
const kfWrapRef = ref<HTMLDivElement>()

const allKindsChecked = computed(() => Object.values(filterKinds.value).every(v => v))
const someKindsChecked = computed(() => Object.values(filterKinds.value).some(v => v))
const activeKindCount = computed(() => Object.values(filterKinds.value).filter(v => v).length)

function toggleAllKinds() {
  const val = !allKindsChecked.value
  ;(Object.keys(filterKinds.value) as (keyof typeof filterKinds.value)[]).forEach(k => {
    filterKinds.value[k] = val
  })
}

function closeKfMenu(e: MouseEvent) {
  if (!kfWrapRef.value?.contains(e.target as Node)) showKfMenu.value = false
}

const allItems = computed<AnyNode[]>(() => [
  ...props.servers,
  ...props.l7Nodes,
  ...props.infraNodes,
  ...props.dnsNodes,
  ...props.externalNodes,
])

const filteredItems = computed(() => {
  const q = search.value.toLowerCase()
  return allItems.value.filter(item => {
    const kind = (item.nodeKind ?? 'server') as keyof typeof filterKinds.value
    if (!(filterKinds.value[kind] ?? true)) return false
    if (!q) return true
    if (item.name.toLowerCase().includes(q)) return true
    if (item.nodeKind !== 'l7' && item.nodeKind !== 'infra' && item.nodeKind !== 'external') {
      return (item as Server).team?.toLowerCase().includes(q)
    }
    return false
  })
})

function toggleMenu() { showMenu.value = !showMenu.value }
function closeMenu(e: MouseEvent) {
  if (!addWrapRef.value?.contains(e.target as Node)) showMenu.value = false
}
onMounted(() => {
  document.addEventListener('click', closeMenu)
  document.addEventListener('click', closeKfMenu)
})
onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
  document.removeEventListener('click', closeKfMenu)
})

</script>

<style scoped>
.server-panel {
  display: flex; flex-direction: column; height: 100%;
  background: var(--bg-surface); border-right: 1px solid var(--border-default);
}
.panel-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; border-bottom: 1px solid var(--border-default); gap: 8px;
}
.panel-header h2 {
  font-size: var(--text-base); font-weight: 700; color: var(--text-primary); margin: 0;
  display: flex; align-items: center; gap: 6px;
}
.count-badge {
  background: var(--border-default); color: var(--text-tertiary); border-radius: 10px;
  padding: 1px 6px; font-size: var(--text-xs); font-weight: 600;
}
.add-wrap { position: relative; }
.btn-add {
  background: var(--accent-primary); color: #fff; border: none; border-radius: 6px;
  padding: 5px 10px; font-size: var(--text-xs); cursor: pointer; font-weight: 600; white-space: nowrap;
}
.btn-add:hover { background: var(--accent-hover); }
.add-menu {
  position: absolute; right: 0; top: calc(100% + 4px);
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 8px;
  padding: 4px 0; z-index: 300; min-width: 130px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.add-menu button {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 14px; background: none; border: none;
  color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; text-align: left;
}
.add-menu button:hover { background: var(--bg-elevated); }
.menu-icon { color: var(--text-tertiary); flex-shrink: 0; }
.search-box {
  padding: 8px 12px; border-bottom: 1px solid var(--border-default);
}
.search-box input {
  width: 100%; background: var(--bg-base); border: 1px solid var(--border-default);
  border-radius: 6px; padding: 6px 10px; color: var(--text-secondary); font-size: var(--text-xs); box-sizing: border-box;
}
.kf-wrap {
  position: relative; padding: 7px 12px; border-bottom: 1px solid var(--border-default);
}
.kf-trigger {
  display: flex; align-items: center; gap: 6px;
  width: 100%; background: var(--bg-base); border: 1px solid var(--border-default);
  border-radius: 6px; padding: 6px 10px;
  font-size: var(--text-xs); color: var(--text-disabled); cursor: pointer; text-align: left;
  transition: border-color 0.15s, color 0.15s;
}
.kf-trigger:hover { border-color: var(--border-strong); color: var(--text-tertiary); }
.kf-trigger.active { border-color: var(--accent-focus); color: var(--accent-soft); }
.kf-active-count {
  margin-left: auto; background: var(--node-srv-bg); color: var(--accent-soft);
  border-radius: 10px; padding: 0 6px; font-size: 10px; font-weight: 700;
}
.kf-chevron { margin-left: auto; transition: transform 0.15s; color: var(--border-strong); }
.kf-chevron.open { transform: rotate(180deg); }
.kf-active-count + .kf-chevron { margin-left: 4px; }

.kf-menu {
  position: absolute; left: 12px; right: 12px; top: calc(100% - 4px);
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 8px;
  padding: 6px 0; z-index: 300;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
}
.kf-menu-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 14px; cursor: pointer; user-select: none;
  font-size: var(--text-xs); color: var(--text-tertiary); transition: background 0.1s;
}
.kf-menu-item:hover { background: var(--bg-elevated); color: var(--text-secondary); }
.kf-menu-all { font-weight: 700; color: var(--text-secondary); }
.kf-menu-item input[type="checkbox"] {
  width: 13px; height: 13px; accent-color: var(--accent-soft); cursor: pointer; flex-shrink: 0;
}
.kf-divider { height: 1px; background: var(--border-default); margin: 4px 0; }
.kf-dot {
  font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 800; letter-spacing: 0.03em; flex-shrink: 0;
}
.kf-server { background: var(--accent-bg); color: var(--accent-light); }
.kf-l7    { background: var(--node-l7-bg-deep); color: var(--node-l7-text); }
.kf-infra { background: var(--node-infra-bg-deep); color: var(--color-ip-text); }
.kf-dns   { background: var(--node-dns-bg-deep); color: var(--node-dns-text); }
.kf-ext   { background: var(--node-ext-bg-deep); color: var(--color-success-lighter); }
.node-list {
  list-style: none; margin: 0; padding: 8px 0; flex: 1; overflow-y: auto;
}
.node-card {
  position: relative; overflow: hidden;
  margin: 0 10px 6px; padding: 9px 10px 9px 13px;
  background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 8px;
  cursor: pointer; transition: border-color 0.15s, background 0.15s, transform 0.15s, box-shadow 0.15s;
  display: flex; flex-direction: column; gap: 3px;
}
.node-card:hover {
  border-color: var(--border-strong); background: var(--bg-elevated);
  transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.4);
}
.node-card.selected { border-color: var(--accent-focus); background: var(--accent-bg-deep); }
.node-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
}
.kind-server::before   { background: var(--node-srv-color); }
.kind-l7::before       { background: var(--node-l7-color); }
.kind-infra::before    { background: var(--node-infra-color); }
.kind-dns::before      { background: var(--node-dns-color); }
.kind-external::before { background: var(--node-ext-color); }
.card-row1 { display: flex; align-items: center; justify-content: space-between; }
.badges { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
.type-badge {
  font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 800; letter-spacing: 0.03em;
}
.type-badge.server, .type-badge.undefined { background: var(--accent-bg); color: var(--accent-light); }
.type-badge.l7 { background: var(--node-l7-bg-deep); color: var(--node-l7-text); }
.type-badge.infra { background: var(--node-infra-bg-deep); color: var(--color-ip-text); }
.type-badge.dns { background: var(--node-dns-bg-deep); color: var(--node-dns-text); }
.type-badge.external { background: var(--node-ext-bg-deep); color: var(--color-success-lighter); }
.card-actions { display: flex; gap: 2px; opacity: 0; transition: opacity 0.15s; }
.node-card:hover .card-actions { opacity: 1; }
.card-actions button {
  background: none; border: none; color: var(--text-disabled); cursor: pointer;
  padding: 1px 4px; font-size: var(--text-sm); border-radius: 3px;
}
.card-actions button:hover { background: var(--border-default); color: var(--text-secondary); }
.card-actions button.danger:hover { color: #ef4444; }
.card-name {
  font-size: var(--text-sm); font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.card-sub {
  font-size: 10px; color: var(--border-strong);
  font-family: var(--font-mono);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.empty {
  padding: 32px 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
}
.empty-label { font-size: var(--text-sm); font-weight: 600; color: var(--text-disabled); }
.empty-hint  { font-size: var(--text-xs); color: var(--border-strong); }
</style>
