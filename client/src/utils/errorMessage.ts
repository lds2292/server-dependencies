import { useI18n } from 'vue-i18n'

/**
 * Extract a translated error message from an API error response.
 * If the response contains a `code` field, map it via the `errors` namespace.
 * Otherwise, return the fallback key translation.
 */
export function getErrorMessage(
  err: unknown,
  t: ReturnType<typeof useI18n>['t'],
  fallbackKey: string = 'common.serverError',
): string {
  const e = err as { response?: { data?: { code?: string; error?: string } } }
  const code = e.response?.data?.code
  if (code) {
    const key = `errors.${code}`
    const translated = t(key)
    // vue-i18n returns the key itself when no translation is found
    if (translated !== key) return translated
  }
  return t(fallbackKey)
}
