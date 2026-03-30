# 히어로 리뉴얼 디자인 가이드

## 개요

HeroView.vue 히어로 섹션 리뉴얼의 디자인 스펙. 기획서(hero_renewal_spec.md)와 참고 이미지를 기반으로 작성.

---

## 1. 디자인 결정 사항

### 1-1. hero-logo-mark 제거
- 참고 이미지에 별도 로고 마크 없음 -> 제거
- hero-badge가 첫 요소로 올라감

### 1-2. 피처 리스트 텍스트
- 기존 짧은 키워드 -> 구체적 설명문으로 변경
- 아이콘은 기존 SVG 유지

### 1-3. CTA 텍스트
- "시작하기" -> "무료로 시작하기" (hero-section, header 모두)

### 1-4. 보안 섹션 분리
- hero-content 내부 카드형 -> hero-section 아래 풀 와이드 밴드로 이동
- 세로 리스트 -> 가로 나열 (4컬럼)
- 타이틀: "보안 및 개인정보 보호" -> "ENTERPRISE-GRADE SECURITY"
- 별도 입장 애니메이션 없음

---

## 2. 레이아웃 스펙

### 2-1. 히어로 섹션 (변경 없음 - 이미 2컬럼)

현재 `.hero-inner`가 이미 flex row 2컬럼이므로 레이아웃 자체는 유지한다.

```
+-- hero-section (85vh, scroll-snap) -------------------------+
|  +-- hero-inner (flex row, max-w: 1280px, gap: 64px) ----+ |
|  |  +-- hero-content (flex: 1) --+  +-- hero-visual ---+  | |
|  |  |  badge                     |  |  graph-window    |  | |
|  |  |  title                     |  |  (mac frame)     |  | |
|  |  |  desc                      |  |  (SVG graph)     |  | |
|  |  |  features                  |  |                   |  | |
|  |  |  CTA buttons               |  |                   |  | |
|  |  +----------------------------+  +-------------------+  | |
|  +--------------------------------------------------------+ |
+-------------------------------------------------------------+
```

변경 사항:
- hero-logo-mark 제거 (badge가 첫 요소)
- security-section 제거 (밴드로 분리)
- hero-actions의 margin-bottom 제거 (security-section이 없으므로 마지막 요소)

### 2-2. 보안 밴드 섹션 (신규)

```
+====================================================================+
|  (풀 와이드, 보안 밴드 배경)                                          |
|  +-- security-band-inner (max-w: 1280px, centered) --------+       |
|  |  [shield-icon] ENTERPRISE-GRADE SECURITY                |       |
|  |                                                          |       |
|  |  * 항목1    * 항목2    * 항목3    * 항목4                  |       |
|  +----------------------------------------------------------+       |
+====================================================================+
```

위치: hero-section과 features-section 사이.

---

## 3. CSS 스펙

### 3-1. 제거할 CSS

```css
/* 제거 대상 */
.hero-logo-mark { ... }
.security-section { ... }
.security-title { ... }
.security-grid { ... }
.security-item { ... }
.security-dot { ... }
.hero-content.is-visible .security-section { ... }
```

### 3-2. hero-actions 수정

기존 `.hero-actions`는 아래에 security-section이 있어서 별도 margin-bottom이 없었다. security-section 제거 후에도 hero-actions가 마지막 요소이므로 추가 margin 불필요.

### 3-3. 보안 밴드 신규 CSS

```css
/* ---- Security band ---- */
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
  color: #34d399;
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
  color: #6ee7b7;
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

참고: emerald 계열 색상(#34d399, #6ee7b7)은 보안 섹션 전용 시맨틱 색상으로, 기존 코드에서도 하드코딩. CSS 변수에 정의되지 않은 상태이므로 기존 패턴 유지.

### 3-4. 보안 밴드 반응형

```css
@media (max-width: 900px) {
  .security-band-inner { padding: 0 40px; }
}

@media (max-width: 768px) {
  .security-band { padding: 24px; }
  .security-band-inner { padding: 0; }
  .security-band-items { flex-direction: column; gap: 10px; }
}
```

---

## 4. Template 구조

### 4-1. hero-content 수정 후 구조

```html
<div class="hero-content" :class="{ 'is-visible': isVisible }">
  <!-- hero-logo-mark 제거됨 -->
  <div class="hero-badge">서버 의존성 시각화 플랫폼</div>
  <h1 class="hero-title">서버 의존성을<br/>한눈에 파악하세요</h1>
  <p class="hero-desc">...</p>
  <div class="hero-features">
    <div class="feature-item">
      <span class="feature-icon"><!-- 기존 SVG --></span>
      <span>서버, 로드밸런서, 인프라, 외부 서비스 간의 의존 관계를 시각화</span>
    </div>
    <div class="feature-item">
      <span class="feature-icon"><!-- 기존 SVG --></span>
      <span>영향 범위 및 순환 의존성 자동 분석 제공</span>
    </div>
    <div class="feature-item">
      <span class="feature-icon"><!-- 기존 SVG --></span>
      <span>프로젝트 단위 팀 협업 지원</span>
    </div>
  </div>
  <div class="hero-actions" ref="heroActionsRef">
    <router-link to="/register" class="btn-primary btn-lg">무료로 시작하기</router-link>
    <router-link to="/login" class="btn-ghost btn-lg">로그인</router-link>
  </div>
  <!-- security-section 제거됨 -->
</div>
```

### 4-2. 보안 밴드 (hero-section과 features-section 사이)

```html
<section class="security-band">
  <div class="security-band-inner">
    <div class="security-band-header">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="flex-shrink:0">
        <path d="M6.5 1L1.5 3.5V6.5C1.5 9.26 3.68 11.85 6.5 12.5C9.32 11.85 11.5 9.26 11.5 6.5V3.5L6.5 1Z" stroke="#34d399" stroke-width="1.2" stroke-linejoin="round"/>
        <path d="M4.5 6.5L5.8 7.8L8.5 5" stroke="#34d399" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="security-band-title">ENTERPRISE-GRADE SECURITY</span>
    </div>
    <div class="security-band-items">
      <div class="security-band-item">
        <span class="security-band-dot"></span>
        <span>서버 IP, 호스트 등 민감한 인프라 정보는 암호화되어 안전하게 보관됩니다</span>
      </div>
      <div class="security-band-item">
        <span class="security-band-dot"></span>
        <span>회원 정보는 암호화 저장되며 외부에 노출되지 않습니다</span>
      </div>
      <div class="security-band-item">
        <span class="security-band-dot"></span>
        <span>담당자 연락처는 기본적으로 가려지며, 본인 확인 후에만 열람할 수 있습니다</span>
      </div>
      <div class="security-band-item">
        <span class="security-band-dot"></span>
        <span>로그인 세션은 안전하게 관리되며 언제든지 로그아웃할 수 있습니다</span>
      </div>
    </div>
  </div>
</section>
```

---

## 5. 수정 대상 파일

| 파일 | 작업 |
|------|------|
| `client/src/views/HeroView.vue` | template + style 수정 (상세 내용은 위 참조) |

프론트엔드만 수정. 백엔드 변경 없음.

---

## 6. 제약 조건

- 보안 밴드의 emerald 색상은 기존 패턴대로 하드코딩 유지
- 나머지 색상은 CSS 변수 사용
- 이모지 사용 금지
- 기존 입장 애니메이션, IntersectionObserver, 그래프 SVG 애니메이션 유지
- 글로벌 버튼 클래스 사용
