<template>
  <div class="hero-page" ref="heroPageRef">
    <header class="site-header" :class="{ 'cta-visible': showHeaderCta }">
      <div class="header-brand">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="4" y1="4" x2="22" y2="22" stroke="#5b8def" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="14,22 22,22 22,14" stroke="#5b8def" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <line x1="28" y1="28" x2="10" y2="10" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
          <polyline points="18,10 10,10 10,18" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <circle cx="6" cy="26" r="3.5" stroke="#787878" stroke-width="1.4" fill="none"/>
          <line x1="6" y1="22.5" x2="6" y2="29.5" stroke="#787878" stroke-width="1" stroke-linecap="round"/>
          <line x1="2.5" y1="26" x2="9.5" y2="26" stroke="#787878" stroke-width="1" stroke-linecap="round"/>
          <path d="M3.5 23.8 Q6 25 8.5 23.8" stroke="#787878" stroke-width="1" fill="none" stroke-linecap="round"/>
          <path d="M3.5 28.2 Q6 27 8.5 28.2" stroke="#787878" stroke-width="1" fill="none" stroke-linecap="round"/>
          <ellipse cx="26" cy="5" rx="4" ry="1.8" stroke="#787878" stroke-width="1.4" fill="none"/>
          <line x1="22" y1="5" x2="22" y2="9" stroke="#787878" stroke-width="1.4"/>
          <line x1="30" y1="5" x2="30" y2="9" stroke="#787878" stroke-width="1.4"/>
          <path d="M22 9 Q26 11 30 9" stroke="#787878" stroke-width="1.4" fill="none"/>
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
              <line x1="4" y1="4" x2="22" y2="22" stroke="#5b8def" stroke-width="2.2" stroke-linecap="round"/>
              <polyline points="14,22 22,22 22,14" stroke="#5b8def" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <line x1="28" y1="28" x2="10" y2="10" stroke="#f97316" stroke-width="2.2" stroke-linecap="round"/>
              <polyline points="18,10 10,10 10,18" stroke="#f97316" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
              <circle cx="6" cy="26" r="3.5" stroke="#787878" stroke-width="1.4" fill="none"/>
              <line x1="6" y1="22.5" x2="6" y2="29.5" stroke="#787878" stroke-width="1" stroke-linecap="round"/>
              <line x1="2.5" y1="26" x2="9.5" y2="26" stroke="#787878" stroke-width="1" stroke-linecap="round"/>
              <path d="M3.5 23.8 Q6 25 8.5 23.8" stroke="#787878" stroke-width="1" fill="none" stroke-linecap="round"/>
              <path d="M3.5 28.2 Q6 27 8.5 28.2" stroke="#787878" stroke-width="1" fill="none" stroke-linecap="round"/>
              <ellipse cx="26" cy="5" rx="4" ry="1.8" stroke="#787878" stroke-width="1.4" fill="none"/>
              <line x1="22" y1="5" x2="22" y2="9" stroke="#787878" stroke-width="1.4"/>
              <line x1="30" y1="5" x2="30" y2="9" stroke="#787878" stroke-width="1.4"/>
              <path d="M22 9 Q26 11 30 9" stroke="#787878" stroke-width="1.4" fill="none"/>
            </svg>
          </div>
          <div class="hero-badge">서버 의존성 시각화 플랫폼</div>
          <h1 class="hero-title">서버 의존성을<br/>한눈에 파악하세요</h1>
          <p class="hero-desc">서버, 로드밸런서, 인프라, 외부 서비스 간의 의존 관계를 시각화하고<br/>팀과 함께 관리하는 협업 도구</p>
          <div class="hero-features">
            <div class="feature-item">
              <span class="feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="1" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4"/>
                  <rect x="10" y="1" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4"/>
                  <rect x="5.5" y="10" width="5" height="5" rx="1.2" stroke="currentColor" stroke-width="1.4"/>
                  <line x1="5" y1="6" x2="7" y2="10" stroke="currentColor" stroke-width="1.2" opacity="0.7"/>
                  <line x1="11" y1="6" x2="9" y2="10" stroke="currentColor" stroke-width="1.2" opacity="0.7"/>
                </svg>
              </span>
              <span>노드 기반 의존성 그래프</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/>
                  <circle cx="8" cy="8" r="5" stroke="currentColor" stroke-width="1.2" stroke-dasharray="2.5 1.5" opacity="0.6"/>
                  <circle cx="8" cy="8" r="7.2" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2" opacity="0.35"/>
                </svg>
              </span>
              <span>영향 범위 및 순환 의존성 분석</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="5" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                  <circle cx="11" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                  <circle cx="8" cy="12" r="2.5" stroke="currentColor" stroke-width="1.4"/>
                  <line x1="6.5" y1="7" x2="7" y2="10" stroke="currentColor" stroke-width="1" opacity="0.5"/>
                  <line x1="9.5" y1="7" x2="9" y2="10" stroke="currentColor" stroke-width="1" opacity="0.5"/>
                </svg>
              </span>
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
                <!-- edges: CDN -> L7 -->
                <line x1="240" y1="38" x2="130" y2="95" stroke="#3ec6d6" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.5" class="edge-animated"/>
                <line x1="240" y1="38" x2="350" y2="95" stroke="#3ec6d6" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.5" class="edge-animated edge-rev"/>
                <!-- L7 -> API -->
                <line x1="130" y1="115" x2="200" y2="148" stroke="#b494f7" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6" class="edge-animated"/>
                <line x1="350" y1="115" x2="280" y2="148" stroke="#b494f7" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6" class="edge-animated edge-rev"/>
                <!-- API -> Auth -->
                <line x1="260" y1="170" x2="410" y2="148" stroke="#5b8def" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.5" class="edge-animated edge-slow"/>
                <!-- API -> DB, Redis, EXT -->
                <line x1="225" y1="175" x2="110" y2="222" stroke="#42b883" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.7" class="edge-animated"/>
                <line x1="240" y1="178" x2="240" y2="222" stroke="#5b8def" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.5" class="edge-animated"/>
                <line x1="255" y1="175" x2="370" y2="222" stroke="#f97316" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.7" class="edge-animated edge-slow"/>
                <!-- DB -> Worker -->
                <line x1="110" y1="262" x2="175" y2="272" stroke="#42b883" stroke-width="1.2" stroke-dasharray="5 3" opacity="0.4" class="edge-animated"/>
                <!-- Worker -> Redis -->
                <line x1="200" y1="268" x2="240" y2="255" stroke="#5b8def" stroke-width="1.2" stroke-dasharray="5 3" opacity="0.4" class="edge-animated edge-rev"/>

                <!-- CDN node (top center) -->
                <rect x="207" y="14" width="66" height="42" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5" class="node-glow" style="animation-delay:-1.8s"/>
                <rect x="210" y="17" width="60" height="36" rx="6" fill="#0e2a2e" stroke="#3ec6d6" stroke-width="1.5"/>
                <text x="240" y="40" text-anchor="middle" fill="#67e8f9" font-size="10" font-weight="700">CDN</text>

                <!-- L7 left node -->
                <rect x="87" y="80" width="86" height="42" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5" class="node-glow"/>
                <rect x="90" y="83" width="80" height="36" rx="6" fill="#2a1f52" stroke="#b494f7" stroke-width="1.5"/>
                <text x="130" y="106" text-anchor="middle" fill="#e9d5ff" font-size="10" font-weight="700">L7-Front</text>

                <!-- L7 right node -->
                <rect x="307" y="80" width="86" height="42" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5" class="node-glow" style="animation-delay:-0.8s"/>
                <rect x="310" y="83" width="80" height="36" rx="6" fill="#2a1f52" stroke="#b494f7" stroke-width="1.5"/>
                <text x="350" y="106" text-anchor="middle" fill="#e9d5ff" font-size="10" font-weight="700">L7-API</text>

                <!-- Auth node (right) -->
                <rect x="397" y="130" width="66" height="36" rx="8" fill="none" stroke="#5b8def" stroke-width="1.3" class="node-glow" style="animation-delay:-0.3s"/>
                <rect x="400" y="133" width="60" height="30" rx="6" fill="#152040" stroke="#5b8def" stroke-width="1.3"/>
                <text x="430" y="153" text-anchor="middle" fill="#93bbfd" font-size="9" font-weight="700">Auth</text>

                <!-- API center node -->
                <rect x="207" y="140" width="66" height="42" rx="8" fill="none" stroke="#3a3a42" stroke-width="1.5" class="node-glow" style="animation-delay:-1.4s"/>
                <rect x="210" y="143" width="60" height="36" rx="6" fill="#1a1a1e" stroke="#3a3a42" stroke-width="1.5"/>
                <text x="240" y="166" text-anchor="middle" fill="#a0a0a0" font-size="10" font-weight="700">API</text>

                <!-- DB node -->
                <rect x="67" y="212" width="86" height="42" rx="8" fill="none" stroke="#42b883" stroke-width="1.5" class="node-glow" style="animation-delay:-0.4s"/>
                <rect x="70" y="215" width="80" height="36" rx="6" fill="#0d2e1c" stroke="#42b883" stroke-width="1.5"/>
                <text x="110" y="238" text-anchor="middle" fill="#86efac" font-size="10" font-weight="700">PostgreSQL</text>

                <!-- Redis node (center bottom) -->
                <rect x="207" y="218" width="66" height="36" rx="8" fill="none" stroke="#5b8def" stroke-width="1.3" class="node-glow" style="animation-delay:-1.6s"/>
                <rect x="210" y="221" width="60" height="30" rx="6" fill="#152040" stroke="#5b8def" stroke-width="1.3"/>
                <text x="240" y="241" text-anchor="middle" fill="#93bbfd" font-size="9" font-weight="700">Redis</text>

                <!-- EXT node -->
                <rect x="337" y="212" width="86" height="42" rx="8" fill="none" stroke="#f97316" stroke-width="1.5" class="node-glow" style="animation-delay:-1.1s"/>
                <rect x="340" y="215" width="80" height="36" rx="6" fill="#2d1c0e" stroke="#f97316" stroke-width="1.5"/>
                <text x="380" y="238" text-anchor="middle" fill="#fdba74" font-size="9" font-weight="700">Slack API</text>

                <!-- Worker node (bottom left) -->
                <rect x="157" y="262" width="66" height="30" rx="7" fill="none" stroke="#42b883" stroke-width="1.2" class="node-glow" style="animation-delay:-0.6s"/>
                <rect x="160" y="265" width="60" height="24" rx="5" fill="#0d2e1c" stroke="#42b883" stroke-width="1.2"/>
                <text x="190" y="281" text-anchor="middle" fill="#86efac" font-size="8" font-weight="700">Worker</text>
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
          <div class="feature-card-icon icon-srv">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="2" stroke="#5b8def" stroke-width="1.8"/>
              <rect x="14" y="3" width="7" height="7" rx="2" stroke="#5b8def" stroke-width="1.8"/>
              <rect x="8" y="14" width="7" height="7" rx="2" stroke="#5b8def" stroke-width="1.8"/>
              <line x1="6.5" y1="10" x2="11.5" y2="14" stroke="#5b8def" stroke-width="1.5"/>
              <line x1="17.5" y1="10" x2="12.5" y2="14" stroke="#5b8def" stroke-width="1.5"/>
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
              <rect x="4" y="4" width="6" height="5" rx="1.5" stroke="#b494f7" stroke-width="1.8"/>
              <rect x="14" y="4" width="6" height="5" rx="1.5" stroke="#b494f7" stroke-width="1.8"/>
              <rect x="9" y="15" width="6" height="5" rx="1.5" stroke="#b494f7" stroke-width="1.8"/>
              <line x1="7" y1="9" x2="7" y2="12" stroke="#b494f7" stroke-width="1.5"/>
              <line x1="17" y1="9" x2="17" y2="12" stroke="#b494f7" stroke-width="1.5"/>
              <line x1="7" y1="12" x2="17" y2="12" stroke="#b494f7" stroke-width="1.5"/>
              <line x1="12" y1="12" x2="12" y2="15" stroke="#b494f7" stroke-width="1.5"/>
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
              <polyline points="3,17 8,12 12,15 16,9 21,11" stroke="#3ec6d6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="3" y1="20" x2="21" y2="20" stroke="#3ec6d6" stroke-width="1.3" opacity="0.4"/>
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
  background: var(--bg-base);
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
  background: rgba(18, 18, 20, 0.92);
  border-bottom-color: var(--border-subtle);
  box-shadow: 0 1px 12px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--accent-soft);
  letter-spacing: 0.02em;
}
.header-actions {
  display: flex;
  gap: 8px;
}
.btn-primary-sm {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 6px 18px; border-radius: 6px; font-size: var(--text-sm); font-weight: 700;
  background: var(--accent-primary); color: #fff; text-decoration: none;
  transition: background 0.15s, box-shadow 0.15s;
}
.btn-primary-sm:hover { background: var(--accent-hover); box-shadow: 0 0 14px rgba(217,119,6,0.35); }
.btn-secondary-sm {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 6px 18px; border-radius: 6px; font-size: var(--text-sm); font-weight: 700;
  background: transparent; color: var(--text-tertiary); border: 1px solid var(--border-default);
  text-decoration: none; transition: all 0.15s;
}
.btn-secondary-sm:hover { border-color: var(--border-strong); color: var(--text-secondary); }

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
  background-image:
    linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px),
    linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
  background-size: 140px 140px, 140px 140px, 28px 28px, 28px 28px;
}
.hero-section::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 70% 70% at 30% 55%, rgba(18,18,20,0.95) 0%, rgba(18,18,20,0.6) 50%, transparent 100%);
  z-index: 0;
  pointer-events: none;
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
  background: rgba(26, 26, 30, 0.85);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.04);
}

/* ---- Badge ---- */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-xs); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--accent-light);
  background: rgba(41, 33, 23, 0.6);
  border: 1px solid rgba(217, 119, 6, 0.35);
  padding: 5px 14px;
  border-radius: 999px;
  margin-bottom: 28px;
  backdrop-filter: blur(4px);
}
.hero-badge::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent-focus);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
  animation: badgePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes badgePulse {
  0%, 100% { box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3); }
  50%       { box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.0); }
}

.hero-title {
  font-size: var(--text-hero); font-weight: 800; line-height: 1.12;
  color: var(--text-primary); margin: 0 0 20px 0; letter-spacing: -0.03em;
}
.hero-desc {
  font-size: var(--text-base); line-height: 1.7; color: var(--text-muted); margin: 0 0 32px 0;
}
.hero-features { display: flex; flex-direction: column; gap: 10px; margin-bottom: 40px; }
.feature-item { display: flex; align-items: center; gap: 10px; font-size: var(--text-sm); color: var(--text-muted); }
.feature-icon { color: var(--accent-focus); width: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.hero-actions { display: flex; gap: 12px; }
.btn-primary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 28px; border-radius: 8px; font-size: var(--text-base); font-weight: 700;
  background: var(--accent-primary); color: #fff; border: none; cursor: pointer;
  text-decoration: none; transition: background 0.15s, box-shadow 0.15s;
}
.btn-primary:hover { background: var(--accent-hover); box-shadow: 0 0 18px rgba(217,119,6,0.4); }
.btn-secondary {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 10px 28px; border-radius: 8px; font-size: var(--text-base); font-weight: 700;
  background: transparent; color: var(--text-tertiary); border: 1px solid var(--border-default);
  cursor: pointer; text-decoration: none; transition: all 0.15s;
}
.btn-secondary:hover { border-color: var(--border-strong); color: var(--text-secondary); }

/* ---- Graph window ---- */
.graph-window {
  width: 100%;
  max-width: 520px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--border-default);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(217, 119, 6, 0.1);
}
.graph-window-bar {
  height: 32px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--bg-base);
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
  background: var(--bg-base);
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
  background: rgba(6, 78, 59, 0.35);
  border: 1px solid rgba(52, 211, 153, 0.25);
  backdrop-filter: blur(8px);
  border-radius: 10px;
}
.security-title {
  display: flex; align-items: center; gap: 7px;
  font-size: var(--text-xs); font-weight: 700; color: #34d399;
  margin-bottom: 12px; letter-spacing: 0.03em;
}
.security-grid { display: flex; flex-direction: column; gap: 7px; }
.security-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: var(--text-xs); color: #6ee7b7; line-height: 1.5;
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
  font-size: var(--text-display); font-weight: 800; color: var(--text-primary);
  margin: 0 0 14px 0; letter-spacing: -0.02em;
}
.features-subtitle {
  font-size: var(--text-base); color: var(--text-tertiary); margin: 0; line-height: 1.6;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.feature-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 16px;
  padding: 28px 28px 28px 32px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
}
/* 좌측 3px 컬러 바 */
.feature-card::before {
  content: '';
  position: absolute;
  left: 0; top: 16px; bottom: 16px;
  width: 3px; border-radius: 0 2px 2px 0;
  opacity: 0.3;
  transition: opacity 0.2s, top 0.2s, bottom 0.2s, box-shadow 0.2s;
}
.feature-card:nth-child(1)::before { background: var(--accent-focus); }
.feature-card:nth-child(2)::before { background: #f97316; }
.feature-card:nth-child(3)::before { background: var(--color-success-light); }
.feature-card:nth-child(4)::before { background: #b494f7; }
.feature-card:nth-child(5)::before { background: #3ec6d6; }
.feature-card:nth-child(6)::before { background: #34d399; }
.feature-card:hover {
  border-color: var(--border-strong);
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.04);
}
.feature-card:hover::before { opacity: 1; top: 0; bottom: 0; }
.feature-card:nth-child(1):hover::before { box-shadow: 2px 0 10px rgba(245,158,11,0.6); }
.feature-card:nth-child(2):hover::before { box-shadow: 2px 0 10px rgba(249,115,22,0.6); }
.feature-card:nth-child(3):hover::before { box-shadow: 2px 0 10px rgba(74,222,128,0.6); }
.feature-card:nth-child(4):hover::before { box-shadow: 2px 0 10px rgba(180,148,247,0.6); }
.feature-card:nth-child(5):hover::before { box-shadow: 2px 0 10px rgba(62,198,214,0.6); }
.feature-card:nth-child(6):hover::before { box-shadow: 2px 0 10px rgba(52,211,153,0.6); }

.feature-card-icon {
  width: 48px; height: 48px;
  border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
  transition: filter 0.2s, box-shadow 0.2s;
}
.icon-srv    { background: rgba(91, 141, 239, 0.12); }
.icon-orange  { background: rgba(249, 115, 22, 0.12); }
.icon-green   { background: rgba(66, 184, 131, 0.12); }
.icon-purple  { background: rgba(180, 148, 247, 0.12); }
.icon-cyan    { background: rgba(62, 198, 214, 0.12); }
.icon-emerald { background: rgba(52, 211, 153, 0.12); }
.feature-card:hover .icon-srv    { background: rgba(91, 141, 239, 0.22);  box-shadow: 0 0 18px rgba(91, 141, 239, 0.2); }
.feature-card:hover .icon-orange  { background: rgba(249, 115, 22, 0.22);  box-shadow: 0 0 18px rgba(249, 115, 22, 0.2); }
.feature-card:hover .icon-green   { background: rgba(66, 184, 131, 0.22);  box-shadow: 0 0 18px rgba(66, 184, 131, 0.2); }
.feature-card:hover .icon-purple  { background: rgba(180, 148, 247, 0.22); box-shadow: 0 0 18px rgba(180, 148, 247, 0.2); }
.feature-card:hover .icon-cyan    { background: rgba(62, 198, 214, 0.22);  box-shadow: 0 0 18px rgba(62, 198, 214, 0.2); }
.feature-card:hover .icon-emerald { background: rgba(52, 211, 153, 0.22);  box-shadow: 0 0 18px rgba(52, 211, 153, 0.2); }

.feature-card-title {
  font-size: var(--text-base); font-weight: 700; color: var(--text-secondary);
  margin: 0 0 8px 0;
}
.feature-card-desc {
  font-size: var(--text-sm); color: var(--text-tertiary); line-height: 1.6;
  margin: 0 0 14px 0;
}
.feature-card-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 5px;
}
.feature-card-list li {
  font-size: var(--text-xs); color: var(--text-tertiary);
  padding-left: 16px;
  position: relative;
}
.feature-card-list li::before {
  content: '';
  position: absolute;
  left: 2px; top: 4px;
  width: 5px; height: 5px;
  border-right: 1.5px solid var(--border-strong);
  border-bottom: 1.5px solid var(--border-strong);
  transform: rotate(-45deg);
}

.features-cta {
  margin-top: 64px;
  text-align: center;
}
.features-cta-text {
  font-size: var(--text-lg); color: var(--text-tertiary); margin: 0 0 24px 0;
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
  .hero-title { font-size: 46px; } /* --text-hero의 반응형 축소 */
  .graph-window { max-width: 420px; }
}
@media (max-width: 900px) {
  .hero-inner { padding: 0 40px; }
  .hero-title { font-size: var(--text-3xl); }
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
