# 제품 가이드 페이지 구현 기획서

## 개요

신규 사용자가 가입 전에 앱의 핵심 기능과 사용 흐름을 직관적으로 이해할 수 있도록, 로그인 없이 접근 가능한 `/guide` 페이지를 별도로 만든다. 스크롤 기반 제품 투어 형태로, 각 기능 섹션마다 인라인 SVG + CSS 애니메이션으로 시각적 설명을 제공한다.

---

## 1단계: 현황 분석

### 현재 상태

- **HeroView.vue**: 히어로 섹션 + 6개 피처 카드로 구성. 피처 카드는 텍스트 + 아이콘만으로 기능을 설명하며, 실제 앱 사용 흐름을 보여주지 않음
- **라우터**: `publicOnly` 배열(`['hero', 'login', 'register']`)로 로그인 사용자 리다이렉트 관리. 가이드 페이지는 로그인 여부와 무관하게 접근 가능해야 함
- **헤더**: HeroView에 자체 헤더가 포함되어 있고, `header-nav` 클래스가 이미 존재하지만 현재 링크 없이 `display: none` 상태 (768px 이상에서 `display: flex`)
- **SVG 패턴**: HeroView의 데모 그래프에서 정적 SVG + CSS 애니메이션(`@keyframes marchDash`, `nodePulse` 등) 패턴이 확립되어 있음. 노드는 이중 rect(외곽 glow + 내부 fill), 엣지는 stroke-dasharray + animation

### 현재 구현의 부족한 점

1. 가입 전 사용자에게 앱 동작 방식을 보여주는 콘텐츠가 없음
2. 가입 후 빈 캔버스에서의 온보딩 안내가 없음
3. HeroView의 피처 카드는 기능 나열일 뿐, 실제 워크플로우를 안내하지 않음

### 참조할 기존 패턴

| 패턴 | 파일 | 설명 |
|------|------|------|
| SVG 노드 렌더링 | `HeroView.vue` L172-240 | 이중 rect + text, 노드 타입별 색상 |
| 엣지 애니메이션 | `HeroView.vue` L185-195 | `stroke-dasharray` + `marchDash` keyframe |
| 노드 glow 애니메이션 | `HeroView.vue` L928-950 | `nodePulse` keyframe |
| 데모 윈도우 프레임 | `HeroView.vue` L129-144 | macOS 스타일 윈도우 (dots + address bar) |
| 입장 애니메이션 | `HeroView.vue` L955-994 | `heroFadeUp` + staggered delay |
| 반응형 breakpoints | `HeroView.vue` L1125-1177 | 640px, 768px, 1024px |
| blueprint 배경 | `HeroView.vue` L516-527 | 격자 + radial mask |

---

## 2단계: 로직 설계

### 라우터 변경

`client/src/router/index.ts`에 라우트 추가:

```typescript
// 기존 hero, login, register 라우트 아래에 추가
{ path: '/guide', name: 'guide', component: () => import('../views/GuideView.vue') },
```

`publicOnly` 배열에 `'guide'`를 추가하지 **않는다**. 가이드 페이지는 로그인 사용자도 접근 가능해야 하며, `meta: { requiresAuth: true }`도 붙이지 않으므로 현재 beforeEach 가드에서 자연스럽게 통과한다.

### 컴포넌트 구조

새 파일 1개만 생성: `client/src/views/GuideView.vue`

```
GuideView.vue (SFC, <template> + <script setup> + <style scoped>)
  +-- guide-page (전체 래퍼, 100vh, overflow-y: auto)
      +-- site-header (HeroView와 동일 구조, 고정 헤더)
      +-- guide-hero (히어로 섹션: 제목 + 부제)
      +-- guide-section * 6 (기능별 섹션, 교대 레이아웃)
      |   +-- guide-section-content (텍스트: 번호 + 제목 + 설명 + 하이라이트 리스트)
      |   +-- guide-section-visual (SVG 시각 요소)
      +-- guide-cta (하단 CTA)
```

### 스크롤 인터랙션

IntersectionObserver를 사용하여 각 섹션이 뷰포트에 진입할 때 fade-up 애니메이션을 트리거한다.

```typescript
import { ref, onMounted, onUnmounted } from 'vue'

const sectionRefs = ref<HTMLElement[]>([])
const visibleSections = ref<Set<number>>(new Set())

let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = sectionRefs.value.indexOf(entry.target as HTMLElement)
          if (index !== -1) visibleSections.value.add(index)
        }
      })
    },
    { threshold: 0.15 }
  )
  sectionRefs.value.forEach(el => el && observer!.observe(el))
})

onUnmounted(() => {
  observer?.disconnect()
})
```

### 헤더 변경 (HeroView.vue 수정 없이)

GuideView에 자체 헤더를 포함한다. HeroView의 헤더 구조를 복제하되, "가이드" 링크를 활성 상태로 표시하고 "로그인" + "시작하기" 버튼을 유지한다. HeroView는 수정하지 않는다.

> 참고: HeroView에도 가이드 링크를 추가하는 것이 이상적이나, 제약 조건에 따라 HeroView는 수정하지 않는다. 향후 헤더를 공통 컴포넌트로 분리하는 것을 권장한다.

---

## 3단계: UI/UX 스펙

### 전체 페이지 와이어프레임

```
+================================================================+
| [Logo] Server Dependencies      [가이드] [로그인] [시작하기]    |
+================================================================+
|                                                                  |
|                    GUIDE HERO SECTION                            |
|                                                                  |
|              "Server Dependencies 시작 가이드"                    |
|      "프로젝트 생성부터 영향도 분석까지, 5분이면 충분합니다"       |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 1: 프로젝트 생성                                        |
|  +---------------------------+  +-----------------------------+  |
|  |  01                       |  |  [SVG: 프로젝트 카드]        |  |
|  |  프로젝트를 만드세요       |  |  +---------------------+    |  |
|  |                           |  |  | Production Cluster  |    |  |
|  |  팀의 인프라 토폴로지를    |  |  | 3 members           |    |  |
|  |  프로젝트 단위로 관리...   |  |  +---------------------+    |  |
|  |                           |  |  +---------------------+    |  |
|  |  - 프로젝트별 독립 그래프  |  |  | Staging Env         |    |  |
|  |  - 팀원 초대 및 역할 관리  |  |  | 2 members           |    |  |
|  |  - 감사 로그 추적          |  |  +---------------------+    |  |
|  +---------------------------+  +-----------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 2: 노드 추가         (좌우 반전)                        |
|  +-----------------------------+  +---------------------------+  |
|  |  [SVG: 5가지 노드 타입]     |  |  02                       |  |
|  |                             |  |  노드를 추가하세요         |  |
|  |  [SRV] [L7] [Infra]        |  |                           |  |
|  |  [EXT] [DNS]               |  |  5가지 타입의 노드로 ...   |  |
|  |                             |  |                           |  |
|  |  각 노드에 IP, 포트 등     |  |  - Server: 애플리케이션.. |  |
|  |  메타데이터 표시            |  |  - L7: 로드밸런서...      |  |
|  +-----------------------------+  +---------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 3: 의존성 연결                                          |
|  +---------------------------+  +-----------------------------+  |
|  |  03                       |  |  [SVG: 연결된 그래프]        |  |
|  |  의존성을 연결하세요       |  |  A ----> B ----> C          |  |
|  |  ...                      |  |       \----> D              |  |
|  +---------------------------+  +-----------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 4: 영향도 분석       (좌우 반전)                        |
|  +-----------------------------+  +---------------------------+  |
|  |  [SVG: 영향 범위 시각화]    |  |  04                       |  |
|  |  선택 노드 + 영향 노드     |  |  영향 범위를 분석하세요    |  |
|  |  강조 + 비영향 노드 흐림   |  |  ...                      |  |
|  +-----------------------------+  +---------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 5: 경로 탐색 & 순환 탐지                                |
|  +---------------------------+  +-----------------------------+  |
|  |  05                       |  |  [SVG: 경로 + 순환]         |  |
|  |  경로를 탐색하세요         |  |  A -> B -> C (경로 강조)    |  |
|  |  ...                      |  |  X -> Y -> Z -> X (순환)    |  |
|  +---------------------------+  +-----------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|  SECTION 6: 팀 협업 & 내보내기 (좌우 반전)                       |
|  +-----------------------------+  +---------------------------+  |
|  |  [SVG: 멤버 + 내보내기]     |  |  06                       |  |
|  |  아바타들 + PNG/JSON 아이콘 |  |  팀과 함께 관리하세요      |  |
|  +-----------------------------+  +---------------------------+  |
|                                                                  |
+------------------------------------------------------------------+
|                                                                  |
|         지금 바로 시작하세요                                      |
|    복잡한 인프라도 한눈에 파악할 수 있습니다                      |
|         [무료로 시작하기]  [로그인]                                |
|                                                                  |
+================================================================+
```

### 섹션 상세 스펙

#### 가이드 히어로

| 항목 | 값 |
|------|-----|
| 제목 | "Server Dependencies 시작 가이드" |
| 부제 | "프로젝트 생성부터 영향도 분석까지, 5분이면 충분합니다" |
| 배경 | blueprint 격자 + amber glow (HeroView 패턴 재사용) |
| 상단 뱃지 | "PRODUCT GUIDE" (accent 색상 pill) |

#### Section 1: 프로젝트 생성

| 항목 | 값 |
|------|-----|
| 번호 | 01 |
| 제목 | "프로젝트를 만드세요" |
| 부제 | "팀의 인프라 토폴로지를 프로젝트 단위로 관리합니다. 프로젝트마다 독립적인 그래프와 멤버를 설정할 수 있습니다." |
| 하이라이트 | - 프로젝트별 독립적인 의존성 그래프 / - 팀원 초대 및 역할 기반 권한 관리 / - 모든 변경 이력 감사 로그 추적 |
| 레이아웃 | 좌: 텍스트, 우: 시각 요소 |
| SVG 시각 요소 | 프로젝트 카드 2개가 쌓인 형태. 상단 카드 "Production Cluster" (accent 보더, 강조), 하단 카드 "Staging Environment" (default 보더, 흐림). 각 카드에 프로젝트명 + 멤버 수 + 노드 수 표시. 상단 카드에 미세한 pulse glow 애니메이션 |

#### Section 2: 노드 추가

| 항목 | 값 |
|------|-----|
| 번호 | 02 |
| 제목 | "노드를 추가하세요" |
| 부제 | "5가지 타입의 노드로 인프라의 모든 구성 요소를 표현합니다. 각 노드에 IP, 포트, 담당자 등 상세 정보를 기록할 수 있습니다." |
| 하이라이트 | - Server: 애플리케이션 서버, 웹 서버 / - L7: HTTP 로드밸런서, 리버스 프록시 / - Infra: 데이터베이스, 캐시, 메시지 큐 / - External: 외부 API, SaaS 서비스 / - DNS: 도메인 네임 서버 |
| 레이아웃 | 좌: 시각 요소, 우: 텍스트 (반전) |
| SVG 시각 요소 | 5개 노드가 가로 2열 + 하단 1개로 배치. 각 노드는 타입별 색상(--node-srv-color 등)의 이중 rect + 타입명 텍스트. 노드 아래에 작은 메타데이터 힌트 (IP: xxx, Port: xxx 등). 각 노드에 staggered nodePulse 애니메이션 |

#### Section 3: 의존성 연결

| 항목 | 값 |
|------|-----|
| 번호 | 03 |
| 제목 | "의존성을 연결하세요" |
| 부제 | "노드 사이의 호출 관계를 방향성 엣지로 표현합니다. 드래그로 직관적으로 연결하고, 연결 설명을 추가할 수 있습니다." |
| 하이라이트 | - 드래그 앤 드롭으로 노드 간 연결 / - 엣지에 설명(description) 추가 가능 / - L7 노드는 멤버 서버를 자동으로 그룹핑 |
| 레이아웃 | 좌: 텍스트, 우: 시각 요소 |
| SVG 시각 요소 | 미니 그래프: L7 노드 1개 상단, 하위에 Server 2개, 우측에 Infra(DB) 1개. L7에서 Server들로 엣지, Server에서 DB로 엣지. 엣지에 marchDash 애니메이션. 하나의 엣지 위에 작은 라벨 "HTTP :8080". 전체를 데모 윈도우 프레임(macOS dots)으로 감쌈 |

#### Section 4: 영향도 분석

| 항목 | 값 |
|------|-----|
| 번호 | 04 |
| 제목 | "영향 범위를 분석하세요" |
| 부제 | "특정 노드를 선택하면 장애나 변경이 전파되는 범위를 즉시 확인할 수 있습니다. upstream과 downstream을 한눈에 파악합니다." |
| 하이라이트 | - 선택 노드에서 upstream/downstream 자동 탐색 / - 영향받는 노드 강조, 비영향 노드 흐림 처리 / - 영향도 깊이(depth)별 시각적 구분 |
| 레이아웃 | 좌: 시각 요소, 우: 텍스트 (반전) |
| SVG 시각 요소 | 5개 노드 그래프. 중앙 노드가 "선택됨" 상태 (accent 보더 + glow). 연결된 상위 1개, 하위 2개 노드가 밝게 강조(원래 색상). 연결되지 않은 1개 노드는 opacity: 0.2로 흐림. 강조 엣지는 stroke-width 두껍게 + 색상 밝게, 비관련 엣지는 흐림. 선택 노드 주변에 동심원 ripple 애니메이션 (3겹, opacity 감소) |

#### Section 5: 경로 탐색 & 순환 탐지

| 항목 | 값 |
|------|-----|
| 번호 | 05 |
| 제목 | "경로를 탐색하고 순환을 감지하세요" |
| 부제 | "두 노드 사이의 모든 경로를 찾고, 순환 의존성이 있으면 자동으로 경고합니다." |
| 하이라이트 | - 출발/도착 노드 지정으로 경로 탐색 / - 발견된 경로를 색상으로 강조 / - 순환 의존성 자동 탐지 및 경고 배지 |
| 레이아웃 | 좌: 텍스트, 우: 시각 요소 |
| SVG 시각 요소 | 두 파트로 구성. **상단**: A -> B -> C 경로가 accent 색상으로 강조된 선형 그래프 (출발 A에 "출발" 라벨, 도착 C에 "도착" 라벨). **하단**: X -> Y -> Z -> X 순환 구조, warning 색상(--color-warning) 엣지 + 순환 배지("순환 감지", HeroView의 canvas-cycle-badge 스타일). 순환 엣지에 빠른 marchDash 애니메이션 |

#### Section 6: 팀 협업 & 내보내기

| 항목 | 값 |
|------|-----|
| 번호 | 06 |
| 제목 | "팀과 함께 관리하세요" |
| 부제 | "프로젝트에 팀원을 초대하고 역할을 부여합니다. 완성된 그래프는 이미지나 데이터로 내보낼 수 있습니다." |
| 하이라이트 | - Master / Admin / Writer / Readonly 역할 체계 / - 낙관적 잠금으로 동시 편집 충돌 방지 / - PNG 이미지 및 JSON 데이터 내보내기 |
| 레이아웃 | 좌: 시각 요소, 우: 텍스트 (반전) |
| SVG 시각 요소 | 두 파트로 구성. **좌측**: 멤버 리스트 UI 모킹 -- 3개 행 (각각 원형 아바타 + 이름 + 역할 뱃지). 역할 뱃지는 role 색상 변수 사용 (Master: --role-master, Admin: --role-admin, Writer: --role-writer). **우측**: 내보내기 아이콘 2개 (PNG 파일 아이콘 + JSON 파일 아이콘), 각각 아래에 "PNG", "JSON" 라벨 |

#### 하단 CTA

| 항목 | 값 |
|------|-----|
| 제목 | "지금 바로 시작하세요" |
| 부제 | "복잡한 인프라도 한눈에 파악할 수 있습니다" |
| 버튼 | `.btn-primary.btn-lg` "무료로 시작하기" + `.btn-ghost.btn-lg` "로그인" |

### 레이아웃 규칙

- 각 섹션은 2컬럼 그리드 (`grid-template-columns: 1fr 1fr`)
- 홀수 섹션(1, 3, 5): 좌측 텍스트 + 우측 시각 요소
- 짝수 섹션(2, 4, 6): 좌측 시각 요소 + 우측 텍스트
- 섹션 간 구분: 상단에 `border-top: 1px solid var(--border-subtle)` 또는 간격만으로 구분
- 최대 너비: `max-width: 72rem` (1152px), `margin: 0 auto`

### CSS 변수 (신규 추가)

`style.css`에 추가할 변수는 **없다**. 기존 CSS 변수만으로 충분하며, GuideView의 scoped CSS에서 기존 변수를 조합하여 사용한다.

### 섹션 번호 스타일

```css
.guide-step-number {
  font-size: var(--text-hero);       /* 56px */
  font-weight: 800;
  color: var(--accent-primary);
  opacity: 0.15;
  font-family: var(--font-mono);
  line-height: 1;
  margin-bottom: 8px;
}
```

### 인터랙션 상세

| 인터랙션 | 구현 |
|----------|------|
| 스크롤 진입 애니메이션 | IntersectionObserver (threshold: 0.15). 텍스트 블록은 fade-up (translateY 24px -> 0, opacity 0 -> 1, 0.6s cubic-bezier(0.22, 1, 0.36, 1)). 시각 요소는 0.15s delay 후 동일 애니메이션 |
| 헤더 스크롤 반응 | 스크롤 Y > 64px일 때 배경 blur + border 활성화 (HeroView의 `.cta-visible` 패턴과 동일하되, 항상 CTA 버튼 노출) |
| SVG 애니메이션 | 엣지 marchDash, 노드 nodePulse는 CSS만으로 처리. 뷰포트 진입 시 자동 재생 (paused 상태에서 `.is-visible`일 때 running으로 전환) |
| 섹션 간 스크롤 | `scroll-behavior: smooth`만 적용, scroll-snap은 사용하지 않음 (긴 콘텐츠에 snap은 부적합) |

### 빈 상태 / 에러 상태

- 정적 콘텐츠이므로 로딩, 에러 상태 없음
- API 호출 없음

### 반응형 breakpoints

| Breakpoint | 변경 사항 |
|-----------|----------|
| >= 1024px | 2컬럼 그리드, 시각 요소 최대 크기 |
| 768px ~ 1023px | 2컬럼 유지하되 시각 요소 축소 |
| < 768px | 1컬럼 (시각 요소가 텍스트 아래로), 헤더 높이 56px, 섹션 패딩 축소 |
| < 640px | 가이드 히어로 제목 축소, CTA 버튼 세로 배치 |

```css
/* 모바일 */
@media (max-width: 767px) {
  .guide-section-grid {
    grid-template-columns: 1fr;
  }
  .guide-section-grid.reversed {
    /* 반전 해제: 시각 요소가 항상 텍스트 아래 */
  }
  .guide-section-visual {
    order: 2;
  }
  .guide-section-content {
    order: 1;
  }
  .guide-hero-title {
    font-size: var(--text-2xl); /* 28px */
  }
  .site-header {
    height: 56px;
  }
}

/* 태블릿 */
@media (min-width: 768px) and (max-width: 1023px) {
  .guide-section-visual svg {
    max-height: 320px;
  }
}

/* 데스크톱 */
@media (min-width: 1024px) {
  .guide-section-visual svg {
    max-height: 420px;
  }
}
```

---

## 4단계: 수정 파일 체크리스트

| 파일 경로 | 작업 |
|-----------|------|
| **`client/src/views/GuideView.vue`** | **신규 생성**. 전체 가이드 페이지 (헤더 + 히어로 + 6개 섹션 + CTA). `<script setup>`에 IntersectionObserver 로직. `<style scoped>`에 레이아웃, 섹션, SVG, 애니메이션, 반응형 CSS 전부 포함 |
| `client/src/router/index.ts` | L21 부근에 `{ path: '/guide', name: 'guide', component: () => import('../views/GuideView.vue') }` 라우트 추가. `publicOnly` 배열은 수정하지 않음 (가이드는 로그인 사용자도 접근 가능) |

### 수정하지 않는 파일

- `HeroView.vue` -- 제약 조건에 따라 수정하지 않음
- `style.css` -- 신규 CSS 변수 불필요
- 서버 측 파일 -- **프론트엔드만 수정 (백엔드 변경 없음)**

---

## 주의사항

1. **이모지 사용 금지** -- 모든 텍스트, 뱃지, 라벨에 이모지를 사용하지 않는다
2. **CSS 변수 필수** -- 모든 색상은 `var(--xxx)` 형태로 참조. SVG 인라인 속성의 노드 색상(`#5b8def` 등)은 HeroView 기존 패턴과 동일하게 하드코딩 허용 (SVG attribute에서 CSS 변수 사용이 제한적이므로)
3. **외부 라이브러리 금지** -- 스크롤 라이브러리, 애니메이션 라이브러리 사용 금지. 순수 IntersectionObserver + CSS animation만 사용
4. **HeroView.vue 수정 금지** -- 향후 헤더 공통화는 별도 작업으로 진행
5. **버튼 클래스** -- CTA 버튼은 `style.css`의 글로벌 `.btn-primary`, `.btn-ghost`, `.btn-lg` 클래스 사용. scoped에서 외형 재정의 금지 (레이아웃 속성만 허용)
6. **성능** -- SVG 애니메이션은 뷰포트 밖에서 `animation-play-state: paused` 적용하여 불필요한 리페인트 방지
7. **접근성** -- 각 섹션에 적절한 `<h2>`, `<h3>` 태그 사용. SVG에 `aria-hidden="true"` 적용 (장식용)
