# SEO + GEO (Generative Engine Optimization) 구현 플랜

## Context
현재 Seraph는 순수 Vue 3 SPA로 SEO 관련 설정이 전무하다. 메타 태그, OG 태그, robots.txt, sitemap.xml, 구조화된 데이터 모두 없다. 공개 페이지(Hero, Guide, Login, Register)가 크롤러에 노출되지 않아 검색 엔진(전통적 + AI 기반) 가시성이 0이다.

**목표:** 기본 SEO + 공개 페이지 프리렌더링 + GEO(AI 검색엔진 최적화)를 추가한다.

---

## Phase 0: 브랜치 생성

```bash
git checkout -b seo-geo
```

---

## Phase 1: 프리렌더링 인프라 구축

### 1-1. 의존성 설치
```bash
cd client && npm install @unhead/vue vite-ssg
```

### 1-2. 라우터 리팩토링 (`client/src/router/index.ts`)
- `routes` 배열을 별도 export로 분리 (vite-ssg가 소비)
- `createRouter` 호출과 `beforeEach` 가드는 main.ts의 ViteSSG 콜백으로 이동
- `beforeEach`에 SSG 안전 가드 추가: `if (typeof window === 'undefined') return`

### 1-3. 엔트리 포인트 변환 (`client/src/main.ts`)
```ts
import { ViteSSG } from 'vite-ssg'
import { createHead } from '@unhead/vue'
import { createPinia } from 'pinia'
import i18n from './i18n'
import App from './App.vue'
import { routes } from './router'

export const createApp = ViteSSG(
  App,
  { routes, base: import.meta.env.BASE_URL },
  ({ app, router, isClient }) => {
    app.use(createPinia())
    app.use(i18n)
    app.use(createHead())
    // router guard 등록 (isClient 체크 포함)
  },
)
```

### 1-4. i18n SSG 안전 처리 (`client/src/i18n/index.ts`)
- `detectLocale()`에 `typeof window === 'undefined'` 체크 추가, SSG 시 `'ko'` 반환

### 1-5. Vite 설정 (`client/vite.config.ts`)
- `ssgOptions.includedRoutes`: `['/', '/login', '/register', '/guide']`만 프리렌더링

### 1-6. 빌드 스크립트 (`client/package.json`)
- `"build"`: `"vue-tsc && vite-ssg build"`로 변경

---

## Phase 2: 기본 SEO (메타 태그 + OG + 정적 파일)

### 2-1. SEO 컴포저블 생성 (`client/src/composables/usePageSeo.ts`)
- `@unhead/vue`의 `useSeoMeta` + `useHead` 래핑
- 파라미터: titleKey, descriptionKey, ogImagePath, type
- 자동 생성: canonical URL, OG 태그, Twitter Card, hreflang

### 2-2. 번역 키 추가 (`client/src/i18n/locales/ko.ts`, `en.ts`)
- `seo.hero`, `seo.guide`, `seo.login`, `seo.register` 섹션 추가
- 각각 title, description 포함

### 2-3. 각 공개 뷰에 SEO 적용
- `HeroView.vue`: `usePageSeo({ titleKey: 'seo.hero.title', ... })`
- `GuideView.vue`: 동일 패턴
- `LoginView.vue`, `RegisterView.vue`: 기본 title/description만

### 2-4. `client/public/robots.txt` 생성
```
User-agent: *
Allow: /
Allow: /guide
Disallow: /projects
Disallow: /account
Disallow: /api/
Sitemap: https://seraph.toolzy.com/sitemap.xml
```

### 2-5. `client/public/sitemap.xml` 생성
- 4개 공개 URL (/, /guide, /login, /register)
- 정적 파일로 충분 (공개 페이지가 소수이므로)

### 2-6. `client/index.html` 보강
- 기본 description 메타 태그 (폴백용)
- `<meta name="robots" content="max-snippet:-1, max-image-preview:large">` 추가

### 2-7. OG 이미지 (`client/public/og-default.png`)
- 기본 OG 이미지 파일 필요 (별도 준비)

---

## Phase 3: GEO - 구조화된 데이터 + AI 최적화

### 3-1. JSON-LD 컴포저블 (`client/src/composables/useJsonLd.ts`)
- `useHead`로 `<script type="application/ld+json">` 주입하는 헬퍼

### 3-2. SoftwareApplication 스키마 (글로벌, App.vue)
```json
{
  "@type": "SoftwareApplication",
  "name": "Seraph",
  "applicationCategory": "DeveloperApplication",
  "description": "인프라 의존성 시각화 및 영향도 분석 도구"
}
```

### 3-3. FAQPage 스키마 (`GuideView.vue`)
- 가이드 5개 섹션을 FAQ Question/Answer 형태로 매핑
- AI 엔진이 직접 답변으로 표시하는 가장 중요한 GEO 시그널

### 3-4. HowTo 스키마 (`GuideView.vue`)
- 가이드 단계를 HowToStep으로 구조화

### 3-5. WebPage 스키마 (`HeroView.vue`)

### 3-6. 시맨틱 HTML 개선
- `App.vue`의 `<router-view>` 영역에 `<main>` 추가
- HeroView/GuideView에 `<article>`, `<section aria-labelledby="">` 적용
- 제목 계층(h1 > h2 > h3) 검증

### 3-7. AI 검색 최적화 콘텐츠
- HeroView에 "Seraph이란?" 직접 답변형 문단 추가 (첫 번째 가시적 텍스트)
- 비교 문구: "에이전트 설치 없이 인프라 의존성을 시각화"
- `max-snippet:-1` 메타로 AI Overviews 스니펫 길이 제한 해제

---

## 수정 대상 파일 목록

| 파일 | 변경 유형 |
|------|-----------|
| `client/package.json` | 의존성 추가, build 스크립트 변경 |
| `client/src/main.ts` | ViteSSG 엔트리로 전환 |
| `client/src/router/index.ts` | routes 배열 분리, guard 이동 |
| `client/src/i18n/index.ts` | SSG 안전 처리 |
| `client/vite.config.ts` | ssgOptions 추가 |
| `client/index.html` | 폴백 메타 태그 추가 |
| `client/src/App.vue` | `<main>` 랜드마크 추가, 글로벌 JSON-LD |
| `client/src/views/HeroView.vue` | SEO 메타 + WebPage JSON-LD + 시맨틱 HTML |
| `client/src/views/GuideView.vue` | SEO 메타 + FAQ/HowTo JSON-LD + 시맨틱 HTML |
| `client/src/views/LoginView.vue` | 기본 SEO 메타 |
| `client/src/views/RegisterView.vue` | 기본 SEO 메타 |
| `client/src/i18n/locales/ko.ts` | seo 번역 키 추가 |
| `client/src/i18n/locales/en.ts` | seo 번역 키 추가 |
| **신규** `client/src/composables/usePageSeo.ts` | SEO 메타 컴포저블 |
| **신규** `client/src/composables/useJsonLd.ts` | JSON-LD 헬퍼 |
| **신규** `client/public/robots.txt` | 크롤러 지시 |
| **신규** `client/public/sitemap.xml` | 사이트맵 |

---

## 검증 방법

1. **빌드 검증**: `npm run build --workspace=client` 후 `dist/` 내 프리렌더링된 HTML 확인
   - `dist/index.html`, `dist/guide/index.html` 등에 실제 콘텐츠가 포함되어야 함
2. **메타 태그 확인**: 프리렌더링된 HTML에서 `<title>`, `<meta name="description">`, `og:*` 태그 존재 확인
3. **JSON-LD 확인**: HTML 내 `<script type="application/ld+json">` 블록이 올바른 스키마 포함
4. **개발 서버 확인**: `npm run dev:client`로 각 공개 페이지 접근 시 title이 동적으로 변경되는지 확인
5. **robots.txt/sitemap**: `http://localhost:5173/robots.txt`, `/sitemap.xml` 접근 가능 확인
6. **Google Rich Results Test**: 빌드된 HTML을 [Rich Results Test](https://search.google.com/test/rich-results)로 검증

---

## 주의사항

- **hreflang URL 전략**: 현재 URL에 locale prefix가 없으므로 (`/guide`, `/en/guide` 아님), hreflang은 `x-default`만 사용. 향후 locale prefix 도입 시 확장
- **SSG 시 브라우저 API**: `localStorage`, `navigator` 접근하는 코드는 모두 `typeof window` 체크 필요
- **OG 이미지**: 실제 이미지 파일은 별도 디자인 필요. 플레이스홀더로 시작
- **도메인**: `https://seraph.toolzy.com` 사용. 환경변수 `VITE_BASE_URL`로 관리
