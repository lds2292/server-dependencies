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
            <span v-for="ip in (selectedNode as any).internalIps" :key="ip" class="detail-row mono ip-chip">{{ ip }}</span>
            <span v-if="!(selectedNode as any).internalIps?.length" class="detail-row mono">-</span>
          </div>
          <div class="ip-group">
            <span class="ip-label">NAT IP</span>
            <span v-for="ip in (selectedNode as any).natIps" :key="ip" class="detail-row mono ip-chip">{{ ip }}</span>
            <span v-if="!(selectedNode as any).natIps?.length" class="detail-row mono">-</span>
          </div>
          <p v-if="(selectedNode as any).hasFirewall" class="detail-firewall">
            🔒 방화벽 오픈 필요
            <a v-if="(selectedNode as any).firewallUrl" :href="(selectedNode as any).firewallUrl" target="_blank" class="fw-link">요청 링크</a>
          </p>
        </template>

        <!-- L7 전용 -->
        <template v-else-if="selectedNode.nodeKind === 'l7'">
          <p v-if="(selectedNode as any).ip" class="detail-row mono">IP: {{ (selectedNode as any).ip }}</p>
          <p v-if="(selectedNode as any).natIp" class="detail-row mono">NAT IP: {{ (selectedNode as any).natIp }}</p>
        </template>

        <!-- DB 전용 -->
        <template v-else-if="selectedNode.nodeKind === 'infra'">
          <p class="detail-row">유형: {{ (selectedNode as any).infraType || '-' }}</p>
          <p v-if="(selectedNode as any).host" class="detail-row mono">
            {{ (selectedNode as any).host }}{{ (selectedNode as any).port ? ':' + (selectedNode as any).port : '' }}
          </p>
        </template>

        <!-- 외부서비스 전용 -->
        <template v-else-if="selectedNode.nodeKind === 'external'">
          <p v-if="(selectedNode as any).hasFirewall" class="detail-firewall">
            🔒 방화벽 오픈 필요
            <a v-if="(selectedNode as any).firewallUrl" :href="(selectedNode as any).firewallUrl" target="_blank" class="fw-link">요청 링크</a>
          </p>
          <p v-if="(selectedNode as any).hasWhitelist" class="detail-firewall">📋 화이트리스트 요청 필요</p>
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
        <h4>담당자 <span class="count">{{ (selectedNode as any).contacts.length }}</span></h4>
        <ul>
          <li v-for="(c, i) in (selectedNode as any).contacts" :key="i" class="contact-li">
            <span class="contact-name">{{ c.name }}</span>
            <span v-if="c.phone" class="contact-info">{{ c.phone }}</span>
            <span v-if="c.email" class="contact-info">{{ c.email }}</span>
          </li>
        </ul>
      </div>

      <!-- 의존 관계 -->
      <div class="section">
        <h4>의존하는 노드 <span class="count">{{ outgoing.length }}</span></h4>
        <ul>
          <li v-for="d in outgoing" :key="d.id" class="nav-item" @click="$emit('navigateTo', d.target)">
            <span :class="['dep-type', d.type]">{{ d.type }}</span>
            {{ getNodeName(d.target) }}
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
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Server, AnyNode, Dependency } from '../types'

function typeLabel(node: AnyNode): string {
  if (node.nodeKind === 'l7') return 'L7'
  if (node.nodeKind === 'infra') return 'INFRA'
  if (node.nodeKind === 'external') return 'EXT'
  return 'SRV'
}

const props = defineProps<{
  selectedNode: AnyNode | null
  allNodes: AnyNode[]
  dependencies: Dependency[]
  impactedIds: Set<string>
  readOnly: boolean
}>()

defineEmits<{
  removeDependency: [id: string]
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
  const prefix = n.nodeKind === 'l7' ? '[L7] ' : n.nodeKind === 'infra' ? '[INFRA] ' : n.nodeKind === 'external' ? '[EXT] ' : ''
  return prefix + n.name
}
</script>

<style scoped>
.impact-panel {
  background: #1e293b; border-left: 1px solid #334155;
  height: 100%; overflow-y: auto; display: flex; flex-direction: column;
}
.no-selection {
  display: flex; align-items: center; justify-content: center;
  height: 100%; color: #475569; text-align: center; font-size: 13px; line-height: 1.8;
}
.node-detail { padding: 14px; border-bottom: 1px solid #334155; }
.detail-header {
  display: flex; align-items: center; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;
}
.detail-name { font-size: 15px; font-weight: 700; color: #f1f5f9; }
.detail-row { margin: 3px 0; font-size: 12px; color: #64748b; }
.detail-row.mono { font-family: 'Menlo', 'Consolas', monospace; color: #7dd3fc; }
.desc-text { font-size: 12px; color: #94a3b8; line-height: 1.6; margin: 0; word-break: break-word; }
.detail-firewall { margin: 3px 0; font-size: 12px; color: #fbbf24; display: flex; align-items: center; gap: 6px; }
.fw-link { color: #60a5fa; text-decoration: underline; font-size: 11px; }
.section { padding: 10px 14px; border-bottom: 1px solid #334155; }
.section h4 {
  font-size: 11px; font-weight: 700; color: #64748b; margin: 0 0 7px;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.impact-desc { font-size: 11px; color: #475569; margin: -3px 0 7px; }
.count {
  background: #334155; color: #e2e8f0; border-radius: 10px;
  padding: 1px 6px; font-size: 10px; font-weight: 600; margin-left: 4px;
}
.count.impact { background: #7f1d1d; color: #fca5a5; }
ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; }
li {
  display: flex; align-items: center; gap: 5px; flex-wrap: wrap;
  font-size: 12px; color: #cbd5e1; padding: 3px 5px; border-radius: 4px;
}
li:hover { background: #273549; }
.sub-text { font-size: 10px; color: #94a3b8; }
.contact-li { align-items: flex-start; flex-direction: column; gap: 2px; padding: 5px 6px; }
.contact-name { font-weight: 600; color: #e2e8f0; font-size: 12px; }
.contact-info { font-size: 11px; color: #94a3b8; }
.dep-type {
  font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight: 700; flex-shrink: 0;
}
.dep-type.http { background: #1e3a5f; color: #93c5fd; }
.dep-type.tcp { background: #1e1b4b; color: #a5b4fc; }
.dep-type.websocket { background: #14290a; color: #86efac; }
.dep-type.other { background: #1c1917; color: #9ca3af; }
.del-dep {
  margin-left: auto; background: none; border: none; color: #475569;
  cursor: pointer; font-size: 11px; padding: 2px 4px; border-radius: 3px; opacity: 0;
}
li:hover .del-dep { opacity: 1; }
.del-dep:hover { color: #ef4444; background: #3f1f1f; }
.impact-item { color: #fca5a5; }
.empty { color: #475569; font-size: 12px; padding: 2px 5px; }
.nav-item { cursor: pointer; }
.ip-group { display: flex; flex-direction: column; gap: 2px; margin: 2px 0; }
.ip-label { font-size: 11px; color: #475569; font-weight: 600; }
.ip-chip { font-size: 12px; color: #7dd3fc; font-family: 'Menlo', 'Consolas', monospace; padding-left: 6px; }
.type-badge {
  font-size: 9px; padding: 1px 5px; border-radius: 3px; font-weight: 800; flex-shrink: 0;
}
.type-badge.server, .type-badge.undefined { background: #1e3a5f; color: #93c5fd; }
.type-badge.l7 { background: #3b0764; color: #e9d5ff; }
.type-badge.infra { background: #0c2040; color: #7dd3fc; }
.type-badge.external { background: #052e16; color: #86efac; }
.panel-actions {
  padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; margin-top: auto;
}
.btn-dep {
  background: #2563eb; color: #fff; border: none;
  border-radius: 6px; padding: 8px; font-size: 12px; cursor: pointer; font-weight: 600;
}
.btn-dep:hover { background: #1d4ed8; }
.btn-clear {
  background: #334155; color: #94a3b8; border: none;
  border-radius: 6px; padding: 8px; font-size: 12px; cursor: pointer;
}
.btn-clear:hover { background: #475569; }
</style>
