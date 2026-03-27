<template>
  <div class="hero-page" ref="heroPageRef">
    <header class="site-header" :class="{ 'cta-visible': showHeaderCta }">
      <div class="header-brand">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="4" y1="4" x2="22" y2="22" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="14,22 22,22 22,14" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <line x1="28" y1="28" x2="10" y2="10" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="18,10 10,10 10,18" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="6" cy="26" r="3.5" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
          <line x1="6" y1="22.5" x2="6" y2="29.5" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>
          <line x1="2.5" y1="26" x2="9.5" y2="26" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>
          <path d="M3.5 23.8 Q6 25 8.5 23.8" stroke="#94a3b8" stroke-width="1" fill="none" stroke-linecap="round"/>
          <path d="M3.5 28.2 Q6 27 8.5 28.2" stroke="#94a3b8" stroke-width="1" fill="none" stroke-linecap="round"/>
          <ellipse cx="26" cy="5" rx="4" ry="1.8" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
          <line x1="22" y1="5" x2="22" y2="9" stroke="#94a3b8" stroke-width="1.4"/>
          <line x1="30" y1="5" x2="30" y2="9" stroke="#94a3b8" stroke-width="1.4"/>
          <path d="M22 9 Q26 11 30 9" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
        </svg>
        Server Dependencies
      </div>
      <transition name="fade">
        <div v-if="showHeaderCta" class="header-actions">
          <router-link to="/register" class="btn-primary-sm">시작하기</router-link>
          <router-link to="/login" class="btn-secondary-sm">로그인</router-link>
        </div>
      </transition>
    </header>

    <section class="hero-section">
      <div class="hero-inner">
        <div class="hero-content" :class="{ 'is-visible': isVisible }">
          <div class="hero-logo-mark">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="4" y1="4" x2="22" y2="22" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round"/>
              <polyline points="14,22 22,22 22,14" stroke="#60a5fa" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <line x1="28" y1="28" x2="10" y2="10" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
              <polyline points="18,10 10,10 10,18" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <circle cx="6" cy="26" r="3.5" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
              <line x1="6" y1="22.5" x2="6" y2="29.5" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>
              <line x1="2.5" y1="26" x2="9.5" y2="26" stroke="#94a3b8" stroke-width="1" stroke-linecap="round"/>
              <path d="M3.5 23.8 Q6 25 8.5 23.8" stroke="#94a3b8" stroke-width="1" fill="none" stroke-linecap="round"/>
              <path d="M3.5 28.2 Q6 27 8.5 28.2" stroke="#94a3b8" stroke-width="1" fill="none" stroke-linecap="round"/>
              <ellipse cx="26" cy="5" rx="4" ry="1.8" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
              <line x1="22" y1="5" x2="22" y2="9" stroke="#94a3b8" stroke-width="1.4"/>
              <line x1="30" y1="5" x2="30" y2="9" stroke="#94a3b8" stroke-width="1.4"/>
              <path d="M22 9 Q26 11 30 9" stroke="#94a3b8" stroke-width="1.4" fill="none"/>
            </svg>
          </div>
          <h1 class="hero-title">서버 의존성을<br/>한눈에 파악하세요</h1>
          <p class="hero-desc">서버, 로드밸런서, 인프라, 외부 서비스 간의 의존 관계를 시각화하고<br/>팀과 함께 관리하는 협업 도구</p>
          <div class="hero-features">
            <div class="feature-item">
              <span class="feature-icon">▣</span>
              <span>노드 기반 의존성 그래프</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">◈</span>
              <span>영향 범위 및 순환 의존성 분석</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">◎</span>
              <span>프로젝트 단위 팀 협업</span>
            </div>
          </div>
          <div class="hero-actions" ref="heroActionsRef">
            <router-link to="/register" class="btn-primary">시작하기</router-link>
            <router-link to="/login" class="btn-secondary">로그인</router-link>
          </div>

          <div class="security-section">
            <div class="security-title">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style="flex-shrink:0">
                <path d="M6.5 1L1.5 3.5V6.5C1.5 9.26 3.68 11.85 6.5 12.5C9.32 11.85 11.5 9.26 11.5 6.5V3.5L6.5 1Z" stroke="#34d399" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M4.5 6.5L5.8 7.8L8.5 5" stroke="#34d399" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>보안 및 개인정보 보호</span>
            </div>
            <div class="security-grid">
              <div class="security-item">
                <span class="security-dot"></span>
                <span>서버 IP, 호스트 등 민감한 인프라 정보는 암호화되어 안전하게 보관됩니다</span>
              </div>
              <div class="security-item">
                <span class="security-dot"></span>
                <span>회원 정보는 암호화 저장되며 외부에 노출되지 않습니다</span>
              </div>
              <div class="security-item">
                <span class="security-dot"></span>
                <span>담당자 연락처는 기본적으로 가려지며, 본인 확인 후에만 열람할 수 있습니다</span>
              </div>
              <div class="security-item">
                <span class="security-dot"></span>
                <span>로그인 세션은 안전하게 관리되며 언제든지 로그아웃할 수 있습니다</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hero-visual" :class="{ 'is-visible': isVisible }">
          <div class="graph-window">
            <div class="graph-window-bar">
              <span class="window-dot dot-red"></span>
              <span class="window-dot dot-yellow"></span>
              <span class="window-dot dot-green"></span>
            </div>
            <div class="graph-preview">
              <svg viewBox="0 0 480 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- edges -->
                <line x1="90" y1="90" x2="220" y2="148" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6" class="edge-animated"/>
                <line x1="390" y1="90" x2="260" y2="148" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6" class="edge-animated edge-rev"/>
                <line x1="240" y1="168" x2="120" y2="238" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.7" class="edge-animated"/>
                <line x1="240" y1="168" x2="360" y2="238" stroke="#f97316" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.7" class="edge-animated edge-slow"/>

                <!-- L7 left node -->
                <rect x="57" y="66" width="66" height="48" rx="8" fill="none" stroke="#3b82f6" stroke-width="1.5" class="node-glow"/>
                <rect x="60" y="69" width="60" height="42" rx="6" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1.5"/>
                <text x="90" y="95" text-anchor="middle" fill="#93c5fd" font-size="10" font-weight="700">L7</text>

                <!-- L7 right node -->
                <rect x="357" y="66" width="66" height="48" rx="8" fill="none" stroke="#3b82f6" stroke-width="1.5" class="node-glow" style="animation-delay:-0.8s"/>
                <rect x="360" y="69" width="60" height="42" rx="6" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1.5"/>
                <text x="390" y="95" text-anchor="middle" fill="#93c5fd" font-size="10" font-weight="700">L7</text>

                <!-- API center node -->
                <rect x="207" y="144" width="66" height="48" rx="8" fill="none" stroke="#475569" stroke-width="1.5" class="node-glow" style="animation-delay:-1.4s"/>
                <rect x="210" y="147" width="60" height="42" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
                <text x="240" y="173" text-anchor="middle" fill="#cbd5e1" font-size="10" font-weight="700">API</text>

                <!-- DB node -->
                <rect x="87" y="216" width="66" height="48" rx="8" fill="none" stroke="#22c55e" stroke-width="1.5" class="node-glow" style="animation-delay:-0.4s"/>
                <rect x="90" y="219" width="60" height="42" rx="6" fill="#1a2d1a" stroke="#22c55e" stroke-width="1.5"/>
                <text x="120" y="245" text-anchor="middle" fill="#86efac" font-size="10" font-weight="700">DB</text>

                <!-- EXT node -->
                <rect x="327" y="216" width="66" height="48" rx="8" fill="none" stroke="#f97316" stroke-width="1.5" class="node-glow" style="animation-delay:-1.1s"/>
                <rect x="330" y="219" width="60" height="42" rx="6" fill="#2d1b1b" stroke="#f97316" stroke-width="1.5"/>
                <text x="360" y="245" text-anchor="middle" fill="#fdba74" font-size="9" font-weight="700">EXT</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="features-section">
      <div class="features-header">
        <h2 class="features-title">팀의 인프라를 더 스마트하게</h2>
        <p class="features-subtitle">복잡한 서버 구조를 그래프로 시각화하고, 변경의 영향을 즉시 파악하세요</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-card-icon icon-blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="2" stroke="#60a5fa" stroke-width="1.8"/>
              <rect x="14" y="3" width="7" height="7" rx="2" stroke="#60a5fa" stroke-width="1.8"/>
              <rect x="8" y="14" width="7" height="7" rx="2" stroke="#60a5fa" stroke-width="1.8"/>
              <line x1="6.5" y1="10" x2="11.5" y2="14" stroke="#60a5fa" stroke-width="1.5"/>
              <line x1="17.5" y1="10" x2="12.5" y2="14" stroke="#60a5fa" stroke-width="1.5"/>
            </svg>
          </div>
          <h3 class="feature-card-title">의존성 그래프 시각화</h3>
          <p class="feature-card-desc">서버, L7, 인프라, 외부 서비스를 노드로 표현하고 의존 관계를 직관적인 그래프로 확인합니다.</p>
          <ul class="feature-card-list">
            <li>서버 / L7 / 인프라 / 외부 서비스 노드 타입</li>
            <li>방향성 엣지로 호출 방향 표현</li>
            <li>노드 클릭으로 상세 정보 확인</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-icon icon-orange">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="#fb923c" stroke-width="1.8"/>
              <circle cx="12" cy="12" r="7" stroke="#fb923c" stroke-width="1.5" stroke-dasharray="3 2" opacity="0.6"/>
              <circle cx="12" cy="12" r="10.5" stroke="#fb923c" stroke-width="1.2" stroke-dasharray="2 3" opacity="0.35"/>
            </svg>
          </div>
          <h3 class="feature-card-title">영향 범위 분석</h3>
          <p class="feature-card-desc">특정 노드에 장애나 변경이 발생했을 때 영향을 받는 서비스를 즉시 파악합니다.</p>
          <ul class="feature-card-list">
            <li>upstream / downstream 영향 노드 강조</li>
            <li>순환 의존성 자동 탐지 및 경고</li>
            <li>두 노드 간 경로 탐색</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-icon icon-green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="9" cy="7" r="3" stroke="#4ade80" stroke-width="1.8"/>
              <circle cx="17" cy="7" r="3" stroke="#4ade80" stroke-width="1.8"/>
              <circle cx="13" cy="17" r="3" stroke="#4ade80" stroke-width="1.8"/>
              <line x1="11.5" y1="9.5" x2="14.5" y2="14.5" stroke="#4ade80" stroke-width="1.5" opacity="0.7"/>
              <line x1="14.5" y1="9.5" x2="14" y2="14" stroke="#4ade80" stroke-width="1.5" opacity="0.7"/>
            </svg>
          </div>
          <h3 class="feature-card-title">팀 협업</h3>
          <p class="feature-card-desc">프로젝트 단위로 팀원을 초대하고 함께 의존성 맵을 관리합니다.</p>
          <ul class="feature-card-list">
            <li>멤버 초대 및 역할 관리</li>
            <li>담당자 정보 및 연락처 관리</li>
            <li>변경 이력 추적</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-icon icon-purple">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="4" y="4" width="6" height="5" rx="1.5" stroke="#a78bfa" stroke-width="1.8"/>
              <rect x="14" y="4" width="6" height="5" rx="1.5" stroke="#a78bfa" stroke-width="1.8"/>
              <rect x="9" y="15" width="6" height="5" rx="1.5" stroke="#a78bfa" stroke-width="1.8"/>
              <line x1="7" y1="9" x2="7" y2="12" stroke="#a78bfa" stroke-width="1.5"/>
              <line x1="17" y1="9" x2="17" y2="12" stroke="#a78bfa" stroke-width="1.5"/>
              <line x1="7" y1="12" x2="17" y2="12" stroke="#a78bfa" stroke-width="1.5"/>
              <line x1="12" y1="12" x2="12" y2="15" stroke="#a78bfa" stroke-width="1.5"/>
            </svg>
          </div>
          <h3 class="feature-card-title">다양한 노드 상세 정보</h3>
          <p class="feature-card-desc">각 노드에 IP, 포트, 설명, 담당자, 태그 등 풍부한 메타데이터를 기록합니다.</p>
          <ul class="feature-card-list">
            <li>서버 다중 IP 및 포트 관리</li>
            <li>L7 라우팅 규칙 기록</li>
            <li>외부 서비스 엔드포인트 관리</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-icon icon-cyan">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <polyline points="3,17 8,12 12,15 16,9 21,11" stroke="#22d3ee" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="3" y1="20" x2="21" y2="20" stroke="#22d3ee" stroke-width="1.3" opacity="0.4"/>
            </svg>
          </div>
          <h3 class="feature-card-title">그래프 편집 및 관리</h3>
          <p class="feature-card-desc">드래그 앤 드롭으로 직관적으로 그래프를 구성하고, 실행 취소/다시 실행을 지원합니다.</p>
          <ul class="feature-card-list">
            <li>Undo / Redo (Cmd+Z / Cmd+Shift+Z)</li>
            <li>PNG / JSON 내보내기</li>
            <li>우클릭 컨텍스트 메뉴</li>
          </ul>
        </div>

        <div class="feature-card">
          <div class="feature-card-icon icon-emerald">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 21.5C16.6 20.5 20 16.4 20 12V6L12 2Z" stroke="#34d399" stroke-width="1.8" stroke-linejoin="round"/>
              <path d="M9 12L10.8 13.8L15 9" stroke="#34d399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="feature-card-title">보안 중심 설계</h3>
          <p class="feature-card-desc">인프라 민감 정보를 암호화하여 저장하고 안전하게 관리합니다.</p>
          <ul class="feature-card-list">
            <li>서버 IP / 호스트 암호화 저장</li>
            <li>연락처 마스킹 및 본인 확인 열람</li>
            <li>감사 로그 기록</li>
          </ul>
        </div>
      </div>

      <div class="features-cta">
        <p class="features-cta-text">지금 바로 팀의 인프라를 시각화해보세요</p>
        <div class="features-cta-actions">
          <router-link to="/register" class="btn-primary">무료로 시작하기</router-link>
          <router-link to="/login" class="btn-secondary">로그인</router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

const heroPageRef = ref<HTMLElement | null>(null)
const heroActionsRef = ref<HTMLElement | null>(null)
const showHeaderCta = ref(false)
const isVisible = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
  nextTick(() => {
    isVisible.value = true
  })
  if (!heroActionsRef.value) return
  observer = new IntersectionObserver(
    ([entry]) => {
      showHeaderCta.value = !entry.isIntersecting
    },
    { root: heroPageRef.value, threshold: 0 }
  )
  observer.observe(heroActionsRef.value)
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<style scoped>
.hero-page {
  background: #0f172a;
  height: 100vh;
  overflow-y: scroll;
  scroll-snap-type: y mandatory;
}

/* ---- Header ---- */
.site-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 56px;
  background: transparent;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  border-bottom: 1px solid transparent;
}
.site-header.cta-visible {
  background: rgba(15, 23, 42, 0.92);
  border-bottom-color: #1e293b;
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #60a5fa;
  letter-spacing: 0.02em;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.btn-primary-sm {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 6px 18px; border-radius: 6px; font-size: 13px; font-weight: 700;
  background: #2563eb; color: #fff; text-decoration: none;
  transition: background 0.15s;
}
.btn-primary-sm:hover { background: #1d4ed8; }
.btn-secondary-sm {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 6px 18px; border-radius: 6px; font-size: 13px; font-weight: 700;
  background: transparent; color: #94a3b8; border: 1px solid #334155;
  text-decoration: none; transition: all 0.15s;
}
.btn-secondary-sm:hover { border-color: #475569; color: #e2e8f0; }

/* ---- Hero section ---- */
.hero-section {
  height: 85vh;
  scroll-snap-align: start;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 56px 0 40px;
  position: relative;
  overflow: hidden;
  background-image: radial-gradient(circle, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size: 28px 28px;
}


.hero-inner {
  display: flex;
  align-items: center;
  gap: 64px;
  width: 100%;
  max-width: 1280px;
  padding: 0 60px;
  position: relative;
  z-index: 1;
}

.hero-content {
  flex: 1 1 0;
  max-width: 600px;
  min-width: 0;
  opacity: 0;
}
.hero-visual {
  flex: 1 1 0;
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
}

/* ---- 입장 애니메이션 ---- */
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes heroFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.hero-content.is-visible {
  animation: heroFadeIn 0.01s forwards; /* base opacity restore */
}
.hero-content.is-visible .hero-badge {
  animation: heroFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.05s;
}
.hero-content.is-visible .hero-title {
  animation: heroFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.15s;
}
.hero-content.is-visible .hero-desc {
  animation: heroFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.25s;
}
.hero-content.is-visible .hero-features {
  animation: heroFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.35s;
}
.hero-content.is-visible .hero-actions {
  animation: heroFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.45s;
}
.hero-content.is-visible .security-section {
  animation: heroFadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.55s;
}
.hero-visual.is-visible {
  animation: heroFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.2s;
}

/* ---- Logo mark ---- */
.hero-logo-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px; height: 64px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid #334155;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.04);
}

/* ---- Badge ---- */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: #93c5fd;
  background: rgba(30, 58, 95, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.35);
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 28px;
  backdrop-filter: blur(4px);
}
.hero-badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  animation: badgePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes badgePulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); }
  50%       { box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.0); }
}

.hero-title {
  font-size: 56px; font-weight: 800; line-height: 1.12;
  color: #f1f5f9; margin: 0 0 20px 0; letter-spacing: -0.03em;
}
.hero-desc {
  font-size: 15px; line-height: 1.7; color: #94a3b8; margin: 0 0 32px 0;
}
.hero-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 40px; }
.feature-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #cbd5e1; }
.feature-icon { color: #3b82f6; font-size: 14px; width: 20px; text-align: center; }
.hero-actions { display: flex; gap: 12px; }
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;
  background: #2563eb; color: #fff; border: none; cursor: pointer;
  text-decoration: none; transition: background 0.15s;
}
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;
  background: transparent; color: #94a3b8; border: 1px solid #334155;
  cursor: pointer; text-decoration: none; transition: all 0.15s;
}
.btn-secondary:hover { border-color: #475569; color: #e2e8f0; }

/* ---- Graph window ---- */
.graph-window {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid #334155;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1);
}
.graph-window-bar {
  height: 32px;
  background: #1e293b;
  border-bottom: 1px solid #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
}
.window-dot {
  width: 10px; height: 10px; border-radius: 50%;
}
.dot-red    { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green  { background: #28c840; }

.graph-preview {
  background: #0f172a;
  aspect-ratio: 16 / 10;
}
.graph-preview svg { width: 100%; height: 100%; display: block; }

/* Graph animations */
@keyframes marchDash {
  to { stroke-dashoffset: -10; }
}
@keyframes marchDashRev {
  to { stroke-dashoffset: 10; }
}
@keyframes nodePulse {
  0%, 100% { opacity: 0.15; }
  50%       { opacity: 0.5; }
}

.graph-preview .edge-animated {
  animation: marchDash 1.4s linear infinite;
}
.graph-preview .edge-rev {
  animation: marchDashRev 1.4s linear infinite;
}
.graph-preview .edge-slow {
  animation: marchDash 2.2s linear infinite;
}
.graph-preview .node-glow {
  animation: nodePulse 2.4s ease-in-out infinite;
}

/* ---- Security section ---- */
.security-section {
  margin-top: 32px;
  padding: 16px 18px;
  background: rgba(6, 78, 59, 0.15);
  border: 1px solid rgba(52, 211, 153, 0.2);
  border-radius: 10px;
}
.security-title {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 700; color: #34d399;
  margin-bottom: 12px; letter-spacing: 0.03em;
}
.security-grid { display: flex; flex-direction: column; gap: 7px; }
.security-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: #6ee7b7; line-height: 1.5;
}
.security-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #34d399; margin-top: 5px; flex-shrink: 0;
}

/* ---- Features section ---- */
.features-section {
  scroll-snap-align: start;
  min-height: auto;
  padding: 60px 40px 80px;
  max-width: 1100px;
  margin: 0 auto;
}
.features-header {
  text-align: center;
  margin-bottom: 56px;
}
.features-title {
  font-size: 34px; font-weight: 800; color: #f1f5f9;
  margin: 0 0 14px 0; letter-spacing: -0.02em;
}
.features-subtitle {
  font-size: 15px; color: #94a3b8; margin: 0; line-height: 1.6;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.feature-card {
  background: linear-gradient(145deg, #1e293b 0%, #162032 100%);
  border: 1px solid #263348;
  border-radius: 16px;
  padding: 28px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
/* 상단 shimmer */
.feature-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
  pointer-events: none;
}
/* hover 시 accent color bar */
.feature-card::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  border-radius: 16px 16px 0 0;
  opacity: 0;
  transition: opacity 0.2s;
}
.feature-card:nth-child(1)::after { background: #3b82f6; }
.feature-card:nth-child(2)::after { background: #f97316; }
.feature-card:nth-child(3)::after { background: #4ade80; }
.feature-card:nth-child(4)::after { background: #a78bfa; }
.feature-card:nth-child(5)::after { background: #22d3ee; }
.feature-card:nth-child(6)::after { background: #34d399; }
.feature-card:hover {
  border-color: #334155;
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}
.feature-card:hover::after { opacity: 1; }

.feature-card-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
}
.icon-blue    { background: rgba(59, 130, 246, 0.12); }
.icon-orange  { background: rgba(249, 115, 22, 0.12); }
.icon-green   { background: rgba(74, 222, 128, 0.12); }
.icon-purple  { background: rgba(167, 139, 250, 0.12); }
.icon-cyan    { background: rgba(34, 211, 238, 0.12); }
.icon-emerald { background: rgba(52, 211, 153, 0.12); }

.feature-card-title {
  font-size: 15px; font-weight: 700; color: #e2e8f0;
  margin: 0 0 8px 0;
}
.feature-card-desc {
  font-size: 13px; color: #64748b; line-height: 1.6;
  margin: 0 0 14px 0;
}
.feature-card-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 5px;
}
.feature-card-list li {
  font-size: 12px; color: #64748b;
  padding-left: 16px;
  position: relative;
}
.feature-card-list li::before {
  content: '';
  position: absolute;
  left: 2px; top: 4px;
  width: 5px; height: 5px;
  border-right: 1.5px solid #475569;
  border-bottom: 1.5px solid #475569;
  transform: rotate(-45deg);
}

.features-cta {
  margin-top: 64px;
  text-align: center;
}
.features-cta-text {
  font-size: 16px; color: #94a3b8; margin: 0 0 24px 0;
}
.features-cta-actions {
  display: flex; gap: 12px; justify-content: center;
}

/* ---- Transitions ---- */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ---- Responsive ---- */
@media (max-width: 1100px) {
  .hero-inner { gap: 48px; }
  .hero-title { font-size: 46px; }
  .graph-window { max-width: 420px; }
}
@media (max-width: 900px) {
  .hero-inner { padding: 0 40px; }
  .hero-title { font-size: 40px; }
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .hero-section { padding: 80px 0 60px; }
  .hero-inner { flex-direction: column; gap: 40px; padding: 0 24px; }
  .hero-title { font-size: 32px; }
  .hero-visual { display: none; }
  .site-header { padding: 0 24px; }
  .features-section { padding: 60px 24px 80px; }
  .features-grid { grid-template-columns: 1fr; }
}
</style>
