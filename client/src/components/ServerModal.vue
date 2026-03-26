<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
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
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.hasFirewall" />
          방화벽 오픈 필요
        </label>
        <label v-if="form.hasFirewall">
          방화벽 오픈요청 URL
          <input
            v-model="form.firewallUrl"
            type="url"
            placeholder="https://firewall.example.com/request/..."
          />
        </label>
        <div class="actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">취소</button>
          <button type="submit" class="btn-primary" :disabled="isDuplicate">{{ isEdit ? '저장' : '추가' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { Server } from '../types'


import IpInput from './IpInput.vue'
import CustomCombobox from './CustomCombobox.vue'

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
  hasFirewall: props.server?.hasFirewall ?? false,
  firewallUrl: props.server?.firewallUrl ?? '',
})

function onSubmit() {
  emit('submit', { ...form })
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
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 24px;
  width: 380px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
}
.modal h3 {
  margin: 0 0 20px;
  font-size: 16px;
  font-weight: 700;
  color: #f1f5f9;
}
form { display: flex; flex-direction: column; gap: 14px; }
label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  color: #94a3b8;
  font-weight: 600;
}
input, select, textarea {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 10px;
  color: #e2e8f0;
  font-size: 13px;
  outline: none;
}
input:focus, select:focus, textarea:focus { border-color: #3b82f6; }
.input-error { border-color: #ef4444 !important; }
.error-msg { color: #ef4444; font-size: 11px; font-weight: 500; }
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
  accent-color: #3b82f6;
}
/* datalist 드롭다운 스타일 */
input[list] { cursor: pointer; }
.ip-section { display: flex; flex-direction: column; gap: 6px; }
.ip-section-label { font-size: 12px; color: #94a3b8; font-weight: 600; }
.ip-row { display: flex; align-items: center; gap: 6px; }
.btn-ip-remove {
  background: none; border: none; color: #475569; cursor: pointer;
  font-size: 12px; padding: 4px 6px; border-radius: 4px; flex-shrink: 0;
}
.btn-ip-remove:hover { color: #ef4444; background: rgba(239,68,68,0.1); }
.btn-ip-add {
  background: none; border: 1px dashed #334155; border-radius: 5px;
  color: #64748b; font-size: 11px; padding: 4px 10px; cursor: pointer;
  align-self: flex-start;
}
.btn-ip-add:hover { border-color: #60a5fa; color: #93c5fd; }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
.btn-primary {
  background: #2563eb; color: #fff; border: none;
  border-radius: 6px; padding: 8px 18px; font-size: 13px;
  cursor: pointer; font-weight: 600;
}
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary {
  background: #334155; color: #e2e8f0; border: none;
  border-radius: 6px; padding: 8px 18px; font-size: 13px; cursor: pointer;
}
.btn-secondary:hover { background: #475569; }
</style>
