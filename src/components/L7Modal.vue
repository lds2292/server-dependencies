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

        <div class="section-label">구성 서버 선택</div>
        <div class="server-checklist">
          <label
            v-for="server in servers"
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
import { reactive, computed } from 'vue'
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

const form = reactive<{ name: string; ip: string; memberServerIds: string[]; description: string }>({
  name: props.node?.name ?? '',
  ip: props.node?.ip ?? '',
  memberServerIds: [...(props.node?.memberServerIds ?? [])],
  description: props.node?.description ?? '',
})

function onSubmit() {
  if (!form.name.trim()) return
  emit('submit', {
    nodeKind: 'l7',
    name: form.name.trim(),
    ip: form.ip,
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
