import { createI18n } from 'vue-i18n'
import ko from './locales/ko'
import en from './locales/en'

function detectLocale(): 'ko' | 'en' {
  const saved = localStorage.getItem('app-locale')
  if (saved === 'ko' || saved === 'en') return saved
  const browserLang = navigator.language || (navigator as any).userLanguage || ''
  return browserLang.startsWith('ko') ? 'ko' : 'en'
}

const i18n = createI18n({
  legacy: false,          // Composition API
  locale: detectLocale(),
  fallbackLocale: 'ko',
  messages: { ko, en },
})

export default i18n

/** Change locale and persist to localStorage */
export function setLocale(locale: 'ko' | 'en'): void {
  i18n.global.locale.value = locale
  localStorage.setItem('app-locale', locale)
  document.documentElement.lang = locale
}

export function getLocale(): 'ko' | 'en' {
  return i18n.global.locale.value as 'ko' | 'en'
}
