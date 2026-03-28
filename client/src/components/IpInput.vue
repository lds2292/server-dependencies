<template>
  <div class="ip-input" :class="{ focused: isFocused }">
    <template v-for="(_, i) in octets" :key="i">
      <input
        :ref="el => { if (el) inputs[i] = el as HTMLInputElement }"
        :value="octets[i]"
        class="octet"
        inputmode="numeric"
        maxlength="3"
        placeholder="0"
        @input="onInput(i, $event)"
        @keydown="onKeydown(i, $event)"
        @focus="onFocus($event)"
        @blur="onBlur"
      />
      <span v-if="i < 3" class="dot">.</span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const octets = ref(['', '', '', ''])
const inputs: HTMLInputElement[] = []
const isFocused = ref(false)

// 외부 값 → octets 파싱
watch(() => props.modelValue, (val) => {
  const parts = (val ?? '').split('.')
  octets.value = [0, 1, 2, 3].map(i => parts[i] ?? '')
}, { immediate: true })

function emitValue() {
  emit('update:modelValue', octets.value.join('.'))
}

function clamp(val: string): string {
  const n = parseInt(val, 10)
  if (isNaN(n)) return ''
  return String(Math.min(255, Math.max(0, n)))
}

function onInput(i: number, event: Event) {
  const raw = (event.target as HTMLInputElement).value
  // 숫자만 허용
  const digits = raw.replace(/\D/g, '')
  const clamped = digits === '' ? '' : clamp(digits)
  octets.value[i] = clamped
  // 입력 필드 값 동기화 (직접 세팅)
  inputs[i].value = clamped
  emitValue()
  // 3자리이거나 100 이상이면 다음 필드로 이동
  if (clamped.length === 3 && i < 3) {
    inputs[i + 1]?.focus()
    inputs[i + 1]?.select()
  }
}

function onKeydown(i: number, event: KeyboardEvent) {
  // . 또는 → 키 → 다음 필드
  if ((event.key === '.' || event.key === 'ArrowRight') && octets.value[i] !== '') {
    if (i < 3) {
      event.preventDefault()
      inputs[i + 1]?.focus()
      inputs[i + 1]?.select()
    }
  }
  // ← 키 → 이전 필드
  if (event.key === 'ArrowLeft') {
    const el = inputs[i]
    if (el.selectionStart === 0 && i > 0) {
      event.preventDefault()
      inputs[i - 1]?.focus()
    }
  }
  // Backspace on empty → 이전 필드
  if (event.key === 'Backspace' && octets.value[i] === '' && i > 0) {
    event.preventDefault()
    inputs[i - 1]?.focus()
    // 이전 필드 값 지우기
    octets.value[i - 1] = ''
    inputs[i - 1].value = ''
    emitValue()
  }
}

function onFocus(event: FocusEvent) {
  isFocused.value = true
  ;(event.target as HTMLInputElement).select()
}

function onBlur() {
  // 모든 input이 blur 됐는지 체크 (setTimeout으로 다음 focus 이벤트 우선)
  setTimeout(() => {
    const active = document.activeElement
    isFocused.value = inputs.some(el => el === active)
  }, 0)
}
</script>

<style scoped>
.ip-input {
  display: flex;
  align-items: center;
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 0 10px;
  gap: 2px;
  transition: border-color 0.15s;
}
.ip-input.focused {
  border-color: var(--accent-focus);
}
.octet {
  width: 36px;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
  padding: 8px 0;
  font-family: var(--font-mono);
}
.dot {
  color: var(--text-disabled);
  font-size: 14px;
  font-weight: 700;
  user-select: none;
}
</style>
