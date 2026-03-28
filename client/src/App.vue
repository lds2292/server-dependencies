<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; }
body { margin: 0; font-family: var(--font-sans); background: var(--bg-base); color: var(--text-secondary); }
.page-enter-active, .page-leave-active { transition: opacity 0.15s, transform 0.15s; }
.page-enter-from { opacity: 0; transform: translateY(6px); }
.page-leave-to   { opacity: 0; transform: translateY(-6px); }
</style>
