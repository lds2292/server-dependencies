<template>
  <div class="modal-backdrop" @mousedown.self="backdropDown = true" @mouseup.self="backdropDown && $emit('close')" @mouseup="backdropDown = false">
    <div class="modal">
      <h3>
        <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" />
        </svg>
        {{ isEdit ? 'DNS 수정' : 'DNS 추가' }}
      </h3>
      <form @submit.prevent="onSubmit">
        <label>
          이름 *
          <input v-model="form.name" required placeholder="api.example.com" :class="{ 'input-error': isDuplicate || hasSpaces }" />
          <span v-if="isDuplicate" class="error-msg">이미 사용 중인 이름입니다</span>
          <span v-if="hasSpaces" class="warning-msg">이름에 공백이 포함되어 있습니다</span>
        </label>
        <label>DNS 유형
          <CustomSelect v-model="form.dnsType" :options="dnsTypeOptions" />
        </label>
        <label>레코드 값
          <input v-model="form.recordValue" :placeholder="recordValuePlaceholder" />
        </label>
        <label>TTL
          <input v-model.number="form.ttl" type="number" placeholder="300" />
        </label>
        <label>Provider
          <CustomSelect v-model="form.provider" :options="providerOptions" />
        </label>
        <label>설명<textarea v-model="form.description" rows="2" placeholder="DNS 레코드 설명..." /></label>
        <div class="actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">취소</button>
          <button type="submit" class="btn-primary" :disabled="!form.name.trim() || isDuplicate">{{ isEdit ? '저장' : '추가' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { DnsNode } from '../types'
import CustomSelect from './CustomSelect.vue'

const dnsTypeOptions = [
  { value: 'A', label: 'A' },
  { value: 'CNAME', label: 'CNAME' },
  { value: 'AAAA', label: 'AAAA' },
  { value: 'SRV', label: 'SRV' },
  { value: 'MX', label: 'MX' },
  { value: 'TXT', label: 'TXT' },
]

const providerOptions = [
  { value: '', label: '(없음)' },
  { value: 'Route53', label: 'Route53' },
  { value: 'CloudFlare', label: 'CloudFlare' },
  { value: 'Google Cloud DNS', label: 'Google Cloud DNS' },
  { value: 'Gabia', label: 'Gabia' },
  { value: 'Other', label: 'Other' },
]

const RECORD_VALUE_PLACEHOLDERS: Record<string, string> = {
  A: '192.168.1.1',
  CNAME: 'origin.example.com',
  AAAA: '2001:db8::1',
  SRV: '0 5 5060 sip.example.com',
  MX: '10 mail.example.com',
  TXT: 'v=spf1 include:...',
}

const backdropDown = ref(false)
const props = defineProps<{ node?: DnsNode | null; takenNames: Set<string> }>()
const emit = defineEmits<{ close: []; submit: [data: Omit<DnsNode, 'id'>] }>()
const isEdit = computed(() => !!props.node)
const isDuplicate = computed(() => {
  const trimmed = form.name.trim()
  if (!trimmed) return false
  if (props.node?.name === trimmed) return false
  return props.takenNames.has(trimmed)
})
const hasSpaces = computed(() => form.name.includes(' '))
const recordValuePlaceholder = computed(() => RECORD_VALUE_PLACEHOLDERS[form.dnsType] ?? '')

const form = reactive<{ name: string; dnsType: string; recordValue: string; ttl: number; provider: string; description: string }>({
  name: props.node?.name ?? '',
  dnsType: props.node?.dnsType ?? 'A',
  recordValue: props.node?.recordValue ?? '',
  ttl: props.node?.ttl ?? 300,
  provider: props.node?.provider ?? '',
  description: props.node?.description ?? '',
})

function onSubmit() {
  if (!form.name.trim()) return
  emit('submit', {
    nodeKind: 'dns',
    name: form.name.trim(),
    dnsType: form.dnsType,
    recordValue: form.recordValue,
    ttl: form.ttl,
    provider: form.provider,
    description: form.description,
  })
}
</script>

<style scoped>
.modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200; }
.modal { background:var(--bg-surface);border:1px solid var(--border-default);border-radius:10px;padding:24px;width:380px;max-width:90vw;max-height:90vh;overflow-y:auto; }
.modal h3 { margin:0 0 20px;font-size: var(--text-lg);font-weight:700;color:var(--text-primary);display:flex;align-items:center;gap:8px; }
.header-icon { width:20px;height:20px;color:var(--node-dns-color);flex-shrink:0; }
form { display:flex;flex-direction:column;gap:14px; }
label { display:flex;flex-direction:column;gap:5px;font-size: var(--text-xs);color:var(--text-tertiary);font-weight:600; }
input,textarea { background:var(--bg-base);border:1px solid var(--border-default);border-radius:6px;padding:8px 10px;color:var(--text-secondary);font-size: var(--text-sm);outline:none; }
input:focus,textarea:focus { border-color:var(--accent-focus); }
.input-error { border-color:#ef4444!important; }
.error-msg { color:#ef4444;font-size: var(--text-xs);font-weight:500; }
.warning-msg { color:var(--node-dns-color);font-size: var(--text-xs);font-weight:500; }
.actions { display:flex;gap:8px;justify-content:flex-end;margin-top:4px; }
.btn-primary { background:var(--accent-primary);color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size: var(--text-sm);cursor:pointer;font-weight:600; }
.btn-primary:hover:not(:disabled) { background:var(--accent-hover); }
.btn-primary:disabled { opacity:0.5;cursor:not-allowed; }
.btn-secondary { background:var(--border-default);color:var(--text-secondary);border:none;border-radius:6px;padding:8px 18px;font-size: var(--text-sm);cursor:pointer; }
.btn-secondary:hover { background:var(--border-strong); }
</style>
