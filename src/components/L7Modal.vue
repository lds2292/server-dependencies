<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ isEdit ? 'L7 노드 수정' : 'L7 노드 추가' }}</h3>
      <form @submit.prevent="onSubmit">
        <label>
          이름 *
          <input v-model="form.name" required placeholder="예: api-lb-prod" :class="{ 'input-error': isDuplicate }" />
          <span v-if="isDuplicate" class="error-msg">이미 사용 중인 이름입니다</span>
        </label>
        <label>
          IP 주소
          <input v-model="form.ip" placeholder="예: 10.0.0.10" />
        </label>
        <label>
          NAT IP
          <input v-model="form.natIp" placeholder="예: 203.0.113.10" />
        </label>

        <div class="section-label">구성 서버 선택</div>
        <div class="server-filter-wrap">
          <svg class="filter-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="#475569" stroke-width="1.3"/>
            <line x1="8.5" y1="8.5" x2="12" y2="12" stroke="#475569" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input
            v-model="serverFilter"
            class="server-filter-input"
            placeholder="서버 이름 또는 팀으로 검색..."
          />
          <button v-if="serverFilter" class="filter-clear" type="button" @click="serverFilter = ''">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="1" y1="1" x2="9" y2="9" stroke="#64748b" stroke-width="1.4" stroke-linecap="round"/>
              <line x1="9" y1="1" x2="1" y2="9" stroke="#64748b" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div class="server-checklist">
          <label
            v-for="server in filteredServers"
            :key="server.id"
            class="check-item"
          >
            <input
              type="checkbox"
              :value="server.id"
              v-model="form.memberServerIds"
            />
            <span class="check-name">{{ server.name }}</span>
            <span v-if="server.team" class="check-team">{{ server.team }}</span>
          </label>
          <p v-if="servers.length === 0" class="empty-list">추가된 서버가 없습니다</p>
          <p v-else-if="filteredServers.length === 0" class="empty-list">검색 결과가 없습니다</p>
        </div>
        <p class="selected-count">{{ form.memberServerIds.length }}개 서버 선택됨</p>

        <label>
          설명
          <textarea v-model="form.description" rows="2" placeholder="L7 로드밸런서 설명..." />
        </label>

        <div class="actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">취소</button>
          <button type="submit" class="btn-primary" :disabled="!form.name.trim() || isDuplicate">
            {{ isEdit ? '저장' : '추가' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { Server, L7Node } from '../types'

const props = defineProps<{
  node?: L7Node | null
  servers: Server[]
  takenNames: Set<string>
}>()

const emit = defineEmits<{
  close: []
  submit: [data: Omit<L7Node, 'id'>]
}>()

const isEdit = computed(() => !!props.node)
const isDuplicate = computed(() => {
  const trimmed = form.name.trim()
  if (!trimmed) return false
  if (props.node?.name === trimmed) return false
  return props.takenNames.has(trimmed)
})

const serverFilter = ref('')
const filteredServers = computed(() => {
  const q = serverFilter.value.trim().toLowerCase()
  if (!q) return props.servers
  return props.servers.filter(s =>
    s.name.toLowerCase().includes(q) || (s.team ?? '').toLowerCase().includes(q)
  )
})

const form = reactive<{ name: string; ip: string; natIp: string; memberServerIds: string[]; description: string }>({
  name: props.node?.name ?? '',
  ip: props.node?.ip ?? '',
  natIp: props.node?.natIp ?? '',
  memberServerIds: [...(props.node?.memberServerIds ?? [])],
  description: props.node?.description ?? '',
})

function onSubmit() {
  if (!form.name.trim()) return
  emit('submit', {
    nodeKind: 'l7',
    name: form.name.trim(),
    ip: form.ip,
    natIp: form.natIp,
    memberServerIds: form.memberServerIds,
    description: form.description,
  })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.modal {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 10px; padding: 24px; width: 420px;
  max-width: 90vw; max-height: 90vh; overflow-y: auto;
}
.modal h3 { margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #f1f5f9; }
form { display: flex; flex-direction: column; gap: 14px; }
label {
  display: flex; flex-direction: column; gap: 5px;
  font-size: 12px; color: #94a3b8; font-weight: 600;
}
input, textarea {
  background: #0f172a; border: 1px solid #334155;
  border-radius: 6px; padding: 8px 10px; color: #e2e8f0;
  font-size: 13px; outline: none;
}
input:focus, textarea:focus { border-color: #7c3aed; }
.input-error { border-color: #ef4444 !important; }
.error-msg { color: #ef4444; font-size: 11px; font-weight: 500; }
.section-label {
  font-size: 12px; font-weight: 600; color: #94a3b8;
}
.server-filter-wrap {
  display: flex; align-items: center; gap: 7px;
  background: #0f172a; border: 1px solid #334155;
  border-radius: 6px; padding: 6px 10px;
  transition: border-color 0.15s;
}
.server-filter-wrap:focus-within { border-color: #7c3aed; }
.filter-icon { flex-shrink: 0; }
.server-filter-input {
  flex: 1; background: none; border: none;
  color: #e2e8f0; font-size: 12px; outline: none; padding: 0;
}
.server-filter-input::placeholder { color: #475569; }
.filter-clear {
  background: none; border: none; padding: 0;
  cursor: pointer; display: flex; align-items: center;
  opacity: 0.7; transition: opacity 0.15s;
}
.filter-clear:hover { opacity: 1; }
.server-checklist {
  background: #0f172a; border: 1px solid #334155;
  border-radius: 6px; padding: 6px 0;
  max-height: 200px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 0;
}
.check-item {
  display: flex; flex-direction: row !important; align-items: center;
  gap: 8px; padding: 7px 12px; cursor: pointer;
  font-size: 13px; font-weight: 400; color: #cbd5e1;
  transition: background 0.12s;
}
.check-item:hover { background: #1e293b; }
.check-item input[type="checkbox"] {
  width: 14px; height: 14px; padding: 0;
  cursor: pointer; accent-color: #7c3aed; flex-shrink: 0;
  background: transparent; border: none; outline: none;
}
.check-name { flex: 1; }
.check-team { font-size: 11px; color: #475569; }
.empty-list { padding: 10px 12px; color: #475569; font-size: 12px; margin: 0; }
.selected-count { font-size: 11px; color: #7c3aed; margin: -6px 0; }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
.btn-primary {
  background: #7c3aed; color: #fff; border: none;
  border-radius: 6px; padding: 8px 18px; font-size: 13px; cursor: pointer; font-weight: 600;
}
.btn-primary:hover:not(:disabled) { background: #6d28d9; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: #334155; color: #e2e8f0; border: none;
  border-radius: 6px; padding: 8px 18px; font-size: 13px; cursor: pointer;
}
.btn-secondary:hover { background: #475569; }
</style>
