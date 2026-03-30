<script setup lang="ts">
import { watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useIdleTimeout } from './composables/useIdleTimeout'
import SessionTimeoutWarning from './components/SessionTimeoutWarning.vue'

const router = useRouter()
const authStore = useAuthStore()

const { isWarningVisible, remainingSeconds, start, stop, extend } = useIdleTimeout({
  onExpire: async () => {
    await authStore.logout()
    router.push({ name: 'login' })
  },
})

watch(
  () => authStore.isLoggedIn,
  (loggedIn) => {
    if (loggedIn) {
      start()
    } else {
      stop()
    }
  },
  { immediate: true },
)

function handleExtend(): void {
  extend()
}

async function handleLogout(): Promise<void> {
  stop()
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>

  <SessionTimeoutWarning
    :visible="isWarningVisible"
    :remaining-seconds="remainingSeconds"
    @extend="handleExtend"
    @logout="handleLogout"
  />
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: var(--font-sans); background: var(--bg-base); color: var(--text-secondary); }
.page-enter-active, .page-leave-active { transition: opacity 0.15s, transform 0.15s; }
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
