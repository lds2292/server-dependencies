<template>
  <div class="hero-page" ref="heroPageRef">
    <!-- Header -->
    <header class="site-header" :class="{ 'cta-visible': showHeaderCta }">
      <div class="header-inner">
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

        <div class="header-actions">
          <router-link to="/login" class="nav-login">로그인</router-link>
          <transition name="fade">
            <router-link v-if="showHeaderCta" to="/register" class="btn-primary btn-sm">시작하기</router-link>
          </transition>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="hero-section">
      <!-- Background decorations -->
      <div class="blueprint-bg"></div>
      <div class="hero-top-line"></div>
      <div class="hero-glow"></div>

      <div class="hero-inner">
        <!-- Left: Content (5 cols) -->
        <div class="hero-content" :class="{ 'is-visible': isVisible }">
          <div class="hero-badge">
            <span class="badge-dot"></span>
            서버 의존성 시각화 플랫폼
          </div>

          <h1 class="hero-title">서버 의존성을<br/>한눈에 파악하세요</h1>

          <p class="hero-desc">서버, 로드밸런서, 인프라, 외부 서비스 간의 의존 관계를 시각화하고 팀과 함께 관리하는 협업 도구</p>

          <div class="hero-features">
            <div class="feature-item">
              <span class="feature-check">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="feature-text">
                <span class="feature-label">의존성 시각화</span>
                <span class="feature-sub">서버, L7, 인프라, 외부 서비스 간의 관계를 그래프로 표현</span>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-check">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="feature-text">
                <span class="feature-label">영향 범위 분석</span>
                <span class="feature-sub">순환 의존성 자동 탐지 및 경로 분석 제공</span>
              </div>
            </div>
            <div class="feature-item">
              <span class="feature-check">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              <div class="feature-text">
                <span class="feature-label">팀 협업</span>
                <span class="feature-sub">프로젝트 단위로 팀원을 초대하고 함께 관리</span>
              </div>
            </div>
          </div>

          <div class="hero-actions" ref="heroActionsRef">
            <router-link to="/register" class="hero-cta-primary">
              무료로 시작하기
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </router-link>
            <router-link to="/login" class="hero-cta-secondary">로그인</router-link>
          </div>

          <!-- Security section -->
          <div id="security" class="hero-security">
            <div class="security-header">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <rect x="3.5" y="7" width="9" height="7" rx="1.5" stroke="#4ade80" stroke-width="1.3"/>
                <path d="M5.5 7V5C5.5 3.34 6.62 2 8 2C9.38 2 10.5 3.34 10.5 5V7" stroke="#4ade80" stroke-width="1.3" stroke-linecap="round"/>
                <circle cx="8" cy="10.5" r="1" fill="#4ade80"/>
              </svg>
              <span class="security-title">ENTERPRISE-GRADE SECURITY</span>
            </div>
            <div class="security-list">
              <div class="security-item">
                <span class="security-dot"></span>
                서버 IP, 호스트 등 민감한 인프라 정보 암호화 저장
              </div>
              <div class="security-item">
                <span class="security-dot"></span>
                회원 정보 암호화 및 외부 비노출
              </div>
              <div class="security-item">
                <span class="security-dot"></span>
                담당자 연락처 마스킹 및 본인 확인 열람
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Demo window (7 cols) -->
        <div class="hero-visual" :class="{ 'is-visible': isVisible }">
          <div class="demo-perspective">
            <div class="demo-window">
              <!-- Window header -->
              <div class="demo-window-bar">
                <div class="demo-dots">
                  <span class="dot dot-red"></span>
                  <span class="dot dot-yellow"></span>
                  <span class="dot dot-green"></span>
                </div>
                <div class="demo-address-bar">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <rect x="2" y="2" width="12" height="12" rx="3" stroke="currentColor" stroke-width="1.2"/>
                    <path d="M5 8L7 10L11 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>app.serverdeps.io/p/prod-cluster</span>
                </div>
              </div>

              <!-- Canvas -->
              <div class="demo-canvas">
                <!-- Control bar -->
                <div class="canvas-controls">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2"/>
                    <line x1="8" y1="5" x2="8" y2="11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" stroke-width="1.2"/>
                    <line x1="5" y1="8" x2="11" y2="8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                  </svg>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <rect x="2.5" y="2.5" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.2"/>
                    <line x1="2.5" y1="6" x2="13.5" y2="6" stroke="currentColor" stroke-width="1"/>
                  </svg>
                </div>

                <!-- Cycle badge -->
                <div class="canvas-cycle-badge">
                  <span class="cycle-dot"></span>
                  순환 의존성 감지됨
                </div>

                <!-- SVG Graph -->
                <svg class="demo-graph" viewBox="0 0 560 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <!-- Glow filter -->
                  <defs>
                    <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="4" result="blur"/>
                      <feMerge>
                        <feMergeNode in="blur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  <!-- Edges -->
                  <line x1="280" y1="50" x2="150" y2="120" stroke="#3ec6d6" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.5" class="edge-animated"/>
                  <line x1="280" y1="50" x2="410" y2="120" stroke="#3ec6d6" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.5" class="edge-animated edge-rev"/>
                  <line x1="150" y1="145" x2="240" y2="185" stroke="#b494f7" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6" class="edge-animated"/>
                  <line x1="410" y1="145" x2="320" y2="185" stroke="#b494f7" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6" class="edge-animated edge-rev"/>
                  <line x1="300" y1="210" x2="470" y2="185" stroke="#5b8def" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.5" class="edge-animated edge-slow"/>
                  <line x1="260" y1="215" x2="130" y2="275" stroke="#42b883" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.7" class="edge-animated"/>
                  <line x1="280" y1="220" x2="280" y2="275" stroke="#5b8def" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.5" class="edge-animated"/>
                  <line x1="300" y1="215" x2="430" y2="275" stroke="#f97316" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.7" class="edge-animated edge-slow"/>
                  <line x1="130" y1="320" x2="210" y2="345" stroke="#42b883" stroke-width="1.2" stroke-dasharray="5 3" opacity="0.4" class="edge-animated"/>
                  <line x1="240" y1="340" x2="280" y2="315" stroke="#5b8def" stroke-width="1.2" stroke-dasharray="5 3" opacity="0.4" class="edge-animated edge-rev"/>

                  <!-- CDN node (top center) -->
                  <rect x="245" y="22" width="70" height="44" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5" class="node-glow" style="animation-delay:-1.8s"/>
                  <rect x="248" y="25" width="64" height="38" rx="6" fill="#0e2a2e" stroke="#3ec6d6" stroke-width="1.5"/>
                  <text x="280" y="50" text-anchor="middle" fill="#67e8f9" font-size="11" font-weight="700" font-family="var(--font-mono)">CDN</text>

                  <!-- L7-Front (left) -->
                  <rect x="105" y="100" width="90" height="44" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5" class="node-glow"/>
                  <rect x="108" y="103" width="84" height="38" rx="6" fill="#2a1f52" stroke="#b494f7" stroke-width="1.5"/>
                  <text x="150" y="128" text-anchor="middle" fill="#e9d5ff" font-size="11" font-weight="700" font-family="var(--font-mono)">L7-Front</text>

                  <!-- L7-API (right) -->
                  <rect x="365" y="100" width="90" height="44" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5" class="node-glow" style="animation-delay:-0.8s"/>
                  <rect x="368" y="103" width="84" height="38" rx="6" fill="#2a1f52" stroke="#b494f7" stroke-width="1.5"/>
                  <text x="410" y="128" text-anchor="middle" fill="#e9d5ff" font-size="11" font-weight="700" font-family="var(--font-mono)">L7-API</text>

                  <!-- Auth (far right) -->
                  <rect x="452" y="160" width="70" height="38" rx="8" fill="none" stroke="#5b8def" stroke-width="1.3" class="node-glow" style="animation-delay:-0.3s"/>
                  <rect x="455" y="163" width="64" height="32" rx="6" fill="#152040" stroke="#5b8def" stroke-width="1.3"/>
                  <text x="487" y="184" text-anchor="middle" fill="#93bbfd" font-size="10" font-weight="700" font-family="var(--font-mono)">Auth</text>

                  <!-- API (center) -->
                  <rect x="245" y="175" width="70" height="44" rx="8" fill="none" stroke="#3a3a42" stroke-width="1.5" class="node-glow" style="animation-delay:-1.4s"/>
                  <rect x="248" y="178" width="64" height="38" rx="6" fill="#1a1a1e" stroke="#3a3a42" stroke-width="1.5"/>
                  <text x="280" y="203" text-anchor="middle" fill="#a0a0a0" font-size="11" font-weight="700" font-family="var(--font-mono)">API</text>

                  <!-- PostgreSQL (bottom left) -->
                  <rect x="85" y="260" width="90" height="44" rx="8" fill="none" stroke="#42b883" stroke-width="1.5" class="node-glow" style="animation-delay:-0.4s"/>
                  <rect x="88" y="263" width="84" height="38" rx="6" fill="#0d2e1c" stroke="#42b883" stroke-width="1.5"/>
                  <text x="130" y="288" text-anchor="middle" fill="#86efac" font-size="10" font-weight="700" font-family="var(--font-mono)">PostgreSQL</text>

                  <!-- Redis (bottom center) -->
                  <rect x="245" y="268" width="70" height="38" rx="8" fill="none" stroke="#5b8def" stroke-width="1.3" class="node-glow" style="animation-delay:-1.6s"/>
                  <rect x="248" y="271" width="64" height="32" rx="6" fill="#152040" stroke="#5b8def" stroke-width="1.3"/>
                  <text x="280" y="292" text-anchor="middle" fill="#93bbfd" font-size="10" font-weight="700" font-family="var(--font-mono)">Redis</text>

                  <!-- Slack API (bottom right) -->
                  <rect x="390" y="260" width="80" height="44" rx="8" fill="none" stroke="#f97316" stroke-width="1.5" class="node-glow" style="animation-delay:-1.1s"/>
                  <rect x="393" y="263" width="74" height="38" rx="6" fill="#2d1c0e" stroke="#f97316" stroke-width="1.5"/>
                  <text x="430" y="288" text-anchor="middle" fill="#fdba74" font-size="10" font-weight="700" font-family="var(--font-mono)">Slack API</text>

                  <!-- Worker (very bottom) -->
                  <rect x="190" y="335" width="70" height="32" rx="7" fill="none" stroke="#42b883" stroke-width="1.2" class="node-glow" style="animation-delay:-0.6s"/>
                  <rect x="193" y="338" width="64" height="26" rx="5" fill="#0d2e1c" stroke="#42b883" stroke-width="1.2"/>
                  <text x="225" y="356" text-anchor="middle" fill="#86efac" font-size="9" font-weight="700" font-family="var(--font-mono)">Worker</text>
                </svg>

                <!-- Legend -->
                <div class="canvas-legend">
                  <div class="legend-item">
                    <span class="legend-color" style="background: #5b8def"></span>
                    <span>Server</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background: #b494f7"></span>
                    <span>L7 LB</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background: #3ec6d6"></span>
                    <span>Infra</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background: #42b883"></span>
                    <span>External</span>
                  </div>
                  <div class="legend-item">
                    <span class="legend-color" style="background: #8b5cf6"></span>
                    <span>DNS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section (preserved) -->
    <section id="features" class="features-section">
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
          <router-link to="/register" class="btn-primary btn-lg">무료로 시작하기</router-link>
          <router-link to="/login" class="btn-ghost btn-lg">로그인</router-link>
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

/* ============================================
   HEADER
   ============================================ */
.site-header {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 50;
  height: 64px;
  border-bottom: 1px solid transparent;
  background: transparent;
  transition: background 0.2s, border-color 0.2s, box-shadow 0.2s, backdrop-filter 0.2s;
}
.site-header.cta-visible {
  background: rgba(18, 18, 20, 0.8);
  border-bottom-color: var(--border-default);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.header-inner {
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--accent-soft);
  letter-spacing: 0.02em;
  flex-shrink: 0;
}
.header-nav {
  display: none;
  align-items: center;
  gap: 32px;
}
.nav-link {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color 0.15s;
}
.nav-link:hover {
  color: var(--text-primary);
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-login {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s;
}
.nav-login:hover {
  color: var(--text-primary);
}

/* ============================================
   HERO SECTION
   ============================================ */
.hero-section {
  position: relative;
  scroll-snap-align: start;
  overflow: hidden;
  padding-top: 8rem;
  padding-bottom: 6rem;
}

/* Blueprint grid background */
.blueprint-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(58, 58, 66, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(58, 58, 66, 0.2) 1px, transparent 1px);
  background-size: 40px 40px;
  mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  z-index: 0;
  pointer-events: none;
}

/* Top amber line */
.hero-top-line {
  position: absolute;
  top: 64px;
  left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(217, 119, 6, 0.5), transparent);
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
}

/* Background glow */
.hero-glow {
  position: absolute;
  top: 10%;
  left: 50%;
  transform: translateX(-50%);
  width: 800px;
  height: 300px;
  background: rgba(217, 119, 6, 0.1);
  filter: blur(120px);
  border-radius: 9999px;
  z-index: 0;
  pointer-events: none;
}

.hero-inner {
  position: relative;
  z-index: 2;
  max-width: 80rem;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 4rem;
  align-items: center;
}

/* ============================================
   HERO CONTENT (LEFT)
   ============================================ */
.hero-content {
  opacity: 0;
}

/* Badge */
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 12px;
  border-radius: 9999px;
  background: var(--accent-bg-medium);
  border: 1px solid rgba(217, 119, 6, 0.3);
  color: var(--accent-soft);
  font-size: 0.875rem;
  font-weight: 600;
  box-shadow: 0 0 20px rgba(217, 119, 6, 0.15);
  margin-bottom: 1.5rem;
}
.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-soft);
  animation: badgePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
@keyframes badgePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* Title */
.hero-title {
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0 0 1.5rem 0;
  background: linear-gradient(135deg, #ffffff, var(--text-primary), var(--text-muted));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Description */
.hero-desc {
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.625;
  max-width: 32rem;
  margin: 0 0 2.5rem 0;
}

/* Feature list */
.hero-features {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.feature-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  padding: 4px;
  color: var(--accent-soft);
  flex-shrink: 0;
  margin-top: 1px;
}
.feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.feature-label {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--text-primary);
}
.feature-sub {
  font-size: var(--text-sm);
  font-weight: 400;
  color: var(--text-tertiary);
}

/* CTA Buttons */
.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 2.5rem;
}
.hero-cta-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--accent-primary);
  color: #fff;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 4px 20px rgba(217, 119, 6, 0.4);
  transition: all 0.2s;
  white-space: nowrap;
}
.hero-cta-primary:hover {
  background: var(--accent-hover);
  box-shadow: 0 4px 25px rgba(217, 119, 6, 0.6);
  transform: translateY(-2px);
}
.hero-cta-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  color: var(--text-primary);
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 1.125rem;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.2s;
  white-space: nowrap;
}
.hero-cta-secondary:hover {
  border-color: var(--text-muted);
  background: var(--bg-elevated);
}

/* Security section */
.hero-security {
  border-top: 1px solid var(--border-default);
  padding-top: 2rem;
}
.security-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.security-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.security-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}
.security-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: var(--text-sm);
  color: var(--text-tertiary);
  line-height: 1.5;
}
.security-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-tertiary);
  margin-top: 6px;
  flex-shrink: 0;
}

/* ============================================
   HERO VISUAL (RIGHT)
   ============================================ */
.hero-visual {
  display: none;
  justify-content: center;
  align-items: center;
  opacity: 0;
}

.demo-perspective {
  perspective: 1000px;
  width: 100%;
}

.demo-window {
  background: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(217, 119, 6, 0.1);
  height: 600px;
  display: flex;
  flex-direction: column;
  transition: transform 0.4s ease;
}

/* Window header bar */
.demo-window-bar {
  height: 48px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  flex-shrink: 0;
}
.demo-dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}
.dot-red { background: #ff5f57; }
.dot-yellow { background: #febc2e; }
.dot-green { background: #28c840; }

.demo-address-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 5px 10px;
  font-size: var(--text-xs);
  font-family: var(--font-mono);
  color: var(--text-tertiary);
}
.demo-address-bar svg {
  color: var(--color-success);
  flex-shrink: 0;
}

/* Canvas area */
.demo-canvas {
  flex: 1;
  position: relative;
  background:
    radial-gradient(circle, #2a2a30 1px, transparent 1px);
  background-size: 24px 24px;
  background-color: var(--bg-base);
  overflow: hidden;
}

/* Canvas controls (top left) */
.canvas-controls {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 4px;
  background: rgba(35, 35, 40, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 6px 8px;
  z-index: 3;
  color: var(--text-tertiary);
}
.canvas-controls svg {
  cursor: pointer;
  transition: color 0.15s;
}
.canvas-controls svg:hover {
  color: var(--text-primary);
}

/* Cycle detection badge (top right) */
.canvas-cycle-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(26, 26, 30, 0.9);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 6px;
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--accent-soft);
  box-shadow: 0 0 16px rgba(217, 119, 6, 0.15);
  z-index: 3;
}
.cycle-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-soft);
  animation: badgePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}

/* Demo graph SVG */
.demo-graph {
  width: 100%;
  height: 100%;
  display: block;
}

/* Legend (bottom left) */
.canvas-legend {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  gap: 12px;
  background: rgba(35, 35, 40, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 6px 12px;
  z-index: 3;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
.legend-color {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* ============================================
   GRAPH ANIMATIONS
   ============================================ */
@keyframes marchDash {
  to { stroke-dashoffset: -10; }
}
@keyframes marchDashRev {
  to { stroke-dashoffset: 10; }
}
@keyframes nodePulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.5; }
}

.demo-graph .edge-animated {
  animation: marchDash 1.4s linear infinite;
}
.demo-graph .edge-rev {
  animation: marchDashRev 1.4s linear infinite;
}
.demo-graph .edge-slow {
  animation: marchDash 2.2s linear infinite;
}
.demo-graph .node-glow {
  animation: nodePulse 2.4s ease-in-out infinite;
}

/* ============================================
   ENTRY ANIMATIONS
   ============================================ */
@keyframes heroFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes heroFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.hero-content.is-visible {
  animation: heroFadeIn 0.01s forwards;
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
.hero-content.is-visible .hero-security {
  animation: heroFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.55s;
}
.hero-visual.is-visible {
  animation: heroFadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.2s;
}

/* ============================================
   FEATURES SECTION (PRESERVED)
   ============================================ */
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

/* ============================================
   TRANSITIONS
   ============================================ */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ============================================
   RESPONSIVE
   ============================================ */
@media (min-width: 640px) {
  .hero-actions {
    flex-direction: row;
  }
}

@media (min-width: 768px) {
  .header-nav {
    display: flex;
  }
}

@media (min-width: 1024px) {
  .hero-section {
    padding-top: 10rem;
    padding-bottom: 8rem;
  }
  .hero-inner {
    grid-template-columns: 5fr 7fr;
  }
  .hero-title {
    font-size: 3.75rem;
  }
  .hero-visual {
    display: flex;
  }
  .demo-window {
    height: 700px;
    transform: rotateY(-2deg) rotateX(2deg);
  }
  .demo-window:hover {
    transform: rotateY(0) rotateX(0);
  }
}

@media (max-width: 1023px) {
  .hero-visual {
    display: none;
  }
}

@media (max-width: 900px) {
  .features-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .hero-section { padding-top: 7rem; padding-bottom: 4rem; }
  .hero-title { font-size: 2.25rem; }
  .site-header { height: 56px; }
  .features-section { padding: 60px 24px 80px; }
  .features-grid { grid-template-columns: 1fr; }
}
</style>
