<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal">
      <h3>의존성 추가</h3>
      <form @submit.prevent="onSubmit">
        <label>
          출발 노드 (source) *
          <CustomSelect
            v-model="form.source"
            :options="nodeOptions"
            placeholder="서버 / L7 선택..."
          />
        </label>
        <label>
          대상 노드 (target) *
          <CustomSelect
            v-model="form.target"
            :options="targetOptions"
            placeholder="서버 / L7 선택..."
          />
        </label>
        <p v-if="form.source && form.source === form.target" class="error">
          source와 target이 같을 수 없습니다.
        </p>
        <p v-else-if="isDuplicate" class="error">
          이미 동일한 의존성이 존재합니다.
        </p>
        <p v-else-if="isDbToServerBlocked" class="error">
          DB 노드는 서버 노드에 의존성을 추가할 수 없습니다.
        </p>
        <label>
          연결 유형
          <CustomSelect v-model="form.type" :options="typeOptions" />
        </label>
        <label>
          설명
          <input v-model="form.description" placeholder="예: REST API 호출" />
        </label>
        <div class="actions">
          <button type="button" class="btn-secondary" @click="$emit('close')">취소</button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="!form.source || !form.target || form.source === form.target || isDuplicate || isDbToServerBlocked"
          >
            추가
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { AnyNode, Dependency, DependencyType } from '../types'
import CustomSelect from './CustomSelect.vue'

const props = defineProps<{
  nodes: AnyNode[]
  defaultSource?: string
  defaultTarget?: string
  existingDependencies?: Dependency[]
}>()

const emit = defineEmits<{
  close: []
  submit: [data: Omit<Dependency, 'id'>]
}>()

const nodeOptions = computed(() =>
  props.nodes.map(n => ({
    value: n.id,
    label: n.nodeKind === 'l7' ? `[L7] ${n.name}` : (n.nodeKind === 'db' ? `[DB] ${n.name}` : n.name),
  }))
)

const sourceNode = computed(() => props.nodes.find(n => n.id === form.source))

const targetOptions = computed(() => {
  if (sourceNode.value?.nodeKind === 'db') {
    return props.nodes
      .filter(n => n.nodeKind === 'db')
      .map(n => ({ value: n.id, label: `[DB] ${n.name}` }))
  }
  return nodeOptions.value
})

const isDbToServerBlocked = computed(() => {
  if (!form.source || !form.target) return false
  const target = props.nodes.find(n => n.id === form.target)
  return sourceNode.value?.nodeKind === 'db' && (!target?.nodeKind || target.nodeKind === 'server')
})

const typeOptions = [
  { value: 'http', label: 'HTTP' },
  { value: 'websocket', label: 'WebSocket' },
  { value: 'db', label: 'DB' },
  { value: 'queue', label: 'Queue' },
  { value: 'other', label: 'Other' },
]

function defaultTypeForTarget(targetId: string): DependencyType {
  const target = props.nodes.find(n => n.id === targetId)
  if (!target) return 'http'
  return target.nodeKind === 'db' ? 'db' : 'http'
}

function resolveInitialTarget(): string {
  const targetId = props.defaultTarget ?? ''
  if (!targetId) return ''
  const src = props.nodes.find(n => n.id === (props.defaultSource ?? ''))
  if (src?.nodeKind === 'db') {
    const tgt = props.nodes.find(n => n.id === targetId)
    if (tgt?.nodeKind !== 'db') return ''
  }
  return targetId
}

const form = reactive({
  source: props.defaultSource ?? '',
  target: resolveInitialTarget(),
  type: defaultTypeForTarget(resolveInitialTarget()) as DependencyType,
  description: '',
})

watch(() => form.target, (targetId) => {
  form.type = defaultTypeForTarget(targetId)
})

watch(() => form.source, () => {
  const isTargetStillValid = targetOptions.value.some(o => o.value === form.target)
  if (!isTargetStillValid) form.target = ''
})

const isDuplicate = computed(() =>
  !!form.source && !!form.target && form.source !== form.target &&
  (props.existingDependencies ?? []).some(d => d.source === form.source && d.target === form.target)
)

function onSubmit() {
  if (form.source === form.target || isDuplicate.value) return
  emit('submit', { ...form })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 200;
}
.modal {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 10px; padding: 24px; width: 360px; max-width: 90vw;
}
.modal h3 { margin: 0 0 20px; font-size: 16px; font-weight: 700; color: #f1f5f9; }
form { display: flex; flex-direction: column; gap: 14px; }
label { display: flex; flex-direction: column; gap: 5px; font-size: 12px; color: #94a3b8; font-weight: 600; }
input { background: #0f172a; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; color: #e2e8f0; font-size: 13px; outline: none; }
input:focus { border-color: #3b82f6; }
.error { font-size: 12px; color: #ef4444; margin: 0; }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 4px; }
.btn-primary {
  background: #2563eb; color: #fff; border: none;
  border-radius: 6px; padding: 8px 18px; font-size: 13px; cursor: pointer; font-weight: 600;
}
.btn-primary:hover:not(:disabled) { background: #1d4ed8; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-secondary {
  background: #334155; color: #e2e8f0; border: none;
  border-radius: 6px; padding: 8px 18px; font-size: 13px; cursor: pointer;
}
.btn-secondary:hover { background: #475569; }
</style>
