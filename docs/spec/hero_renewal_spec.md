# 히어로 페이지 리뉴얼 구현 기획서

## 개요

HeroView.vue의 히어로 섹션을 참고 이미지 기반으로 리뉴얼한다. 핵심 변경은 (1) 보안 섹션을 히어로 좌측 컬럼에서 분리하여 히어로 아래 풀 와이드 섹션으로 이동, (2) 피처 리스트 텍스트를 구체적 설명으로 변경, (3) CTA 버튼 텍스트 변경이다.

---

## 1단계: 현황 분석

### 현재 HeroView.vue 구조

```
hero-page (100vh, scroll-snap)
  +-- site-header (fixed, IntersectionObserver로 CTA 토글)
  +-- hero-section (85vh, scroll-snap-align: start)
  |   +-- hero-inner (flex row, max-width: 1280px)
  |       +-- hero-content (좌측)
  |       |   +-- hero-logo-mark (64x64 로고 아이콘)
  |       |   +-- hero-badge ("서버 의존성 시각화 플랫폼")
  |       |   +-- hero-title ("서버 의존성을 한눈에 파악하세요")
  |       |   +-- hero-desc (서비스 설명)
  |       |   +-- hero-features (SVG 아이콘 + 텍스트 3줄)
  |       |   +-- hero-actions (CTA 버튼 2개) <-- IntersectionObserver 타겟
  |       |   +-- security-section (보안 항목 4개, 녹색 카드)
  |       +-- hero-visual (우측)
  |           +-- graph-window (macOS 윈도우 프레임 + SVG 그래프)
  +-- features-section (기능 카드 6개 + CTA)
```

### 참고 이미지와의 차이점

| 항목 | 현재 | 참고 이미지 |
|------|------|------------|
| 보안 섹션 위치 | hero-content 내부 (좌측 컬럼 하단) | 히어로 아래 풀 와이드 별도 섹션 |
| 보안 섹션 타이틀 | "보안 및 개인정보 보호" | "ENTERPRISE-GRADE SECURITY" |
| 보안 항목 레이아웃 | 세로 리스트 (flex-column) | 가로 나열 (flex-row) |
| 피처 리스트 텍스트 | 짧은 키워드형 | 구체적 설명문 |
| CTA primary 텍스트 | "시작하기" | "무료로 시작하기" |
| hero-logo-mark | 존재 | 참고 이미지에는 없음 (제거) |

### 유지할 요소
- 헤더 sticky + IntersectionObserver 로직 (변경 없음)
- 가로 2컬럼 레이아웃 (이미 구현됨)
- 그래프 미리보기 SVG + 노드/엣지 애니메이션 (변경 없음)
- 뱃지, 타이틀, 서브텍스트 (텍스트만 일부 변경)
- features-section (변경 없음)
- 입장 애니메이션 (변경 없음)
- 반응형 breakpoint (변경 없음, 보안 섹션 반응형만 추가)

---

## 2단계: 변경 사항

### 2-1. hero-content 내부 변경

#### hero-logo-mark 제거
- 참고 이미지에서 히어로 좌측에 별도 로고 마크가 없음
- `<div class="hero-logo-mark">...</div>` 제거
- 관련 CSS `.hero-logo-mark` 제거

#### 피처 리스트 텍스트 변경
현재:
```
- 노드 기반 의존성 그래프
- 영향 범위 및 순환 의존성 분석
- 프로젝트 단위 팀 협업
```

변경 (service-profile.json 기반 + 참고 이미지):
```
- 서버, 로드밸런서, 인프라, 외부 서비스 간의 의존 관계를 시각화
- 영향 범위 및 순환 의존성 자동 분석 제공
- 프로젝트 단위 팀 협업 지원
```

#### CTA 버튼 텍스트 변경
- hero-section: "시작하기" -> "무료로 시작하기"
- header: "시작하기" -> "무료로 시작하기" (헤더 버튼도 통일)

#### security-section 제거 (hero-content 내부에서)
- hero-content 내부의 `<div class="security-section">...</div>` 제거
- 해당 CSS 전부 제거
- 별도 풀 와이드 섹션으로 이동

### 2-2. 보안 섹션을 별도 풀 와이드 섹션으로 분리

#### 새 HTML 구조

```html
<section class="security-band">
  <div class="security-band-inner">
    <div class="security-band-header">
      <svg ...shield-icon... />
      <span class="security-band-title">ENTERPRISE-GRADE SECURITY</span>
    </div>
    <div class="security-band-items">
      <div class="security-band-item">
        <span class="security-band-dot"></span>
        <span>서버 IP, 호스트 등 민감한 인프라 정보는 암호화되어 안전하게 보관됩니다</span>
      </div>
      <!-- ... 나머지 3개 항목 ... -->
    </div>
  </div>
</section>
```

#### 위치
- hero-section과 features-section 사이에 배치
- 풀 와이드 배경 (hero-section의 블루프린트 격자 없이)
- 내부 콘텐츠는 max-width: 1280px로 센터 정렬

---

## 3단계: UI/UX 스펙

### 와이어프레임: 보안 밴드 섹션

```
+======================================================================+
|  (풀 와이드, bg: rgba(6,78,59,0.2), border-top/bottom)              |
|                                                                      |
|    [shield-icon] ENTERPRISE-GRADE SECURITY                           |
|                                                                      |
|    * 서버 IP, 호스트 등...  * 회원 정보는...  * 담당자 연락처는...  * 로그인 세션은... |
|                                                                      |
+======================================================================+
```

### 보안 밴드 CSS 스펙

```css
.security-band {
  padding: 28px 40px;
  background: rgba(6, 78, 59, 0.15);
  border-top: 1px solid rgba(52, 211, 153, 0.15);
  border-bottom: 1px solid rgba(52, 211, 153, 0.15);
}
.security-band-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 60px;
}
.security-band-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.security-band-title {
  font-size: var(--text-xs);
  font-weight: 700;
  color: #34d399; /* emerald-400 -- 보안 섹션 전용 시맨틱 색상 */
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.security-band-items {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}
.security-band-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: var(--text-xs);
  color: #6ee7b7; /* emerald-300 */
  line-height: 1.5;
  flex: 1 1 200px;
}
.security-band-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #34d399;
  margin-top: 5px;
  flex-shrink: 0;
}
```

### 보안 밴드 반응형

```css
@media (max-width: 768px) {
  .security-band { padding: 24px; }
  .security-band-inner { padding: 0; }
  .security-band-items { flex-direction: column; gap: 10px; }
}
```

### 입장 애니메이션 변경
- `.hero-content.is-visible .security-section` 애니메이션 규칙 제거
- 보안 밴드는 별도 애니메이션 없음 (스크롤 시 자연스럽게 노출)

---

## 4단계: 수정 파일 체크리스트

| 파일 | 작업 내용 |
|------|----------|
| `client/src/views/HeroView.vue` | (1) hero-logo-mark 제거, (2) 피처 리스트 텍스트 변경, (3) CTA "무료로 시작하기"로 변경, (4) security-section을 hero-content에서 제거하고 security-band로 분리, (5) 관련 CSS 수정 |

> 프론트엔드만 수정. 백엔드 변경 없음.
> 수정 파일 1개만.

---

## 제약 조건

- 색상 하드코딩 금지 (CSS 변수 사용). 단, 보안 섹션의 emerald 계열(#34d399, #6ee7b7)은 기존 코드에서도 하드코딩되어 있던 것이며 CSS 변수로 정의되지 않은 상태. 기존 패턴 유지.
- 이모지 사용 금지
- 기존 헤더 sticky + IntersectionObserver 로직 유지
- 기존 그래프 미리보기 SVG 노드/엣지 애니메이션 유지
- 반응형: 모바일에서는 보안 밴드 항목도 세로 스택
- Vue 3 Composition API, script setup lang="ts"
- 글로벌 버튼 클래스 사용 (.btn-primary, .btn-ghost, .btn-lg, .btn-sm)
