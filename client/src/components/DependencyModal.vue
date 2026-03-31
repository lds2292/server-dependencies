<template>
  <div class="modal-backdrop" @mousedown.self="backdropDown = true" @mouseup.self="backdropDown && $emit('close')" @mouseup="backdropDown = false">
    <div class="modal">
      <h3>{{ editingDep ? t('modals.dep.editTitle') : t('modals.dep.addTitle') }}</h3>
      <form @submit.prevent="onSubmit">
        <label>
          {{ t('modals.dep.source') }}
          <CustomSelect
            v-model="form.source"
            :options="nodeOptions"
            :placeholder="t('modals.dep.selectNode')"
            :disabled="!!editingDep"
          />
        </label>
        <label>
          {{ t('modals.dep.target') }}
          <CustomSelect
            v-model="form.target"
            :options="targetOptions"
            :placeholder="t('modals.dep.selectNode')"
            :disabled="!!editingDep"
          />
        </label>
        <p v-if="form.source && form.source === form.target" class="error">
          {{ t('modals.dep.sameNodeError') }}
        </p>
        <p v-else-if="isDuplicate" class="error">
          {{ t('modals.dep.duplicateError') }}
        </p>
        <p v-else-if="isInfraSourceBlocked" class="error">
          {{ t('modals.dep.infraSourceError') }}
        </p>
        <p v-else-if="isDnsTargetBlocked" class="error">
          {{ t('modals.dep.dnsTargetError') }}
        </p>
        <p v-else-if="isL7MemberBlocked" class="error">
          {{ t('modals.dep.l7MemberError') }}
        </p>
        <label>
          {{ t('modals.dep.type') }}
          <CustomSelect v-model="form.type" :options="typeOptions" />
        </label>
        <label>
          {{ t('modals.dep.description') }}
          <input v-model="form.description" :placeholder="t('modals.dep.descPlaceholder')" />
        </label>
        <label class="checkbox-label">
          <input type="checkbox" v-model="form.hasFirewall" />
          {{ t('modals.dep.firewall') }}
        </label>
        <label v-if="form.hasFirewall">
          {{ t('modals.dep.firewallUrl') }}
          <input
            v-model="form.firewallUrl"
            type="url"
            placeholder="https://firewall.example.com/request/..."
          />
        </label>
        <div class="actions">
          <button type="button" class="btn-ghost" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="!form.source || !form.target || form.source === form.target || isDuplicate || isInfraSourceBlocked || isDnsTargetBlocked || isL7MemberBlocked"
          >
            {{ editingDep ? t('common.save') : t('common.add') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AnyNode, Dependency, DependencyType, L7Node } from '../types'
import CustomSelect from './CustomSelect.vue'

const { t } = useI18n()

const backdropDown = ref(false)

const props = defineProps<{
  nodes: AnyNode[]
  defaultSource?: string
  defaultTarget?: string
  existingDependencies?: Dependency[]
  editingDep?: Dependency
}>()

const emit = defineEmits<{
  close: []
  submit: [data: Omit<Dependency, 'id'>]
  update: [id: string, data: Partial<Omit<Dependency, 'id' | 'source' | 'target'>>]
}>()

const editingDep = computed(() => props.editingDep)

const nodeOptions = computed(() =>
  props.nodes.map(n => ({
    value: n.id,
    label: n.nodeKind === 'l7' ? `[L7] ${n.name}` : n.nodeKind === 'infra' ? `[INFRA] ${n.name}` : n.nodeKind === 'dns' ? `[DNS] ${n.name}` : n.name,
  }))
)

const sourceNode = computed(() => props.nodes.find(n => n.id === form.source))

const targetOptions = computed(() => {
  if (sourceNode.value?.nodeKind === 'dns') {
    return props.nodes
      .filter(n => n.nodeKind !== 'infra')
      .map(n => ({
        value: n.id,
        label: n.nodeKind === 'l7' ? `[L7] ${n.name}` : n.nodeKind === 'dns' ? `[DNS] ${n.name}` : n.name,
      }))
  }
  return nodeOptions.value
})

const isInfraSourceBlocked = computed(() => {
  if (!form.source) return false
  return sourceNode.value?.nodeKind === 'infra'
})

const isDnsTargetBlocked = computed(() => {
  if (!form.source || !form.target) return false
  const target = props.nodes.find(n => n.id === form.target)
  return target?.nodeKind === 'dns'
})

const isL7MemberBlocked = computed(() => {
  if (!form.source || !form.target) return false
  const l7Nodes = props.nodes.filter((n): n is L7Node => n.nodeKind === 'l7')
  for (const l7 of l7Nodes) {
    const members = l7.memberServerIds
    if (l7.id === form.source && members.includes(form.target)) return true
    if (l7.id === form.target && members.includes(form.source)) return true
  }
  return false
})

const typeOptions = [
  { value: 'http', label: 'HTTP' },
  { value: 'tcp', label: 'TCP/IP' },
  { value: 'websocket', label: 'WebSocket' },
  { value: 'other', label: 'Other' },
]

function defaultTypeForTarget(targetId: string): DependencyType {
  const target = props.nodes.find(n => n.id === targetId)
  if (!target) return 'http'
  if (target.nodeKind === 'infra') return 'tcp'
  if (target.nodeKind === 'dns') return 'dns'
  return 'http'
}

function resolveInitialTarget(): string {
  return props.defaultTarget ?? ''
}

const form = reactive({
  source: props.editingDep?.source ?? props.defaultSource ?? '',
  target: props.editingDep?.target ?? resolveInitialTarget(),
  type: (props.editingDep?.type ?? defaultTypeForTarget(resolveInitialTarget())) as DependencyType,
  description: props.editingDep?.description ?? '',
  hasFirewall: props.editingDep?.hasFirewall ?? false,
  firewallUrl: props.editingDep?.firewallUrl ?? '',
})

watch(() => form.target, (targetId) => {
  form.type = defaultTypeForTarget(targetId)
})

watch(() => form.source, () => {
  const isTargetStillValid = targetOptions.value.some(o => o.value === form.target)
  if (!isTargetStillValid) form.target = ''
})

const isDuplicate = computed(() =>
  !props.editingDep &&
  !!form.source && !!form.target && form.source !== form.target &&
  (props.existingDependencies ?? []).some(d => d.source === form.source && d.target === form.target)
)

function onSubmit() {
  if (form.source === form.target || isDuplicate.value || isInfraSourceBlocked.value || isDnsTargetBlocked.value || isL7MemberBlocked.value) return
  const firewallUrl = form.hasFirewall ? form.firewallUrl : ''
  if (props.editingDep) {
    emit('update', props.editingDep.id, {
      type: form.type,
      description: form.description,
      hasFirewall: form.hasFirewall,
      firewallUrl,
    })
  } else {
    emit('submit', { ...form, firewallUrl })
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.modal {
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 10px; padding: 24px; width: 360px; max-width: 90vw;
}
.modal h3 { margin: 0 0 20px; font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); }
form { display: flex; flex-direction: column; gap: 14px; }
label { display: flex; flex-direction: column; gap: 5px; font-size: var(--text-xs); color: var(--text-tertiary); font-weight: 600; }
input { background: var(--bg-base); border: 1px solid var(--border-default); border-radius: 6px; padding: 8px 10px; color: var(--text-secondary); font-size: var(--text-sm); outline: none; }
input:focus { border-color: var(--accent-focus); }
.error { font-size: var(--text-xs); color: #ef4444; margin: 0; }
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
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
</style>
