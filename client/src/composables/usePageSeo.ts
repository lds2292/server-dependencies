import { computed } from 'vue'
import { useHead, useSeoMeta } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

const BASE_URL = 'https://seraph.toolzy.com'

interface SeoOptions {
  titleKey: string
  descriptionKey: string
  ogImagePath?: string
  type?: 'website' | 'article'
}

export function usePageSeo(options: SeoOptions): void {
  const { t, locale } = useI18n()
  const route = useRoute()

  const title = computed(() => t(options.titleKey))
  const description = computed(() => t(options.descriptionKey))
  const canonicalUrl = computed(() => `${BASE_URL}${route.path}`)
  const ogImage = `${BASE_URL}${options.ogImagePath ?? '/og-default.png'}`

  useSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogImage,
    ogUrl: canonicalUrl,
    ogType: options.type ?? 'website',
    ogLocale: computed(() => locale.value === 'ko' ? 'ko_KR' : 'en_US'),
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: ogImage,
    robots: 'max-snippet:-1, max-image-preview:large',
  })

  useHead({
    htmlAttrs: { lang: computed(() => locale.value) },
    link: [
      { rel: 'canonical', href: canonicalUrl },
    ],
  })
}
