import { ViteSSG } from 'vite-ssg'
import { createPinia } from 'pinia'
import i18n, { getLocale } from './i18n'
import App from './App.vue'
import { routes, setupRouterGuards } from './router'
import './style.css'

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  ({ app, router }) => {
    app.use(createPinia())
    app.use(i18n)
    document.documentElement.lang = getLocale()
    setupRouterGuards(router)
  },
)
