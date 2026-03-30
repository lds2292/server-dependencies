<template>
  <div class="conflict-overlay" @click.self="onDismiss">
    <div class="conflict-modal">
      <div class="conflict-header">
        <span class="conflict-title">변경사항 충돌 ({{ conflicts.length }}건)</span>
        <span class="conflict-subtitle">다른 사용자가 동일한 항목을 수정했습니다. 각 항목에 대해 유지할 버전을 선택하세요.</span>
      </div>

      <div class="conflict-list">
        <div v-for="conflict in conflicts" :key="conflict.id" class="conflict-item">
          <div class="conflict-item-header">
            <span class="conflict-node-type">{{ nodeTypeLabel(conflict.nodeType) }}</span>
            <span class="conflict-node-name">{{ conflict.label }}</span>
          </div>

          <!-- 삭제 충돌 -->
          <div v-if="conflict.mine === null || conflict.server === null" class="deletion-info">
            <span v-if="conflict.mine === null" class="deletion-msg">
              내가 수정한 항목을 상대방이 삭제했습니다.
            </span>
            <span v-else class="deletion-msg">
              상대방이 수정한 항목을 내가 삭제했습니다.
            </span>
            <table class="diff-table">
              <tbody>
                <tr v-for="row in getNodeFields(conflict.mine ?? conflict.server)" :key="row.field">
                  <td class="diff-field">{{ row.label }}</td>
                  <td class="diff-value">{{ row.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 수정 충돌: 변경된 필드만 표시 -->
          <table v-else class="diff-table">
            <thead>
              <tr>
                <th class="th-field">필드</th>
                <th class="th-mine">내 버전</th>
                <th class="th-server">서버 버전</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="diff in getDiff(conflict.mine, conflict.server)" :key="diff.field">
                <td class="diff-field">{{ diff.label }}</td>
                <td class="diff-value" :class="{ selected: resolutions[conflict.id] !== 'server' }">
                  {{ diff.myValue }}
                </td>
                <td class="diff-value" :class="{ selected: resolutions[conflict.id] === 'server' }">
                  {{ diff.serverValue }}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="conflict-choices">
            <button
              :class="['choice-btn', { active: resolutions[conflict.id] !== 'server' }]"
              @click="resolutions[conflict.id] = 'mine'"
            >
              <span class="choice-badge mine">내 버전 유지</span>
              <span v-if="conflict.mine === null" class="choice-sub">삭제 유지</span>
            </button>
            <button
              :class="['choice-btn', { active: resolutions[conflict.id] === 'server' }]"
              @click="resolutions[conflict.id] = 'server'"
            >
              <span class="choice-badge server">서버 버전 수용</span>
              <span v-if="conflict.server === null" class="choice-sub">삭제 수용</span>
            </button>
          </div>
        </div>
      </div>

      <div class="conflict-bulk">
        <button class="btn-bulk" @click="selectAll('mine')">전체 내 버전 선택</button>
        <button class="btn-bulk" @click="selectAll('server')">전체 서버 버전 선택</button>
      </div>

      <div class="conflict-actions">
        <button class="btn-ghost" @click="onDismiss">나중에 결정</button>
        <button class="btn-primary" @click="onConfirm">적용</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { ConflictItem } from '../stores/graph'

const props = defineProps<{
  conflicts: ConflictItem[]
}>()

const emit = defineEmits<{
  resolve: [resolutions: Record<string, 'mine' | 'server'>]
  dismiss: []
}>()

const resolutions = reactive<Record<string, 'mine' | 'server'>>({})
props.conflicts.forEach(c => { resolutions[c.id] = 'mine' })

const FIELD_LABELS: Record<string, string> = {
  name: '이름',
  team: '팀',
  internalIps: '내부 IP',
  natIps: 'NAT IP',
  ip: 'IP',
  natIp: 'NAT IP',
  memberServerIds: '멤버 서버 ID',
  infraType: '인프라 타입',
  host: '호스트',
  port: '포트',
  dnsType: 'DNS 레코드 타입',
  recordValue: '레코드 값',
  ttl: 'TTL',
  provider: 'DNS 관리',
  description: '설명',
  hasFirewall: '방화벽 여부',
  firewallUrl: '방화벽 URL',
  hasWhitelist: '화이트리스트',
  type: '연결 유형',
  source: '출발 노드',
  target: '대상 노드',
}

const EXCLUDED_FIELDS = new Set(['id', 'nodeKind', 'contacts'])

function formatValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '(없음)'
  if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : '(없음)'
  if (typeof value === 'boolean') return value ? '예' : '아니오'
  return String(value)
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function nodeTypeLabel(type: ConflictItem['nodeType']): string {
  const map: Record<ConflictItem['nodeType'], string> = {
    server: 'Server', l7: 'L7', infra: 'Infra', external: 'External', dns: 'DNS', dependency: 'Dependency',
  }
  return map[type]
}

function getDiff(mine: unknown, server: unknown): Array<{ field: string; label: string; myValue: string; serverValue: string }> {
  const m = mine as Record<string, unknown>
  const s = server as Record<string, unknown>
  const allFields = new Set([...Object.keys(m), ...Object.keys(s)])
  const result = []
  for (const field of allFields) {
    if (EXCLUDED_FIELDS.has(field)) continue
    if (!deepEqual(m[field], s[field])) {
      result.push({
        field,
        label: FIELD_LABELS[field] ?? field,
        myValue: formatValue(m[field]),
        serverValue: formatValue(s[field]),
      })
    }
  }
  return result
}

function getNodeFields(node: unknown): Array<{ field: string; label: string; value: string }> {
  const n = node as Record<string, unknown>
  return Object.keys(n)
    .filter(f => !EXCLUDED_FIELDS.has(f))
    .map(f => ({ field: f, label: FIELD_LABELS[f] ?? f, value: formatValue(n[f]) }))
}

function selectAll(choice: 'mine' | 'server') {
  props.conflicts.forEach(c => { resolutions[c.id] = choice })
}

function onConfirm() {
  emit('resolve', { ...resolutions })
}

function onDismiss() {
  emit('dismiss')
}
</script>

<style scoped>
.conflict-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.conflict-modal {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 12px;
  width: 100%; max-width: 640px; max-height: 82vh;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.conflict-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-default);
  display: flex; flex-direction: column; gap: 4px;
  flex-shrink: 0;
}
.conflict-title { font-size: var(--text-base); font-weight: 700; color: var(--text-primary); }
.conflict-subtitle { font-size: var(--text-xs); color: var(--text-disabled); }

.conflict-list {
  overflow-y: auto; padding: 14px 24px;
  display: flex; flex-direction: column; gap: 14px;
  flex: 1;
}
.conflict-item {
  background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 8px;
  padding: 14px; display: flex; flex-direction: column; gap: 12px;
}
.conflict-item-header { display: flex; align-items: center; gap: 8px; }
.conflict-node-type {
  font-size: 10px; font-weight: 700; color: var(--accent-soft);
  background: var(--accent-bg); border-radius: 4px; padding: 2px 6px;
  text-transform: uppercase; flex-shrink: 0;
}
.conflict-node-name { font-size: var(--text-sm); font-weight: 600; color: var(--text-secondary); }

/* 삭제 충돌 */
.deletion-info { display: flex; flex-direction: column; gap: 8px; }
.deletion-msg { font-size: var(--text-xs); color: #f87171; }

/* diff 테이블 */
.diff-table {
  width: 100%; border-collapse: collapse;
  font-size: var(--text-xs);
}
.diff-table th {
  padding: 5px 10px; font-size: var(--text-xs); font-weight: 600;
  color: var(--text-disabled); text-align: left; border-bottom: 1px solid var(--bg-surface);
}
.th-field { width: 28%; }
.th-mine, .th-server { width: 36%; }
.diff-table td { padding: 6px 10px; vertical-align: top; }
.diff-field {
  color: var(--text-tertiary); font-weight: 500;
  border-right: 1px solid var(--bg-surface);
}
.diff-value {
  color: var(--text-muted); word-break: break-all;
  border-right: 1px solid var(--bg-surface);
}
.diff-value:last-child { border-right: none; }
.diff-value.selected {
  color: var(--text-primary); font-weight: 600;
  background: rgba(59, 130, 246, 0.08);
}
.diff-table tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
.diff-value.selected { background: rgba(59, 130, 246, 0.1); }

/* 선택 버튼 */
.conflict-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.choice-btn {
  background: var(--bg-surface); border: 1px solid var(--border-default); border-radius: 6px;
  padding: 8px 12px; cursor: pointer; text-align: left;
  display: flex; flex-direction: column; gap: 3px;
  transition: border-color 0.15s;
}
.choice-btn:hover { border-color: var(--border-strong); }
.choice-btn.active { border-color: var(--accent-focus); background: var(--accent-bg); }
.choice-badge {
  font-size: var(--text-xs); font-weight: 700; border-radius: 4px;
  padding: 2px 7px; display: inline-block;
}
.choice-badge.mine { background: #14532d; color: var(--color-success-light); }
.choice-badge.server { background: var(--accent-bg); color: var(--accent-soft); }
.choice-sub { font-size: 10px; color: var(--text-disabled); }

.conflict-bulk {
  padding: 10px 24px;
  border-top: 1px solid var(--border-default);
  display: flex; gap: 8px;
  flex-shrink: 0;
}
.btn-bulk {
  font-size: var(--text-xs); color: var(--text-disabled); background: none;
  border: 1px solid var(--border-default); border-radius: 5px;
  padding: 4px 10px; cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.btn-bulk:hover { color: var(--text-tertiary); border-color: var(--border-strong); }

.conflict-actions {
  padding: 14px 24px;
  border-top: 1px solid var(--border-default);
  display: flex; justify-content: flex-end; gap: 8px;
  flex-shrink: 0;
}
</style>
