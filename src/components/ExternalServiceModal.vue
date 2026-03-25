<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ isEdit ? '외부서비스 수정' : '외부서비스 추가' }}</h3>
      <form @submit.prevent="onSubmit">
        <label>서비스명 *<input v-model="form.name" required placeholder="예: Stripe API" /></label>
        <label>환경 *<CustomSelect v-model="form.environment" :options="envOptions" /></label>

        <label class="checkbox-label">
          <input type="checkbox" v-model="form.hasFirewall" />
          방화벽 오픈 필요
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.hasWhitelist" />
          화이트리스트 요청 필요
        </label>

        <div class="section-row">
          <span class="section-label">담당자 정보</span>
          <button type="button" class="btn-add-contact" @click="addContact">+ 담당자 추가</button>
        </div>

        <div class="contacts-list">
          <div v-for="(contact, idx) in form.contacts" :key="idx" class="contact-item">
            <div class="contact-row">
              <input v-model="contact.name" placeholder="담당자명 *" class="contact-name" />
              <button type="button" class="btn-remove" @click="removeContact(idx)" title="삭제">✕</button>
            </div>
            <input v-model="contact.phone" placeholder="연락처 (예: 010-1234-5678)" />
            <input v-model="contact.email" type="email" placeholder="이메일" />
          </div>
          <p v-if="form.contacts.length === 0" class="no-contacts">담당자가 없습니다</p>
        </div>

        <label>설명<textarea v-model="form.description" rows="2" placeholder="외부서비스 설명..." /></label>

        <div class="actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">취소</button>
          <button type="submit" class="btn-primary" :disabled="!form.name.trim()">{{ isEdit ? '저장' : '추가' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { ExternalServiceNode, ExternalContact, Environment } from '../types'
import CustomSelect from './CustomSelect.vue'

const envOptions = [
  { value: 'prod', label: 'Production' },
  { value: 'staging', label: 'Staging' },
  { value: 'dev', label: 'Develop' },
]

const props = defineProps<{ node?: ExternalServiceNode | null }>()
const emit = defineEmits<{ close: []; submit: [data: Omit<ExternalServiceNode, 'id'>] }>()
const isEdit = computed(() => !!props.node)

const form = reactive<{
  name: string; environment: Environment
  hasFirewall: boolean; hasWhitelist: boolean
  contacts: ExternalContact[]; description: string
}>({
  name: props.node?.name ?? '',
  environment: props.node?.environment ?? 'prod',
  hasFirewall: props.node?.hasFirewall ?? false,
  hasWhitelist: props.node?.hasWhitelist ?? false,
  contacts: props.node?.contacts ? props.node.contacts.map(c => ({ ...c })) : [],
  description: props.node?.description ?? '',
})

function addContact() {
  form.contacts.push({ name: '', phone: '', email: '' })
}
function removeContact(idx: number) {
  form.contacts.splice(idx, 1)
}

function onSubmit() {
  if (!form.name.trim()) return
  emit('submit', {
    nodeKind: 'external',
    name: form.name.trim(),
    environment: form.environment,
    hasFirewall: form.hasFirewall,
    hasWhitelist: form.hasWhitelist,
    contacts: form.contacts.filter(c => c.name.trim()),
    description: form.description,
  })
}
</script>

<style scoped>
.modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200; }
.modal { background:#1e293b;border:1px solid #334155;border-radius:10px;padding:24px;width:420px;max-width:90vw;max-height:90vh;overflow-y:auto; }
.modal h3 { margin:0 0 20px;font-size:16px;font-weight:700;color:#f1f5f9; }
form { display:flex;flex-direction:column;gap:14px; }
label { display:flex;flex-direction:column;gap:5px;font-size:12px;color:#94a3b8;font-weight:600; }
input,textarea { background:#0f172a;border:1px solid #334155;border-radius:6px;padding:8px 10px;color:#e2e8f0;font-size:13px;outline:none; }
input:focus,textarea:focus { border-color:#16a34a; }
.checkbox-label { flex-direction:row!important;align-items:center;gap:8px;cursor:pointer; }
.checkbox-label input[type="checkbox"] { width:15px;height:15px;padding:0;cursor:pointer;accent-color:#16a34a;flex-shrink:0; }
.section-row { display:flex;align-items:center;justify-content:space-between; }
.section-label { font-size:12px;font-weight:600;color:#94a3b8; }
.btn-add-contact { background:#14532d;color:#86efac;border:1px solid #16a34a;border-radius:5px;padding:3px 8px;font-size:11px;cursor:pointer;font-weight:600; }
.btn-add-contact:hover { background:#166534; }
.contacts-list { display:flex;flex-direction:column;gap:8px; }
.contact-item { background:#0f172a;border:1px solid #334155;border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:6px; }
.contact-row { display:flex;gap:6px;align-items:center; }
.contact-name { flex:1; }
.btn-remove { background:none;border:none;color:#475569;cursor:pointer;font-size:13px;padding:2px 4px;border-radius:3px;flex-shrink:0; }
.btn-remove:hover { color:#ef4444;background:#3f1f1f; }
.no-contacts { color:#475569;font-size:12px;text-align:center;margin:4px 0; }
.actions { display:flex;gap:8px;justify-content:flex-end;margin-top:4px; }
.btn-primary { background:#16a34a;color:#fff;border:none;border-radius:6px;padding:8px 18px;font-size:13px;cursor:pointer;font-weight:600; }
.btn-primary:hover:not(:disabled) { background:#15803d; }
.btn-primary:disabled { opacity:0.5;cursor:not-allowed; }
.btn-secondary { background:#334155;color:#e2e8f0;border:none;border-radius:6px;padding:8px 18px;font-size:13px;cursor:pointer; }
.btn-secondary:hover { background:#475569; }
</style>
