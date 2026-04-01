import { useHead } from '@unhead/vue'

export function useJsonLd(schema: Record<string, unknown>): void {
  const data = { '@context': 'https://schema.org', ...schema }
  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(data),
      },
    ],
  })
}
