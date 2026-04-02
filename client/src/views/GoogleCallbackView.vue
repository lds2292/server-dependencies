<template>
  <div class="callback-page">
    <p>{{ $t('auth.google.processing') }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  const hash = window.location.hash.substring(1)
  const params = new URLSearchParams(hash)
  const idToken = params.get('id_token')
  const state = params.get('state')
  const error = params.get('error')

  if (window.opener) {
    window.opener.postMessage({
      type: 'google-oauth-callback',
      idToken,
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
