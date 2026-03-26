<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ isEdit ? '인프라 노드 수정' : '인프라 노드 추가' }}</h3>
      <form @submit.prevent="onSubmit">
        <label>
          이름 *
          <input v-model="form.name" required placeholder="예: user-db-prod" :class="{ 'input-error': isDuplicate }" />
          <span v-if="isDuplicate" class="error-msg">이미 사용 중인 이름입니다</span>
        </label>
        <label>인프라 유형
          <CustomSelect v-model="form.infraType" :options="infraTypeOptions" />
        </label>
        <label>Host<input v-model="form.host" placeholder="예: db.internal.com" /></label>
        <label>Port<input v-model="form.port" placeholder="예: 5432" /></label>
        <label>설명<textarea v-model="form.description" rows="2" placeholder="인프라 설명..." /></label>
        <div class="actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">취소</button>
          <button type="submit" class="btn-primary" :disabled="!form.name.trim() || isDuplicate">{{ isEdit ? '저장' : '추가' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { InfraNode } from '../types'
import CustomSelect from './CustomSelect.vue'

const infraTypeOptions = [
  { value: 'MySQL', label: 'MySQL' },
  { value: 'PostgreSQL', label: 'PostgreSQL' },
  { value: 'MongoDB', label: 'MongoDB' },
  { value: 'Redis', label: 'Redis' },
  { value: 'Oracle', label: 'Oracle' },
  { value: 'MSSQL', label: 'MSSQL' },
  { value: 'RabbitMQ', label: 'RabbitMQ' },
  { value: 'Kafka', label: 'Kafka' },
  { value: 'SQS', label: 'SQS' },
  { value: 'Other', label: 'Other' },
]

const INFRA_DEFAULT_PORTS: Record<string, string> = {
  MySQL: '3306',
  PostgreSQL: '5432',
  MongoDB: '27017',
  Redis: '6379',
  Oracle: '1521',
  MSSQL: '1433',
  RabbitMQ: '5672',
  Kafka: '9092',
  SQS: '',
  Other: '',
}

const props = defineProps<{ node?: InfraNode | null; takenNames: Set<string> }>()
const emit = defineEmits<{ close: []; submit: [data: Omit<InfraNode, 'id'>] }>()
const isEdit = computed(() => !!props.node)
const isDuplicate = computed(() => {
  const trimmed = form.name.trim()
  if (!trimmed) return false
  if (props.node?.name === trimmed) return false
  return props.takenNames.has(trimmed)
})

const knownPorts = new Set(Object.values(INFRA_DEFAULT_PORTS).filter(Boolean))

const form = reactive<{ name: string; infraType: string; host: string; port: string; description: string }>({
  name: props.node?.name ?? '',
  infraType: props.node?.infraType ?? 'MySQL',
  host: props.node?.host ?? '',
  port: props.node?.port ?? (isEdit.value ? '' : INFRA_DEFAULT_PORTS['MySQL']),
  description: props.node?.description ?? '',
})

watch(() => form.infraType, (newType) => {
  if (!isEdit.value || !form.port || knownPorts.has(form.port)) {
    form.port = INFRA_DEFAULT_PORTS[newType] ?? ''
  }
})

function onSubmit() {
  if (!form.name.trim()) return
  emit('submit', {
    nodeKind: 'infra',
    name: form.name.trim(),
    infraType: form.infraType,
    host: form.host,
    port: form.port,
    description: form.description,
  })
}
</script>

<style scoped>
.modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200; }
.modal { background:#1e293b;border:1px solid #334155;border-radius:10px;padding:24px;width:380px;max-width:90vw;max-height:90vh;overflow-y:auto; }
.modal h3 { margin:0 0 20px;font-size:16px;font-weight:700;color:#f1f5f9; }
form { display:flex;flex-direction:column;gap:14px; }
label { display:flex;flex-direction:column;gap:5px;font-size:12px;color:#94a3b8;font-weight:600; }
input,textarea { background:#0f172a;border:1px solid #334155;border-radius:6px;padding:8px 10px;color:#e2e8f0;font-size:13px;outline:none; }
input:focus,textarea:focus { border-color:#06b6d4; }
.input-error { border-color:#ef4444!important; }
.error-msg { color:#ef4444;font-size:11px;font-weight:500; }
.actions { display:flex;gap:8px;justify-content:flex-end;margin-top:4px; }
.btn-primary { background:#0e7490;color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size:13px;cursor:pointer;font-weight:600; }
.btn-primary:hover:not(:disabled) { background:#0891b2; }
.btn-primary:disabled { opacity:0.5;cursor:not-allowed; }
.btn-secondary { background:#334155;color:#e2e8f0;border:none;border-radius:6px;padding:8px 18px;font-size:13px;cursor:pointer; }
.btn-secondary:hover { background:#475569; }
</style>
