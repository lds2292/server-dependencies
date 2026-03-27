<template>
  <div ref="container" class="graph-container">
    <svg ref="svgRef" class="graph-svg"
      :style="{ cursor: spaceHeld ? 'grab' : 'default' }"
      @mousedown="onCanvasSvgMouseDown"
      @dblclick="onCanvasDblClick"
      @click="onCanvasClick"
      @contextmenu.prevent="onCanvasContextMenu"
    >
      <defs>
        <marker
          v-for="m in markerDefs"
          :key="m.id"
          :id="m.id"
          viewBox="0 -5 10 10"
          refX="10"
          refY="0"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,-5L10,0L0,5" :fill="m.fill" />
        </marker>
        <!-- 그리드 패턴 -->
        <pattern id="grid-minor" width="50" height="50" patternUnits="userSpaceOnUse">
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.035)" stroke-width="0.5"/>
        </pattern>
        <pattern id="grid-major" width="250" height="250" patternUnits="userSpaceOnUse">
          <rect width="250" height="250" fill="url(#grid-minor)"/>
          <path d="M 250 0 L 0 0 0 250" fill="none" stroke="rgba(255,255,255,0.09)" stroke-width="1"/>
        </pattern>
      </defs>
      <g ref="gRef">
        <!-- 그리드 배경 -->
        <rect v-if="showGrid" x="-50000" y="-50000" width="100000" height="100000" fill="url(#grid-major)" pointer-events="none"/>

        <!-- 중심점 마커 -->
        <g v-if="showGrid" pointer-events="none" opacity="0.55">
          <line x1="-40" y1="0" x2="40" y2="0" stroke="#60a5fa" stroke-width="1.2"/>
          <line x1="0" y1="-40" x2="0" y2="40" stroke="#60a5fa" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="4" fill="none" stroke="#60a5fa" stroke-width="1.2"/>
        </g>

        <!-- L7 멤버 연결선 (의존성 라인보다 먼저 렌더링) -->
        <g v-for="ml in l7MemberLines" :key="ml.key" pointer-events="none"
          :opacity="(pathMode || pathNodes.size > 0) ? (pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId) ? 1 : 0.1) : 1"
        >
          <!-- 글로우 레이어 -->
          <line
            :x1="ml.x1" :y1="ml.y1" :x2="ml.x2" :y2="ml.y2"
            :stroke="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#f59e0b' : '#7c3aed'"
            stroke-width="8" opacity="0.15"
          />
          <!-- 메인 라인 -->
          <line
            :x1="ml.x1" :y1="ml.y1" :x2="ml.x2" :y2="ml.y2"
            :stroke="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#f59e0b' : '#a78bfa'"
            :stroke-width="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? 3 : 2"
            stroke-dasharray="6,4" stroke-linecap="round" opacity="0.85"
          />
          <!-- 끝점 커넥터 (L7 쪽) -->
          <circle :cx="ml.x1" :cy="ml.y1" r="4"
            :fill="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#f59e0b' : '#7c3aed'"
            :stroke="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#fcd34d' : '#a78bfa'"
            stroke-width="1.5" opacity="0.9"/>
          <!-- 끝점 커넥터 (서버 쪽) -->
          <circle :cx="ml.x2" :cy="ml.y2" r="3"
            :fill="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#f59e0b' : '#a78bfa'"
            opacity="0.85"/>
        </g>

        <!-- 의존성 링크 -->
        <line
          v-for="link in computedLinks"
          :key="link.id"
          :x1="link.x1" :y1="link.y1"
          :x2="link.x2" :y2="link.y2"
          :class="{
            'link-amber':    pathLinks.has(link.id),
            'link-outgoing': !pathLinks.has(link.id) && (showAllFlow || outgoingLinks.has(link.id)),
            'link-impacted': !pathLinks.has(link.id) && !showAllFlow && impactedLinks.has(link.id),
            'link-normal':   !pathLinks.has(link.id) && !showAllFlow && !impactedLinks.has(link.id) && !outgoingLinks.has(link.id),
          }"
          :stroke="linkStroke(link)"
          :stroke-width="pathLinks.has(link.id) ? 3 : showAllFlow || impactedLinks.has(link.id) || outgoingLinks.has(link.id) ? 2.5 : 1.5"
          :opacity="linkOpacity(link)"
          :marker-end="`url(#${linkMarker(link)})`"
        />

        <!-- 드래그 미리보기 화살표 -->
        <line
          v-if="arrowPreview"
          :x1="arrowPreview.x1" :y1="arrowPreview.y1"
          :x2="arrowPreview.x2" :y2="arrowPreview.y2"
          stroke="#60a5fa" stroke-width="2" stroke-dasharray="7,4"
          marker-end="url(#arrow-preview)"
          pointer-events="none"
        />

        <!-- 박스 선택 영역 -->
        <rect
          v-if="boxSelect"
          :x="Math.min(boxSelect.startX, boxSelect.endX)"
          :y="Math.min(boxSelect.startY, boxSelect.endY)"
          :width="Math.abs(boxSelect.endX - boxSelect.startX)"
          :height="Math.abs(boxSelect.endY - boxSelect.startY)"
          fill="rgba(96, 165, 250, 0.08)"
          stroke="#60a5fa"
          stroke-width="1"
          stroke-dasharray="5,3"
          pointer-events="none"
        />

        <!-- 노드 -->
        <g
          v-for="node in renderedNodes"
          :key="node.id"
          :transform="`translate(${node.x ?? 0},${node.y ?? 0})`"
          class="graph-node"
          :class="{
            selected: selectedId === node.id,
            impacted: impactedNodes.has(node.id),
            'connect-source': arrowSource?.id === node.id,
            'connect-target': connectTarget?.id === node.id,
            'multi-selected': multiSelectedIds.has(node.id),
          }"
          :filter="nodeFilter(node)"
          :opacity="nodeOpacity(node)"
          @mousedown.stop="onNodeMouseDown($event, node)"
          @click.stop="onNodeClick(node)"
          @contextmenu.prevent.stop="onNodeContextMenu($event, node)"
          @mouseenter="hoveredNodeId = (props.pathMode && node.nodeKind === 'l7') ? null : node.id"
          @mouseleave="hoveredNodeId = null"
        >
          <title>{{ node.name }}</title>
          <rect
            x="-86" y="-37" width="187" height="74" rx="6"
            :fill="nodeColor(node)"
            :stroke="nodeStroke(node)"
            :stroke-width="isHighlighted(node) ? 3 : 1.5"
          />

          <!-- 아이콘/텍스트 구분선 -->
          <line x1="-60" y1="-31" x2="-60" y2="31" :stroke="node.nodeKind === 'infra' ? 'rgba(3,105,161,0.18)' : 'rgba(255,255,255,0.12)'" stroke-width="1" pointer-events="none"/>

          <!-- 타입 아이콘 (좌측 컬럼 수직 중앙) -->
          <g transform="translate(-79,-6)" opacity="0.85" pointer-events="none">
            <!-- Server -->
            <template v-if="!node.nodeKind || node.nodeKind === 'server'">
              <rect x="0" y="0" width="11" height="8" rx="1.5" stroke="white" stroke-width="0.9" fill="none"/>
              <line x1="0" y1="3.2" x2="11" y2="3.2" stroke="white" stroke-width="0.7"/>
              <circle cx="8.5" cy="5.8" r="0.9" fill="white"/>
              <circle cx="6.5" cy="5.8" r="0.9" fill="white"/>
            </template>
            <!-- L7 -->
            <template v-else-if="node.nodeKind === 'l7'">
              <circle cx="5.5" cy="3.5" r="3" stroke="white" stroke-width="0.9" fill="none"/>
              <line x1="5.5" y1="6.5" x2="2" y2="10" stroke="white" stroke-width="0.9"/>
              <line x1="5.5" y1="6.5" x2="9" y2="10" stroke="white" stroke-width="0.9"/>
              <line x1="2.5" y1="3.5" x2="8.5" y2="3.5" stroke="white" stroke-width="0.8"/>
            </template>
            <!-- DB -->
            <template v-else-if="node.nodeKind === 'infra'">
              <!-- v-for 트릭으로 getInfraIconInfo 결과를 로컬 변수처럼 사용 -->
              <template v-for="dbIcon in [getInfraIconInfo((node as any).infraType)]" :key="'dbi'">
                <!-- 알려진 DB: 컬러 배지 -->
                <template v-if="dbIcon">
                  <circle cx="8" cy="5" r="7" :fill="dbIcon.color" opacity="0.92"/>
                  <text
                    x="8" y="7.2"
                    text-anchor="middle"
                    :fill="dbIcon.textColor"
                    font-size="6"
                    font-weight="800"
                    style="font-family: 'Courier New', Courier, monospace; letter-spacing: 0.3px"
                    pointer-events="none"
                  >{{ dbIcon.abbr }}</text>
                </template>
                <!-- 알 수 없는 DB: 기존 실린더 유지 -->
                <template v-else>
                  <ellipse cx="5.5" cy="1.8" rx="5" ry="1.8" stroke="#0369a1" stroke-width="0.9" fill="none"/>
                  <line x1="0.5" y1="1.8" x2="0.5" y2="7.5" stroke="#0369a1" stroke-width="0.9"/>
                  <line x1="10.5" y1="1.8" x2="10.5" y2="7.5" stroke="#0369a1" stroke-width="0.9"/>
                  <ellipse cx="5.5" cy="7.5" rx="5" ry="1.8" stroke="#0369a1" stroke-width="0.9" fill="none"/>
                </template>
              </template>
            </template>
            <!-- External -->
            <template v-else-if="node.nodeKind === 'external'">
              <circle cx="5.5" cy="5" r="4.5" stroke="white" stroke-width="0.9" fill="none"/>
              <ellipse cx="5.5" cy="5" rx="2.2" ry="4.5" stroke="white" stroke-width="0.7" fill="none"/>
              <line x1="1" y1="5" x2="10" y2="5" stroke="white" stroke-width="0.7"/>
              <line x1="1.5" y1="2.5" x2="9.5" y2="2.5" stroke="white" stroke-width="0.5"/>
              <line x1="1.5" y1="7.5" x2="9.5" y2="7.5" stroke="white" stroke-width="0.5"/>
            </template>
          </g>

          <!-- 노드 텍스트 (우측 텍스트 영역 중앙: x=13) -->
          <text x="21" dy="-9" text-anchor="middle" class="node-label" :style="node.nodeKind === 'infra' ? 'fill:#0f172a' : ''">{{ truncate(node.name) }}</text>

          <template v-if="node.nodeKind === 'l7'">
            <text x="21" dy="6" text-anchor="middle" class="node-sub">{{ (node as any).ip || '' }}{{ (node as any).ip && (node as any).natIp ? ' / ' : '' }}{{ (node as any).natIp || '' }}{{ !((node as any).ip) && !((node as any).natIp) ? 'L7 Load Balancer' : '' }}</text>
            <text x="21" dy="19" text-anchor="middle" class="node-meta">{{ (node as any).memberServerIds?.length ?? 0 }}개 서버</text>
          </template>
          <template v-else-if="node.nodeKind === 'infra'">
            <text x="21" dy="6" text-anchor="middle" class="node-sub" style="fill:rgba(15,23,42,0.65)">{{ (node as any).infraType || 'Infra' }}</text>
            <text x="21" dy="19" text-anchor="middle" class="node-meta" style="fill:rgba(15,23,42,0.5)">{{ (node as any).host || '-' }}{{ (node as any).port ? ':' + (node as any).port : '' }}</text>
          </template>
          <template v-else-if="node.nodeKind === 'external'">
            <text x="21" dy="6" text-anchor="middle" class="node-sub">외부 서비스</text>
            <text x="21" dy="19" text-anchor="middle" class="node-meta">담당자 {{ (node as any).contacts?.length ?? 0 }}명</text>
          </template>
          <template v-else>
            <text x="21" dy="6" text-anchor="middle" class="node-ip">{{ (node as any).internalIps?.[0] || '-' }}{{ (node as any).internalIps?.length > 1 ? ` +${(node as any).internalIps.length - 1}` : '' }}</text>
            <text x="21" dy="19" text-anchor="middle" class="node-meta">NAT: {{ (node as any).natIps?.[0] || '-' }}{{ (node as any).natIps?.length > 1 ? ` +${(node as any).natIps.length - 1}` : '' }}</text>
          </template>

          <!-- 순환 의존성 경고 배지 -->
          <g v-if="cycleNodes.has(node.id)" class="cycle-badge" pointer-events="none">
            <circle cx="80" cy="-30" r="8" fill="#dc2626" stroke="#0f172a" stroke-width="1.5"/>
            <text x="80" y="-26" text-anchor="middle" font-size="10" font-weight="900" fill="white">!</text>
          </g>
        </g>

        <!-- glow 필터 (defs 내에 정의) -->
        <defs>
          <filter id="glow-blue" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-amber" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <marker id="arrow-preview" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,-5L10,0L0,5" fill="#60a5fa"/>
          </marker>
        </defs>
      </g>
    </svg>

    <!-- 상단 중앙 검색 -->
    <div class="search-bar" @keydown.escape="searchQuery = ''; searchFocused = false">
      <div class="search-input-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="5.5" cy="5.5" r="4" stroke="#94a3b8" stroke-width="1.3"/>
          <line x1="8.5" y1="8.5" x2="13" y2="13" stroke="#94a3b8" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="노드 / IP 검색..."
          autocomplete="off"
          spellcheck="false"
          @focus="searchFocused = true"
          @blur="onSearchBlur"
          @keydown.down.prevent="searchSelectDelta(1)"
          @keydown.up.prevent="searchSelectDelta(-1)"
          @keydown.enter.prevent="searchConfirm"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''; searchFocused = false">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="1" y1="1" x2="9" y2="9" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="9" y1="1" x2="1" y2="9" stroke="#94a3b8" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <ul v-if="searchFocused && searchResults.length > 0" class="search-dropdown">
        <li
          v-for="(node, i) in searchResults"
          :key="node.id"
          class="search-result-item"
          :class="{ active: i === searchActiveIndex }"
          @mousedown.prevent="navigateToNode(node)"
          @mouseenter="searchActiveIndex = i"
        >
          <span class="search-result-kind" :style="{ color: searchNodeColor(node) }">{{ searchNodeKindLabel(node) }}</span>
          <span class="search-result-name">{{ node.name }}</span>
          <span class="search-result-ip">{{ searchNodeIp(node) }}</span>
        </li>
      </ul>
      <div v-else-if="searchFocused && searchQuery.trim() && searchResults.length === 0" class="search-no-result">
        결과 없음
      </div>
    </div>

    <!-- 우측 상단 색상 범주 Legend -->
    <div class="node-legend">
      <div class="legend-item">
        <span class="legend-dot" style="background:#1e3a8a;border-color:#475569"></span>Server
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background:#3b0764;border-color:#7c3aed"></span>L7
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background:#f0f9ff;border-color:#7dd3fc"></span>INFRA
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background:#052e16;border-color:#16a34a"></span>External
      </div>
    </div>

    <!-- 왼쪽 상단 노드 트래킹 토글 -->
    <button
      class="canvas-btn tracking-btn"
      :class="{ active: nodeTracking }"
      @click="nodeTracking = !nodeTracking"
      :data-tooltip="`${nodeTracking ? '트래킹 ON' : '트래킹 OFF'} — 선택 노드 자동 이동`"
      data-shortcut="F"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.2"/>
        <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
        <line x1="7" y1="0.5" x2="7" y2="3" stroke="currentColor" stroke-width="1.2"/>
        <line x1="7" y1="11" x2="7" y2="13.5" stroke="currentColor" stroke-width="1.2"/>
        <line x1="0.5" y1="7" x2="3" y2="7" stroke="currentColor" stroke-width="1.2"/>
        <line x1="11" y1="7" x2="13.5" y2="7" stroke="currentColor" stroke-width="1.2"/>
      </svg>
      트래킹
    </button>

    <!-- 전체 흐름 토글 버튼 -->
    <div class="canvas-btns canvas-btns-right">
      <button
        class="canvas-btn"
        :class="{ active: showAllFlow }"
        @click="showAllFlow = !showAllFlow"
        :data-tooltip="showAllFlow ? '전체 의존 흐름 ON' : '전체 의존 흐름 OFF'"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M1 7h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          <path d="M7 4l3.5 3L7 10" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1 3h5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" opacity="0.5"/>
          <path d="M1 11h5" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" opacity="0.5"/>
        </svg>
        의존성
      </button>
    </div>

    <!-- 그리드 토글 버튼 -->
    <div class="canvas-btns">
      <button class="canvas-btn" @click="showGrid = !showGrid" :class="{ active: showGrid }" title="그리드 표시/숨김">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M0 4.67h14M0 9.33h14M4.67 0v14M9.33 0v14" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        Grid
      </button>
      <button v-if="showGrid" class="canvas-btn" @click="goToCenter" title="중심으로 이동">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="2.5" stroke="currentColor" stroke-width="1.2"/>
          <line x1="7" y1="0" x2="7" y2="3.5" stroke="currentColor" stroke-width="1.2"/>
          <line x1="7" y1="10.5" x2="7" y2="14" stroke="currentColor" stroke-width="1.2"/>
          <line x1="0" y1="7" x2="3.5" y2="7" stroke="currentColor" stroke-width="1.2"/>
          <line x1="10.5" y1="7" x2="14" y2="7" stroke="currentColor" stroke-width="1.2"/>
        </svg>
        중심
      </button>
    </div>

    <!-- 미니맵 -->
    <div v-if="minimapNodes.length > 0" class="minimap">
      <svg class="minimap-svg" :viewBox="`0 0 ${MINIMAP_W} ${MINIMAP_H}`" :width="MINIMAP_W" :height="MINIMAP_H" overflow="hidden"
        @mousedown.prevent="onMinimapMouseDown"
        @mousemove="onMinimapMouseMove"
        @mouseup="onMinimapMouseUp"
        @mouseleave="onMinimapMouseUp"
      >
        <defs>
          <clipPath id="minimap-clip">
            <rect x="0" y="0" :width="MINIMAP_W" :height="MINIMAP_H"/>
          </clipPath>
        </defs>
        <g clip-path="url(#minimap-clip)">
          <!-- 노드 점 -->
          <circle
            v-for="node in minimapNodes"
            :key="node.id"
            :cx="node.mx"
            :cy="node.my"
            r="3"
            :fill="minimapNodeColor(node)"
            opacity="0.9"
          />
          <!-- 뷰포트 바깥 어두운 오버레이 (mask로 뷰포트 구멍 뚫기) -->
          <template v-if="minimapViewport">
            <defs>
              <mask id="viewport-hole">
                <rect x="0" y="0" :width="MINIMAP_W" :height="MINIMAP_H" fill="white"/>
                <rect
                  :x="minimapViewport.x" :y="minimapViewport.y"
                  :width="minimapViewport.w" :height="minimapViewport.h"
                  fill="black"
                />
              </mask>
            </defs>
            <rect x="0" y="0" :width="MINIMAP_W" :height="MINIMAP_H"
              fill="rgba(0,0,0,0.45)" mask="url(#viewport-hole)"/>
            <!-- 뷰포트 테두리 -->
            <rect
              :x="minimapViewport.x" :y="minimapViewport.y"
              :width="minimapViewport.w" :height="minimapViewport.h"
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              stroke-width="1.5"
              rx="2"
            />
          </template>
        </g>
      </svg>
    </div>

    <!-- 하단 우측 줌 컨트롤 -->
    <div class="zoom-controls">
      <button class="zoom-btn" @click="changeZoom(-10)">−</button>
      <input
        class="zoom-input"
        type="number"
        :value="currentZoom"
        min="50"
        max="200"
        @change="onZoomInput"
        @keydown.enter.prevent="onZoomInput"
      />
      <span class="zoom-pct">%</span>
      <button class="zoom-btn" @click="changeZoom(10)">+</button>
    </div>

    <!-- 하단 힌트 -->
    <div v-if="!readOnly" class="mode-hint">일반 드래그: 노드 이동 &nbsp;|&nbsp; Ctrl + 드래그: 의존성 연결</div>
    <div v-else class="mode-hint readonly-hint">읽기 전용 모드 — 노드 이동만 가능</div>

    <!-- 순환 의존성 경고 배너 -->
    <div v-if="cycleNodes.size > 0 && !pathMode && pathNodes.size === 0" class="cycle-warning-banner">
      순환 의존성 감지: {{ cycleNodes.size }}개 노드
    </div>

    <!-- 경로 탐색 모드 배너 -->
    <div v-if="pathMode && pathNodes.size === 0" class="path-mode-banner">
      출발: <span class="path-source-name">{{ pathSourceName }}</span>
      &mdash; 도착 노드를 클릭하세요
      <button class="path-cancel-btn" @click="emit('cancelPathMode')">취소 (Esc)</button>
    </div>

    <!-- 연결 힌트 -->
    <div v-if="connectTarget && arrowSource" class="drop-hint">
      <span class="hint-source">{{ arrowSource.name }}</span> →
      <span class="hint-target">{{ connectTarget.name }}</span>
      (놓으면 의존관계 생성)
    </div>
    <div v-else-if="blockedTarget && arrowSource" class="blocked-hint">
      <span class="hint-source">{{ arrowSource.name }}</span> →
      <span class="hint-blocked">{{ blockedTarget.name }}</span>
      연결 불가
    </div>
    <div v-else-if="arrowSource && arrowPreview && !connectTarget" class="drag-hint">
      다른 노드 위에서 놓으면 의존관계를 생성합니다
    </div>
    <!-- 연결 차단 토스트 -->
    <transition name="fade">
      <div v-if="connectBlockedMsg" class="blocked-toast">{{ connectBlockedMsg }}</div>
    </transition>

    <!-- 노드 추가 메뉴 (더블클릭) -->
    <div v-if="addNodeMenu.visible" class="add-node-menu"
      :style="{ left: addNodeMenu.x + 'px', top: addNodeMenu.y + 'px' }" @click.stop>
      <div class="add-node-menu-title">노드 추가</div>
      <button @click="onAddNodeMenuSelect('server')">
        <svg class="menu-icon" viewBox="0 0 11 9" fill="none">
          <rect x="0.5" y="0.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="0.9"/>
          <line x1="0.5" y1="3.7" x2="10.5" y2="3.7" stroke="currentColor" stroke-width="0.7"/>
          <circle cx="8.5" cy="6.2" r="0.9" fill="currentColor"/>
          <circle cx="6.5" cy="6.2" r="0.9" fill="currentColor"/>
        </svg>
        서버
      </button>
      <button @click="onAddNodeMenuSelect('l7')">
        <svg class="menu-icon" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="3.5" r="3" stroke="currentColor" stroke-width="0.9"/>
          <line x1="5.5" y1="6.5" x2="2" y2="10" stroke="currentColor" stroke-width="0.9"/>
          <line x1="5.5" y1="6.5" x2="9" y2="10" stroke="currentColor" stroke-width="0.9"/>
          <line x1="2.5" y1="3.5" x2="8.5" y2="3.5" stroke="currentColor" stroke-width="0.8"/>
        </svg>
        L7 로드밸런서
      </button>
      <button @click="onAddNodeMenuSelect('infra')">
        <svg class="menu-icon" viewBox="0 0 11 10" fill="none">
          <ellipse cx="5.5" cy="1.8" rx="5" ry="1.8" stroke="#7dd3fc" stroke-width="0.9"/>
          <line x1="0.5" y1="1.8" x2="0.5" y2="8" stroke="#7dd3fc" stroke-width="0.9"/>
          <line x1="10.5" y1="1.8" x2="10.5" y2="8" stroke="#7dd3fc" stroke-width="0.9"/>
          <ellipse cx="5.5" cy="8" rx="5" ry="1.8" stroke="#7dd3fc" stroke-width="0.9"/>
        </svg>
        인프라
      </button>
      <button @click="onAddNodeMenuSelect('external')">
        <svg class="menu-icon" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="0.9"/>
          <ellipse cx="5.5" cy="5.5" rx="2.2" ry="4.5" stroke="currentColor" stroke-width="0.7"/>
          <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" stroke-width="0.7"/>
          <line x1="1.5" y1="3" x2="9.5" y2="3" stroke="currentColor" stroke-width="0.5"/>
          <line x1="1.5" y1="8" x2="9.5" y2="8" stroke="currentColor" stroke-width="0.5"/>
        </svg>
        외부 서비스
      </button>
    </div>

    <!-- 컨텍스트 메뉴 -->
    <div v-if="contextMenu.visible" class="context-menu"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
      <template v-if="multiSelectedIds.size > 1 && contextMenu.node && multiSelectedIds.has(contextMenu.node.id)">
        <div class="context-multi-label">{{ multiSelectedIds.size }}개 선택됨</div>
        <div class="context-divider"></div>
        <button v-if="!readOnly" class="danger" @click="onDeleteMultiNodes">삭제</button>
        <button v-else class="disabled-item" disabled>읽기 전용 모드</button>
      </template>
      <template v-else>
        <button class="path-item" :class="{ 'path-item-disabled': contextMenu.node?.nodeKind === 'l7' }" :disabled="contextMenu.node?.nodeKind === 'l7'" @click="onStartPath">경로 탐색</button>
        <template v-if="!readOnly">
          <div class="context-divider"></div>
          <button @click="onEditNode">수정</button>
          <button @click="onAddDep">의존성 추가</button>
          <button class="danger" @click="onDeleteNode">삭제</button>
        </template>
        <template v-else>
          <div class="context-divider"></div>
          <button class="disabled-item" disabled>읽기 전용 모드</button>
        </template>
      </template>
    </div>

    <!-- 캔버스 빈 공간 우클릭 컨텍스트 메뉴 -->
    <div v-if="canvasContextMenu.visible" class="context-menu canvas-context-menu"
      :style="{ left: canvasContextMenu.x + 'px', top: canvasContextMenu.y + 'px' }" @click.stop>
      <template v-if="!readOnly">
        <div class="submenu-item" @mouseenter="canvasContextMenu.activeSubmenu = 'add'" @mouseleave="canvasContextMenu.activeSubmenu = null">
          <span>노드 추가</span>
          <span class="submenu-arrow">▶</span>
          <div v-if="canvasContextMenu.activeSubmenu === 'add'" class="submenu">
            <button @click="onCanvasAddNode('server')">
              <svg class="menu-icon" viewBox="0 0 11 9" fill="none">
                <rect x="0.5" y="0.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="0.9"/>
                <line x1="0.5" y1="3.7" x2="10.5" y2="3.7" stroke="currentColor" stroke-width="0.7"/>
                <circle cx="8.5" cy="6.2" r="0.9" fill="currentColor"/>
                <circle cx="6.5" cy="6.2" r="0.9" fill="currentColor"/>
              </svg>
              서버
            </button>
            <button @click="onCanvasAddNode('l7')">
              <svg class="menu-icon" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="3.5" r="3" stroke="currentColor" stroke-width="0.9"/>
                <line x1="5.5" y1="6.5" x2="2" y2="10" stroke="currentColor" stroke-width="0.9"/>
                <line x1="5.5" y1="6.5" x2="9" y2="10" stroke="currentColor" stroke-width="0.9"/>
                <line x1="2.5" y1="3.5" x2="8.5" y2="3.5" stroke="currentColor" stroke-width="0.8"/>
              </svg>
              L7
            </button>
            <button @click="onCanvasAddNode('infra')">
              <svg class="menu-icon" viewBox="0 0 11 10" fill="none">
                <ellipse cx="5.5" cy="1.8" rx="5" ry="1.8" stroke="#7dd3fc" stroke-width="0.9"/>
                <line x1="0.5" y1="1.8" x2="0.5" y2="8" stroke="#7dd3fc" stroke-width="0.9"/>
                <line x1="10.5" y1="1.8" x2="10.5" y2="8" stroke="#7dd3fc" stroke-width="0.9"/>
                <ellipse cx="5.5" cy="8" rx="5" ry="1.8" stroke="#7dd3fc" stroke-width="0.9"/>
              </svg>
              인프라
            </button>
            <button @click="onCanvasAddNode('external')">
              <svg class="menu-icon" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" stroke-width="0.9"/>
                <ellipse cx="5.5" cy="5.5" rx="2.2" ry="4.5" stroke="currentColor" stroke-width="0.7"/>
                <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" stroke-width="0.7"/>
                <line x1="1.5" y1="3" x2="9.5" y2="3" stroke="currentColor" stroke-width="0.5"/>
                <line x1="1.5" y1="8" x2="9.5" y2="8" stroke="currentColor" stroke-width="0.5"/>
              </svg>
              외부 서비스
            </button>
          </div>
        </div>
      </template>
      <button @click="openExportModal">내보내기</button>
    </div>

    <!-- 내보내기 모달 -->
    <div v-if="exportModal.visible" class="modal-backdrop" @click.self="exportModal.visible = false">
      <div class="export-modal">
        <h3>내보내기</h3>
        <div class="export-format">
          <label :class="{ active: exportModal.format === 'png' }">
            <input type="radio" value="png" v-model="exportModal.format" />
            PNG
          </label>
          <label :class="{ active: exportModal.format === 'svg' }">
            <input type="radio" value="svg" v-model="exportModal.format" />
            SVG
          </label>
        </div>
        <label class="export-option">
          <input type="checkbox" v-model="exportModal.transparent" />
          배경 제거 (투명)
        </label>
        <div class="export-actions">
          <button class="btn-secondary" @click="exportModal.visible = false">취소</button>
          <button class="btn-primary" @click="onExportConfirm">내보내기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { AnyNode, D3Node, D3Link } from '../types'
import { useGraphStore } from '../stores/graph'

const graphStore = useGraphStore()

const props = defineProps<{
  nodes: AnyNode[]
  links: D3Link[]
  impactedNodes: Set<string>
  impactedLinks: Set<string>
  outgoingLinks: Set<string>
  selectedId: string | null
  readOnly: boolean
  pathNodes: Set<string>
  pathLinks: Set<string>
  pathSourceName: string
  pathMode: boolean
  cycleNodes: Set<string>
}>()

const emit = defineEmits<{
  nodeClick: [node: AnyNode]
  deselect: []
  editNode: [node: AnyNode]
  deleteNode: [node: AnyNode]
  deleteNodes: [nodeIds: string[]]
  addDependency: [source: AnyNode]
  quickConnect: [source: AnyNode, target: AnyNode]
  addNodeAt: [nodeKind: 'server' | 'l7' | 'infra' | 'external']
  startPathFrom: [node: AnyNode]
  cancelPathMode: []
}>()

const container = ref<HTMLDivElement>()
const svgRef = ref<SVGSVGElement>()
const gRef = ref<SVGGElement>()

const showGrid = ref(true)
const currentZoom = ref(100)
const nodeTracking = ref(true)
const showAllFlow = ref(false)
const currentTransform = ref({ k: 1, x: 0, y: 0 })

const MINIMAP_W = 160
const MINIMAP_H = 100
const MINIMAP_PAD = 10


const renderedNodes = ref<D3Node[]>([])
const renderedLinks = ref<D3Link[]>([])

const markerDefs = [
  { id: 'arrow-default', fill: '#94a3b8' },
  { id: 'arrow-red',     fill: '#ef4444' },
  { id: 'arrow-green',   fill: '#22c55e' },
  { id: 'arrow-amber',   fill: '#f59e0b' },
]

let simulation: d3.Simulation<D3Node, D3Link> | null = null
let zoomSetup = false
let zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null

// ─── 위치 저장/복원 ──────────────────────────────────────
function loadSavedPositions(): Record<string, { x: number; y: number }> {
  return graphStore.getPositions()
}

function savePositions() {
  const positions: Record<string, { x: number; y: number }> = {}
  renderedNodes.value.forEach(n => {
    if (n.x != null && n.y != null) positions[n.id] = { x: n.x, y: n.y }
  })
  graphStore.savePositions(positions)
}

// 드래그 상태
const hoveredNodeId = ref<string | null>(null)
const arrowSource = ref<D3Node | null>(null)
const spaceHeld = ref(false)
const multiSelectedIds = ref<Set<string>>(new Set())
const boxSelect = ref<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
const arrowPreview = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
const connectTarget = ref<D3Node | null>(null)
const blockedTarget = ref<D3Node | null>(null)
const connectBlockedMsg = ref('')

function isConnectionBlocked(source: D3Node, target: D3Node): boolean {
  return source.nodeKind === 'infra' && (!target.nodeKind || target.nodeKind === 'server')
}

let blockMsgTimer: ReturnType<typeof setTimeout> | null = null
function showBlockedMsg(msg: string) {
  connectBlockedMsg.value = msg
  if (blockMsgTimer) clearTimeout(blockMsgTimer)
  blockMsgTimer = setTimeout(() => { connectBlockedMsg.value = '' }, 2500)
}

// 컨텍스트 메뉴
const contextMenu = ref({ visible: false, x: 0, y: 0, node: null as AnyNode | null })

// 노드 추가 메뉴 (더블클릭)
const addNodeMenu = ref({ visible: false, x: 0, y: 0 })
const canvasContextMenu = ref({ visible: false, x: 0, y: 0, activeSubmenu: null as string | null })
const exportModal = ref({ visible: false, format: 'png' as 'svg' | 'png', transparent: false })
let pendingNodePosition: { x: number; y: number } | null = null

function onCanvasClick() {
  if (boxSelectDone) {
    boxSelectDone = false
    return
  }
  if (props.pathMode || props.pathNodes.size > 0) {
    emit('cancelPathMode')
  } else if (props.selectedId) {
    emit('deselect')
  }
  contextMenu.value.visible = false
  multiSelectedIds.value = new Set()
}

function onCanvasDblClick(event: MouseEvent) {
  if (props.readOnly) return
  const { x, y } = getSvgPoint(event)
  if (findNodeAt(x, y, '')) return   // 노드 위면 무시
  contextMenu.value.visible = false
  addNodeMenu.value = { visible: true, x: event.offsetX, y: event.offsetY }
  pendingNodePosition = { x, y }
}

function onAddNodeMenuSelect(nodeKind: 'server' | 'l7' | 'infra' | 'external') {
  addNodeMenu.value.visible = false
  emit('addNodeAt', nodeKind)
}

function onCanvasContextMenu(event: MouseEvent) {
  const { x, y } = getSvgPoint(event)
  if (findNodeAt(x, y, '')) return  // 노드 위면 노드 컨텍스트 메뉴에 위임
  contextMenu.value.visible = false
  addNodeMenu.value.visible = false
  pendingNodePosition = { x, y }
  canvasContextMenu.value = { visible: true, x: event.offsetX, y: event.offsetY, activeSubmenu: null }
}

function onCanvasAddNode(nodeKind: 'server' | 'l7' | 'infra' | 'external') {
  canvasContextMenu.value.visible = false
  emit('addNodeAt', nodeKind)
}

function openExportModal() {
  canvasContextMenu.value.visible = false
  exportModal.value.visible = true
}

function onExportConfirm() {
  exportGraph(exportModal.value.format, exportModal.value.transparent)
  exportModal.value.visible = false
}


// ─── DB 타입별 배지 정보 ─────────────────────────────────
function getInfraIconInfo(infraType?: string): { abbr: string; color: string; textColor: string } | null {
  if (!infraType) return null
  const t = infraType.toLowerCase()
  if (t.includes('postgres'))                           return { abbr: 'PG', color: '#1d4ed8', textColor: '#fff' }
  if (t.includes('mysql'))                              return { abbr: 'MY', color: '#e97c00', textColor: '#fff' }
  if (t.includes('mariadb'))                            return { abbr: 'MA', color: '#b45309', textColor: '#fff' }
  if (t.includes('redis'))                              return { abbr: 'RD', color: '#dc2626', textColor: '#fff' }
  if (t.includes('mongo'))                              return { abbr: 'MG', color: '#15803d', textColor: '#fff' }
  if (t.includes('oracle'))                             return { abbr: 'OR', color: '#c2410c', textColor: '#fff' }
  if (t.includes('sqlite'))                             return { abbr: 'SL', color: '#0369a1', textColor: '#fff' }
  if (t.includes('cassandra'))                          return { abbr: 'CA', color: '#6d28d9', textColor: '#fff' }
  if (t.includes('elastic'))                            return { abbr: 'ES', color: '#d97706', textColor: '#fff' }
  if (t.includes('dynamo'))                             return { abbr: 'DY', color: '#b45309', textColor: '#fff' }
  if (t.includes('mssql') || t.includes('sqlserver') || t.includes('sql server')) return { abbr: 'MS', color: '#0284c7', textColor: '#fff' }
  if (t.includes('influx'))                             return { abbr: 'IF', color: '#0891b2', textColor: '#fff' }
  if (t.includes('clickhouse'))                         return { abbr: 'CH', color: '#ea580c', textColor: '#fff' }
  return null
}

// ─── 텍스트 잘라내기 ─────────────────────────────────────
function truncate(text: string, max = 20): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

// ─── 색상 ───────────────────────────────────────────────
function nodeColor(node: D3Node): string {
  if (node.nodeKind === 'l7') return '#3b0764'
  if (node.nodeKind === 'infra') return '#f0f9ff'
  if (node.nodeKind === 'external') return '#052e16'
  return '#1e3a8a'
}

function linkStroke(link: { id: string }): string {
  if (props.pathLinks.has(link.id)) return '#f59e0b'
  if (!showAllFlow.value && props.impactedLinks.has(link.id)) return '#ef4444'
  if (showAllFlow.value || props.outgoingLinks.has(link.id)) return '#22c55e'
  return '#94a3b8'
}

function linkOpacity(link: { id: string }): number {
  if (props.pathMode || props.pathLinks.size > 0)
    return props.pathLinks.has(link.id) ? 1 : 0.1
  if (!showAllFlow.value && props.selectedId &&
      !props.impactedLinks.has(link.id) && !props.outgoingLinks.has(link.id)) return 0.15
  return 1
}

function linkMarker(link: { id: string }): string {
  if (props.pathLinks.has(link.id)) return 'arrow-amber'
  if (!showAllFlow.value && props.impactedLinks.has(link.id)) return 'arrow-red'
  if (showAllFlow.value || props.outgoingLinks.has(link.id)) return 'arrow-green'
  return 'arrow-default'
}

function nodeFilter(node: D3Node): string | undefined {
  if (props.pathNodes.has(node.id)) return 'url(#glow-amber)'
  if (props.pathMode && hoveredNodeId.value === node.id) return 'url(#glow-amber)'
  if (props.selectedId === node.id) return 'url(#glow-blue)'
  if (props.cycleNodes.has(node.id)) return 'url(#glow-red)'
  if (props.impactedNodes.has(node.id)) return 'url(#glow-red)'
  return undefined
}

function nodeOpacity(node: D3Node): number {
  if (props.pathMode || props.pathNodes.size > 0) {
    if (props.pathNodes.has(node.id)) return 1
    if (props.pathMode && hoveredNodeId.value === node.id) return 1
    return 0.15
  }
  return 1
}

function nodeStroke(node: D3Node): string {
  if (props.pathNodes.has(node.id)) return '#f59e0b'
  if (props.pathMode && hoveredNodeId.value === node.id) return '#f59e0b'
  if (props.cycleNodes.has(node.id)) return '#dc2626'
  if (blockedTarget.value?.id === node.id) return '#ef4444'
  if (connectTarget.value?.id === node.id) return '#22c55e'
  if (arrowSource.value?.id === node.id) return '#60a5fa'
  if (props.selectedId === node.id) {
    if (node.nodeKind === 'l7') return '#a78bfa'
    if (node.nodeKind === 'infra') return '#0284c7'
    if (node.nodeKind === 'external') return '#4ade80'
    return '#2563eb'
  }
  if (props.impactedNodes.has(node.id)) return '#ef4444'
  if (node.nodeKind === 'l7') return '#7c3aed'
  if (node.nodeKind === 'infra') return '#7dd3fc'
  if (node.nodeKind === 'external') return '#16a34a'
  return '#475569'
}

function isHighlighted(node: D3Node): boolean {
  return props.pathNodes.has(node.id)
    || props.selectedId === node.id || props.impactedNodes.has(node.id)
    || props.cycleNodes.has(node.id)
    || connectTarget.value?.id === node.id || arrowSource.value?.id === node.id
    || blockedTarget.value?.id === node.id
}

// ─── 링크 끝점 계산 (노드 경계까지) ────────────────────
const computedLinks = computed(() => {
  return renderedLinks.value.map(link => {
    const src = link.source as D3Node
    const tgt = link.target as D3Node
    const sx = src.x ?? 0, sy = src.y ?? 0
    const tx = tgt.x ?? 0, ty = tgt.y ?? 0
    const dx = tx - sx, dy = ty - sy
    const len = Math.hypot(dx, dy)
    if (len < 1) return { ...link, x1: sx, y1: sy, x2: tx, y2: ty }
    const ux = dx / len, uy = dy / len
    const hw = 93, hh = 37
    const tEdge = Math.min(
      Math.abs(ux) > 0.001 ? hw / Math.abs(ux) : Infinity,
      Math.abs(uy) > 0.001 ? hh / Math.abs(uy) : Infinity
    )
    return {
      ...link,
      x1: sx, y1: sy,
      x2: tx - ux * (tEdge + 2),
      y2: ty - uy * (tEdge + 2),
    }
  })
})

// ─── L7 멤버 연결선 ──────────────────────────────────────
const l7MemberLines = computed(() => {
  const nodeMap = new Map(renderedNodes.value.map(n => [n.id, n]))
  const lines: { key: string; l7Id: string; memberId: string; x1: number; y1: number; x2: number; y2: number }[] = []
  for (const node of renderedNodes.value) {
    if (node.nodeKind !== 'l7') continue
    const memberIds: string[] = (node as any).memberServerIds ?? []
    for (const mid of memberIds) {
      const member = nodeMap.get(mid)
      if (member) {
        lines.push({
          key: `${node.id}-${mid}`,
          l7Id: node.id,
          memberId: mid,
          x1: node.x ?? 0, y1: node.y ?? 0,
          x2: member.x ?? 0, y2: member.y ?? 0,
        })
      }
    }
  }
  return lines
})

// ─── SVG 좌표 변환 ───────────────────────────────────────
function getSvgPoint(event: MouseEvent): { x: number; y: number } {
  if (!svgRef.value) return { x: 0, y: 0 }
  const rect = svgRef.value.getBoundingClientRect()
  const transform = d3.zoomTransform(svgRef.value)
  const [wx, wy] = transform.invert([event.clientX - rect.left, event.clientY - rect.top])
  return { x: wx, y: wy }
}

function findNodeAt(worldX: number, worldY: number, excludeId: string): D3Node | null {
  return renderedNodes.value.find(n => {
    if (n.id === excludeId) return false
    return Math.abs(worldX - (n.x ?? 0)) < 93 && Math.abs(worldY - (n.y ?? 0)) < 37
  }) ?? null
}

// ─── 시뮬레이션 ─────────────────────────────────────────
function buildSimulation() {
  const width = container.value?.clientWidth ?? 800
  const height = container.value?.clientHeight ?? 600

  const savedPositions = loadSavedPositions()
  const nodeMap = new Map(props.nodes.map(n => [n.id, { ...n } as D3Node]))

  // 1순위: 인메모리 위치 복원 (같은 세션 내)
  renderedNodes.value.forEach(existing => {
    const n = nodeMap.get(existing.id)
    if (n) { n.x = existing.x; n.y = existing.y; n.fx = existing.fx; n.fy = existing.fy }
  })

  // 2순위: localStorage 저장 위치 (새로고침 후)
  nodeMap.forEach(n => {
    if (n.x == null && savedPositions[n.id]) {
      n.x = savedPositions[n.id].x
      n.y = savedPositions[n.id].y
      n.fx = n.x
      n.fy = n.y
    }
  })

  const nodes: D3Node[] = Array.from(nodeMap.values())

  // hasNewNodes: 저장 위치도 없는 진짜 신규 노드 여부
  const hasNewNodes = nodes.some(n => n.x == null)

  // 3순위: 신규 노드는 더블클릭 위치 또는 현재 뷰포트 중심에 배치
  if (hasNewNodes) {
    const clickPos = pendingNodePosition
    const viewportCenter = (() => {
      if (!svgRef.value) return { x: width / 2, y: height / 2 }
      const transform = d3.zoomTransform(svgRef.value)
      const [cx, cy] = transform.invert([width / 2, height / 2])
      return { x: cx, y: cy }
    })()
    nodes.forEach(n => {
      if (n.x == null) {
        const pos = clickPos ?? viewportCenter
        n.x = pos.x; n.y = pos.y
        if (clickPos) { n.fx = pos.x; n.fy = pos.y }  // 더블클릭 위치는 고정
      }
    })
    pendingNodePosition = null
  }
  const links: D3Link[] = props.links.map(l => ({
    ...l,
    source: nodeMap.get(l.source as string) ?? l.source,
    target: nodeMap.get(l.target as string) ?? l.target,
  }))

  renderedNodes.value = nodes
  renderedLinks.value = links

  simulation?.stop()

  simulation = d3.forceSimulation<D3Node, D3Link>(nodes)
    .alpha(hasNewNodes ? 0.6 : 0.05)
    .alphaDecay(0.04)
    .velocityDecay(0.6)
    .force('link', d3.forceLink<D3Node, D3Link>(links).id(d => d.id).distance(200))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(0, 0))
    .force('collision', d3.forceCollide(113))
    .on('tick', () => {
      renderedNodes.value = [...nodes]
      renderedLinks.value = [...links]
    })
    .on('end', () => {
      // 시뮬레이션 완료 후 모든 노드 위치 고정 → 이후 환경 필터 토글시 흔들림 없음
      nodes.forEach(n => {
        n.fx = n.x ?? 0
        n.fy = n.y ?? 0
      })
      renderedNodes.value = [...nodes]
      savePositions()
    })
}

function setupZoom() {
  if (zoomSetup || !svgRef.value || !gRef.value) return
  zoomSetup = true
  const width = container.value?.clientWidth ?? 800
  const height = container.value?.clientHeight ?? 600
  const svg = d3.select(svgRef.value)
  const g = d3.select(gRef.value)
  zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.5, 2])
    .filter((event: Event) => {
      if (event instanceof WheelEvent) return true
      if (event instanceof MouseEvent) return spaceHeld.value
      return false
    })
    .on('zoom', e => {
      g.attr('transform', e.transform.toString())
      currentZoom.value = Math.round(e.transform.k * 100)
      currentTransform.value = { k: e.transform.k, x: e.transform.x, y: e.transform.y }
    })
  svg.call(zoomBehavior)
  // 초기 뷰포트: 월드 (0,0) = 그리드 중심이 화면 중앙에 오도록 즉시 적용
  svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(width / 2, height / 2))
}

function goToCenter() {
  if (!svgRef.value || !zoomBehavior) return
  const width = container.value?.clientWidth ?? 800
  const height = container.value?.clientHeight ?? 600
  const svg = d3.select(svgRef.value)
  svg.transition().duration(500).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(width / 2, height / 2)
  )
}

// ─── 노드 이동 드래그 ────────────────────────────────────
function startNodeDrag(event: MouseEvent, node: D3Node) {
  event.preventDefault()
  const startWorld = getSvgPoint(event)
  const isMultiDrag = multiSelectedIds.value.size > 1 && multiSelectedIds.value.has(node.id)

  if (isMultiDrag) {
    const startPositions = new Map(
      renderedNodes.value
        .filter(n => multiSelectedIds.value.has(n.id))
        .map(n => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }])
    )
    renderedNodes.value.forEach(n => {
      if (multiSelectedIds.value.has(n.id)) { n.fx = n.x ?? 0; n.fy = n.y ?? 0 }
    })
    simulation?.alphaTarget(0.3).restart()

    const handleMove = (e: MouseEvent) => {
      const { x, y } = getSvgPoint(e)
      const dx = x - startWorld.x, dy = y - startWorld.y
      nodeDragMoved = true
      renderedNodes.value.forEach(n => {
        if (multiSelectedIds.value.has(n.id)) {
          const sp = startPositions.get(n.id)!
          n.fx = sp.x + dx; n.fy = sp.y + dy
          n.x = n.fx; n.y = n.fy
        }
      })
      renderedNodes.value = [...renderedNodes.value]
    }
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      simulation?.alphaTarget(0)
      savePositions()
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  } else {
    const startX = node.x ?? 0, startY = node.y ?? 0
    node.fx = startX; node.fy = startY
    simulation?.alphaTarget(0.3).restart()

    const handleMove = (e: MouseEvent) => {
      const { x, y } = getSvgPoint(e)
      nodeDragMoved = true
      node.fx = startX + (x - startWorld.x)
      node.fy = startY + (y - startWorld.y)
      node.x = node.fx; node.y = node.fy
      renderedNodes.value = [...renderedNodes.value]
    }
    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      simulation?.alphaTarget(0)
      savePositions()
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }
}

// ─── 화살표 드래그 (의존성 연결) ─────────────────────────
function startArrowDrag(event: MouseEvent, node: D3Node) {
  let isDragging = false
  const startPos = getSvgPoint(event)
  arrowSource.value = node

  const handleMove = (e: MouseEvent) => {
    const { x, y } = getSvgPoint(e)
    if (!isDragging) {
      if (Math.hypot(x - startPos.x, y - startPos.y) < 8) return
      isDragging = true
    }
    arrowPreview.value = { x1: node.x ?? 0, y1: node.y ?? 0, x2: x, y2: y }
    const found = findNodeAt(x, y, node.id)
    if (found && isConnectionBlocked(node, found)) {
      connectTarget.value = null
      blockedTarget.value = found
    } else {
      connectTarget.value = found
      blockedTarget.value = null
    }
  }
  const handleUp = () => {
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
    if (isDragging && blockedTarget.value) {
      showBlockedMsg(`인프라 노드는 서버 노드에 의존성을 추가할 수 없습니다`)
    } else if (isDragging && connectTarget.value) {
      emit('quickConnect', node, connectTarget.value)
    }
    arrowPreview.value = null
    arrowSource.value = null
    connectTarget.value = null
    blockedTarget.value = null
  }
  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleUp)
}

let boxSelectDone = false
let nodeDragMoved = false

function onCanvasSvgMouseDown(event: MouseEvent) {
  if (event.button !== 0) return
  if (spaceHeld.value) return
  const startWorld = getSvgPoint(event)
  boxSelect.value = { startX: startWorld.x, startY: startWorld.y, endX: startWorld.x, endY: startWorld.y }

  const handleMove = (e: MouseEvent) => {
    const { x, y } = getSvgPoint(e)
    boxSelect.value = { ...boxSelect.value!, endX: x, endY: y }
  }
  const handleUp = () => {
    window.removeEventListener('mousemove', handleMove)
    window.removeEventListener('mouseup', handleUp)
    if (boxSelect.value) {
      const { startX, startY, endX, endY } = boxSelect.value
      if (Math.abs(endX - startX) > 5 || Math.abs(endY - startY) > 5) {
        const minX = Math.min(startX, endX), maxX = Math.max(startX, endX)
        const minY = Math.min(startY, endY), maxY = Math.max(startY, endY)
        const selected = renderedNodes.value.filter(n => {
          const nx = n.x ?? 0, ny = n.y ?? 0
          return nx >= minX && nx <= maxX && ny >= minY && ny <= maxY
        })
        multiSelectedIds.value = new Set(selected.map(n => n.id))
        boxSelectDone = true
      }
      boxSelect.value = null
    }
  }
  window.addEventListener('mousemove', handleMove)
  window.addEventListener('mouseup', handleUp)
}

function onNodeMouseDown(event: MouseEvent, node: D3Node) {
  contextMenu.value.visible = false
  if (!props.readOnly && (event.ctrlKey || event.metaKey)) startArrowDrag(event, node)
  else startNodeDrag(event, node)
}

watch(() => [props.nodes, props.links], buildSimulation, { deep: true })
watch(() => props.selectedId, (id) => {
  if (nodeTracking.value && id) navigateTo(id)
})

function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'Space' && !e.repeat) {
    e.preventDefault()
    spaceHeld.value = true
  }
}
function onKeyUp(e: KeyboardEvent) {
  if (e.code === 'Space') spaceHeld.value = false
}

onMounted(() => {
  setupZoom()
  buildSimulation()
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
})
onUnmounted(() => {
  simulation?.stop()
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('keyup', onKeyUp)
})

function onNodeClick(node: AnyNode) {
  if (arrowPreview.value) return
  if (nodeDragMoved) { nodeDragMoved = false; return }
  contextMenu.value.visible = false
  multiSelectedIds.value = new Set()
  emit('nodeClick', node)
}
function onNodeContextMenu(event: MouseEvent, node: AnyNode) {
  canvasContextMenu.value.visible = false
  contextMenu.value = { visible: true, x: event.offsetX, y: event.offsetY, node }
}
function onEditNode() { if (contextMenu.value.node) emit('editNode', contextMenu.value.node); contextMenu.value.visible = false }
function onDeleteNode() { if (contextMenu.value.node) emit('deleteNode', contextMenu.value.node); contextMenu.value.visible = false }
function onDeleteMultiNodes() {
  emit('deleteNodes', Array.from(multiSelectedIds.value))
  contextMenu.value.visible = false
}
function onAddDep() { if (contextMenu.value.node) emit('addDependency', contextMenu.value.node); contextMenu.value.visible = false }
function onStartPath() { if (contextMenu.value.node) emit('startPathFrom', contextMenu.value.node); contextMenu.value.visible = false }

function closeContextMenu() {
  contextMenu.value.visible = false
  addNodeMenu.value.visible = false
  canvasContextMenu.value.visible = false
}
onMounted(() => document.addEventListener('click', closeContextMenu))
onUnmounted(() => document.removeEventListener('click', closeContextMenu))

// ─── 미니맵 ─────────────────────────────────────────────
// 월드 (0,0) = 미니맵 중앙 고정, 노드 분포에 따라 스케일만 조정
const minimapLayout = computed(() => {
  const nodes = renderedNodes.value
  if (nodes.length === 0) return null
  const xs = nodes.map(n => Math.abs(n.x ?? 0))
  const ys = nodes.map(n => Math.abs(n.y ?? 0))
  const maxExtentX = Math.max(...xs, 1) + 120
  const maxExtentY = Math.max(...ys, 1) + 80
  const scaleX = (MINIMAP_W / 2 - MINIMAP_PAD) / maxExtentX
  const scaleY = (MINIMAP_H / 2 - MINIMAP_PAD) / maxExtentY
  const scale = Math.min(scaleX, scaleY)
  // 미니맵 중심 = 월드 (0,0)
  const cx = MINIMAP_W / 2
  const cy = MINIMAP_H / 2
  return { scale, cx, cy }
})

const minimapNodes = computed(() => {
  const layout = minimapLayout.value
  if (!layout) return []
  return renderedNodes.value.map(n => ({
    ...n,
    mx: layout.cx + (n.x ?? 0) * layout.scale,
    my: layout.cy + (n.y ?? 0) * layout.scale,
  }))
})

const minimapViewport = computed(() => {
  const layout = minimapLayout.value
  if (!layout) return null
  const { k, x: tx, y: ty } = currentTransform.value
  const w = container.value?.clientWidth ?? 800
  const h = container.value?.clientHeight ?? 600
  const worldLeft = -tx / k
  const worldTop = -ty / k
  const worldRight = (w - tx) / k
  const worldBottom = (h - ty) / k
  const mx = layout.cx + worldLeft * layout.scale
  const my = layout.cy + worldTop * layout.scale
  const mw = (worldRight - worldLeft) * layout.scale
  const mh = (worldBottom - worldTop) * layout.scale
  return { x: mx, y: my, w: mw, h: mh }
})

function minimapNodeColor(node: { nodeKind?: string }): string {
  if (node.nodeKind === 'l7') return '#a78bfa'
  if (node.nodeKind === 'infra') return '#7dd3fc'
  if (node.nodeKind === 'external') return '#4ade80'
  return '#60a5fa'
}

// ─── 미니맵 드래그 ───────────────────────────────────────
const minimapDragging = ref(false)

function minimapSvgPoint(event: MouseEvent): { mx: number; my: number } | null {
  const svgEl = event.currentTarget as SVGSVGElement
  if (!svgEl) return null
  const rect = svgEl.getBoundingClientRect()
  return {
    mx: ((event.clientX - rect.left) / rect.width) * MINIMAP_W,
    my: ((event.clientY - rect.top) / rect.height) * MINIMAP_H,
  }
}

function panToMinimapPoint(mx: number, my: number) {
  const layout = minimapLayout.value
  if (!layout || !svgRef.value || !zoomBehavior) return
  const wx = (mx - layout.cx) / layout.scale
  const wy = (my - layout.cy) / layout.scale
  const w = container.value?.clientWidth ?? 800
  const h = container.value?.clientHeight ?? 600
  const k = currentTransform.value.k
  const tx = w / 2 - wx * k
  const ty = h / 2 - wy * k
  d3.select(svgRef.value).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(tx, ty).scale(k)
  )
}

function onMinimapMouseDown(event: MouseEvent) {
  minimapDragging.value = true
  const pt = minimapSvgPoint(event)
  if (pt) panToMinimapPoint(pt.mx, pt.my)
}

function onMinimapMouseMove(event: MouseEvent) {
  if (!minimapDragging.value) return
  const pt = minimapSvgPoint(event)
  if (pt) panToMinimapPoint(pt.mx, pt.my)
}

function onMinimapMouseUp() {
  minimapDragging.value = false
}

// ─── 검색 ────────────────────────────────────────────────
const searchQuery = ref('')
const searchFocused = ref(false)
const searchActiveIndex = ref(0)

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return renderedNodes.value.filter(node => {
    if (node.name.toLowerCase().includes(q)) return true
    if ((node as any).internalIps?.some((ip: string) => ip.toLowerCase().includes(q))) return true
    if ((node as any).natIps?.some((ip: string) => ip.toLowerCase().includes(q))) return true
    if ('ip' in node && (node as any).ip?.toLowerCase().includes(q)) return true
    if ('host' in node && (node as any).host?.toLowerCase().includes(q)) return true
    return false
  }).slice(0, 8)
})

watch(searchResults, () => { searchActiveIndex.value = 0 })

function searchNodeKindLabel(node: D3Node): string {
  if (node.nodeKind === 'l7') return 'L7'
  if (node.nodeKind === 'infra') return 'INFRA'
  if (node.nodeKind === 'external') return 'EXT'
  return 'SRV'
}

function searchNodeColor(node: D3Node): string {
  if (node.nodeKind === 'l7') return '#a78bfa'
  if (node.nodeKind === 'infra') return '#7dd3fc'
  if (node.nodeKind === 'external') return '#4ade80'
  return '#60a5fa'
}

function searchNodeIp(node: D3Node): string {
  const parts: string[] = []
  if ((node as any).internalIps?.length) parts.push(...(node as any).internalIps)
  if ((node as any).natIps?.length) parts.push(...(node as any).natIps)
  if ('ip' in node && (node as any).ip) parts.push((node as any).ip)
  if ('host' in node && (node as any).host) parts.push((node as any).host)
  return parts.join(' / ')
}

function navigateToNode(node: D3Node) {
  if (!svgRef.value || !zoomBehavior) return
  const wx = node.x ?? 0
  const wy = node.y ?? 0
  const w = container.value?.clientWidth ?? 800
  const h = container.value?.clientHeight ?? 600
  const k = currentTransform.value.k
  const tx = w / 2 - wx * k
  const ty = h / 2 - wy * k
  d3.select(svgRef.value).transition().duration(350).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(tx, ty).scale(k)
  )
  emit('nodeClick', node)
  searchQuery.value = ''
  searchFocused.value = false
}

function onSearchBlur() {
  setTimeout(() => { searchFocused.value = false }, 150)
}

function searchSelectDelta(delta: number) {
  const len = searchResults.value.length
  if (!len) return
  searchActiveIndex.value = (searchActiveIndex.value + delta + len) % len
}

function searchConfirm() {
  const node = searchResults.value[searchActiveIndex.value]
  if (node) navigateToNode(node)
}

// ─── 내보내기 ─────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function exportGraph(format: 'svg' | 'png', transparent = false) {
  if (!svgRef.value) return
  const nodes = renderedNodes.value
  if (nodes.length === 0) return

  const pad = 80
  const halfW = 94, halfH = 38
  const xs = nodes.map(n => n.x ?? 0)
  const ys = nodes.map(n => n.y ?? 0)
  const minX = Math.min(...xs) - halfW - pad
  const maxX = Math.max(...xs) + halfW + pad
  const minY = Math.min(...ys) - halfH - pad
  const maxY = Math.max(...ys) + halfH + pad
  const vw = maxX - minX
  const vh = maxY - minY

  const clone = svgRef.value.cloneNode(true) as SVGSVGElement
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(vw))
  clone.setAttribute('height', String(vh))
  clone.setAttribute('viewBox', `${minX} ${minY} ${vw} ${vh}`)

  // gRef의 d3 transform 제거 (world coord = SVG coord)
  const innerG = Array.from(clone.childNodes).find(
    (n): n is Element => n.nodeType === 1 && (n as Element).tagName === 'g'
  ) as SVGGElement | undefined
  innerG?.removeAttribute('transform')

  // 배경 (투명 옵션이 아닐 때만 삽입)
  if (!transparent) {
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('x', String(minX))
    bg.setAttribute('y', String(minY))
    bg.setAttribute('width', String(vw))
    bg.setAttribute('height', String(vh))
    bg.setAttribute('fill', '#0f172a')
    clone.insertBefore(bg, clone.firstChild)
  }

  // 스코프된 CSS 텍스트 클래스 인라인
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = [
    `text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }`,
    `.node-label { font-size: 12px; fill: #fff; font-weight: 700; }`,
    `.node-ip    { font-size: 10px; fill: rgba(255,255,255,0.75); }`,
    `.node-sub   { font-size: 9px;  fill: rgba(255,255,255,0.65); font-weight: 600; letter-spacing: 0.02em; }`,
    `.node-meta  { font-size: 9.5px; fill: rgba(255,255,255,0.5); }`,
  ].join('\n')
  clone.insertBefore(style, clone.firstChild)

  const svgStr = new XMLSerializer().serializeToString(clone)

  if (format === 'svg') {
    downloadBlob(new Blob([svgStr], { type: 'image/svg+xml' }), 'graph.svg')
    return
  }

  // PNG: SVG → canvas
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('SVG 로드 실패'))
    img.src = url
  })
  const scale = 2
  const canvas = document.createElement('canvas')
  canvas.width = vw * scale
  canvas.height = vh * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.drawImage(img, 0, 0, vw, vh)
  URL.revokeObjectURL(url)
  canvas.toBlob(b => { if (b) downloadBlob(b, 'graph.png') }, 'image/png')
}

// ─── 줌 컨트롤 ──────────────────────────────────────────
function applyZoom(percent: number) {
  if (!svgRef.value || !zoomBehavior) return
  const clamped = Math.max(50, Math.min(200, percent))
  const scale = clamped / 100
  d3.select(svgRef.value).transition().duration(200).call(zoomBehavior.scaleTo, scale)
}

function changeZoom(delta: number) {
  applyZoom(currentZoom.value + delta)
}

function onZoomInput(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value)
  if (!isNaN(val)) applyZoom(val)
}

// ─── 노드로 뷰포트 이동 ──────────────────────────────────
function navigateTo(nodeId: string) {
  const node = renderedNodes.value.find(n => n.id === nodeId)
  if (!node || node.x == null || node.y == null || !svgRef.value || !zoomBehavior) return
  const width = container.value?.clientWidth ?? 800
  const height = container.value?.clientHeight ?? 600
  const scale = d3.zoomTransform(svgRef.value).k
  d3.select(svgRef.value).transition().duration(500).call(
    zoomBehavior.transform,
    d3.zoomIdentity.translate(width / 2 - node.x * scale, height / 2 - node.y * scale).scale(scale)
  )
}

function toggleTracking() {
  nodeTracking.value = !nodeTracking.value
}

defineExpose({ navigateTo, toggleTracking, multiSelectedIds })
</script>

<style scoped>
.graph-container {
  position: relative; width: 100%; height: 100%;
  background: #0f172a; border-radius: 8px; overflow: hidden;
  user-select: none;
}
.graph-svg { width: 100%; height: 100%; }
.node-label { font-size: 12px; fill: #fff; pointer-events: none; font-weight: 700; }
.node-ip { font-size: 10px; fill: rgba(255,255,255,0.75); pointer-events: none; }
.node-sub { font-size: 9px; fill: rgba(255,255,255,0.65); pointer-events: none; font-weight: 600; letter-spacing: 0.02em; }
.node-meta { font-size: 9.5px; fill: rgba(255,255,255,0.5); pointer-events: none; }
/* 의존성 링크 애니메이션 */
@keyframes flow-dash {
  from { stroke-dashoffset: 18; }
  to   { stroke-dashoffset: 0; }
}
/* 장애 영향: 의존노드 → 선택노드 (빨간, forward 방향) */
.link-impacted {
  stroke-dasharray: 10 5;
  animation: flow-dash 0.55s linear infinite;
  filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.7));
}
/* 의존 경로: 선택노드 → 의존노드 (녹색, forward 방향) */
.link-outgoing {
  stroke-dasharray: 10 5;
  animation: flow-dash 0.55s linear infinite;
  filter: drop-shadow(0 0 3px rgba(34, 197, 94, 0.7));
}
.link-normal {
  transition: opacity 0.2s;
}

.graph-node { cursor: grab; }
.graph-node:active { cursor: grabbing; }
.graph-node.connect-source rect { filter: brightness(1.3); }
.graph-node.connect-target rect { filter: brightness(1.5); }

.mode-hint {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  background: #1e293b; border: 1px solid #334155; border-radius: 20px;
  padding: 5px 14px; font-size: 11px; color: #64748b;
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.readonly-hint { background: #1c1217; border-color: #7c3aed; color: #a78bfa; }
.drop-hint {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  background: #052e16; border: 1px solid #22c55e; border-radius: 20px;
  padding: 6px 16px; font-size: 13px; color: #86efac;
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.drag-hint {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  background: #0f2044; border: 1px solid #3b82f6; border-radius: 20px;
  padding: 6px 16px; font-size: 13px; color: #93c5fd;
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.blocked-hint {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 20px;
  padding: 6px 16px; font-size: 13px; color: #fca5a5;
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.hint-blocked { color: #ef4444; font-weight: 700; }
.blocked-toast {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 10px;
  padding: 14px 24px; font-size: 14px; color: #fca5a5; font-weight: 600;
  pointer-events: none; z-index: 100; white-space: nowrap;
  box-shadow: 0 4px 20px rgba(239,68,68,0.25);
}
.fade-enter-active { transition: opacity 0.2s; }
.fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.hint-source { color: #60a5fa; font-weight: 700; }
.hint-target { color: #22c55e; font-weight: 700; }
.add-node-menu {
  position: absolute; background: #1e293b; border: 1px solid #334155;
  border-radius: 8px; padding: 4px 0; z-index: 110; min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.add-node-menu-title {
  padding: 6px 14px 5px; font-size: 11px; font-weight: 700;
  color: #475569; letter-spacing: 0.05em; text-transform: uppercase;
  border-bottom: 1px solid #334155; margin-bottom: 3px;
}
.add-node-menu button {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 14px; background: none;
  border: none; color: #e2e8f0; text-align: left; cursor: pointer; font-size: 13px;
}
.add-node-menu button:hover { background: #334155; }
.menu-icon { width: 14px; height: 14px; flex-shrink: 0; }

.context-menu {
  position: absolute; background: #1e293b; border: 1px solid #334155;
  border-radius: 6px; padding: 4px 0; z-index: 100; min-width: 120px;
}
.context-menu button {
  display: block; width: 100%; padding: 6px 16px; background: none;
  border: none; color: #e2e8f0; text-align: left; cursor: pointer; font-size: 13px;
}
.context-menu button:hover { background: #334155; }
.submenu-item {
  position: relative; display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px 6px 16px; color: #e2e8f0; font-size: 13px; cursor: pointer; user-select: none;
}
.submenu-item:hover { background: #334155; }
.submenu-arrow { font-size: 9px; color: #94a3b8; margin-left: 8px; }
.submenu {
  position: absolute; left: 100%; top: -4px;
  background: #1e293b; border: 1px solid #334155;
  border-radius: 6px; padding: 4px 0; min-width: 120px; z-index: 101;
}
.submenu button {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 6px 16px; background: none;
  border: none; color: #e2e8f0; text-align: left; cursor: pointer; font-size: 13px;
}
.submenu button:hover { background: #334155; }

/* 내보내기 모달 */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 300;
}
.export-modal {
  background: #1e293b; border: 1px solid #334155;
  border-radius: 10px; padding: 24px; width: 300px;
  display: flex; flex-direction: column; gap: 16px;
}
.export-modal h3 { margin: 0; color: #f1f5f9; font-size: 15px; }
.export-format { display: flex; gap: 8px; }
.export-format label {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border: 1px solid #334155; border-radius: 6px;
  color: #94a3b8; cursor: pointer; font-size: 13px; transition: all 0.15s;
}
.export-format label.active { border-color: #3b82f6; color: #e2e8f0; background: rgba(59,130,246,0.1); }
.export-format input[type=radio] { display: none; }
.export-option {
  display: flex; align-items: center; gap: 8px;
  color: #e2e8f0; font-size: 13px; cursor: pointer;
}
.export-option input[type=checkbox] { accent-color: #3b82f6; width: 14px; height: 14px; }
.export-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-primary {
  padding: 7px 16px; background: #2563eb; color: #fff;
  border: none; border-radius: 6px; cursor: pointer; font-size: 13px;
}
.btn-primary:hover { background: #1d4ed8; }
.btn-secondary {
  padding: 7px 16px; background: none; color: #94a3b8;
  border: 1px solid #334155; border-radius: 6px; cursor: pointer; font-size: 13px;
}
.btn-secondary:hover { background: #334155; color: #e2e8f0; }
.context-menu button.danger { color: #ef4444; }
.context-menu button.disabled-item { color: #475569; cursor: not-allowed; font-style: italic; }
.context-menu button.disabled-item:hover { background: none; }

.node-legend {
  position: absolute; top: 12px; right: 12px;
  background: rgba(15, 23, 42, 0.85); border: 1px solid #334155;
  border-radius: 12px; padding: 12px 15px;
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none; z-index: 50;
  backdrop-filter: blur(4px);
}
.legend-item {
  display: flex; align-items: center; gap: 9px;
  font-size: 15px; color: #94a3b8; font-weight: 600; white-space: nowrap;
}
.legend-dot {
  width: 15px; height: 15px; border-radius: 3px;
  border: 2px solid; flex-shrink: 0;
}
.legend-divider {
  height: 2px; background: #334155; margin: 3px 0;
}

.canvas-btns {
  position: absolute; bottom: 12px; left: 12px;
  display: flex; gap: 6px; z-index: 50;
}
.canvas-btns-right {
  left: 12px; bottom: auto; top: 50px;
}
.canvas-btns-right .canvas-btn.active {
  color: #22c55e; border-color: #16a34a;
}
.canvas-btn {
  display: flex; align-items: center; gap: 5px;
  background: rgba(15, 23, 42, 0.85); border: 1px solid #334155;
  border-radius: 20px; padding: 5px 12px;
  font-size: 11px; color: #64748b; cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  backdrop-filter: blur(4px);
}
.canvas-btn:hover { color: #94a3b8; border-color: #475569; }
.canvas-btn.active { color: #60a5fa; border-color: #3b82f6; }

.tracking-btn {
  position: absolute; top: 12px; left: 12px; z-index: 50;
}

.zoom-controls {
  position: absolute; bottom: 12px; right: 12px;
  display: flex; align-items: center; gap: 4px; z-index: 50;
  background: rgba(15, 23, 42, 0.85); border: 1px solid #334155;
  border-radius: 20px; padding: 4px 10px;
  backdrop-filter: blur(4px);
}
.zoom-btn {
  background: none; border: none; color: #64748b;
  font-size: 16px; line-height: 1; cursor: pointer;
  padding: 0 4px; transition: color 0.15s;
}
.zoom-btn:hover { color: #94a3b8; }
.zoom-input {
  width: 40px; background: none; border: none;
  color: #94a3b8; font-size: 12px; font-weight: 700;
  text-align: center; outline: none;
  -moz-appearance: textfield;
}
.zoom-input::-webkit-inner-spin-button,
.zoom-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.zoom-pct { color: #64748b; font-size: 11px; }

/* 단축키 툴팁 */
[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 6px;
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 400;
  padding: 5px 9px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 300;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
}
[data-tooltip][data-shortcut]::after {
  content: attr(data-shortcut);
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(calc(-50% + 2px));
  margin-top: 22px;
  background: #334155;
  border: 1px solid #475569;
  border-radius: 4px;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 300;
  letter-spacing: 0.05em;
}
[data-tooltip]:hover::before,
[data-tooltip]:hover::after { opacity: 1; }

/* 트래킹 버튼 툴팁은 오른쪽으로 표시 (좌측 사이드바에 가리지 않도록) */
.tracking-btn::before {
  top: 0;
  left: calc(100% + 8px);
  transform: none;
}
.tracking-btn[data-shortcut]::after {
  top: 22px;
  left: calc(100% + 8px);
  transform: none;
  margin-top: 0;
}

.minimap {
  position: absolute; bottom: 56px; right: 12px;
  width: 160px; height: 100px; z-index: 50;
  background: rgba(15, 23, 42, 0.88); border: 1px solid #334155;
  border-radius: 8px; overflow: hidden;
  backdrop-filter: blur(4px);
}
.minimap-svg { display: block; cursor: crosshair; }

/* 검색 바 */
.search-bar {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  z-index: 60; width: 280px;
}
.search-input-wrap {
  display: flex; align-items: center; gap: 6px;
  background: rgba(15, 23, 42, 0.92); border: 1px solid #334155;
  border-radius: 8px; padding: 0 10px; height: 34px;
  backdrop-filter: blur(6px);
  transition: border-color 0.15s;
}
.search-input-wrap:focus-within {
  border-color: #60a5fa;
}
.search-icon { flex-shrink: 0; }
.search-input {
  flex: 1; background: none; border: none; outline: none;
  color: #e2e8f0; font-size: 13px;
  min-width: 0;
}
.search-input::placeholder { color: #475569; }
.search-clear {
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer; padding: 2px;
  flex-shrink: 0; opacity: 0.7;
}
.search-clear:hover { opacity: 1; }
.search-dropdown {
  list-style: none; margin: 4px 0 0; padding: 4px 0;
  background: rgba(15, 23, 42, 0.96); border: 1px solid #334155;
  border-radius: 8px; backdrop-filter: blur(6px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  max-height: 280px; overflow-y: auto;
}
.search-result-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; cursor: pointer;
  transition: background 0.1s;
}
.search-result-item:hover, .search-result-item.active {
  background: rgba(96, 165, 250, 0.1);
}
.search-result-kind {
  font-size: 10px; font-weight: 700; letter-spacing: 0.05em;
  min-width: 30px; flex-shrink: 0;
}
.search-result-name {
  flex: 1; font-size: 13px; color: #e2e8f0;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.search-result-ip {
  font-size: 11px; color: #64748b;
  white-space: nowrap; flex-shrink: 0;
}
.search-no-result {
  padding: 10px 14px; font-size: 12px; color: #475569;
  background: rgba(15, 23, 42, 0.96); border: 1px solid #334155;
  border-radius: 8px; margin-top: 4px; text-align: center;
  backdrop-filter: blur(6px);
}

/* 경로 탐색 */
.link-amber {
  stroke-dasharray: 12 5;
  animation: flow-dash 0.45s linear infinite;
  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.8));
}
.path-mode-banner {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  background: #1c1007; border: 1px solid #f59e0b; border-radius: 20px;
  padding: 6px 16px; font-size: 13px; color: #fcd34d;
  z-index: 60; white-space: nowrap;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
}
.path-source-name { color: #f59e0b; font-weight: 700; }
.path-cancel-btn {
  background: none; border: 1px solid #92400e; border-radius: 12px;
  color: #d97706; font-size: 11px; font-weight: 600; padding: 2px 10px; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.path-cancel-btn:hover { border-color: #f59e0b; color: #fcd34d; }
.context-menu .context-divider { height: 1px; background: #334155; margin: 3px 0; }
.context-multi-label {
  padding: 4px 10px 2px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  color: #60a5fa; text-transform: uppercase;
}
.context-menu button.path-item { color: #fbbf24; }
.context-menu button.path-item:hover { background: rgba(245, 158, 11, 0.1); }
.context-menu button.path-item-disabled { color: #475569; cursor: not-allowed; }
.context-menu button.path-item-disabled:hover { background: none; }

/* 다중 선택 */
.graph-node.multi-selected > rect:first-of-type {
  stroke: #60a5fa;
  stroke-width: 2;
  stroke-dasharray: 5 3;
}

/* 순환 의존성 */
.cycle-warning-banner {
  position: absolute; top: 12px; right: 16px;
  background: #1c0a0a; border: 1px solid #dc2626; border-radius: 20px;
  padding: 5px 14px; font-size: 12px; font-weight: 600; color: #fca5a5;
  z-index: 60; white-space: nowrap;
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.2);
}
</style>
