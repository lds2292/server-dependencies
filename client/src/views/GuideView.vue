<template>
  <div class="guide-page" ref="guidePageRef">
    <!-- Header -->
    <header class="site-header" :class="{ 'header-scrolled': headerScrolled }">
      <div class="header-inner">
        <div class="header-brand">
          <router-link to="/" class="brand-link">
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
            Seraph
          </router-link>
        </div>

        <div class="header-actions">
          <router-link to="/guide" class="nav-link active">{{ $t('guide.nav.guide') }}</router-link>
          <router-link to="/login" class="nav-login">{{ $t('guide.nav.login') }}</router-link>
          <router-link to="/register" class="btn-primary btn-sm">{{ $t('guide.nav.start') }}</router-link>
          <button class="locale-toggle" @click="toggleLocale">{{ currentLocale === 'ko' ? 'English' : '한국어' }}</button>
        </div>
      </div>
    </header>

    <!-- Guide Hero -->
    <section class="guide-hero">
      <div class="blueprint-bg"></div>
      <div class="guide-hero-glow"></div>
      <div class="guide-hero-inner">
        <span class="guide-badge">{{ $t('guide.hero.badge') }}</span>
        <h1 class="guide-hero-title">{{ $t('guide.hero.title') }}</h1>
        <p class="guide-hero-subtitle">{{ $t('guide.hero.subtitle') }}</p>
      </div>
    </section>

    <!-- Sections -->
    <section
      v-for="(section, idx) in sections"
      :key="section.number"
      :ref="el => { if (el) sectionRefs[idx] = el as HTMLElement }"
      class="guide-section"
    >
      <div
        class="guide-section-grid"
        :class="{ reversed: idx % 2 === 1, 'is-visible': visibleSections.has(idx) }"
      >
        <!-- Text content -->
        <div class="guide-section-content">
          <span class="guide-step-number">{{ section.number }}</span>
          <h2 class="guide-section-title">{{ section.title }}</h2>
          <p class="guide-section-desc">{{ section.description }}</p>
          <ul class="guide-highlight-list">
            <li v-for="(item, i) in section.highlights" :key="i">{{ item }}</li>
          </ul>
        </div>

        <!-- Visual -->
        <div class="guide-section-visual">
          <!-- Section 1: Project Cards -->
          <svg v-if="idx === 0" class="section-svg" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <filter id="cardGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <!-- Card 1: Production Cluster (emphasized) -->
            <rect x="50" y="30" width="300" height="100" rx="12" fill="none" stroke="#d97706" stroke-width="1.5" class="card-glow" filter="url(#cardGlow)"/>
            <rect x="53" y="33" width="294" height="94" rx="10" fill="#1a1a1e" stroke="#d97706" stroke-width="1"/>
            <text x="80" y="65" fill="#f0f0f0" font-size="14" font-weight="700" font-family="var(--font-mono)">Production Cluster</text>
            <text x="80" y="88" fill="#787878" font-size="11" font-family="var(--font-mono)">3 members</text>
            <text x="180" y="88" fill="#787878" font-size="11" font-family="var(--font-mono)">12 nodes</text>
            <text x="270" y="88" fill="#787878" font-size="11" font-family="var(--font-mono)">8 edges</text>
            <!-- Small amber dot indicator -->
            <circle cx="66" cy="61" r="4" fill="#d97706" opacity="0.8"/>

            <!-- Card 2: Staging Environment (dimmed) -->
            <rect x="50" y="160" width="300" height="100" rx="12" fill="none" stroke="#2a2a30" stroke-width="1" opacity="0.6"/>
            <rect x="53" y="163" width="294" height="94" rx="10" fill="#1a1a1e" stroke="#2a2a30" stroke-width="1" opacity="0.6"/>
            <text x="80" y="195" fill="#787878" font-size="14" font-weight="700" font-family="var(--font-mono)" opacity="0.6">Staging Environment</text>
            <text x="80" y="218" fill="#787878" font-size="11" font-family="var(--font-mono)" opacity="0.5">2 members</text>
            <text x="180" y="218" fill="#787878" font-size="11" font-family="var(--font-mono)" opacity="0.5">7 nodes</text>
            <text x="270" y="218" fill="#787878" font-size="11" font-family="var(--font-mono)" opacity="0.5">5 edges</text>
            <circle cx="66" cy="191" r="4" fill="#3a3a42" opacity="0.5"/>
          </svg>

          <!-- Section 2: Node Types -->
          <svg v-if="idx === 1" class="section-svg" viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <filter id="nodeGlow2" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <!-- Server node -->
            <rect x="30" y="30" width="150" height="50" rx="8" fill="none" stroke="#5b8def" stroke-width="1.5" class="node-glow" style="animation-delay: 0s"/>
            <rect x="33" y="33" width="144" height="44" rx="6" fill="#1a2d4a" stroke="#5b8def" stroke-width="1"/>
            <text x="105" y="60" text-anchor="middle" fill="#93bbfd" font-size="12" font-weight="700" font-family="var(--font-mono)">Server</text>
            <text x="105" y="100" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">IP: 10.0.1.5 | :8080</text>

            <!-- L7 node -->
            <rect x="220" y="30" width="150" height="50" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5" class="node-glow" style="animation-delay: -0.4s"/>
            <rect x="223" y="33" width="144" height="44" rx="6" fill="#2a1f52" stroke="#b494f7" stroke-width="1"/>
            <text x="295" y="60" text-anchor="middle" fill="#e9d5ff" font-size="12" font-weight="700" font-family="var(--font-mono)">L7</text>
            <text x="295" y="100" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">lb.example.com</text>

            <!-- Infra node -->
            <rect x="30" y="130" width="150" height="50" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5" class="node-glow" style="animation-delay: -0.8s"/>
            <rect x="33" y="133" width="144" height="44" rx="6" fill="#0d3340" stroke="#3ec6d6" stroke-width="1"/>
            <text x="105" y="160" text-anchor="middle" fill="#67d2dd" font-size="12" font-weight="700" font-family="var(--font-mono)">Infra</text>
            <text x="105" y="200" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">PostgreSQL :5432</text>

            <!-- External node -->
            <rect x="220" y="130" width="150" height="50" rx="8" fill="none" stroke="#42b883" stroke-width="1.5" class="node-glow" style="animation-delay: -1.2s"/>
            <rect x="223" y="133" width="144" height="44" rx="6" fill="#0d2e1c" stroke="#42b883" stroke-width="1"/>
            <text x="295" y="160" text-anchor="middle" fill="#86efac" font-size="12" font-weight="700" font-family="var(--font-mono)">External</text>
            <text x="295" y="200" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">api.stripe.com</text>

            <!-- DNS node -->
            <rect x="125" y="230" width="150" height="50" rx="8" fill="none" stroke="#f472b6" stroke-width="1.5" class="node-glow" style="animation-delay: -1.6s"/>
            <rect x="128" y="233" width="144" height="44" rx="6" fill="#2e1228" stroke="#f472b6" stroke-width="1"/>
            <text x="200" y="260" text-anchor="middle" fill="#f9a8d4" font-size="12" font-weight="700" font-family="var(--font-mono)">DNS</text>
            <text x="200" y="300" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">ns1.example.com</text>
          </svg>

          <!-- Section 3: Dependency Graph (with demo window frame) -->
          <div v-if="idx === 2" class="demo-window-frame">
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
            <svg class="section-svg demo-graph-svg" viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <defs>
                <filter id="nodeGlow3" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="4" result="blur"/>
                  <feMerge>
                    <feMergeNode in="blur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <!-- Edges -->
              <line x1="200" y1="55" x2="120" y2="125" stroke="#b494f7" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6" class="edge-animated"/>
              <line x1="200" y1="55" x2="280" y2="125" stroke="#b494f7" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6" class="edge-animated edge-rev"/>
              <line x1="120" y1="155" x2="320" y2="215" stroke="#5b8def" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.5" class="edge-animated"/>
              <line x1="280" y1="155" x2="320" y2="215" stroke="#5b8def" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.5" class="edge-animated edge-rev"/>

              <!-- Edge label -->
              <rect x="100" y="78" width="72" height="18" rx="4" fill="#1a1a1e" stroke="#2a2a30" stroke-width="0.8"/>
              <text x="136" y="91" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">HTTP :8080</text>

              <!-- L7 node (top center) -->
              <rect x="160" y="20" width="80" height="44" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5" class="node-glow"/>
              <rect x="163" y="23" width="74" height="38" rx="6" fill="#2a1f52" stroke="#b494f7" stroke-width="1"/>
              <text x="200" y="48" text-anchor="middle" fill="#e9d5ff" font-size="11" font-weight="700" font-family="var(--font-mono)">L7-Front</text>

              <!-- Server 1 (left) -->
              <rect x="75" y="115" width="90" height="44" rx="8" fill="none" stroke="#5b8def" stroke-width="1.5" class="node-glow" style="animation-delay: -0.5s"/>
              <rect x="78" y="118" width="84" height="38" rx="6" fill="#1a2d4a" stroke="#5b8def" stroke-width="1"/>
              <text x="120" y="143" text-anchor="middle" fill="#93bbfd" font-size="11" font-weight="700" font-family="var(--font-mono)">Web-01</text>

              <!-- Server 2 (right) -->
              <rect x="235" y="115" width="90" height="44" rx="8" fill="none" stroke="#5b8def" stroke-width="1.5" class="node-glow" style="animation-delay: -1.2s"/>
              <rect x="238" y="118" width="84" height="38" rx="6" fill="#1a2d4a" stroke="#5b8def" stroke-width="1"/>
              <text x="280" y="143" text-anchor="middle" fill="#93bbfd" font-size="11" font-weight="700" font-family="var(--font-mono)">Web-02</text>

              <!-- Infra DB (bottom right) -->
              <rect x="280" y="200" width="90" height="44" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5" class="node-glow" style="animation-delay: -0.8s"/>
              <rect x="283" y="203" width="84" height="38" rx="6" fill="#0d3340" stroke="#3ec6d6" stroke-width="1"/>
              <text x="325" y="228" text-anchor="middle" fill="#67d2dd" font-size="11" font-weight="700" font-family="var(--font-mono)">PostgreSQL</text>
            </svg>
          </div>

          <!-- Section 4: Impact Analysis -->
          <svg v-if="idx === 3" class="section-svg" viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <filter id="selectGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="blur"/>
                <feMerge>
                  <feMergeNode in="blur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <!-- Ripple effect around selected node -->
            <circle cx="210" cy="150" r="35" stroke="#d97706" stroke-width="1" fill="none" opacity="0.4" class="ripple-ring" style="animation-delay: 0s"/>
            <circle cx="210" cy="150" r="50" stroke="#d97706" stroke-width="0.8" fill="none" opacity="0.2" class="ripple-ring" style="animation-delay: -0.6s"/>
            <circle cx="210" cy="150" r="65" stroke="#d97706" stroke-width="0.6" fill="none" opacity="0.1" class="ripple-ring" style="animation-delay: -1.2s"/>

            <!-- Dimmed edges (non-affected) -->
            <line x1="210" y1="165" x2="370" y2="250" stroke="#3a3a42" stroke-width="1" stroke-dasharray="5 3" opacity="0.15" class="edge-animated edge-slow"/>

            <!-- Highlighted edges (affected) -->
            <line x1="100" y1="75" x2="200" y2="135" stroke="#d97706" stroke-width="2" stroke-dasharray="7 3" opacity="0.8" class="edge-animated"/>
            <line x1="210" y1="165" x2="120" y2="250" stroke="#5b8def" stroke-width="2" stroke-dasharray="7 3" opacity="0.8" class="edge-animated"/>
            <line x1="210" y1="165" x2="300" y2="250" stroke="#5b8def" stroke-width="2" stroke-dasharray="7 3" opacity="0.8" class="edge-animated edge-rev"/>

            <!-- Upstream node (affected, bright) -->
            <rect x="55" y="40" width="90" height="44" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5" class="node-glow"/>
            <rect x="58" y="43" width="84" height="38" rx="6" fill="#2a1f52" stroke="#b494f7" stroke-width="1.5"/>
            <text x="100" y="68" text-anchor="middle" fill="#e9d5ff" font-size="11" font-weight="700" font-family="var(--font-mono)">L7-Front</text>

            <!-- Selected node (center, accent glow) -->
            <rect x="165" y="125" width="90" height="50" rx="8" fill="none" stroke="#d97706" stroke-width="2" filter="url(#selectGlow)"/>
            <rect x="168" y="128" width="84" height="44" rx="6" fill="#1a1a1e" stroke="#d97706" stroke-width="1.5"/>
            <text x="210" y="155" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">API</text>

            <!-- Downstream node 1 (affected, bright) -->
            <rect x="75" y="235" width="90" height="44" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5" class="node-glow" style="animation-delay: -0.6s"/>
            <rect x="78" y="238" width="84" height="38" rx="6" fill="#0d3340" stroke="#3ec6d6" stroke-width="1.5"/>
            <text x="120" y="263" text-anchor="middle" fill="#67d2dd" font-size="11" font-weight="700" font-family="var(--font-mono)">PostgreSQL</text>

            <!-- Downstream node 2 (affected, bright) -->
            <rect x="255" y="235" width="90" height="44" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5" class="node-glow" style="animation-delay: -1.0s"/>
            <rect x="258" y="238" width="84" height="38" rx="6" fill="#0d3340" stroke="#3ec6d6" stroke-width="1.5"/>
            <text x="300" y="263" text-anchor="middle" fill="#67d2dd" font-size="11" font-weight="700" font-family="var(--font-mono)">Redis</text>

            <!-- Non-affected node (dimmed) -->
            <rect x="335" y="235" width="70" height="38" rx="8" fill="none" stroke="#3a3a42" stroke-width="1" opacity="0.2"/>
            <rect x="338" y="238" width="64" height="32" rx="6" fill="#1a1a1e" stroke="#3a3a42" stroke-width="1" opacity="0.2"/>
            <text x="370" y="259" text-anchor="middle" fill="#787878" font-size="10" font-weight="700" font-family="var(--font-mono)" opacity="0.2">Slack</text>
          </svg>

          <!-- Section 5: Path Finding & Cycle Detection -->
          <svg v-if="idx === 4" class="section-svg" viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Part 1: Path (top) -->
            <!-- Path edges (accent) -->
            <line x1="100" y1="60" x2="195" y2="60" stroke="#d97706" stroke-width="2" stroke-dasharray="7 3" opacity="0.8" class="edge-animated"/>
            <line x1="245" y1="60" x2="300" y2="60" stroke="#d97706" stroke-width="2" stroke-dasharray="7 3" opacity="0.8" class="edge-animated"/>

            <!-- Arrow heads for path -->
            <polygon points="193,55 200,60 193,65" fill="#d97706" opacity="0.8"/>
            <polygon points="298,55 305,60 298,65" fill="#d97706" opacity="0.8"/>

            <!-- Node A (start) -->
            <rect x="40" y="38" width="60" height="44" rx="8" fill="none" stroke="#d97706" stroke-width="1.5"/>
            <rect x="43" y="41" width="54" height="38" rx="6" fill="#1a1a1e" stroke="#d97706" stroke-width="1"/>
            <text x="70" y="65" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">A</text>
            <text x="70" y="28" text-anchor="middle" fill="#d97706" font-size="9" font-weight="600" font-family="var(--font-mono)">Start</text>

            <!-- Node B (middle) -->
            <rect x="200" y="38" width="60" height="44" rx="8" fill="none" stroke="#5b8def" stroke-width="1.5" class="node-glow" style="animation-delay: -0.5s"/>
            <rect x="203" y="41" width="54" height="38" rx="6" fill="#1a2d4a" stroke="#5b8def" stroke-width="1"/>
            <text x="230" y="65" text-anchor="middle" fill="#93bbfd" font-size="12" font-weight="700" font-family="var(--font-mono)">B</text>

            <!-- Node C (end) -->
            <rect x="305" y="38" width="60" height="44" rx="8" fill="none" stroke="#d97706" stroke-width="1.5"/>
            <rect x="308" y="41" width="54" height="38" rx="6" fill="#1a1a1e" stroke="#d97706" stroke-width="1"/>
            <text x="335" y="65" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">C</text>
            <text x="335" y="28" text-anchor="middle" fill="#d97706" font-size="9" font-weight="600" font-family="var(--font-mono)">End</text>

            <!-- Divider -->
            <line x1="40" y1="120" x2="360" y2="120" stroke="#2a2a30" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>

            <!-- Part 2: Cycle (bottom) -->
            <!-- Cycle edges (warning) -->
            <line x1="100" y1="190" x2="195" y2="190" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 3" opacity="0.7" class="edge-animated edge-fast"/>
            <line x1="245" y1="190" x2="300" y2="210" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 3" opacity="0.7" class="edge-animated edge-fast"/>
            <line x1="295" y1="245" x2="100" y2="215" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 3" opacity="0.7" class="edge-animated edge-fast"/>

            <!-- Arrow heads for cycle -->
            <polygon points="193,185 200,190 193,195" fill="#f59e0b" opacity="0.7"/>
            <polygon points="298,207 305,212 296,214" fill="#f59e0b" opacity="0.7"/>
            <polygon points="103,212 96,215 105,218" fill="#f59e0b" opacity="0.7"/>

            <!-- Node X -->
            <rect x="40" y="170" width="60" height="44" rx="8" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>
            <rect x="43" y="173" width="54" height="38" rx="6" fill="#2d1c0e" stroke="#f59e0b" stroke-width="1" opacity="0.8"/>
            <text x="70" y="197" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">X</text>

            <!-- Node Y -->
            <rect x="200" y="170" width="60" height="44" rx="8" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>
            <rect x="203" y="173" width="54" height="38" rx="6" fill="#2d1c0e" stroke="#f59e0b" stroke-width="1" opacity="0.8"/>
            <text x="230" y="197" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">Y</text>

            <!-- Node Z -->
            <rect x="280" y="220" width="60" height="44" rx="8" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>
            <rect x="283" y="223" width="54" height="38" rx="6" fill="#2d1c0e" stroke="#f59e0b" stroke-width="1" opacity="0.8"/>
            <text x="310" y="247" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">Z</text>

            <!-- Cycle badge -->
            <rect x="130" y="260" width="140" height="28" rx="14" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" stroke-width="1"/>
            <circle cx="154" cy="274" r="4" fill="#f59e0b" class="cycle-dot-anim"/>
            <text x="210" y="279" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="600" font-family="var(--font-mono)">Cycle Detected</text>
          </svg>

          <!-- Section 6: Team Collaboration & Export -->
          <svg v-if="idx === 5" class="section-svg" viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <!-- Member list (left part) -->
            <!-- Header -->
            <text x="30" y="30" fill="#787878" font-size="10" font-weight="600" font-family="var(--font-mono)" letter-spacing="0.05em">MEMBERS</text>

            <!-- Member 1: Master -->
            <circle cx="50" cy="65" r="16" fill="#2a2a30" stroke="#f59e0b" stroke-width="1.2"/>
            <text x="50" y="69" text-anchor="middle" fill="#f59e0b" font-size="11" font-weight="700" font-family="var(--font-mono)">JK</text>
            <text x="80" y="61" fill="#d4d4d4" font-size="12" font-weight="600">Kim Jongho</text>
            <rect x="80" y="69" width="52" height="18" rx="9" fill="rgba(245, 158, 11, 0.15)"/>
            <text x="106" y="82" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="600" font-family="var(--font-mono)">MASTER</text>

            <!-- Member 2: Admin -->
            <circle cx="50" cy="115" r="16" fill="#2a2a30" stroke="#5b8def" stroke-width="1.2"/>
            <text x="50" y="119" text-anchor="middle" fill="#5b8def" font-size="11" font-weight="700" font-family="var(--font-mono)">LP</text>
            <text x="80" y="111" fill="#d4d4d4" font-size="12" font-weight="600">Park Lena</text>
            <rect x="80" y="119" width="48" height="18" rx="9" fill="rgba(91, 141, 239, 0.15)"/>
            <text x="104" y="132" text-anchor="middle" fill="#93b4f5" font-size="9" font-weight="600" font-family="var(--font-mono)">ADMIN</text>

            <!-- Member 3: Writer -->
            <circle cx="50" cy="165" r="16" fill="#2a2a30" stroke="#42b883" stroke-width="1.2"/>
            <text x="50" y="169" text-anchor="middle" fill="#42b883" font-size="11" font-weight="700" font-family="var(--font-mono)">CS</text>
            <text x="80" y="161" fill="#d4d4d4" font-size="12" font-weight="600">Shin Chaewon</text>
            <rect x="80" y="169" width="52" height="18" rx="9" fill="rgba(66, 184, 131, 0.15)"/>
            <text x="106" y="182" text-anchor="middle" fill="#42b883" font-size="9" font-weight="600" font-family="var(--font-mono)">WRITER</text>

            <!-- Divider -->
            <line x1="230" y1="30" x2="230" y2="200" stroke="#2a2a30" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>

            <!-- Export section (right part) -->
            <text x="270" y="30" fill="#787878" font-size="10" font-weight="600" font-family="var(--font-mono)" letter-spacing="0.05em">EXPORT</text>

            <!-- PNG icon -->
            <rect x="265" y="55" width="60" height="72" rx="6" fill="#1a1a1e" stroke="#2a2a30" stroke-width="1"/>
            <rect x="271" y="61" width="48" height="36" rx="3" fill="#2a2a30"/>
            <!-- Mountain/image icon inside -->
            <polyline points="277,90 287,78 293,85 301,72 313,90" stroke="#5b8def" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
            <circle cx="283" cy="73" r="3" fill="#5b8def" opacity="0.5"/>
            <text x="295" y="118" text-anchor="middle" fill="#787878" font-size="9" font-weight="600" font-family="var(--font-mono)">PNG</text>
            <text x="295" y="150" text-anchor="middle" fill="#3a3a42" font-size="9" font-family="var(--font-mono)">Image Export</text>

            <!-- SVG icon -->
            <rect x="345" y="55" width="60" height="72" rx="6" fill="#1a1a1e" stroke="#2a2a30" stroke-width="1"/>
            <text x="375" y="78" text-anchor="middle" fill="#b494f7" font-size="9" font-weight="700" font-family="var(--font-mono)">&lt;svg&gt;</text>
            <rect x="358" y="88" width="34" height="24" rx="3" fill="none" stroke="#b494f7" stroke-width="0.8" opacity="0.5"/>
            <line x1="362" y1="96" x2="378" y2="96" stroke="#b494f7" stroke-width="0.8" opacity="0.4"/>
            <line x1="362" y1="102" x2="388" y2="102" stroke="#b494f7" stroke-width="0.8" opacity="0.4"/>
            <text x="375" y="150" text-anchor="middle" fill="#787878" font-size="9" font-weight="600" font-family="var(--font-mono)">SVG</text>
            <text x="375" y="168" text-anchor="middle" fill="#3a3a42" font-size="9" font-family="var(--font-mono)">Vector Export</text>
          </svg>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="guide-cta">
      <h2 class="guide-cta-title">{{ $t('guide.cta.title') }}</h2>
      <p class="guide-cta-subtitle">{{ $t('guide.cta.subtitle') }}</p>
      <div class="guide-cta-actions">
        <router-link to="/register" class="btn-primary btn-lg">{{ $t('guide.cta.start') }}</router-link>
        <router-link to="/login" class="btn-ghost btn-lg">로그인</router-link>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, getLocale } from '../i18n'

const { tm } = useI18n()
const currentLocale = ref(getLocale())
function toggleLocale() {
  const next = currentLocale.value === 'ko' ? 'en' : 'ko'
  setLocale(next)
  currentLocale.value = next
}

const guidePageRef = ref<HTMLElement | null>(null)
const sectionRefs = ref<HTMLElement[]>([])
const visibleSections = ref<Set<number>>(new Set())
const headerScrolled = ref(false)

interface GuideSection {
  number: string
  title: string
  description: string
  highlights: string[]
}

const SECTION_NUMBERS = ['01', '02', '03', '04', '05', '06']

const sections = computed<GuideSection[]>(() => {
  const raw = tm('guide.sections') as Array<{ title: string; description: string; highlights: string[] }>
  return raw.map((s, i) => ({
    number: SECTION_NUMBERS[i],
    title: s.title,
    description: s.description,
    highlights: s.highlights as unknown as string[],
  }))
})

let sectionObserver: IntersectionObserver | null = null

function handleScroll() {
  if (!guidePageRef.value) return
  headerScrolled.value = guidePageRef.value.scrollTop > 64
}

onMounted(() => {
  sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = sectionRefs.value.indexOf(entry.target as HTMLElement)
          if (index !== -1) visibleSections.value.add(index)
        }
      })
    },
    { threshold: 0.15 },
  )
  sectionRefs.value.forEach(el => el && sectionObserver!.observe(el))

  guidePageRef.value?.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  sectionObserver?.disconnect()
  guidePageRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* ============================================
   PAGE
   ============================================ */
.guide-page {
  background: var(--bg-base);
  height: 100vh;
  overflow-y: auto;
  scroll-behavior: smooth;
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
  transition: background 0.2s, border-color 0.2s, backdrop-filter 0.2s;
}
.site-header.header-scrolled {
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
.brand-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  text-decoration: none;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-link {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--text-tertiary);
  text-decoration: none;
  transition: color 0.15s;
}
.nav-link.active {
  color: var(--accent-soft);
}
.nav-link:hover {
  color: var(--text-primary);
}
.header-actions .nav-link {
  padding-right: 12px;
  margin-right: 4px;
  border-right: 1px solid var(--border-default);
}
.locale-toggle {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-tertiary);
  background: transparent;
  border: 1px solid var(--border-default);
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-family: var(--font-mono);
  letter-spacing: 0.04em;
  transition: color 0.15s, border-color 0.15s;
}
.locale-toggle:hover {
  color: var(--text-primary);
  border-color: var(--border-strong);
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
   GUIDE HERO
   ============================================ */
.guide-hero {
  position: relative;
  padding: 10rem 1.5rem 5rem;
  text-align: center;
  overflow: hidden;
}
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
.guide-hero-glow {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 200px;
  background: rgba(217, 119, 6, 0.08);
  filter: blur(100px);
  border-radius: 9999px;
  z-index: 0;
  pointer-events: none;
}
.guide-hero-inner {
  position: relative;
  z-index: 1;
  max-width: 72rem;
  margin: 0 auto;
}
.guide-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 700;
  font-family: var(--font-mono);
  letter-spacing: 0.08em;
  color: var(--accent-soft);
  background: rgba(217, 119, 6, 0.12);
  border: 1px solid rgba(217, 119, 6, 0.25);
  margin-bottom: 24px;
}
.guide-hero-title {
  font-size: var(--text-hero);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 16px 0;
  letter-spacing: -0.02em;
  line-height: 1.15;
}
.guide-hero-subtitle {
  font-size: var(--text-lg);
  color: var(--text-tertiary);
  margin: 0;
  line-height: 1.6;
}

/* ============================================
   SECTIONS
   ============================================ */
.guide-section {
  max-width: 72rem;
  margin: 0 auto;
  padding: 80px 1.5rem;
  border-top: 1px solid var(--border-subtle);
}
.guide-section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 56px;
  align-items: center;
}
.guide-section-grid.reversed {
  direction: rtl;
}
.guide-section-grid.reversed > * {
  direction: ltr;
}

/* Fade-up animation */
.guide-section-content,
.guide-section-visual {
  opacity: 0;
  transform: translateY(24px);
  transition: none;
}
.guide-section-grid.is-visible .guide-section-content {
  animation: guideFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.guide-section-grid.is-visible .guide-section-visual {
  animation: guideFadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
}

@keyframes guideFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Step number */
.guide-step-number {
  font-size: var(--text-hero);
  font-weight: 800;
  color: var(--accent-soft);
  opacity: 0.35;
  font-family: var(--font-mono);
  line-height: 1;
  margin-bottom: 8px;
  display: block;
}

/* Section title */
.guide-section-title {
  font-size: var(--text-2xl);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  letter-spacing: -0.01em;
}

/* Section description */
.guide-section-desc {
  font-size: var(--text-base);
  color: var(--text-tertiary);
  line-height: 1.7;
  margin: 0 0 20px 0;
}

/* Highlight list */
.guide-highlight-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.guide-highlight-list li {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  padding-left: 18px;
  position: relative;
  line-height: 1.5;
}
.guide-highlight-list li::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 5px;
  width: 5px;
  height: 5px;
  border-right: 1.5px solid var(--accent-primary);
  border-bottom: 1.5px solid var(--accent-primary);
  transform: rotate(-45deg);
}

/* ============================================
   VISUAL SECTION
   ============================================ */
.guide-section-visual {
  display: flex;
  justify-content: center;
  align-items: center;
}
.section-svg {
  width: 100%;
  max-height: 380px;
}

/* Demo window frame (Section 3) */
.demo-window-frame {
  width: 100%;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 12px;
  overflow: hidden;
}
.demo-window-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-default);
  background: rgba(26, 26, 30, 0.8);
}
.demo-dots {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
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
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(42, 42, 48, 0.5);
  font-size: var(--text-xs);
  color: var(--text-tertiary);
}
.demo-graph-svg {
  padding: 16px;
  max-height: 320px;
}

/* ============================================
   SVG ANIMATIONS
   ============================================ */
@keyframes marchDash {
  to { stroke-dashoffset: -10; }
}
@keyframes marchDashRev {
  to { stroke-dashoffset: 10; }
}
@keyframes marchDashFast {
  to { stroke-dashoffset: -8; }
}
@keyframes nodePulse {
  0%, 100% { opacity: 0.15; }
  50% { opacity: 0.5; }
}
@keyframes ripplePulse {
  0% { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(1.3); opacity: 0; }
}
@keyframes cycleDotPulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* Paused by default, play when section is visible */
.edge-animated,
.node-glow,
.card-glow,
.ripple-ring,
.cycle-dot-anim {
  animation-play-state: paused;
}
.guide-section-grid.is-visible .edge-animated {
  animation: marchDash 1.4s linear infinite;
  animation-play-state: running;
}
.guide-section-grid.is-visible .edge-rev {
  animation: marchDashRev 1.4s linear infinite;
  animation-play-state: running;
}
.guide-section-grid.is-visible .edge-slow {
  animation: marchDash 2.2s linear infinite;
  animation-play-state: running;
}
.guide-section-grid.is-visible .edge-fast {
  animation: marchDashFast 0.7s linear infinite;
  animation-play-state: running;
}
.guide-section-grid.is-visible .node-glow {
  animation: nodePulse 2.4s ease-in-out infinite;
  animation-play-state: running;
}
.guide-section-grid.is-visible .card-glow {
  animation: nodePulse 3s ease-in-out infinite;
  animation-play-state: running;
}
.guide-section-grid.is-visible .ripple-ring {
  animation: ripplePulse 2s ease-out infinite;
  animation-play-state: running;
}
.guide-section-grid.is-visible .cycle-dot-anim {
  animation: cycleDotPulse 1.2s ease-in-out infinite;
  animation-play-state: running;
}

/* ============================================
   CTA
   ============================================ */
.guide-cta {
  text-align: center;
  padding: 80px 1.5rem 100px;
  border-top: 1px solid var(--border-subtle);
  max-width: 72rem;
  margin: 0 auto;
}
.guide-cta-title {
  font-size: var(--text-display);
  font-weight: 800;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}
.guide-cta-subtitle {
  font-size: var(--text-lg);
  color: var(--text-tertiary);
  margin: 0 0 32px 0;
  line-height: 1.6;
}
.guide-cta-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* ============================================
   TRANSITIONS
   ============================================ */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 767px) {
  .guide-section-grid {
    grid-template-columns: 1fr;
    gap: 32px;
  }
  .guide-section-grid.reversed {
    direction: ltr;
  }
  .guide-section-visual {
    order: 2;
  }
  .guide-section-content {
    order: 1;
  }
  .guide-hero-title {
    font-size: var(--text-2xl);
  }
  .site-header {
    height: 56px;
  }
  .guide-hero {
    padding-top: 7rem;
    padding-bottom: 3rem;
  }
  .guide-section {
    padding: 48px 1.5rem;
  }
  .guide-cta {
    padding: 48px 1.5rem 64px;
  }
}

@media (max-width: 639px) {
  .guide-hero-title {
    font-size: var(--text-xl);
  }
  .guide-cta-actions {
    flex-direction: column;
    align-items: center;
  }
  .guide-step-number {
    font-size: var(--text-display);
  }
}

@media (max-width: 400px) {
  .header-brand {
    font-size: 0;
  }
  .header-brand svg {
    flex-shrink: 0;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .section-svg {
    max-height: 320px;
  }
  .guide-section-grid {
    gap: 32px;
  }
}

@media (min-width: 1024px) {
  .section-svg {
    max-height: 420px;
  }
}
</style>
