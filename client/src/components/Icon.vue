<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  size?: number
}>(), {
  size: 16
})

const icons: Record<string, { viewBox: string; content: string }> = {
  // ─── Navigation ───────────────────────────────────────────
  'chevron-left': {
    viewBox: '0 0 16 16',
    content: '<path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  'chevron-down': {
    viewBox: '0 0 12 12',
    content: '<path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  'chevron-down-sm': {
    viewBox: '0 0 10 10',
    content: '<path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  'close': {
    viewBox: '0 0 12 12',
    content: '<line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  },
  'panel-right': {
    viewBox: '0 0 12 12',
    content: '<path d="M3 2l6 4-6 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  'panel-left': {
    viewBox: '0 0 12 12',
    content: '<path d="M9 2L3 6l6 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  },

  // ─── Actions ──────────────────────────────────────────────
  'settings': {
    viewBox: '0 0 24 24',
    content: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  'copy': {
    viewBox: '0 0 11 11',
    content: '<rect x="3.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor"/><path d="M1 3.5H0.5V10.5H7.5V10" stroke="currentColor" stroke-linecap="round"/>'
  },
  'filter': {
    viewBox: '0 0 12 12',
    content: '<path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>'
  },

  // ─── Section Icons ────────────────────────────────────────
  'user-profile': {
    viewBox: '0 0 16 16',
    content: '<circle cx="8" cy="5" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M2 14c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  },
  'lock': {
    viewBox: '0 0 16 16',
    content: '<rect x="3" y="7" width="10" height="7" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  },
  'warning-triangle': {
    viewBox: '0 0 16 16',
    content: '<path d="M8 1L1 14h14L8 1z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M8 6v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/>'
  },
  'project-info': {
    viewBox: '0 0 16 16',
    content: '<rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M5 6h6M5 9h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  },
  'members': {
    viewBox: '0 0 16 16',
    content: '<circle cx="6" cy="5" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M1 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="12.5" cy="5" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M12.5 10c1.66 0 3 1.34 3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  },
  'warning-triangle-alt': {
    viewBox: '0 0 16 16',
    content: '<path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6.5v2.5M8 11h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>'
  },

  // ─── Node Type Icons (ServerPanel dropdown) ───────────────
  'node-server': {
    viewBox: '0 0 11 9',
    content: '<rect x="0.5" y="0.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="0.9"/><line x1="0.5" y1="3.7" x2="10.5" y2="3.7" stroke="currentColor" stroke-width="0.7"/><circle cx="8.5" cy="6.2" r="0.9" fill="currentColor"/><circle cx="6.5" cy="6.2" r="0.9" fill="currentColor"/>'
  },
  'node-l7': {
    viewBox: '0 0 11 11',
    content: '<circle cx="5.5" cy="4" r="3" stroke="currentColor" stroke-width="0.9"/><line x1="5.5" y1="7" x2="2" y2="10.5" stroke="currentColor" stroke-width="0.9"/><line x1="5.5" y1="7" x2="9" y2="10.5" stroke="currentColor" stroke-width="0.9"/><line x1="2.5" y1="4" x2="8.5" y2="4" stroke="currentColor" stroke-width="0.8"/>'
  },
  'node-infra': {
    viewBox: '0 0 11 10',
    content: '<ellipse cx="5.5" cy="2" rx="5" ry="2" stroke="currentColor" stroke-width="0.9"/><line x1="0.5" y1="2" x2="0.5" y2="8" stroke="currentColor" stroke-width="0.9"/><line x1="10.5" y1="2" x2="10.5" y2="8" stroke="currentColor" stroke-width="0.9"/><ellipse cx="5.5" cy="8" rx="5" ry="2" stroke="currentColor" stroke-width="0.9"/>'
  },
  'node-dns': {
    viewBox: '0 0 11 11',
    content: '<circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9"/><line x1="5.5" y1="0.5" x2="5.5" y2="10.5" stroke="currentColor" stroke-width="0.7"/><line x1="0.5" y1="5.5" x2="10.5" y2="5.5" stroke="currentColor" stroke-width="0.7"/><path d="M1.5 3.5C3 3.5 4 2 5.5 2S8 3.5 9.5 3.5" stroke="currentColor" stroke-width="0.5"/><path d="M1.5 7.5C3 7.5 4 9 5.5 9S8 7.5 9.5 7.5" stroke="currentColor" stroke-width="0.5"/>'
  },
  'node-external': {
    viewBox: '0 0 11 11',
    content: '<circle cx="5.5" cy="5.5" r="5" stroke="currentColor" stroke-width="0.9"/><ellipse cx="5.5" cy="5.5" rx="2.2" ry="5" stroke="currentColor" stroke-width="0.7"/><line x1="0.5" y1="5.5" x2="10.5" y2="5.5" stroke="currentColor" stroke-width="0.7"/><line x1="1" y1="3" x2="10" y2="3" stroke="currentColor" stroke-width="0.5"/><line x1="1" y1="8" x2="10" y2="8" stroke="currentColor" stroke-width="0.5"/>'
  },
}
</script>

<template>
  <svg
    v-if="icons[name]"
    :width="size"
    :height="size"
    :viewBox="icons[name].viewBox"
    fill="none"
    v-html="icons[name].content"
    class="icon"
  />
</template>

<style scoped>
.icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
