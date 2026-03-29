<template>
  <div ref="rootRef" class="custom-combobox">
    <div class="input-wrap" :class="{ focused: isOpen }">
      <input
        ref="inputRef"
        v-model="inputValue"
        type="text"
        :placeholder="placeholder"
        autocomplete="off"
        @focus="onFocus"
        @input="onInput"
        @keydown="onKeydown"
      />
      <svg
        v-if="suggestions.length"
        class="chevron"
        :class="{ open: isOpen }"
        viewBox="0 0 20 20"
        fill="currentColor"
        @mousedown.prevent="toggleDropdown"
      >
        <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
      </svg>
    </div>

    <Teleport to="body">
      <ul
        v-if="isOpen && filtered.length"
        ref="dropdownRef"
        class="combobox-dropdown"
        :style="dropdownStyle"
        @mousedown.prevent
      >
        <li
          v-for="(item, i) in filtered"
          :key="item"
          class="combobox-option"
          :class="{
            selected: item === modelValue,
            focused: i === focusedIndex,
          }"
          @click="selectItem(item)"
          @mouseenter="focusedIndex = i"
        >
          <span class="option-check">{{ item === modelValue ? '✓' : '' }}</span>
          {{ item }}
        </li>
      </ul>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: string
  suggestions: string[]
  placeholder?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const rootRef = ref<HTMLDivElement>()
const dropdownRef = ref<HTMLUListElement>()
const inputRef = ref<HTMLInputElement>()
const isOpen = ref(false)
const focusedIndex = ref(-1)
const dropdownStyle = ref<Record<string, string>>({})

// 입력 필드 값 - modelValue와 동기화
const inputValue = ref(props.modelValue)
watch(() => props.modelValue, v => { inputValue.value = v })
watch(inputValue, v => emit('update:modelValue', v))

const filtered = computed(() => {
  const q = inputValue.value.toLowerCase()
  return q
    ? props.suggestions.filter(s => s.toLowerCase().includes(q))
    : props.suggestions
})

function updatePosition() {
  if (!rootRef.value) return
  const rect = rootRef.value.getBoundingClientRect()
  const openUp = window.innerHeight - rect.bottom < 180 && rect.top > 180
  dropdownStyle.value = {
    position: 'fixed',
    left: rect.left + 'px',
    width: rect.width + 'px',
    zIndex: '9999',
    ...(openUp
      ? { bottom: (window.innerHeight - rect.top) + 'px' }
      : { top: rect.bottom + 4 + 'px' }),
  }
}

function open() {
  if (!filtered.value.length) return
  updatePosition()
  isOpen.value = true
  focusedIndex.value = filtered.value.indexOf(inputValue.value)
}

function close() {
  isOpen.value = false
  focusedIndex.value = -1
}

function toggleDropdown() {
  isOpen.value ? close() : open()
  inputRef.value?.focus()
}

function onFocus() {
  open()
}

function onInput() {
  // 타이핑 시 드롭다운 갱신
  if (filtered.value.length) {
    updatePosition()
    isOpen.value = true
    focusedIndex.value = -1
  } else {
    close()
  }
}

function selectItem(item: string) {
  inputValue.value = item
  close()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (!isOpen.value) open()
    focusedIndex.value = Math.min(focusedIndex.value + 1, filtered.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, -1)
  } else if (e.key === 'Enter') {
    if (isOpen.value && focusedIndex.value >= 0) {
      e.preventDefault()
      selectItem(filtered.value[focusedIndex.value])
    }
  } else if (e.key === 'Escape') {
    close()
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
.custom-combobox {
  position: relative;
  width: 100%;
}
.input-wrap {
  display: flex;
  align-items: center;
  background: var(--bg-base);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 0 10px;
  transition: border-color 0.15s;
}
.input-wrap:hover { border-color: var(--border-strong); }
.input-wrap.focused { border-color: var(--accent-focus); }
.input-wrap input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  padding: 8px 0;
}
.input-wrap input::placeholder { color: var(--border-strong); }
.chevron {
  width: 16px;
  height: 16px;
  color: var(--text-disabled);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.15s;
}
.chevron.open { transform: rotate(180deg); }
</style>

<style>
.combobox-dropdown {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  list-style: none;
  margin: 0;
  padding: 4px 0;
  max-height: 200px;
  overflow-y: auto;
}
.combobox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.1s;
}
.combobox-option:hover,
.combobox-option.focused { background: var(--bg-elevated); }
.combobox-option.selected { color: var(--accent-soft); }
.combobox-option .option-check {
  width: 14px;
  font-size: var(--text-xs);
  color: var(--accent-soft);
  flex-shrink: 0;
}
</style>
