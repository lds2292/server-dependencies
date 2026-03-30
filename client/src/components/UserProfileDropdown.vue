<template>
  <div class="user-dropdown-wrap" ref="wrapRef">
    <button class="btn-user-trigger" @click.stop="open = !open">
      <span class="user-avatar">{{ initial }}</span>
      <span class="user-name">{{ username }}</span>
    </button>
    <div v-if="open" class="user-dropdown-menu">
      <button v-if="showProjectsLink" @click="goProjects">프로젝트 목록으로</button>
      <div v-if="showProjectsLink" class="user-dropdown-divider"></div>
      <button @click="goAccount">내 정보 수정</button>
      <div class="user-dropdown-divider"></div>
      <button class="user-dropdown-danger" @click="emit('logout'); open = false">로그아웃</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{ logout: [] }>()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const open = ref(false)
const wrapRef = ref<HTMLDivElement>()

const username = computed(() => auth.user?.username ?? '')
const initial = computed(() => username.value.charAt(0).toUpperCase())
const showProjectsLink = computed(() => route.name !== 'projects')

function goProjects() {
  router.push({ name: 'projects' })
  open.value = false
}

function goAccount() {
  router.push({ name: 'account' })
  open.value = false
}

function onClickOutside(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) open.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.user-dropdown-wrap { position: relative; }
.btn-user-trigger {
  display: flex; align-items: center; gap: 6px; padding: 3px 12px 3px 4px;
  height: 36px; border-radius: 6px; border: 1px solid var(--border-strong);
  background: var(--bg-surface); color: var(--text-tertiary); cursor: pointer;
  transition: all 0.15s; white-space: nowrap; font-size: var(--text-sm); font-weight: 600;
}
.btn-user-trigger:hover {
  border-color: var(--accent-focus);
  color: var(--text-secondary);
  box-shadow: 0 0 8px rgba(217,119,6,0.15);
}
.user-avatar {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--accent-primary); color: var(--bg-base);
  font-size: 12px; font-weight: 700; flex-shrink: 0;
  box-shadow: 0 0 6px rgba(217,119,6,0.25);
}
.user-name { max-width: 80px; overflow: hidden; text-overflow: ellipsis; }
.user-dropdown-menu {
  position: absolute; top: calc(100% + 4px); right: 0;
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 8px; padding: 4px 0; z-index: 200; min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.user-dropdown-menu button {
  display: block; width: 100%; padding: 7px 16px; background: none;
  border: none; color: var(--text-secondary); text-align: left;
  cursor: pointer; font-size: var(--text-sm); transition: background 0.1s;
}
.user-dropdown-menu button:hover { background: var(--border-default); }
.user-dropdown-danger { color: var(--color-danger) !important; }
.user-dropdown-danger:hover { background: rgba(239, 68, 68, 0.1) !important; }
.user-dropdown-divider { height: 1px; background: var(--border-default); margin: 3px 0; }
</style>
