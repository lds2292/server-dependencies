<template>
  <div class="callback-page">
    <p>{{ $t('auth.github.processing') }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')
  const error = params.get('error')

  if (window.opener) {
    window.opener.postMessage({
      type: 'github-oauth-callback',
      code,
      state,
      error,
    }, window.location.origin)
    window.close()
  }
})
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-base);
  color: var(--text-tertiary);
  font-size: var(--text-sm);
}
</style>
