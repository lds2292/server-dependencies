<template>
  <!-- Section 1: Project Cards (실제 카드 레이아웃 반영: 좌측 그래프 미리보기 + 우측 콘텐츠) -->
  <svg v-if="step === 0" class="step-visual-svg" viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <filter id="obCardGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
    </defs>

    <!-- Card 1: Production Cluster (emphasized) -->
    <rect x="30" y="20" width="340" height="110" rx="10" fill="#1a1a1e" stroke="#d97706" stroke-width="1.2" filter="url(#obCardGlow)"/>
    <rect x="30" y="20" width="80" height="110" rx="10" fill="#0f0f12"/>
    <rect x="110" y="20" width="1" height="110" fill="#2a2a30"/>
    <!-- Mini graph nodes: infra(cyan, light bg), server(amber bg), external(green, deep bg) -->
    <rect x="46" y="36" width="32" height="11" rx="2.5" fill="#f0f9ff" stroke="#3ec6d6" stroke-width="0.8"/>
    <rect x="36" y="58" width="26" height="10" rx="2.5" fill="#332a1a" stroke="#5b8def" stroke-width="0.8"/>
    <rect x="72" y="58" width="26" height="10" rx="2.5" fill="#052e16" stroke="#42b883" stroke-width="0.8"/>
    <rect x="46" y="80" width="32" height="11" rx="2.5" fill="#1a1a1e" stroke="#2a2a30" stroke-width="0.8"/>
    <line x1="56" y1="47" x2="49" y2="58" stroke="#3ec6d6" stroke-width="0.7" opacity="0.5" stroke-dasharray="3 2"/>
    <line x1="68" y1="47" x2="80" y2="58" stroke="#3ec6d6" stroke-width="0.7" opacity="0.5" stroke-dasharray="3 2"/>
    <line x1="49" y1="68" x2="56" y2="80" stroke="#525252" stroke-width="0.7" opacity="0.4" stroke-dasharray="3 2"/>
    <line x1="85" y1="68" x2="72" y2="80" stroke="#525252" stroke-width="0.7" opacity="0.4" stroke-dasharray="3 2"/>
    <text x="124" y="50" fill="#f0f0f0" font-size="13" font-weight="700">Production Cluster</text>
    <text x="124" y="70" fill="#787878" font-size="10">Main production infrastructure topology</text>
    <rect x="124" y="90" width="48" height="18" rx="9" fill="rgba(245, 158, 11, 0.15)"/>
    <text x="148" y="103" text-anchor="middle" fill="#f59e0b" font-size="8" font-weight="700" font-family="var(--font-mono)">MASTER</text>
    <text x="184" y="103" fill="#787878" font-size="9" font-family="var(--font-mono)">3 members</text>
    <text x="270" y="103" fill="#787878" font-size="9" font-family="var(--font-mono)">2025-03-15</text>

    <!-- Card 2: Staging Environment (dimmed) -->
    <rect x="30" y="150" width="340" height="110" rx="10" fill="#1a1a1e" stroke="#2a2a30" stroke-width="1" opacity="0.5"/>
    <rect x="30" y="150" width="80" height="110" rx="10" fill="#0f0f12" opacity="0.5"/>
    <rect x="110" y="150" width="1" height="110" fill="#2a2a30" opacity="0.5"/>
    <rect x="50" y="170" width="28" height="10" rx="2.5" fill="#332a1a" stroke="#5b8def" stroke-width="0.8" opacity="0.4"/>
    <rect x="42" y="192" width="22" height="10" rx="2.5" fill="#f0f9ff" stroke="#3ec6d6" stroke-width="0.8" opacity="0.4"/>
    <rect x="68" y="192" width="22" height="10" rx="2.5" fill="#052e16" stroke="#42b883" stroke-width="0.8" opacity="0.4"/>
    <line x1="60" y1="180" x2="53" y2="192" stroke="#5b8def" stroke-width="0.7" opacity="0.3" stroke-dasharray="3 2"/>
    <line x1="72" y1="180" x2="79" y2="192" stroke="#5b8def" stroke-width="0.7" opacity="0.3" stroke-dasharray="3 2"/>
    <text x="124" y="180" fill="#787878" font-size="13" font-weight="700" opacity="0.5">Staging Environment</text>
    <text x="124" y="200" fill="#787878" font-size="10" opacity="0.4">Pre-production testing cluster</text>
    <rect x="124" y="218" width="40" height="18" rx="9" fill="rgba(91, 141, 239, 0.1)" opacity="0.5"/>
    <text x="144" y="231" text-anchor="middle" fill="#5b8def" font-size="8" font-weight="700" font-family="var(--font-mono)" opacity="0.5">ADMIN</text>
    <text x="176" y="231" fill="#787878" font-size="9" font-family="var(--font-mono)" opacity="0.4">2 members</text>
    <text x="262" y="231" fill="#787878" font-size="9" font-family="var(--font-mono)" opacity="0.4">2025-03-10</text>
  </svg>

  <!-- Section 2: Node Types -->
  <svg v-else-if="step === 1" class="step-visual-svg" viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <!-- Server: fill=#332a1a, stroke=#5b8def, text=#fff -->
    <rect x="30" y="30" width="150" height="50" rx="8" fill="none" stroke="#5b8def" stroke-width="1.5"/>
    <rect x="33" y="33" width="144" height="44" rx="6" fill="#332a1a" stroke="#5b8def" stroke-width="1"/>
    <text x="105" y="60" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="var(--font-mono)">Server</text>
    <text x="105" y="100" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">IP: 10.0.1.5 | :8080</text>
    <!-- L7: fill=#2e0a5a, stroke=#b494f7, text=#fff -->
    <rect x="220" y="30" width="150" height="50" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5"/>
    <rect x="223" y="33" width="144" height="44" rx="6" fill="#2e0a5a" stroke="#b494f7" stroke-width="1"/>
    <text x="295" y="60" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="var(--font-mono)">L7</text>
    <text x="295" y="100" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">lb.example.com</text>
    <!-- Infra: fill=#f0f9ff, stroke=#3ec6d6, text=#121214 -->
    <rect x="30" y="130" width="150" height="50" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5"/>
    <rect x="33" y="133" width="144" height="44" rx="6" fill="#f0f9ff" stroke="#3ec6d6" stroke-width="1"/>
    <text x="105" y="160" text-anchor="middle" fill="#121214" font-size="12" font-weight="700" font-family="var(--font-mono)">Infra</text>
    <text x="105" y="200" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">PostgreSQL :5432</text>
    <!-- External: fill=#052e16, stroke=#42b883, text=#fff -->
    <rect x="220" y="130" width="150" height="50" rx="8" fill="none" stroke="#42b883" stroke-width="1.5"/>
    <rect x="223" y="133" width="144" height="44" rx="6" fill="#052e16" stroke="#42b883" stroke-width="1"/>
    <text x="295" y="160" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="var(--font-mono)">External</text>
    <text x="295" y="200" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">api.stripe.com</text>
    <!-- DNS: fill=#fdf2f8, stroke=#f472b6, text=#121214 -->
    <rect x="125" y="230" width="150" height="50" rx="8" fill="none" stroke="#f472b6" stroke-width="1.5"/>
    <rect x="128" y="233" width="144" height="44" rx="6" fill="#fdf2f8" stroke="#f472b6" stroke-width="1"/>
    <text x="200" y="260" text-anchor="middle" fill="#121214" font-size="12" font-weight="700" font-family="var(--font-mono)">DNS</text>
    <text x="200" y="300" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">ns1.example.com</text>
  </svg>

  <!-- Section 3: Dependency Graph -->
  <svg v-else-if="step === 2" class="step-visual-svg" viewBox="0 0 400 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="200" y1="55" x2="120" y2="125" stroke="#b494f7" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6"/>
    <line x1="200" y1="55" x2="280" y2="125" stroke="#b494f7" stroke-width="1.5" stroke-dasharray="7 3" opacity="0.6"/>
    <line x1="120" y1="155" x2="320" y2="215" stroke="#5b8def" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.5"/>
    <line x1="280" y1="155" x2="320" y2="215" stroke="#5b8def" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.5"/>
    <rect x="100" y="78" width="72" height="18" rx="4" fill="#1a1a1e" stroke="#2a2a30" stroke-width="0.8"/>
    <text x="136" y="91" text-anchor="middle" fill="#787878" font-size="9" font-family="var(--font-mono)">HTTP :8080</text>
    <!-- L7-Front -->
    <rect x="160" y="20" width="80" height="44" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5"/>
    <rect x="163" y="23" width="74" height="38" rx="6" fill="#2e0a5a" stroke="#b494f7" stroke-width="1"/>
    <text x="200" y="48" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="var(--font-mono)">L7-Front</text>
    <!-- Web-01 (Server) -->
    <rect x="75" y="115" width="90" height="44" rx="8" fill="none" stroke="#5b8def" stroke-width="1.5"/>
    <rect x="78" y="118" width="84" height="38" rx="6" fill="#332a1a" stroke="#5b8def" stroke-width="1"/>
    <text x="120" y="143" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="var(--font-mono)">Web-01</text>
    <!-- Web-02 (Server) -->
    <rect x="235" y="115" width="90" height="44" rx="8" fill="none" stroke="#5b8def" stroke-width="1.5"/>
    <rect x="238" y="118" width="84" height="38" rx="6" fill="#332a1a" stroke="#5b8def" stroke-width="1"/>
    <text x="280" y="143" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="var(--font-mono)">Web-02</text>
    <!-- PostgreSQL (Infra) -->
    <rect x="280" y="200" width="90" height="44" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5"/>
    <rect x="283" y="203" width="84" height="38" rx="6" fill="#f0f9ff" stroke="#3ec6d6" stroke-width="1"/>
    <text x="325" y="228" text-anchor="middle" fill="#121214" font-size="11" font-weight="700" font-family="var(--font-mono)">PostgreSQL</text>
  </svg>

  <!-- Section 4: Impact Analysis -->
  <svg v-else-if="step === 3" class="step-visual-svg" viewBox="0 0 420 320" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="210" cy="150" r="35" stroke="#d97706" stroke-width="1" fill="none" opacity="0.3"/>
    <circle cx="210" cy="150" r="50" stroke="#d97706" stroke-width="0.8" fill="none" opacity="0.15"/>
    <line x1="210" y1="165" x2="370" y2="250" stroke="#3a3a42" stroke-width="1" stroke-dasharray="5 3" opacity="0.15"/>
    <line x1="100" y1="75" x2="200" y2="135" stroke="#d97706" stroke-width="2" stroke-dasharray="7 3" opacity="0.8"/>
    <line x1="210" y1="165" x2="120" y2="250" stroke="#5b8def" stroke-width="2" stroke-dasharray="7 3" opacity="0.8"/>
    <line x1="210" y1="165" x2="300" y2="250" stroke="#5b8def" stroke-width="2" stroke-dasharray="7 3" opacity="0.8"/>
    <!-- L7-Front -->
    <rect x="55" y="40" width="90" height="44" rx="8" fill="none" stroke="#b494f7" stroke-width="1.5"/>
    <rect x="58" y="43" width="84" height="38" rx="6" fill="#2e0a5a" stroke="#b494f7" stroke-width="1.5"/>
    <text x="100" y="68" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="var(--font-mono)">L7-Front</text>
    <!-- API (Server, selected) -->
    <rect x="165" y="125" width="90" height="50" rx="8" fill="none" stroke="#d97706" stroke-width="2"/>
    <rect x="168" y="128" width="84" height="44" rx="6" fill="#332a1a" stroke="#d97706" stroke-width="1.5"/>
    <text x="210" y="155" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">API</text>
    <!-- PostgreSQL (Infra) -->
    <rect x="75" y="235" width="90" height="44" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5"/>
    <rect x="78" y="238" width="84" height="38" rx="6" fill="#f0f9ff" stroke="#3ec6d6" stroke-width="1.5"/>
    <text x="120" y="263" text-anchor="middle" fill="#121214" font-size="11" font-weight="700" font-family="var(--font-mono)">PostgreSQL</text>
    <!-- Redis (Infra) -->
    <rect x="255" y="235" width="90" height="44" rx="8" fill="none" stroke="#3ec6d6" stroke-width="1.5"/>
    <rect x="258" y="238" width="84" height="38" rx="6" fill="#f0f9ff" stroke="#3ec6d6" stroke-width="1.5"/>
    <text x="300" y="263" text-anchor="middle" fill="#121214" font-size="11" font-weight="700" font-family="var(--font-mono)">Redis</text>
    <!-- Slack (External, dimmed) -->
    <rect x="335" y="235" width="70" height="38" rx="8" fill="none" stroke="#3a3a42" stroke-width="1" opacity="0.2"/>
    <rect x="338" y="238" width="64" height="32" rx="6" fill="#052e16" stroke="#3a3a42" stroke-width="1" opacity="0.2"/>
    <text x="370" y="259" text-anchor="middle" fill="#787878" font-size="10" font-weight="700" font-family="var(--font-mono)" opacity="0.2">Slack</text>
  </svg>

  <!-- Section 5: Path Finding & Cycle Detection -->
  <svg v-else-if="step === 4" class="step-visual-svg" viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <line x1="100" y1="60" x2="195" y2="60" stroke="#d97706" stroke-width="2" stroke-dasharray="7 3" opacity="0.8"/>
    <line x1="245" y1="60" x2="300" y2="60" stroke="#d97706" stroke-width="2" stroke-dasharray="7 3" opacity="0.8"/>
    <polygon points="193,55 200,60 193,65" fill="#d97706" opacity="0.8"/>
    <polygon points="298,55 305,60 298,65" fill="#d97706" opacity="0.8"/>
    <!-- Node A (Server, start) -->
    <rect x="40" y="38" width="60" height="44" rx="8" fill="none" stroke="#d97706" stroke-width="1.5"/>
    <rect x="43" y="41" width="54" height="38" rx="6" fill="#332a1a" stroke="#d97706" stroke-width="1"/>
    <text x="70" y="65" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">A</text>
    <text x="70" y="28" text-anchor="middle" fill="#d97706" font-size="9" font-weight="600" font-family="var(--font-mono)">Start</text>
    <!-- Node B (Server, middle) -->
    <rect x="200" y="38" width="60" height="44" rx="8" fill="none" stroke="#5b8def" stroke-width="1.5"/>
    <rect x="203" y="41" width="54" height="38" rx="6" fill="#332a1a" stroke="#5b8def" stroke-width="1"/>
    <text x="230" y="65" text-anchor="middle" fill="#fff" font-size="12" font-weight="700" font-family="var(--font-mono)">B</text>
    <!-- Node C (Server, end) -->
    <rect x="305" y="38" width="60" height="44" rx="8" fill="none" stroke="#d97706" stroke-width="1.5"/>
    <rect x="308" y="41" width="54" height="38" rx="6" fill="#332a1a" stroke="#d97706" stroke-width="1"/>
    <text x="335" y="65" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">C</text>
    <text x="335" y="28" text-anchor="middle" fill="#d97706" font-size="9" font-weight="600" font-family="var(--font-mono)">End</text>
    <line x1="40" y1="120" x2="360" y2="120" stroke="#2a2a30" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
    <!-- Cycle edges -->
    <line x1="100" y1="190" x2="195" y2="190" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 3" opacity="0.7"/>
    <line x1="245" y1="190" x2="300" y2="210" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 3" opacity="0.7"/>
    <line x1="295" y1="245" x2="100" y2="215" stroke="#f59e0b" stroke-width="2" stroke-dasharray="5 3" opacity="0.7"/>
    <polygon points="193,185 200,190 193,195" fill="#f59e0b" opacity="0.7"/>
    <polygon points="298,207 305,212 296,214" fill="#f59e0b" opacity="0.7"/>
    <polygon points="103,212 96,215 105,218" fill="#f59e0b" opacity="0.7"/>
    <!-- Cycle nodes (Server type) -->
    <rect x="40" y="170" width="60" height="44" rx="8" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>
    <rect x="43" y="173" width="54" height="38" rx="6" fill="#332a1a" stroke="#f59e0b" stroke-width="1" opacity="0.8"/>
    <text x="70" y="197" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">X</text>
    <rect x="200" y="170" width="60" height="44" rx="8" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>
    <rect x="203" y="173" width="54" height="38" rx="6" fill="#332a1a" stroke="#f59e0b" stroke-width="1" opacity="0.8"/>
    <text x="230" y="197" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">Y</text>
    <rect x="280" y="220" width="60" height="44" rx="8" fill="none" stroke="#f59e0b" stroke-width="1.5" opacity="0.8"/>
    <rect x="283" y="223" width="54" height="38" rx="6" fill="#332a1a" stroke="#f59e0b" stroke-width="1" opacity="0.8"/>
    <text x="310" y="247" text-anchor="middle" fill="#fbbf24" font-size="12" font-weight="700" font-family="var(--font-mono)">Z</text>
    <rect x="130" y="260" width="140" height="28" rx="14" fill="rgba(245, 158, 11, 0.15)" stroke="#f59e0b" stroke-width="1"/>
    <circle cx="154" cy="274" r="4" fill="#f59e0b"/>
    <text x="210" y="279" text-anchor="middle" fill="#fbbf24" font-size="11" font-weight="600" font-family="var(--font-mono)">Cycle Detected</text>
  </svg>

  <!-- Section 6: Team Collaboration & Export -->
  <svg v-else-if="step === 5" class="step-visual-svg" viewBox="0 0 420 280" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <text x="30" y="30" fill="#787878" font-size="10" font-weight="600" font-family="var(--font-mono)" letter-spacing="0.05em">MEMBERS</text>
    <circle cx="50" cy="65" r="16" fill="#2a2a30" stroke="#f59e0b" stroke-width="1.2"/>
    <text x="50" y="69" text-anchor="middle" fill="#f59e0b" font-size="11" font-weight="700" font-family="var(--font-mono)">JK</text>
    <text x="80" y="61" fill="#d4d4d4" font-size="12" font-weight="600">Kim Jongho</text>
    <rect x="80" y="69" width="52" height="18" rx="9" fill="rgba(245, 158, 11, 0.15)"/>
    <text x="106" y="82" text-anchor="middle" fill="#f59e0b" font-size="9" font-weight="600" font-family="var(--font-mono)">MASTER</text>
    <circle cx="50" cy="115" r="16" fill="#2a2a30" stroke="#5b8def" stroke-width="1.2"/>
    <text x="50" y="119" text-anchor="middle" fill="#5b8def" font-size="11" font-weight="700" font-family="var(--font-mono)">LP</text>
    <text x="80" y="111" fill="#d4d4d4" font-size="12" font-weight="600">Park Lena</text>
    <rect x="80" y="119" width="48" height="18" rx="9" fill="rgba(91, 141, 239, 0.15)"/>
    <text x="104" y="132" text-anchor="middle" fill="#93b4f5" font-size="9" font-weight="600" font-family="var(--font-mono)">ADMIN</text>
    <circle cx="50" cy="165" r="16" fill="#2a2a30" stroke="#42b883" stroke-width="1.2"/>
    <text x="50" y="169" text-anchor="middle" fill="#42b883" font-size="11" font-weight="700" font-family="var(--font-mono)">CS</text>
    <text x="80" y="161" fill="#d4d4d4" font-size="12" font-weight="600">Shin Chaewon</text>
    <rect x="80" y="169" width="52" height="18" rx="9" fill="rgba(66, 184, 131, 0.15)"/>
    <text x="106" y="182" text-anchor="middle" fill="#42b883" font-size="9" font-weight="600" font-family="var(--font-mono)">WRITER</text>
    <line x1="230" y1="30" x2="230" y2="200" stroke="#2a2a30" stroke-width="1" stroke-dasharray="4 4" opacity="0.5"/>
    <text x="270" y="30" fill="#787878" font-size="10" font-weight="600" font-family="var(--font-mono)" letter-spacing="0.05em">EXPORT</text>
    <rect x="265" y="55" width="60" height="72" rx="6" fill="#1a1a1e" stroke="#2a2a30" stroke-width="1"/>
    <rect x="271" y="61" width="48" height="36" rx="3" fill="#2a2a30"/>
    <polyline points="277,90 287,78 293,85 301,72 313,90" stroke="#5b8def" stroke-width="1.2" fill="none" stroke-linejoin="round"/>
    <circle cx="283" cy="73" r="3" fill="#5b8def" opacity="0.5"/>
    <text x="295" y="118" text-anchor="middle" fill="#787878" font-size="9" font-weight="600" font-family="var(--font-mono)">PNG</text>
    <rect x="345" y="55" width="60" height="72" rx="6" fill="#1a1a1e" stroke="#2a2a30" stroke-width="1"/>
    <text x="375" y="78" text-anchor="middle" fill="#b494f7" font-size="9" font-weight="700" font-family="var(--font-mono)">&lt;svg&gt;</text>
    <rect x="358" y="88" width="34" height="24" rx="3" fill="none" stroke="#b494f7" stroke-width="0.8" opacity="0.5"/>
    <text x="375" y="150" text-anchor="middle" fill="#787878" font-size="9" font-weight="600" font-family="var(--font-mono)">SVG</text>
  </svg>
</template>

<script setup lang="ts">
defineProps<{ step: number }>()
</script>

<style scoped>
.step-visual-svg {
  width: 100%;
  height: 100%;
}
</style>
