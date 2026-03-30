<template>
  <div class="modal-backdrop" @mousedown.self="backdropDown = true" @mouseup.self="backdropDown && $emit('close')" @mouseup="backdropDown = false">
    <div class="modal">
      <h3>{{ isEdit ? '서버 수정' : '서버 추가' }}</h3>
      <form @submit.prevent="onSubmit">
        <label>
          이름 *
          <input v-model="form.name" required placeholder="예: auth-service" :class="{ 'input-error': isDuplicate }" />
          <span v-if="isDuplicate" class="error-msg">이미 사용 중인 이름입니다</span>
        </label>
        <label>
          팀
          <CustomCombobox
            v-model="form.team"
            :suggestions="teams"
            placeholder="팀 이름 입력 또는 선택"
          />
        </label>
        <div class="ip-section">
          <span class="ip-section-label">내부 IP</span>
          <div v-for="(_, i) in form.internalIps" :key="i" class="ip-row">
            <IpInput v-model="form.internalIps[i]" />
            <button type="button" class="btn-ip-remove" @click="form.internalIps.splice(i, 1)">✕</button>
          </div>
          <button type="button" class="btn-ip-add" @click="form.internalIps.push('')">+ 추가</button>
        </div>
        <div class="ip-section">
          <span class="ip-section-label">NAT IP</span>
          <div v-for="(_, i) in form.natIps" :key="i" class="ip-row">
            <IpInput v-model="form.natIps[i]" />
            <button type="button" class="btn-ip-remove" @click="form.natIps.splice(i, 1)">✕</button>
          </div>
          <button type="button" class="btn-ip-add" @click="form.natIps.push('')">+ 추가</button>
        </div>
        <label>
          설명
          <textarea v-model="form.description" rows="3" placeholder="서버 설명..." />
        </label>
        <div class="actions">
          <button type="button" class="btn-ghost" @click="$emit('close')">취소</button>
          <button type="submit" class="btn-primary" :disabled="isDuplicate">{{ isEdit ? '저장' : '추가' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { Server } from '../types'


import IpInput from './IpInput.vue'
import CustomCombobox from './CustomCombobox.vue'

const backdropDown = ref(false)

const props = defineProps<{
  server?: Server | null
  teams: string[]
  takenNames: Set<string>
}>()

const emit = defineEmits<{
  close: []
  submit: [data: Omit<Server, 'id'>]
}>()

const isEdit = computed(() => !!props.server)
const isDuplicate = computed(() => {
  const trimmed = form.name.trim()
  if (!trimmed) return false
  if (props.server?.name === trimmed) return false
  return props.takenNames.has(trimmed)
})

const form = reactive<Omit<Server, 'id'> & { internalIps: string[]; natIps: string[] }>({
  name: props.server?.name ?? '',
  team: props.server?.team ?? '',
  internalIps: props.server?.internalIps ? [...props.server.internalIps] : [],
  natIps: props.server?.natIps ? [...props.server.natIps] : [],
  description: props.server?.description ?? '',
})

function isEmptyIp(ip: string): boolean {
  const trimmed = ip.trim()
  if (!trimmed) return true
  return /^[0.:]+$/.test(trimmed)
}

function onSubmit() {
  emit('submit', {
    ...form,
    internalIps: form.internalIps.filter(ip => !isEmptyIp(ip)),
    natIps: form.natIps.filter(ip => !isEmptyIp(ip)),
  })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 10px;
  padding: 24px;
  width: 380px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}
.modal h3 {
  margin: 0 0 20px;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
}
form { display: flex; flex-direction: column; gap: 14px; }
label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
  font-weight: 600;
}
input, select, textarea {
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 8px 10px;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  outline: none;
}
input:focus, select:focus, textarea:focus { border-color: var(--accent-focus); }
.input-error { border-color: #ef4444 !important; }
.error-msg { color: #ef4444; font-size: var(--text-xs); font-weight: 500; }
.checkbox-label {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  padding: 0;
  cursor: pointer;
  accent-color: var(--accent-focus);
}
/* datalist 드롭다운 스타일 */
input[list] { cursor: pointer; }
.ip-section { display: flex; flex-direction: column; gap: 6px; }
.ip-section-label { font-size: var(--text-xs); color: var(--text-tertiary); font-weight: 600; }
.ip-row { display: flex; align-items: center; gap: 6px; }
.btn-ip-remove {
  background: none; border: none; color: var(--border-strong); cursor: pointer;
  font-size: var(--text-xs); padding: 4px 6px; border-radius: 4px; flex-shrink: 0;
}
.btn-ip-remove:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
.btn-ip-add {
  background: none; border: 1px dashed var(--border-default); border-radius: 5px;
  color: var(--text-disabled); font-size: var(--text-xs); padding: 4px 10px; cursor: pointer;
  align-self: flex-start;
}
.btn-ip-add:hover { border-color: var(--accent-soft); color: var(--accent-light); }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
