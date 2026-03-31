<template>
  <div class="modal-backdrop" @mousedown.self="backdropDown = true" @mouseup.self="backdropDown && $emit('close')" @mouseup="backdropDown = false">
    <div class="modal">
      <h3>{{ isEdit ? t('modals.external.editTitle') : t('modals.external.addTitle') }}</h3>
      <form @submit.prevent="onSubmit">
        <label>
          {{ t('modals.external.name') }}
          <input v-model="form.name" required :placeholder="t('modals.external.namePlaceholder')" :class="{ 'input-error': isDuplicate }" />
          <span v-if="isDuplicate" class="error-msg">{{ t('modals.server.duplicateName') }}</span>
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.hasFirewall" />
          {{ t('modals.external.firewall') }}
        </label>
        <label v-if="form.hasFirewall">
          {{ t('modals.external.firewallUrl') }}
          <input
            v-model="form.firewallUrl"
            type="url"
            placeholder="https://firewall.example.com/request/..."
          />
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.hasWhitelist" />
          {{ t('modals.external.whitelist') }}
        </label>

        <div class="section-row">
          <span class="section-label">{{ t('modals.external.contacts') }}</span>
          <button type="button" class="btn-add-contact" @click="addContact">{{ t('modals.external.addContact') }}</button>
        </div>

        <div class="contacts-list">
          <div v-for="(contact, idx) in form.contacts" :key="idx" class="contact-item">
            <div class="contact-row">
              <input v-model="contact.name" :placeholder="t('modals.external.contactName')" class="contact-name" />
              <button type="button" class="btn-remove" @click="removeContact(idx)" :title="t('common.delete')">✕</button>
            </div>
            <input
              :value="contact.phone"
              @input="onPhoneInput(idx, $event)"
              @blur="onContactBlur(idx)"
              :placeholder="t('modals.external.contactPhone')"
              :class="{ 'input-error': contactErrors[idx]?.phone }"
            />
            <span v-if="contactErrors[idx]?.phone" class="error-msg">{{ contactErrors[idx].phone }}</span>
            <input
              v-model="contact.email"
              type="text"
              :placeholder="t('modals.external.contactEmail')"
              @blur="onContactBlur(idx)"
              :class="{ 'input-error': contactErrors[idx]?.email }"
            />
            <span v-if="contactErrors[idx]?.email" class="error-msg">{{ contactErrors[idx].email }}</span>
          </div>
          <p v-if="form.contacts.length === 0" class="no-contacts">{{ t('modals.external.noContacts') }}</p>
        </div>

        <label>{{ t('modals.external.description') }}<textarea v-model="form.description" rows="2" :placeholder="t('modals.external.descPlaceholder')" /></label>

        <div class="actions">
          <button type="button" class="btn-ghost" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button type="submit" class="btn-primary btn-node-ext" :disabled="!form.name.trim() || isDuplicate || hasAnyContactError">{{ isEdit ? t('common.save') : t('common.add') }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ExternalServiceNode, ExternalContact } from '../types'

const { t } = useI18n()
import { graphApi } from '../api/graphApi'
import { useContactValidation } from '../composables/useContactValidation'
import type { ContactErrors } from '../composables/useContactValidation'

const backdropDown = ref(false)

const props = defineProps<{ node?: ExternalServiceNode | null; takenNames: Set<string>; currentProjectId: string }>()
const emit = defineEmits<{ close: []; submit: [data: Omit<ExternalServiceNode, 'id'>] }>()
const isEdit = computed(() => !!props.node)
const isDuplicate = computed(() => {
  const trimmed = form.name.trim()
  if (!trimmed) return false
  if (props.node?.name === trimmed) return false
  return props.takenNames.has(trimmed)
})

const { validateContact, hasErrors, formatPhone, sanitizePhone } = useContactValidation()
const contactErrors = ref<ContactErrors[]>([])

const form = reactive<{
  name: string
  hasFirewall: boolean; firewallUrl: string; hasWhitelist: boolean
  contacts: ExternalContact[]; description: string
}>({
  name: props.node?.name ?? '',
  hasFirewall: props.node?.hasFirewall ?? false,
  firewallUrl: props.node?.firewallUrl ?? '',
  hasWhitelist: props.node?.hasWhitelist ?? false,
  contacts: [],
  description: props.node?.description ?? '',
})

onMounted(async () => {
  if (props.node && props.currentProjectId) {
    try {
      const res = await graphApi.getNodeContacts(props.currentProjectId, props.node.id)
      form.contacts = res.data.contacts.map(c => ({ ...c }))
      contactErrors.value = form.contacts.map(() => ({}))
    } catch {
      // 로드 실패 시 빈 배열 유지
    }
  }
})

function addContact() {
  form.contacts.push({ name: '', phone: '', email: '' })
  contactErrors.value.push({})
}
function removeContact(idx: number) {
  form.contacts.splice(idx, 1)
  contactErrors.value.splice(idx, 1)
}

function onPhoneInput(idx: number, event: Event) {
  const digits = sanitizePhone((event.target as HTMLInputElement).value)
  const formatted = formatPhone(digits)
  form.contacts[idx].phone = formatted
  ;(event.target as HTMLInputElement).value = formatted
  if (contactErrors.value[idx]) contactErrors.value[idx].phone = undefined
}

function onContactBlur(idx: number) {
  contactErrors.value[idx] = validateContact(form.contacts[idx].phone, form.contacts[idx].email)
}

const hasAnyContactError = computed(() => contactErrors.value.some(hasErrors))

function onSubmit() {
  if (!form.name.trim()) return
  contactErrors.value = form.contacts.map(c => validateContact(c.phone, c.email))
  if (hasAnyContactError.value) return
  emit('submit', {
    nodeKind: 'external',
    name: form.name.trim(),
    hasFirewall: form.hasFirewall,
    firewallUrl: form.hasFirewall ? form.firewallUrl : '',
    hasWhitelist: form.hasWhitelist,
    contacts: form.contacts
      .filter(c => c.name.trim())
      .map(c => ({ ...c, phone: c.phone ? c.phone.replace(/\D/g, '') : c.phone })),
    description: form.description,
  })
}
</script>

<style scoped>
.modal-backdrop { position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:200; }
.modal { background:var(--bg-surface);border:1px solid var(--border-default);border-radius:10px;padding:24px;width:420px;max-width:90vw;max-height:90vh;overflow-y:auto; }
.modal h3 { margin:0 0 20px;font-size: var(--text-lg);font-weight:700;color:var(--text-primary); }
form { display:flex;flex-direction:column;gap:14px; }
label { display:flex;flex-direction:column;gap:5px;font-size: var(--text-xs);color:var(--text-tertiary);font-weight:600; }
input,textarea { background:var(--bg-base);border:1px solid var(--border-default);border-radius:6px;padding:8px 10px;color:var(--text-secondary);font-size: var(--text-sm);outline:none; }
input:focus,textarea:focus { border-color:var(--node-ext-color); }
.input-error { border-color:#ef4444!important; }
.error-msg { color:#ef4444;font-size: var(--text-xs);font-weight:500; }
.checkbox-label { flex-direction:row!important;align-items:center;gap:8px;cursor:pointer; }
.checkbox-label input[type="checkbox"] { width:15px;height:15px;padding:0;cursor:pointer;accent-color:var(--node-ext-color);flex-shrink:0; }
.section-row { display:flex;align-items:center;justify-content:space-between; }
.section-label { font-size: var(--text-xs);font-weight:600;color:var(--text-tertiary); }
.btn-add-contact { background:#14532d;color:var(--color-success-lighter);border:1px solid var(--node-ext-color);border-radius:5px;padding:3px 8px;font-size: var(--text-xs);cursor:pointer;font-weight:600; }
.btn-add-contact:hover { background:#166534; }
.contacts-list { display:flex;flex-direction:column;gap:8px; }
.contact-item { background:var(--bg-base);border:1px solid var(--border-default);border-radius:6px;padding:10px;display:flex;flex-direction:column;gap:6px; }
.contact-row { display:flex;gap:6px;align-items:center; }
.contact-name { flex:1; }
.btn-remove { background:none;border:none;color:var(--border-strong);cursor:pointer;font-size: var(--text-sm);padding:2px 4px;border-radius:3px;flex-shrink:0; }
.btn-remove:hover { color:#ef4444;background:#3f1f1f; }
.no-contacts { color:var(--border-strong);font-size: var(--text-xs);text-align:center;margin:4px 0; }
.actions { display:flex;gap:8px;justify-content:flex-end;margin-top:4px; }
</style>
