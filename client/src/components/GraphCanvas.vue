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
        <!-- 블루프린트 그리드 패턴 (미세 선 + 주요 선) -->
        <pattern id="micro-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
        </pattern>
        <pattern id="dot-grid" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
          <rect width="120" height="120" fill="url(#micro-grid)"/>
          <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="0.5"/>
        </pattern>
      </defs>
      <g ref="gRef">
        <!-- 그리드 배경 -->
        <rect v-if="showGrid" x="-50000" y="-50000" width="100000" height="100000" fill="url(#dot-grid)" pointer-events="none"/>

        <!-- 중심점 마커 -->
        <g v-if="showGrid" pointer-events="none" opacity="0.7">
          <line x1="-40" y1="0" x2="40" y2="0" stroke="#f59e0b" stroke-width="1.2"/>
          <line x1="0" y1="-40" x2="0" y2="40" stroke="#f59e0b" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="4" fill="none" stroke="#f59e0b" stroke-width="1.2"/>
        </g>

        <!-- L7 그룹 영역 -->
        <path v-for="hull in l7GroupHulls" :key="'hull-' + hull.l7Id"
          :d="hull.path"
          :fill="hull.color"
          fill-opacity="0.06"
          :stroke="hull.color"
          stroke-opacity="0.2"
          stroke-width="1"
          stroke-dasharray="4,3"
          pointer-events="none"
          :opacity="(pathMode || pathNodes.size > 0) ? (pathNodes.has(hull.l7Id) ? 0.8 : 0.03) : 1"
        />

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
            :stroke="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#f59e0b' : '#b494f7'"
            :stroke-width="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? 3 : 2"
            stroke-dasharray="6,4" stroke-linecap="round" opacity="0.85"
          />
          <!-- 끝점 커넥터 (L7 쪽) -->
          <circle :cx="ml.x1" :cy="ml.y1" r="4"
            :fill="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#f59e0b' : '#7c3aed'"
            :stroke="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#fcd34d' : '#b494f7'"
            stroke-width="1.5" opacity="0.9"/>
          <!-- 끝점 커넥터 (서버 쪽) -->
          <circle :cx="ml.x2" :cy="ml.y2" r="3"
            :fill="(pathNodes.has(ml.l7Id) && pathNodes.has(ml.memberId)) ? '#f59e0b' : '#b494f7'"
            opacity="0.85"/>
        </g>

        <!-- 의존성 링크 -->
        <g
          v-for="link in computedLinks"
          :key="link.id"
          @dblclick.stop="!readOnly && onLinkDblClick(link)"
          @mouseenter="hoveredLinkId = link.id"
          @mouseleave="hoveredLinkId = null"
          :style="!readOnly ? 'cursor: pointer' : ''"
        >
          <!-- hit area (클릭 감지용 투명 라인) -->
          <line
            :x1="link.x1" :y1="link.y1"
            :x2="link.x2" :y2="link.y2"
            stroke="transparent" stroke-width="12"
          />
          <!-- 시각 라인 -->
          <line
            :x1="link.x1" :y1="link.y1"
            :x2="link.x2" :y2="link.y2"
            :class="{
              'link-amber':    pathLinks.has(link.id),
              'link-outgoing': !pathLinks.has(link.id) && (showAllFlow || outgoingLinks.has(link.id)),
              'link-impacted': !pathLinks.has(link.id) && !showAllFlow && impactedLinks.has(link.id),
              'link-normal':   !pathLinks.has(link.id) && !showAllFlow && !impactedLinks.has(link.id) && !outgoingLinks.has(link.id),
              'link-hovered':  hoveredLinkId === link.id && !pathLinks.has(link.id) && !outgoingLinks.has(link.id) && !impactedLinks.has(link.id),
            }"
            :stroke="linkStroke(link)"
            :stroke-width="pathLinks.has(link.id) ? 3 : showAllFlow || impactedLinks.has(link.id) || outgoingLinks.has(link.id) ? 2.5 : 1.5"
            :opacity="linkOpacity(link)"
            :marker-end="`url(#${linkMarker(link)})`"
            pointer-events="none"
          />
          <!-- 방화벽 자물쇠 아이콘 -->
          <g
            v-if="link.hasFirewall"
            :transform="`translate(${(link.x1 + link.x2) / 2}, ${(link.y1 + link.y2) / 2})`"
            pointer-events="none"
          >
            <circle r="8" fill="#1e293b" stroke="#f59e0b" stroke-width="1.2"/>
            <rect x="-4" y="-1" width="8" height="6" rx="1" fill="none" stroke="#f59e0b" stroke-width="1.1"/>
            <path d="M -2.5 -1 L -2.5 -3.5 A 2.5 2.5 0 0 1 2.5 -3.5 L 2.5 -1" fill="none" stroke="#f59e0b" stroke-width="1.1" stroke-linecap="round"/>
          </g>
        </g>

        <!-- 드래그 미리보기 화살표 -->
        <line
          v-if="arrowPreview"
          :x1="arrowPreview.x1" :y1="arrowPreview.y1"
          :x2="arrowPreview.x2" :y2="arrowPreview.y2"
          stroke="#f59e0b" stroke-width="2" stroke-dasharray="7,4"
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
          fill="rgba(217, 119, 6, 0.08)"
          stroke="#f59e0b"
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
          <!-- 배경 (fill만, stroke 없음) -->
          <rect x="-86" y="-37" width="187" height="74" rx="6" :fill="nodeColor(node)"/>

          <!-- DB 벤더 아이콘 패널 배경 (왼쪽 컬럼만 시그니처 컬러, 왼쪽만 둥글게) -->
          <template v-if="node.nodeKind === 'infra'">
            <template v-for="dbIcon in [getInfraIconInfo((node as any).infraType)]" :key="'dbpanel'">
              <path v-if="dbIcon" d="M -60,-37 L -80,-37 A 6,6 0 0 0 -86,-31 L -86,31 A 6,6 0 0 0 -80,37 L -60,37 Z" :fill="dbIcon.bgColor" pointer-events="none"/>
            </template>
          </template>
          <template v-if="node.nodeKind === 'dns'">
            <template v-for="dnsIcon in [getDnsIconInfo((node as DnsNode).provider)]" :key="'dnspanel'">
              <path v-if="dnsIcon" d="M -60,-37 L -80,-37 A 6,6 0 0 0 -86,-31 L -86,31 A 6,6 0 0 0 -80,37 L -60,37 Z" :fill="dnsIcon.bgColor" pointer-events="none"/>
            </template>
          </template>

          <!-- 테두리 (stroke만, fill 없음 - 패널 위에 그려져 border가 가려지지 않음) -->
          <rect
            x="-86" y="-37" width="187" height="74" rx="6"
            fill="none"
            :stroke="nodeStroke(node)"
            :stroke-width="isHighlighted(node) ? 3 : 1.5"
          />

          <!-- 아이콘/텍스트 구분선 -->
          <line x1="-60" y1="-31" x2="-60" y2="31" :stroke="node.nodeKind === 'infra' ? 'rgba(3,105,161,0.18)' : node.nodeKind === 'dns' ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.12)'" stroke-width="1" pointer-events="none"/>

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
                    style="font-family: var(--font-mono); letter-spacing: 0.3px"
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
            <!-- DNS -->
            <template v-else-if="node.nodeKind === 'dns'">
              <template v-for="dnsIcon in [getDnsIconInfo((node as DnsNode).provider)]" :key="'dnsi'">
                <template v-if="dnsIcon">
                  <circle cx="8" cy="5" r="7" :fill="dnsIcon.color" opacity="0.92"/>
                  <text
                    x="8" y="7.2"
                    text-anchor="middle"
                    :fill="dnsIcon.textColor"
                    font-size="6"
                    font-weight="800"
                    style="font-family: var(--font-mono); letter-spacing: 0.3px"
                    pointer-events="none"
                  >{{ dnsIcon.abbr }}</text>
                </template>
                <template v-else>
                  <circle cx="5.5" cy="5" r="4.5" stroke="#a78bfa" stroke-width="0.9" fill="none"/>
                  <line x1="5.5" y1="0.5" x2="5.5" y2="9.5" stroke="#a78bfa" stroke-width="0.7"/>
                  <line x1="1" y1="5" x2="10" y2="5" stroke="#a78bfa" stroke-width="0.7"/>
                </template>
              </template>
            </template>
          </g>

          <!-- 노드 텍스트 (우측 텍스트 영역 좌측 정렬: x=-52) -->
          <text x="-52" dy="-9" text-anchor="start" class="node-label" :style="(node.nodeKind === 'infra' || node.nodeKind === 'dns') ? `fill:${cssVar('--bg-base')}` : ''">{{ truncate(node.name) }}</text>

          <template v-if="node.nodeKind === 'l7'">
            <text x="-52" dy="6" text-anchor="start" class="node-sub">{{ (node as L7Node).memberServerIds?.length ?? 0 }}개 서버</text>
            <text x="-52" dy="19" text-anchor="start" class="node-meta">{{ (node as L7Node).ip || (node as L7Node).natIp || '-' }}</text>
          </template>
          <template v-else-if="node.nodeKind === 'infra'">
            <text x="-52" dy="6" text-anchor="start" class="node-sub" style="fill:rgba(15,23,42,0.65)">{{ (node as any).infraType || 'Infra' }}</text>
            <text x="-52" dy="19" text-anchor="start" class="node-meta" style="fill:rgba(15,23,42,0.5)">{{ (node as any).host || '-' }}{{ (node as any).port ? ':' + (node as any).port : '' }}</text>
          </template>
          <template v-else-if="node.nodeKind === 'external'">
            <text x="-52" dy="6" text-anchor="start" class="node-sub">{{ externalStatusText(node as ExternalServiceNode) }}</text>
            <text x="-52" dy="19" text-anchor="start" class="node-meta">{{ contactSummary((node as ExternalServiceNode).contacts) }}</text>
          </template>
          <template v-else-if="node.nodeKind === 'dns'">
            <text x="-52" dy="6" text-anchor="start" class="node-sub" style="fill:rgba(15,23,42,0.65)">{{ (node as DnsNode).dnsType || 'DNS' }}</text>
            <text x="-52" dy="19" text-anchor="start" class="node-meta" style="fill:rgba(15,23,42,0.5)">{{ (node as DnsNode).recordValue || '-' }}</text>
          </template>
          <template v-else>
            <text x="-52" dy="6" text-anchor="start" class="node-sub">{{ (node as Server).team || '-' }}</text>
            <text x="-52" dy="19" text-anchor="start" class="node-meta">{{ (node as Server).internalIps?.[0] || '-' }}</text>
          </template>


          <!-- 순환 의존성 경고 배지 -->
          <g v-if="cycleNodes.has(node.id)" class="cycle-badge" pointer-events="none">
            <circle cx="80" cy="-30" r="8" fill="#dc2626" stroke="#0f172a" stroke-width="1.5"/>
            <text x="80" y="-26" text-anchor="middle" font-size="10" font-weight="900" fill="white">!</text>
          </g>
        </g>

        <!-- 호버 툴팁 -->
        <g v-if="tooltipNode && !arrowSource && !boxSelect"
           :transform="`translate(${(tooltipNode.x ?? 0) + 113},${(tooltipNode.y ?? 0) - 20})`"
           pointer-events="none"
           class="hover-tooltip"
        >
          <!-- 그림자 레이어 -->
          <rect
            x="-2" y="-2"
            :width="tooltipWidth + 4"
            :height="getTooltipData(tooltipNode).length * 18 + 44"
            rx="8"
            fill="rgba(0,0,0,0.3)"
            filter="url(#tooltip-shadow)"
          />
          <!-- 배경 -->
          <rect
            x="0" y="0"
            :width="tooltipWidth"
            :height="getTooltipData(tooltipNode).length * 18 + 40"
            rx="7"
            :fill="cssVar('--bg-elevated')"
            :stroke="cssVar('--border-default')"
            stroke-width="1"
          />
          <!-- 좌측 타입 컬러 바 -->
          <rect
            x="0" y="3"
            width="3"
            :height="getTooltipData(tooltipNode).length * 18 + 34"
            :fill="nodeKindColor(tooltipNode.nodeKind ?? 'server')"
            rx="1.5"
          />
          <!-- 상단 글래스 엣지 -->
          <line
            x1="4" :x2="tooltipWidth - 4" y1="1" y2="1"
            stroke="rgba(255,255,255,0.06)"
            stroke-width="1"
          />
          <!-- 헤더: 노드 이름 -->
          <text
            x="12" y="16"
            text-anchor="start"
            :font-size="cssVar('--text-xs')"
            font-weight="700"
            :fill="nodeKindColor(tooltipNode.nodeKind ?? 'server')"
          >{{ tooltipNode.name }}</text>
          <!-- 헤더: 타입 레이블 -->
          <text
            x="12" y="28"
            text-anchor="start"
            font-size="9"
            font-weight="500"
            :fill="cssVar('--text-tertiary')"
          >{{ nodeKindLabel(tooltipNode.nodeKind ?? 'server') }}</text>
          <!-- 구분선 -->
          <line
            x1="8" :x2="tooltipWidth - 8"
            y1="34" y2="34"
            :stroke="cssVar('--border-subtle')"
            stroke-width="0.5"
          />
          <!-- 정보 행 -->
          <g v-for="(line, i) in getTooltipData(tooltipNode)" :key="i">
            <text v-if="line.label"
              x="12" :y="50 + i * 18"
              text-anchor="start"
              font-size="9"
              font-weight="600"
              :fill="cssVar('--text-tertiary')"
            >{{ line.label }}</text>
            <text
              :x="line.label ? 52 : 12"
              :y="50 + i * 18"
              text-anchor="start"
              font-size="10"
              :font-family="line.isTech ? cssVar('--font-mono') : cssVar('--font-sans')"
              font-weight="400"
              :fill="line.isTech ? cssVar('--color-ip-text') : cssVar('--text-secondary')"
            >{{ line.value }}</text>
          </g>
        </g>

        <!-- glow 필터 + 엣지 그라디언트 -->
        <defs>
          <!-- 툴팁 그림자 필터 -->
          <filter id="tooltip-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.5)" flood-opacity="1"/>
          </filter>
          <!-- glow 필터 -->
          <filter id="glow-selected" x="-50%" y="-50%" width="200%" height="200%">
            <feFlood flood-color="#f59e0b" flood-opacity="0.12" result="amber"/>
            <feComposite in="amber" in2="SourceGraphic" operator="in" result="tinted"/>
            <feGaussianBlur in="tinted" stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-red" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-amber" x="-50%" y="-50%" width="200%" height="200%">
            <feFlood flood-color="#f59e0b" flood-opacity="0.25" result="amber"/>
            <feComposite in="amber" in2="SourceGraphic" operator="in" result="tinted"/>
            <feGaussianBlur in="tinted" stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <!-- 노드 타입별 hover glow 필터 -->
          <filter id="glow-purple" x="-50%" y="-50%" width="200%" height="200%">
            <feFlood flood-color="#b494f7" flood-opacity="0.2" result="color"/>
            <feComposite in="color" in2="SourceGraphic" operator="in" result="tinted"/>
            <feGaussianBlur in="tinted" stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
            <feFlood flood-color="#3ec6d6" flood-opacity="0.2" result="color"/>
            <feComposite in="color" in2="SourceGraphic" operator="in" result="tinted"/>
            <feGaussianBlur in="tinted" stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
            <feFlood flood-color="#42b883" flood-opacity="0.2" result="color"/>
            <feComposite in="color" in2="SourceGraphic" operator="in" result="tinted"/>
            <feGaussianBlur in="tinted" stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <!-- 엣지 그라디언트 (출발 노드 색 → 도착 노드 색) -->
          <linearGradient
            v-for="g in linkGradients"
            :key="g.id"
            :id="g.id"
            :x1="g.x1" :y1="g.y1"
            :x2="g.x2" :y2="g.y2"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" :stop-color="g.colorStart" stop-opacity="0.8"/>
            <stop offset="100%" :stop-color="g.colorEnd" stop-opacity="0.8"/>
          </linearGradient>
          <marker id="arrow-preview" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0,-5L10,0L0,5" fill="#f59e0b"/>
          </marker>
        </defs>
      </g>
    </svg>

    <!-- 상단 중앙 검색 -->
    <div class="search-bar" @keydown.escape="searchQuery = ''; searchFocused = false">
      <div class="search-input-wrap">
        <svg class="search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="5.5" cy="5.5" r="4" stroke="#787878" stroke-width="1.3"/>
          <line x1="8.5" y1="8.5" x2="13" y2="13" stroke="#787878" stroke-width="1.3" stroke-linecap="round"/>
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
            <line x1="1" y1="1" x2="9" y2="9" stroke="#787878" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="9" y1="1" x2="1" y2="9" stroke="#787878" stroke-width="1.4" stroke-linecap="round"/>
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
        <span class="legend-dot legend-srv"></span>Server
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-l7"></span>L7
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-infra"></span>INFRA
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-ext"></span>External
      </div>
      <div class="legend-item">
        <span class="legend-dot legend-dns"></span>DNS
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
    <div v-else class="mode-hint readonly-hint">읽기 전용 모드</div>

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
      <button @click="onAddNodeMenuSelect('dns')">
        <svg class="menu-icon" viewBox="0 0 11 11" fill="none">
          <circle cx="5.5" cy="5.5" r="4.5" stroke="#a78bfa" stroke-width="0.9"/>
          <line x1="5.5" y1="1" x2="5.5" y2="10" stroke="#a78bfa" stroke-width="0.7"/>
          <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="#a78bfa" stroke-width="0.7"/>
        </svg>
        DNS
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
            <button @click="onCanvasAddNode('dns')">
              <svg class="menu-icon" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="#a78bfa" stroke-width="0.9"/>
                <line x1="5.5" y1="1" x2="5.5" y2="10" stroke="#a78bfa" stroke-width="0.7"/>
                <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="#a78bfa" stroke-width="0.7"/>
              </svg>
              DNS
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
          <button class="btn-ghost" @click="exportModal.visible = false">취소</button>
          <button class="btn-primary" @click="onExportConfirm">내보내기</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import * as d3 from 'd3'
import type { AnyNode, DnsNode, D3Node, D3Link, Server, L7Node, InfraNode, ExternalServiceNode, ExternalContact } from '../types'
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
  addNodeAt: [nodeKind: 'server' | 'l7' | 'infra' | 'external' | 'dns']
  startPathFrom: [node: AnyNode]
  cancelPathMode: []
  linkDblClick: [linkId: string]
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
const hoveredLinkId = ref<string | null>(null)

const markerDefs = [
  { id: 'arrow-default', fill: '#787878' },
  { id: 'arrow-red',     fill: '#ef4444' },
  { id: 'arrow-green',   fill: '#42b883' },
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

function _getLinkNodeId(endpoint: string | D3Node): string {
  return typeof endpoint === 'string' ? endpoint : endpoint.id
}

watch(() => graphStore.positionRestoreVersion, () => {
  const positions = graphStore.getPositions()
  renderedNodes.value.forEach(n => {
    const pos = positions[n.id]
    if (pos) { n.fx = pos.x; n.fy = pos.y; n.x = pos.x; n.y = pos.y }
  })
  renderedNodes.value = [...renderedNodes.value]
  simulation?.alpha(0.05).restart()
})

// 드래그 상태
const hoveredNodeId = ref<string | null>(null)
const tooltipNodeId = ref<string | null>(null)
let tooltipTimer: ReturnType<typeof setTimeout> | null = null
watch(hoveredNodeId, (newId) => {
  if (tooltipTimer) clearTimeout(tooltipTimer)
  if (newId) {
    tooltipTimer = setTimeout(() => { tooltipNodeId.value = newId }, 300)
  } else {
    tooltipNodeId.value = null
  }
})
const tooltipNode = computed(() => {
  if (!tooltipNodeId.value) return null
  return renderedNodes.value.find(n => n.id === tooltipNodeId.value) ?? null
})
const arrowSource = ref<D3Node | null>(null)
const spaceHeld = ref(false)
const multiSelectedIds = ref<Set<string>>(new Set())
const boxSelect = ref<{ startX: number; startY: number; endX: number; endY: number } | null>(null)
const arrowPreview = ref<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
const connectTarget = ref<D3Node | null>(null)
const blockedTarget = ref<D3Node | null>(null)
const connectBlockedMsg = ref('')

function isConnectionBlocked(source: D3Node, target: D3Node): boolean {
  if (target.nodeKind === 'dns') return true
  if (source.nodeKind === 'dns' && target.nodeKind === 'infra') return true
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

function onAddNodeMenuSelect(nodeKind: 'server' | 'l7' | 'infra' | 'external' | 'dns') {
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

function onCanvasAddNode(nodeKind: 'server' | 'l7' | 'infra' | 'external' | 'dns') {
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
function getInfraIconInfo(infraType?: string): { abbr: string; color: string; textColor: string; bgColor: string } | null {
  if (!infraType) return null
  const t = infraType.toLowerCase()
  if (t.includes('postgres'))                           return { abbr: 'PG', color: '#1d4ed8', textColor: '#fff', bgColor: '#dbeafe' }
  if (t.includes('mysql'))                              return { abbr: 'MY', color: '#e97c00', textColor: '#fff', bgColor: '#ffedd5' }
  if (t.includes('mariadb'))                            return { abbr: 'MA', color: '#b45309', textColor: '#fff', bgColor: '#fef3c7' }
  if (t.includes('redis'))                              return { abbr: 'RD', color: '#dc2626', textColor: '#fff', bgColor: '#fee2e2' }
  if (t.includes('mongo'))                              return { abbr: 'MG', color: '#15803d', textColor: '#fff', bgColor: '#dcfce7' }
  if (t.includes('oracle'))                             return { abbr: 'OR', color: '#c2410c', textColor: '#fff', bgColor: '#ffedd5' }
  if (t.includes('sqlite'))                             return { abbr: 'SL', color: '#0369a1', textColor: '#fff', bgColor: '#e0f2fe' }
  if (t.includes('cassandra'))                          return { abbr: 'CA', color: '#6d28d9', textColor: '#fff', bgColor: '#ede9fe' }
  if (t.includes('elastic'))                            return { abbr: 'ES', color: '#d97706', textColor: '#fff', bgColor: '#fef9c3' }
  if (t.includes('dynamo'))                             return { abbr: 'DY', color: '#b45309', textColor: '#fff', bgColor: '#fef3c7' }
  if (t.includes('mssql') || t.includes('sqlserver') || t.includes('sql server')) return { abbr: 'MS', color: '#0284c7', textColor: '#fff', bgColor: '#e0f2fe' }
  if (t.includes('influx'))                             return { abbr: 'IF', color: '#3ec6d6', textColor: '#fff', bgColor: '#d0f5f8' }
  if (t.includes('clickhouse'))                         return { abbr: 'CH', color: '#ea580c', textColor: '#fff', bgColor: '#ffedd5' }
  return null
}

// ─── DNS 프로바이더별 배지 정보 ─────────────────────────────
function getDnsIconInfo(provider?: string): { abbr: string; color: string; textColor: string; bgColor: string } | null {
  if (!provider) return null
  const p = provider.toLowerCase()
  if (p.includes('route53') || p.includes('aws'))       return { abbr: 'R53', color: '#8b5cf6', textColor: '#fff', bgColor: '#ede9fe' }
  if (p.includes('cloudflare'))                          return { abbr: 'CF', color: '#f59e0b', textColor: '#fff', bgColor: '#fef3c7' }
  if (p.includes('google'))                              return { abbr: 'GC', color: '#4285f4', textColor: '#fff', bgColor: '#dbeafe' }
  if (p.includes('gabia') || p.includes('\uAC00\uBE44\uC544')) return { abbr: 'GA', color: '#2563eb', textColor: '#fff', bgColor: '#dbeafe' }
  return null
}

// ─── 텍스트 잘라내기 ─────────────────────────────────────
function truncate(text: string, max = 20): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

function externalStatusText(node: ExternalServiceNode): string {
  const parts: string[] = []
  if (node.hasFirewall) parts.push('FW')
  if (node.hasWhitelist) parts.push('Whitelist')
  return parts.length > 0 ? parts.join(' / ') : '직접 연결'
}

function contactSummary(contacts?: ExternalContact[]): string {
  if (!contacts || contacts.length === 0) return '담당자 없음'
  if (contacts.length === 1) return contacts[0].name
  return `${contacts[0].name} 외 ${contacts.length - 1}명`
}

interface TooltipLine {
  label?: string
  value: string
  isTech?: boolean
}

const tooltipWidth = 200

function getTooltipData(node: D3Node): TooltipLine[] {
  const lines: TooltipLine[] = []
  if (!node.nodeKind || node.nodeKind === 'server') {
    const s = node as unknown as Server
    if (s.team) lines.push({ label: '팀', value: s.team })
    s.internalIps?.forEach(ip => lines.push({ label: '내부', value: ip, isTech: true }))
    s.natIps?.forEach(ip => lines.push({ label: 'NAT', value: ip, isTech: true }))
    if (s.description) lines.push({ value: truncate(s.description, 30) })
  } else if (node.nodeKind === 'l7') {
    const l = node as unknown as L7Node
    if (l.ip) lines.push({ label: 'IP', value: l.ip, isTech: true })
    if (l.natIp) lines.push({ label: 'NAT', value: l.natIp, isTech: true })
    lines.push({ label: '멤버', value: `${l.memberServerIds?.length ?? 0}개 서버` })
    if (l.description) lines.push({ value: truncate(l.description, 30) })
  } else if (node.nodeKind === 'infra') {
    const i = node as unknown as InfraNode
    if (i.infraType) lines.push({ label: '타입', value: i.infraType })
    if (i.host) lines.push({ label: '호스트', value: `${i.host}${i.port ? ':' + i.port : ''}`, isTech: true })
    if (i.description) lines.push({ value: truncate(i.description, 30) })
  } else if (node.nodeKind === 'external') {
    const e = node as unknown as ExternalServiceNode
    if (e.hasFirewall) lines.push({ value: '방화벽 적용' })
    if (e.hasWhitelist) lines.push({ value: '화이트리스트 적용' })
    e.contacts?.forEach(c => lines.push({ label: '담당', value: c.name }))
    if (e.description) lines.push({ value: truncate(e.description, 30) })
  } else if (node.nodeKind === 'dns') {
    const d = node as unknown as DnsNode
    lines.push({ label: '타입', value: d.dnsType })
    if (d.recordValue) lines.push({ label: '값', value: d.recordValue, isTech: true })
    if (d.ttl != null) lines.push({ label: 'TTL', value: String(d.ttl), isTech: true })
    if (d.description) lines.push({ value: truncate(d.description, 30) })
  }
  return lines
}

function nodeKindLabel(kind: string): string {
  if (kind === 'l7') return 'L7 로드밸런서'
  if (kind === 'infra') return '인프라'
  if (kind === 'external') return '외부 서비스'
  if (kind === 'dns') return 'DNS'
  return '서버'
}

// ─── 색상 ───────────────────────────────────────────────
function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

function nodeKindColor(kind: string): string {
  if (kind === 'l7') return cssVar('--node-l7-color')
  if (kind === 'infra') return cssVar('--node-infra-color')
  if (kind === 'external') return cssVar('--node-ext-color')
  if (kind === 'dns') return cssVar('--node-dns-color')
  return cssVar('--node-srv-color')
}

const linkGradients = computed(() =>
  renderedLinks.value.map(link => {
    const src = link.source as D3Node
    const tgt = link.target as D3Node
    return {
      id: `link-grad-${(link as any).id}`,
      x1: src.x ?? 0, y1: src.y ?? 0,
      x2: tgt.x ?? 0, y2: tgt.y ?? 0,
      colorStart: nodeKindColor(src.nodeKind ?? 'server'),
      colorEnd: nodeKindColor(tgt.nodeKind ?? 'server'),
    }
  })
)

function nodeColor(node: D3Node): string {
  if (node.nodeKind === 'l7') return cssVar('--node-l7-bg-deep')
  if (node.nodeKind === 'infra') return cssVar('--node-infra-bg-light')
  if (node.nodeKind === 'external') return cssVar('--node-ext-bg-deep')
  if (node.nodeKind === 'dns') return cssVar('--node-dns-bg-light')
  return cssVar('--accent-bg-medium')
}

function linkStroke(link: { id: string }): string {
  if (props.pathLinks.has(link.id)) return '#f59e0b'
  if (!showAllFlow.value && props.impactedLinks.has(link.id)) return '#ef4444'
  if (showAllFlow.value || props.outgoingLinks.has(link.id)) return '#42b883'
  return `url(#link-grad-${link.id})`
}

function linkOpacity(link: { id: string }): number {
  if (props.pathMode || props.pathNodes.size > 0)
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
  if ((props.pathMode || props.pathNodes.size > 0) && hoveredNodeId.value === node.id) return 'url(#glow-amber)'
  if (props.selectedId === node.id) return 'url(#glow-selected)'
  if (props.cycleNodes.has(node.id)) return 'url(#glow-red)'
  if (props.impactedNodes.has(node.id)) return 'url(#glow-red)'
  if (hoveredNodeId.value === node.id) {
    if (node.nodeKind === 'l7') return 'url(#glow-purple)'
    if (node.nodeKind === 'infra') return 'url(#glow-cyan)'
    if (node.nodeKind === 'external') return 'url(#glow-green)'
    if (node.nodeKind === 'dns') return 'url(#glow-purple)'
    return 'url(#glow-selected)'
  }
  return undefined
}

function nodeOpacity(node: D3Node): number {
  if (props.pathMode || props.pathNodes.size > 0) {
    if (props.pathNodes.has(node.id)) return 1
    if (hoveredNodeId.value === node.id) return 1
    return 0.15
  }
  return 1
}

function nodeStroke(node: D3Node): string {
  if (props.pathNodes.has(node.id)) return '#f59e0b'
  if ((props.pathMode || props.pathNodes.size > 0) && hoveredNodeId.value === node.id) return '#f59e0b'
  if (props.cycleNodes.has(node.id)) return '#dc2626'
  if (blockedTarget.value?.id === node.id) return '#ef4444'
  if (connectTarget.value?.id === node.id) return '#42b883'
  if (arrowSource.value?.id === node.id) return cssVar('--accent-soft')

  if (props.selectedId === node.id) {
    if (node.nodeKind === 'l7') return '#b494f7'
    if (node.nodeKind === 'infra') return '#3ec6d6'
    if (node.nodeKind === 'external') return '#42b883'
    if (node.nodeKind === 'dns') return '#8b5cf6'
    return cssVar('--node-srv-color')
  }
  if (props.impactedNodes.has(node.id)) return '#ef4444'
  if (node.nodeKind === 'l7') return '#7c3aed'
  if (node.nodeKind === 'infra') return '#7dd3fc'
  if (node.nodeKind === 'external') return '#42b883'
  if (node.nodeKind === 'dns') return '#a78bfa'
  return cssVar('--border-strong')
}

function isHighlighted(node: D3Node): boolean {
  return props.pathNodes.has(node.id)
    || props.selectedId === node.id || props.impactedNodes.has(node.id)
    || props.cycleNodes.has(node.id)
    || connectTarget.value?.id === node.id || arrowSource.value?.id === node.id
    || blockedTarget.value?.id === node.id
}

// ─── 노드 경계까지 거리 계산 ─────────────────────────────
function edgeDist(ux: number, uy: number, hw = 93, hh = 37): number {
  return Math.min(
    Math.abs(ux) > 0.001 ? hw / Math.abs(ux) : Infinity,
    Math.abs(uy) > 0.001 ? hh / Math.abs(uy) : Infinity
  )
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
    const sEdge = edgeDist(ux, uy)
    const tEdge = edgeDist(ux, uy)
    return {
      ...link,
      x1: sx + ux * (sEdge + 2), y1: sy + uy * (sEdge + 2),
      x2: tx - ux * (tEdge + 2), y2: ty - uy * (tEdge + 2),
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

// ─── L7 그룹 시각 영역 ──────────────────────────────────────
const l7GroupHulls = computed(() => {
  const nodeMap = new Map(renderedNodes.value.map(n => [n.id, n]))
  const hulls: { l7Id: string; path: string; color: string }[] = []

  for (const node of renderedNodes.value) {
    if (node.nodeKind !== 'l7') continue
    const memberIds: string[] = (node as any).memberServerIds ?? []
    if (memberIds.length === 0) continue

    const points: [number, number][] = []
    const nx = node.x ?? 0, ny = node.y ?? 0
    points.push([nx - 86, ny - 37], [nx + 101, ny - 37], [nx + 101, ny + 37], [nx - 86, ny + 37])

    for (const mid of memberIds) {
      const m = nodeMap.get(mid)
      if (!m) continue
      const mx = m.x ?? 0, my = m.y ?? 0
      points.push([mx - 86, my - 37], [mx + 101, my - 37], [mx + 101, my + 37], [mx - 86, my + 37])
    }

    if (points.length < 6) continue
    const hull = d3.polygonHull(points)
    if (!hull) continue

    const centroid = d3.polygonCentroid(hull)
    const padded = hull.map(([px, py]) => {
      const dx = px - centroid[0], dy = py - centroid[1]
      const dist = Math.hypot(dx, dy)
      if (dist === 0) return [px, py] as [number, number]
      return [px + (dx / dist) * 20, py + (dy / dist) * 20] as [number, number]
    })

    const lineGen = d3.line().curve(d3.curveCatmullRomClosed.alpha(0.5))
    const pathD = lineGen(padded)
    if (pathD) {
      hulls.push({ l7Id: node.id, path: pathD, color: cssVar('--node-l7-color') })
    }
  }
  return hulls
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

function _applyHierarchicalLayout() {
  if (props.readOnly) return
  const nodes = renderedNodes.value
  const links = renderedLinks.value
  if (nodes.length === 0) return

  const inDegree = new Map<string, number>(nodes.map(n => [n.id, 0]))
  const children = new Map<string, string[]>(nodes.map(n => [n.id, []]))
  for (const link of links) {
    const src = _getLinkNodeId(link.source)
    const tgt = _getLinkNodeId(link.target)
    if (!inDegree.has(tgt) || !inDegree.has(src)) continue
    inDegree.set(tgt, (inDegree.get(tgt) ?? 0) + 1)
    children.get(src)!.push(tgt)
  }

  const layer = new Map<string, number>()
  const queue: string[] = []
  for (const [id, deg] of inDegree) {
    if (deg === 0) { queue.push(id); layer.set(id, 0) }
  }
  let head = 0
  while (head < queue.length) {
    const id = queue[head++]
    const cur = layer.get(id) ?? 0
    for (const childId of (children.get(id) ?? [])) {
      const proposed = cur + 1
      if (!layer.has(childId) || layer.get(childId)! < proposed) {
        layer.set(childId, proposed)
      }
      inDegree.set(childId, (inDegree.get(childId) ?? 1) - 1)
      if (inDegree.get(childId) === 0) queue.push(childId)
    }
  }
  const maxLayer = layer.size > 0 ? Math.max(...layer.values()) : 0
  for (const n of nodes) {
    if (!layer.has(n.id)) layer.set(n.id, maxLayer + 1)
  }

  const layerGroups = new Map<number, string[]>()
  for (const [id, l] of layer) {
    if (!layerGroups.has(l)) layerGroups.set(l, [])
    layerGroups.get(l)!.push(id)
  }

  const X_SPACING = 220
  const Y_SPACING = 250
  const posMap = new Map<string, { x: number; y: number }>()
  for (const [l, group] of layerGroups) {
    const totalWidth = (group.length - 1) * X_SPACING
    group.forEach((id, i) => {
      posMap.set(id, { x: -totalWidth / 2 + i * X_SPACING, y: l * Y_SPACING })
    })
  }

  const allX = Array.from(posMap.values()).map(p => p.x)
  const allY = Array.from(posMap.values()).map(p => p.y)
  const cx = (Math.min(...allX) + Math.max(...allX)) / 2
  const cy = (Math.min(...allY) + Math.max(...allY)) / 2

  for (const n of nodes) {
    const pos = posMap.get(n.id)
    if (pos) { n.fx = pos.x - cx; n.fy = pos.y - cy; n.x = n.fx; n.y = n.fy }
  }
  renderedNodes.value = [...nodes]
  simulation?.alpha(0.05).restart()
  savePositions()
}

function _applyRadialLayout() {
  if (props.readOnly) return
  const nodes = renderedNodes.value
  const links = renderedLinks.value
  if (nodes.length === 0) return

  const inDegree = new Map<string, number>(nodes.map(n => [n.id, 0]))
  const neighbors = new Map<string, Set<string>>(nodes.map(n => [n.id, new Set()]))
  for (const link of links) {
    const src = _getLinkNodeId(link.source)
    const tgt = _getLinkNodeId(link.target)
    if (!inDegree.has(src) || !inDegree.has(tgt)) continue
    inDegree.set(tgt, (inDegree.get(tgt) ?? 0) + 1)
    neighbors.get(src)!.add(tgt)
    neighbors.get(tgt)!.add(src)
  }

  const roots = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id)
  const startNodes = roots.length > 0
    ? roots
    : [nodes.reduce((a, b) =>
        (neighbors.get(a.id)?.size ?? 0) >= (neighbors.get(b.id)?.size ?? 0) ? a : b
      ).id]

  const level = new Map<string, number>()
  const bfsQueue: string[] = []
  for (const id of startNodes) { level.set(id, 0); bfsQueue.push(id) }
  let bfsHead = 0
  while (bfsHead < bfsQueue.length) {
    const id = bfsQueue[bfsHead++]
    const cur = level.get(id) ?? 0
    for (const neighborId of (neighbors.get(id) ?? [])) {
      if (!level.has(neighborId)) {
        level.set(neighborId, cur + 1)
        bfsQueue.push(neighborId)
      }
    }
  }
  const maxLevel = level.size > 0 ? Math.max(...level.values()) : 0
  for (const n of nodes) {
    if (!level.has(n.id)) level.set(n.id, maxLevel + 1)
  }

  const levelGroups = new Map<number, string[]>()
  for (const [id, l] of level) {
    if (!levelGroups.has(l)) levelGroups.set(l, [])
    levelGroups.get(l)!.push(id)
  }

  const RADIUS_PER_LEVEL = 300
  const posMap = new Map<string, { x: number; y: number }>()
  for (const [l, group] of levelGroups) {
    if (l === 0 && group.length === 1) {
      posMap.set(group[0], { x: 0, y: 0 })
    } else {
      const radius = l === 0 ? RADIUS_PER_LEVEL * 0.35 : l * RADIUS_PER_LEVEL
      group.forEach((id, i) => {
        const angle = (2 * Math.PI * i) / group.length - Math.PI / 2
        posMap.set(id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
      })
    }
  }

  for (const n of nodes) {
    const pos = posMap.get(n.id)
    if (pos) { n.fx = pos.x; n.fy = pos.y; n.x = n.fx; n.y = n.fy }
  }
  renderedNodes.value = [...nodes]
  simulation?.alpha(0.05).restart()
  savePositions()
}

// ─── 노드 이동 드래그 ────────────────────────────────────
function startNodeDrag(event: MouseEvent, node: D3Node) {
  event.preventDefault()
  graphStore.saveSnapshot()
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
    const nx = node.x ?? 0, ny = node.y ?? 0
    const pdx = x - nx, pdy = y - ny
    const plen = Math.hypot(pdx, pdy)
    if (plen > 1) {
      const pux = pdx / plen, puy = pdy / plen
      const pe = edgeDist(pux, puy)
      arrowPreview.value = { x1: nx + pux * (pe + 2), y1: ny + puy * (pe + 2), x2: x, y2: y }
    } else {
      arrowPreview.value = { x1: nx, y1: ny, x2: x, y2: y }
    }
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
  if (props.readOnly) return
  if (props.pathMode || props.pathNodes.size > 0) return
  if (event.ctrlKey || event.metaKey) startArrowDrag(event, node)
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
function onLinkDblClick(link: { id: string }) {
  emit('linkDblClick', link.id)
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
  if (node.nodeKind === 'l7') return cssVar('--node-l7-color')
  if (node.nodeKind === 'infra') return cssVar('--node-infra-color')
  if (node.nodeKind === 'external') return cssVar('--node-ext-color')
  if (node.nodeKind === 'dns') return cssVar('--node-dns-color')
  return cssVar('--node-srv-color')
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
  if (node.nodeKind === 'dns') return 'DNS'
  return 'SRV'
}

function searchNodeColor(node: D3Node): string {
  if (node.nodeKind === 'l7') return cssVar('--node-l7-color')
  if (node.nodeKind === 'infra') return cssVar('--node-infra-color')
  if (node.nodeKind === 'external') return cssVar('--node-ext-color')
  if (node.nodeKind === 'dns') return cssVar('--node-dns-color')
  return cssVar('--node-srv-color')
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
    bg.setAttribute('fill', cssVar('--bg-base'))
    clone.insertBefore(bg, clone.firstChild)
  }

  // 스코프된 CSS 텍스트 클래스 인라인
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  style.textContent = [
    `text { font-family: var(--font-sans); }`,
    `.node-label { font-size: var(--text-xs); fill: #fff; font-weight: 700; }`,
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

defineExpose({ navigateTo, toggleTracking, multiSelectedIds, applyHierarchicalLayout: _applyHierarchicalLayout, applyRadialLayout: _applyRadialLayout })
</script>

<style scoped>
.graph-container {
  position: relative; width: 100%; height: 100%;
  background: var(--bg-base); border-radius: 8px; overflow: hidden;
  user-select: none;
}
.graph-svg { width: 100%; height: 100%; }
.node-label { font-size: var(--text-xs); fill: #fff; pointer-events: none; font-weight: 700; }
.node-ip { font-size: 10px; fill: rgba(255,255,255,0.75); pointer-events: none; }
.node-sub { font-size: 9px; fill: rgba(255,255,255,0.65); pointer-events: none; font-weight: 600; letter-spacing: 0.02em; }
.node-meta { font-size: 9.5px; fill: rgba(255,255,255,0.5); pointer-events: none; }
.hover-tooltip {
  opacity: 0;
  animation: tooltip-fade-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes tooltip-fade-in {
  to { opacity: 1; }
}
/* 의존성 링크 애니메이션 */
@keyframes flow-dash {
  from { stroke-dashoffset: 15; }
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
.link-hovered {
  filter: drop-shadow(0 0 5px rgba(148, 163, 184, 0.6));
  transition: filter 0.15s;
}

.graph-node { cursor: grab; }
.graph-node:active { cursor: grabbing; }
.graph-node.connect-source rect { filter: brightness(1.3); }
.graph-node.connect-target rect { filter: brightness(1.5); }

.mode-hint {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  background: var(--bg-surface); border: 1px solid var(--border-strong); border-radius: 20px;
  padding: 5px 14px; font-size: var(--text-xs); color: var(--text-tertiary);
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.readonly-hint { background: #1c1217; border-color: var(--node-l7-color); color: var(--node-l7-color); }
.drop-hint {
  position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
  background: var(--node-ext-bg-deep); border: 1px solid var(--node-ext-color); border-radius: 20px;
  padding: 6px 16px; font-size: var(--text-sm); color: var(--color-success-lighter);
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.drag-hint {
  position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
  background: var(--accent-bg-deep); border: 1px solid var(--accent-focus); border-radius: 20px;
  padding: 6px 16px; font-size: var(--text-sm); color: var(--accent-light);
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.blocked-hint {
  position: absolute; top: 56px; left: 50%; transform: translateX(-50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 20px;
  padding: 6px 16px; font-size: var(--text-sm); color: #fca5a5;
  pointer-events: none; z-index: 50; white-space: nowrap;
}
.hint-blocked { color: #ef4444; font-weight: 700; }
.blocked-toast {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: #1c0a0a; border: 1px solid #ef4444; border-radius: 10px;
  padding: 14px 24px; font-size: var(--text-base); color: #fca5a5; font-weight: 600;
  pointer-events: none; z-index: 100; white-space: nowrap;
  box-shadow: 0 4px 20px rgba(239,68,68,0.25);
}
.fade-enter-active { transition: opacity 0.2s; }
.fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.hint-source { color: var(--accent-soft); font-weight: 700; }
.hint-target { color: var(--node-ext-color); font-weight: 700; }
.add-node-menu {
  position: absolute; background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 8px; padding: 4px 0; z-index: 110; min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.add-node-menu-title {
  padding: 6px 14px 5px; font-size: var(--text-xs); font-weight: 700;
  color: var(--border-strong); letter-spacing: 0.05em; text-transform: uppercase;
  border-bottom: 1px solid var(--border-default); margin-bottom: 3px;
}
.add-node-menu button {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 7px 14px; background: none;
  border: none; color: var(--text-secondary); text-align: left; cursor: pointer; font-size: var(--text-sm);
}
.add-node-menu button:hover { background: var(--border-default); }
.menu-icon { width: 14px; height: 14px; flex-shrink: 0; }

.context-menu {
  position: absolute; background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 6px; padding: 4px 0; z-index: 100; min-width: 120px;
}
.context-menu button {
  display: block; width: 100%; padding: 6px 16px; background: none;
  border: none; color: var(--text-secondary); text-align: left; cursor: pointer; font-size: var(--text-sm);
}
.context-menu button:hover { background: var(--border-default); }
.submenu-item {
  position: relative; display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px 6px 16px; color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer; user-select: none;
}
.submenu-item:hover { background: var(--border-default); }
.submenu-arrow { font-size: 9px; color: var(--text-tertiary); margin-left: 8px; }
.submenu {
  position: absolute; left: 100%; top: -4px;
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 6px; padding: 4px 0; min-width: 120px; z-index: 101;
}
.submenu button {
  display: flex; align-items: center; gap: 6px;
  width: 100%; padding: 6px 16px; background: none;
  border: none; color: var(--text-secondary); text-align: left; cursor: pointer; font-size: var(--text-sm);
}
.submenu button:hover { background: var(--border-default); }

/* 내보내기 모달 */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 300;
}
.export-modal {
  background: var(--bg-surface); border: 1px solid var(--border-default);
  border-radius: 10px; padding: 24px; width: 300px;
  display: flex; flex-direction: column; gap: 16px;
}
.export-modal h3 { margin: 0; color: var(--text-primary); font-size: var(--text-base); }
.export-format { display: flex; gap: 8px; }
.export-format label {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px; border: 1px solid var(--border-default); border-radius: 6px;
  color: var(--text-tertiary); cursor: pointer; font-size: var(--text-sm); transition: all 0.15s;
}
.export-format label.active { border-color: var(--accent-focus); color: var(--text-secondary); background: rgba(59,130,246,0.1); }
.export-format input[type=radio] { display: none; }
.export-option {
  display: flex; align-items: center; gap: 8px;
  color: var(--text-secondary); font-size: var(--text-sm); cursor: pointer;
}
.export-option input[type=checkbox] { accent-color: var(--accent-focus); width: 14px; height: 14px; }
.export-actions { display: flex; gap: 8px; justify-content: flex-end; }
.context-menu button.danger { color: #ef4444; }
.context-menu button.disabled-item { color: var(--border-strong); cursor: not-allowed; font-style: italic; }
.context-menu button.disabled-item:hover { background: none; }

.node-legend {
  position: absolute; top: 12px; right: 12px;
  background: rgba(18, 18, 20, 0.85); border: 1px solid var(--border-default);
  border-radius: 12px; padding: 12px 15px;
  display: flex; flex-direction: column; gap: 8px;
  pointer-events: none; z-index: 50;
  backdrop-filter: blur(4px);
}
.legend-item {
  display: flex; align-items: center; gap: 9px;
  font-size: var(--text-base); color: var(--text-tertiary); font-weight: 600; white-space: nowrap;
}
.legend-dot {
  width: 15px; height: 15px; border-radius: 3px;
  border: 2px solid; flex-shrink: 0;
}
.legend-srv   { background: var(--accent-bg-medium);    border-color: var(--node-srv-color); }
.legend-l7    { background: var(--node-l7-bg-deep);     border-color: var(--node-l7-color); }
.legend-infra { background: var(--node-infra-bg-light); border-color: var(--node-infra-color); }
.legend-ext   { background: var(--node-ext-bg-deep);    border-color: var(--node-ext-color); }
.legend-dns   { background: var(--node-dns-color);      border-color: var(--node-dns-color); }
.legend-divider {
  height: 2px; background: var(--border-default); margin: 3px 0;
}

.canvas-btns {
  position: absolute; bottom: 12px; left: 12px;
  display: flex; gap: 6px; z-index: 50;
}
.canvas-btns-right {
  left: 12px; bottom: auto; top: 50px;
}
.canvas-btns-right .canvas-btn.active {
  color: var(--node-ext-color); border-color: var(--node-ext-color);
}
.canvas-btn {
  display: flex; align-items: center; gap: 5px;
  background: rgba(18, 18, 20, 0.85); border: 1px solid var(--border-default);
  border-radius: 20px; padding: 5px 12px;
  font-size: var(--text-xs); color: var(--text-disabled); cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
  backdrop-filter: blur(4px);
}
.canvas-btn:hover { color: var(--text-tertiary); border-color: var(--border-strong); }
.canvas-btn.active { color: var(--accent-soft); border-color: var(--accent-focus); }

.tracking-btn {
  position: absolute; top: 12px; left: 12px; z-index: 50;
}

.zoom-controls {
  position: absolute; bottom: 12px; right: 12px;
  display: flex; align-items: center; gap: 4px; z-index: 50;
  background: rgba(18, 18, 20, 0.85); border: 1px solid var(--border-default);
  border-radius: 20px; padding: 4px 10px;
  backdrop-filter: blur(4px);
}
.zoom-btn {
  background: none; border: none; color: var(--text-disabled);
  font-size: var(--text-lg); line-height: 1; cursor: pointer;
  padding: 0 4px; transition: color 0.15s;
}
.zoom-btn:hover { color: var(--text-tertiary); }
.zoom-input {
  width: 40px; background: none; border: none;
  color: var(--text-tertiary); font-size: var(--text-xs); font-weight: 700;
  text-align: center; outline: none;
  -moz-appearance: textfield;
}
.zoom-input::-webkit-inner-spin-button,
.zoom-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.zoom-pct { color: var(--text-disabled); font-size: var(--text-xs); }

/* 단축키 툴팁 */
[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: var(--text-xs);
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
  background: var(--border-default);
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  color: var(--text-tertiary);
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
  background: rgba(15, 23, 42, 0.88); border: 1px solid var(--border-default);
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
  background: rgba(15, 23, 42, 0.92); border: 1px solid var(--border-default);
  border-radius: 8px; padding: 0 10px; height: 34px;
  backdrop-filter: blur(6px);
  transition: border-color 0.15s;
}
.search-input-wrap:focus-within {
  border-color: var(--accent-soft);
}
.search-icon { flex-shrink: 0; }
.search-input {
  flex: 1; background: none; border: none; outline: none;
  color: var(--text-secondary); font-size: var(--text-sm);
  min-width: 0;
}
.search-input::placeholder { color: var(--border-strong); }
.search-clear {
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer; padding: 2px;
  flex-shrink: 0; opacity: 0.7;
}
.search-clear:hover { opacity: 1; }
.search-dropdown {
  list-style: none; margin: 4px 0 0; padding: 4px 0;
  background: rgba(15, 23, 42, 0.96); border: 1px solid var(--border-default);
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
  flex: 1; font-size: var(--text-sm); color: var(--text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.search-result-ip {
  font-size: var(--text-xs); color: var(--text-disabled);
  white-space: nowrap; flex-shrink: 0;
}
.search-no-result {
  padding: 10px 14px; font-size: var(--text-xs); color: var(--border-strong);
  background: rgba(15, 23, 42, 0.96); border: 1px solid var(--border-default);
  border-radius: 8px; margin-top: 4px; text-align: center;
  backdrop-filter: blur(6px);
}

/* 경로 탐색 */
@keyframes flow-dash-amber {
  from { stroke-dashoffset: 17; }
  to   { stroke-dashoffset: 0; }
}
.link-amber {
  stroke-dasharray: 12 5;
  animation: flow-dash-amber 0.45s linear infinite;
  filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.8));
}
.path-mode-banner {
  position: absolute; top: 12px; left: 50%; transform: translateX(-50%);
  background: #1c1007; border: 1px solid #f59e0b; border-radius: 20px;
  padding: 6px 16px; font-size: var(--text-sm); color: #fcd34d;
  z-index: 60; white-space: nowrap;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.25);
}
.path-source-name { color: #f59e0b; font-weight: 700; }
.path-cancel-btn {
  background: none; border: 1px solid #92400e; border-radius: 12px;
  color: #d97706; font-size: var(--text-xs); font-weight: 600; padding: 2px 10px; cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}
.path-cancel-btn:hover { border-color: #f59e0b; color: #fcd34d; }
.context-menu .context-divider { height: 1px; background: var(--border-default); margin: 3px 0; }
.context-multi-label {
  padding: 4px 10px 2px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.04em;
  color: var(--accent-soft); text-transform: uppercase;
}
.context-menu button.path-item { color: var(--color-warning-light); }
.context-menu button.path-item:hover { background: rgba(245, 158, 11, 0.1); }
.context-menu button.path-item-disabled { color: var(--border-strong); cursor: not-allowed; }
.context-menu button.path-item-disabled:hover { background: none; }

/* 다중 선택 - marching ants */
.graph-node.multi-selected > rect:first-of-type {
  stroke: #f97316;
  stroke-width: 2.5;
  stroke-dasharray: 6 4;
  animation: marching-ants 0.5s linear infinite;
}
@keyframes marching-ants {
  from { stroke-dashoffset: 0; }
  to   { stroke-dashoffset: -20; }
}

/* 순환 의존성 */
.cycle-warning-banner {
  position: absolute; top: 12px; right: 16px;
  background: #1c0a0a; border: 1px solid #dc2626; border-radius: 20px;
  padding: 5px 14px; font-size: var(--text-xs); font-weight: 600; color: #fca5a5;
  z-index: 60; white-space: nowrap;
  box-shadow: 0 0 10px rgba(220, 38, 38, 0.2);
}
</style>
