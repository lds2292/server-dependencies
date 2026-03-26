<template>
  <div ref="rootRef" class="custom-select" :class="{ open: isOpen }">
    <button
      type="button"
      class="select-trigger"
      :class="{ placeholder: !modelValue }"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span>{{ selectedLabel }}</span>
      <svg class="chevron" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="select-dropdown"
        :style="dropdownStyle"
        @mousedown.prevent
      >
        <ul role="listbox">
          <li
            v-for="(opt, i) in options"
            :key="opt.value"
            role="option"
            class="select-option"
            :class="{
              selected: opt.value === modelValue,
              focused: i === focusedIndex,
            }"
            @click="select(opt.value)"
            @mouseenter="focusedIndex = i"
          >
            <span class="option-check">{{ opt.value === modelValue ? '✓' : '' }}</span>
            {{ opt.label }}
          </li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface SelectOption {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: SelectOption[]
  placeholder?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rootRef = ref<HTMLDivElement>()
const dropdownRef = ref<HTMLDivElement>()
const isOpen = ref(false)
const focusedIndex = ref(-1)
const dropdownStyle = ref<Record<string, string>>({})

const selectedLabel = computed(() => {
  if (!props.modelValue) return props.placeholder ?? '선택...'
  return props.options.find(o => o.value === props.modelValue)?.label ?? props.modelValue
})

function updatePosition() {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top
  const openUp = spaceBelow < 180 && spaceAbove > spaceBelow

  dropdownStyle.value = {
    position: 'fixed',
    left: rect.left + 'px',
    width: rect.width + 'px',
    ...(openUp
      ? { bottom: (window.innerHeight - rect.top) + 'px' }
      : { top: rect.bottom + 4 + 'px' }),
    zIndex: '9999',
  }
}

function open() {
  updatePosition()
  isOpen.value = true
  focusedIndex.value = props.options.findIndex(o => o.value === props.modelValue)
}

function close() {
  isOpen.value = false
  focusedIndex.value = -1
}

function toggle() {
  isOpen.value ? close() : open()
}

function select(value: string) {
  emit('update:modelValue', value)
  close()
}

function onTriggerKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    toggle()
  } else if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value) open()
    focusedIndex.value = Math.min(focusedIndex.value + 1, props.options.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
  } else if (e.key === 'Escape') {
    close()
  } else if ((e.key === 'Enter') && isOpen.value && focusedIndex.value >= 0) {
    select(props.options[focusedIndex.value].value)
  }
}

function onOutsideClick(e: MouseEvent) {
  if (
    !rootRef.value?.contains(e.target as Node) &&
    !dropdownRef.value?.contains(e.target as Node)
  ) close()
}

onMounted(() => document.addEventListener('mousedown', onOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', onOutsideClick))
</script>

<style scoped>
.custom-select {
  position: relative;
  width: 100%;
}

.select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 6px;
  padding: 8px 10px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s;
  gap: 6px;
}
.select-trigger:hover { border-color: #475569; }
.select-trigger:focus { outline: none; border-color: #3b82f6; }
.custom-select.open .select-trigger { border-color: #3b82f6; }
.select-trigger.placeholder span { color: #475569; }

.chevron {
  width: 16px;
  height: 16px;
  color: #64748b;
  flex-shrink: 0;
  transition: transform 0.15s;
}
.custom-select.open .chevron { transform: rotate(180deg); }
</style>

<style>
/* Teleport 대상이 body이므로 scoped 불가 */
.select-dropdown {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
}
.select-dropdown ul {
  list-style: none;
  margin: 0;
  padding: 4px 0;
}
.select-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  font-size: 13px;
  color: #e2e8f0;
  cursor: pointer;
  transition: background 0.1s;
}
.select-option:hover,
.select-option.focused { background: #273549; }
.select-option.selected { color: #60a5fa; }
.option-check {
  width: 14px;
  font-size: 12px;
  color: #60a5fa;
  flex-shrink: 0;
}
</style>
