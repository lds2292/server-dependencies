<template>
  <div class="hero-page">
    <div class="hero-content">
      <div class="hero-badge">Server Dependencies</div>
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
      <div class="hero-actions">
        <router-link to="/register" class="btn-primary">시작하기</router-link>
        <router-link to="/login" class="btn-secondary">로그인</router-link>
      </div>
    </div>
    <div class="hero-visual">
      <div class="graph-preview">
        <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="60" y1="60" x2="160" y2="100" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.5"/>
          <line x1="260" y1="60" x2="160" y2="100" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4 3" opacity="0.5"/>
          <line x1="160" y1="100" x2="80" y2="160" stroke="#22c55e" stroke-width="1.5" opacity="0.6"/>
          <line x1="160" y1="100" x2="240" y2="160" stroke="#22c55e" stroke-width="1.5" opacity="0.6"/>
          <rect x="30" y="42" width="60" height="36" rx="6" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="60" y="64" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="600">L7</text>
          <rect x="130" y="82" width="60" height="36" rx="6" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
          <text x="160" y="104" text-anchor="middle" fill="#cbd5e1" font-size="9" font-weight="600">API</text>
          <rect x="230" y="42" width="60" height="36" rx="6" fill="#1e3a5f" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="260" y="64" text-anchor="middle" fill="#93c5fd" font-size="9" font-weight="600">L7</text>
          <rect x="50" y="142" width="60" height="36" rx="6" fill="#1a2d1a" stroke="#22c55e" stroke-width="1.5"/>
          <text x="80" y="164" text-anchor="middle" fill="#86efac" font-size="9" font-weight="600">DB</text>
          <rect x="210" y="142" width="60" height="36" rx="6" fill="#2d1b1b" stroke="#f97316" stroke-width="1.5"/>
          <text x="240" y="164" text-anchor="middle" fill="#fdba74" font-size="8" font-weight="600">EXT</text>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 80px;
  padding: 40px;
  background: #0f172a;
}
.hero-content { max-width: 480px; }
.hero-badge {
  display: inline-block;
  font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
  color: #60a5fa; background: #1e3a5f; border: 1px solid #1d4ed8;
  padding: 4px 12px; border-radius: 999px; margin-bottom: 24px;
}
.hero-title {
  font-size: 42px; font-weight: 800; line-height: 1.15;
  color: #f1f5f9; margin: 0 0 20px 0; letter-spacing: -0.02em;
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
.hero-visual {
  flex-shrink: 0;
}
.graph-preview {
  width: 320px; height: 200px;
  background: #1e293b; border: 1px solid #334155; border-radius: 16px;
  overflow: hidden;
}
.graph-preview svg { width: 100%; height: 100%; }

@media (max-width: 768px) {
  .hero-page { flex-direction: column; gap: 40px; padding: 24px; }
  .hero-title { font-size: 32px; }
  .hero-visual { display: none; }
}
</style>
