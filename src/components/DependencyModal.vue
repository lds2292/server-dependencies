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
            :options="nodeOptions"
            placeholder="서버 / L7 선택..."
          />
        </label>
        <p v-if="form.source && form.source === form.target" class="error">
          source와 target이 같을 수 없습니다.
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
            :disabled="!form.source || !form.target || form.source === form.target"
          >
            추가
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import type { AnyNode, Dependency, DependencyType } from '../types'
import CustomSelect from './CustomSelect.vue'

const props = defineProps<{
  nodes: AnyNode[]
  defaultSource?: string
  defaultTarget?: string
}>()

const emit = defineEmits<{
  close: []
  submit: [data: Omit<Dependency, 'id'>]
}>()

const nodeOptions = computed(() =>
  props.nodes.map(n => ({
    value: n.id,
    label: n.nodeKind === 'l7' ? `[L7] ${n.name}` : n.name,
  }))
)

const typeOptions = [
  { value: 'http', label: 'HTTP' },
  { value: 'db', label: 'DB' },
  { value: 'queue', label: 'Queue' },
  { value: 'other', label: 'Other' },
]

const form = reactive({
  source: props.defaultSource ?? '',
  target: props.defaultTarget ?? '',
  type: 'http' as DependencyType,
  description: '',
})

function onSubmit() {
  if (form.source === form.target) return
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
