import { createI18n } from 'vue-i18n'
import ko from './locales/ko'
import en from './locales/en'

export type AppLocale = 'ko' | 'en'
const SUPPORTED_LOCALES: AppLocale[] = ['ko', 'en']
const DEFAULT_LOCALE: AppLocale = 'en'

function detectLocale(): AppLocale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  // 1) URL 쿼리 파라미터 (?lang=ko)
  const urlLang = new URLSearchParams(window.location.search).get('lang')
  if (urlLang && SUPPORTED_LOCALES.includes(urlLang as AppLocale)) {
    localStorage.setItem('app-locale', urlLang)
    return urlLang as AppLocale
  }

  // 2) localStorage
  const saved = localStorage.getItem('app-locale')
  if (saved && SUPPORTED_LOCALES.includes(saved as AppLocale)) return saved as AppLocale

  // 3) 브라우저 언어
  const browserLang = navigator.language || (navigator as any).userLanguage || ''
  return browserLang.startsWith('ko') ? 'ko' : DEFAULT_LOCALE
}

const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: { ko, en },
})

export default i18n

/** Change locale, persist to localStorage, and update URL query */
export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale
  if (typeof window === 'undefined') return

  localStorage.setItem('app-locale', locale)
  document.documentElement.lang = locale

  // URL 쿼리 파라미터 업데이트
  const url = new URL(window.location.href)
  if (locale === DEFAULT_LOCALE) {
    url.searchParams.delete('lang')
  } else {
    url.searchParams.set('lang', locale)
  }
  window.history.replaceState(null, '', url.toString())
}

export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale
}
