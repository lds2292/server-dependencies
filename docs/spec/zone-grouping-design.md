# Zone (시각적 그룹핑) — 디자인 가이드

> 기획서: `docs/spec/zone-grouping.md`
> 개발 에이전트는 이 문서의 스펙을 그대로 따라 구현할 것. 기획서의 섹션 번호(§)는 본 문서의 항목과 1:1 매핑됨.

---

## 제약 조건 (필수)

- CSS 색상 하드코딩 금지. 모든 색상은 `client/src/style.css`에 추가되는 CSS 변수를 통해 사용한다.
- JS/TS에서 색상은 기존 `cssVar(name)` 헬퍼(`GraphCanvas.vue`)로 읽는다. `getComputedStyle(...).getPropertyValue(...)`.
- 이모지 금지. 아이콘은 인라인 SVG 또는 `Icon.vue`.
- 폰트 크기는 `--text-xs` ~ `--text-2xl` 변수만 사용. 단, SVG `font-size` 속성은 숫자가 필요하므로 `parseInt(cssVar('--text-sm'))` 또는 상수 사용 허용.
- Zone은 L7 hull과 동일한 "장식 레이어" 성격이지만, **L7 hull보다 뒤(아래)** 에 그린다 — 기획서 §3.2 렌더링 순서 준수.
- 시안/블루 등 비앰버 색상은 **Zone 프리셋 6색 한정**으로만 허용. 그 외 액센트(테두리·hover·선택 강조)는 모두 앰버 계열.

---

## 1. Zone 색상 프리셋 (§3.1) — CSS 변수 정의

### 1.1 확정 스펙 — `client/src/style.css` 추가

`:root {}` 블록 맨 아래(역할 뱃지 다음)에 새 섹션 추가.

```css
/* ── Zone 색상 프리셋 ──
   캔버스 상의 시각적 그룹핑 전용. 다른 UI에서 사용 금지.
   bg는 8% alpha (영역 채움), border는 35% alpha (점선 테두리),
   text는 라벨 텍스트 (300번대 톤, WCAG AA 충족) */

--zone-blue-bg:     rgba(59, 130, 246, 0.08);
--zone-blue-border: rgba(59, 130, 246, 0.35);
--zone-blue-text:   #93b4f5;

--zone-green-bg:     rgba(34, 197, 94, 0.08);
--zone-green-border: rgba(34, 197, 94, 0.35);
--zone-green-text:   #86efac;

--zone-purple-bg:     rgba(168, 85, 247, 0.08);
--zone-purple-border: rgba(168, 85, 247, 0.35);
--zone-purple-text:   #d8b4fe;

--zone-orange-bg:     rgba(249, 115, 22, 0.08);
--zone-orange-border: rgba(249, 115, 22, 0.35);
--zone-orange-text:   #fdba74;

--zone-pink-bg:     rgba(236, 72, 153, 0.08);
--zone-pink-border: rgba(236, 72, 153, 0.35);
--zone-pink-text:   #f9a8d4;

--zone-cyan-bg:     rgba(6, 182, 212, 0.08);
--zone-cyan-border: rgba(6, 182, 212, 0.35);
--zone-cyan-text:   #67e8f9;

/* Zone 헤더 hover/선택 상태용 */
--zone-header-hover-overlay: rgba(255, 255, 255, 0.04);
--zone-drop-target-overlay:  rgba(245, 158, 11, 0.10); /* drag-over 강조 (앰버) */
--zone-drop-target-stroke:   rgba(245, 158, 11, 0.65); /* drag-over 외곽선 (앰버) */
```

### 1.2 근거

- **8% / 35% alpha**: L7 hull은 `fill-opacity="0.06"` + `stroke-opacity="0.2"`로 매우 옅다. Zone은 L7 hull보다 사용자 의도가 명확한 1차 그룹이므로 한 단계 더 진하게(`0.08` / `0.35`) 처리하여 위계를 형성. 동시에 노드 가독성을 해치지 않음.
- **300톤 라벨 텍스트**: 어두운 차콜 배경(`#121214`) 위에서 다크모드 안전 톤(Tailwind 300번대 hex). 기존 `--role-admin-text: #93b4f5`, `--node-ext-text: #86efac` 등과 동일한 톤 체계로 일관성 확보.
- **dropTarget 오버레이는 앰버**: Zone 자체 색은 6색 중 하나지만, "여기에 드롭 가능"이라는 액션 피드백은 앱 전체 액션 액센트인 앰버(`--accent-focus`)로 통일. 새로운 인터랙션 색을 도입하지 않음.
- 6색 모두 다크 차콜 위에서 충분한 대비를 가지면서, 인접 색끼리(blue/cyan, purple/pink) 식별 가능한 색상환 분포로 선정.

---

## 2. Zone SVG 렌더링 (§3.2)

### 2.1 확정 상수 — `GraphCanvas.vue` `<script setup>` 상단

```typescript
// --- Zone 시각 상수 ---
const ZONE_PADDING = 40        // 노드 주변 여백 (기획서 §3.2)
const ZONE_HEADER_H = 32       // 상단 헤더(드래그 핸들+라벨) 높이
const ZONE_MIN_W = 220         // 빈 Zone 최소 너비
const ZONE_MIN_H = 120         // 빈 Zone 최소 높이 (헤더 포함)
const ZONE_CORNER_R = 10       // 모서리 라운드 (px)
const ZONE_BORDER_W = 1.5      // 테두리 굵기
const ZONE_BORDER_DASH = '6,4' // 점선 패턴
const ZONE_LABEL_PADDING_X = 14
const ZONE_LABEL_FONT_SIZE = 13   // = --text-sm (SVG 숫자 필요)
const ZONE_LABEL_FONT_WEIGHT = 600
const ZONE_EMPTY_HINT_FONT_SIZE = 11 // = --text-xs
```

### 2.2 SVG 템플릿 — 렌더링 순서 (gRef 내부)

기획서 §3.2 순서를 그대로 따른다. **그리드/중심점 마커 다음, L7 hull 직전**에 Zone 그룹을 삽입.

```html
<!-- 중심점 마커 직후 -->

<!-- ============ Zone 영역 (L7 hull보다 뒤) ============ -->
<g
  v-for="zone in zoneRects"
  :key="'zone-' + zone.id"
  :class="['zone-group', {
    'zone-group--empty': zone.isEmpty,
    'zone-group--drop-target': dropTargetZoneId === zone.id,
    'zone-group--dragging': draggingZoneId === zone.id,
    'zone-group--just-attached': justAttachedZoneId === zone.id,
  }]"
  :opacity="(pathMode || pathNodes.size > 0) ? 0.15 : 1"
>
  <!-- (1) 영역 배경 + 점선 테두리 -->
  <rect
    class="zone-bg"
    :x="zone.x" :y="zone.y"
    :width="zone.width" :height="zone.height"
    :rx="ZONE_CORNER_R"
    :fill="dropTargetZoneId === zone.id
      ? cssVar('--zone-drop-target-overlay')
      : cssVar(`--zone-${zone.color}-bg`)"
    :stroke="dropTargetZoneId === zone.id
      ? cssVar('--zone-drop-target-stroke')
      : cssVar(`--zone-${zone.color}-border`)"
    :stroke-width="ZONE_BORDER_W"
    :stroke-dasharray="ZONE_BORDER_DASH"
    pointer-events="none"
  />

  <!-- (2) 헤더 바 (드래그/우클릭/더블클릭 핫스팟) -->
  <rect
    class="zone-header"
    :x="zone.x" :y="zone.y"
    :width="zone.width" :height="ZONE_HEADER_H"
    :rx="ZONE_CORNER_R"
    :fill="cssVar(`--zone-${zone.color}-bg`)"
    :style="{ cursor: readOnly ? 'default' : (draggingZoneId === zone.id ? 'grabbing' : 'grab') }"
    @mousedown.stop="onZoneHeaderMouseDown($event, zone)"
    @dblclick.stop="onZoneNameDblClick(zone)"
    @contextmenu.prevent.stop="onZoneContextMenu($event, zone)"
    @mouseenter="hoveredZoneId = zone.id"
    @mouseleave="hoveredZoneId = null"
  />

  <!-- (3) 헤더 하단 모서리 직각 보정 (라운드 덮개) -->
  <rect
    :x="zone.x" :y="zone.y + ZONE_HEADER_H - ZONE_CORNER_R"
    :width="zone.width" :height="ZONE_CORNER_R"
    :fill="cssVar(`--zone-${zone.color}-bg`)"
    pointer-events="none"
  />

  <!-- (4) 헤더 hover 오버레이 -->
  <rect
    v-if="hoveredZoneId === zone.id && !readOnly && draggingZoneId !== zone.id"
    :x="zone.x" :y="zone.y"
    :width="zone.width" :height="ZONE_HEADER_H"
    :rx="ZONE_CORNER_R"
    :fill="cssVar('--zone-header-hover-overlay')"
    pointer-events="none"
  />

  <!-- (5) 헤더-본문 구분선 -->
  <line
    :x1="zone.x" :y1="zone.y + ZONE_HEADER_H"
    :x2="zone.x + zone.width" :y2="zone.y + ZONE_HEADER_H"
    :stroke="cssVar(`--zone-${zone.color}-border`)"
    stroke-width="0.8"
    pointer-events="none"
  />

  <!-- (6) Zone 이름 라벨 -->
  <text
    v-if="editingZoneId !== zone.id"
    :x="zone.x + ZONE_LABEL_PADDING_X"
    :y="zone.y + ZONE_HEADER_H / 2 + 1"
    dominant-baseline="central"
    :fill="cssVar(`--zone-${zone.color}-text`)"
    :font-size="ZONE_LABEL_FONT_SIZE"
    :font-weight="ZONE_LABEL_FONT_WEIGHT"
    font-family="var(--font-sans)"
    pointer-events="none"
  >{{ zone.name }}</text>

  <!-- (7) 노드 카운트 마이크로 뱃지 (isEmpty=false 일 때만) -->
  <g v-if="!zone.isEmpty" pointer-events="none">
    <text
      :x="zone.x + zone.width - ZONE_LABEL_PADDING_X"
      :y="zone.y + ZONE_HEADER_H / 2 + 1"
      text-anchor="end"
      dominant-baseline="central"
      :fill="cssVar('--text-tertiary')"
      :font-size="ZONE_EMPTY_HINT_FONT_SIZE"
      font-family="var(--font-sans)"
    >{{ zone.memberCount }}</text>
  </g>

  <!-- (8) 빈 Zone 안내 -->
  <text
    v-if="zone.isEmpty && !readOnly"
    :x="zone.x + zone.width / 2"
    :y="zone.y + (zone.height + ZONE_HEADER_H) / 2"
    text-anchor="middle"
    dominant-baseline="central"
    :fill="cssVar('--text-disabled')"
    :font-size="ZONE_EMPTY_HINT_FONT_SIZE"
    font-family="var(--font-sans)"
    pointer-events="none"
  >{{ t('graph.zone.emptyHint') }}</text>

  <!-- (9) 인라인 이름 편집 (foreignObject) -->
  <foreignObject
    v-if="editingZoneId === zone.id"
    :x="zone.x + 8" :y="zone.y + 4"
    :width="zone.width - 16" :height="ZONE_HEADER_H - 8"
  >
    <input
      ref="zoneNameInputRef"
      class="zone-name-input"
      :style="{ color: cssVar(`--zone-${zone.color}-text`) }"
      v-model="editingZoneName"
      @blur="commitZoneNameEdit"
      @keydown.enter.prevent="commitZoneNameEdit"
      @keydown.escape.prevent="cancelZoneNameEdit"
      @click.stop
      @mousedown.stop
    />
  </foreignObject>
</g>
<!-- ============ /Zone 영역 ============ -->

<!-- L7 그룹 영역 — 그대로 -->
```

### 2.3 z-order 전략 (L7 hull과의 관계)

현재 `GraphCanvas.vue`의 `l7GroupHulls`는 `<path>` 단일 요소로 그려진다. Zone은 그 **직전**에 삽입한다. 결과 레이어 순서:

```
[아래] 그리드 → 중심마커 → Zone(g) → L7 hull(path) → L7 멤버선 → 의존성 → 드래그 미리보기 → 박스선택 → ghosts → 노드 [위]
```

이유:
- L7 hull은 데이터 모델의 결과(자동), Zone은 사용자가 직접 그린 시각 그룹. **수동 그룹이 더 큰 컨테이너**이므로 의미상 더 뒤(아래)에 둔다.
- L7 hull이 Zone 위에 있으면, Zone을 두른 L7 멤버 그룹의 보라색 점선이 잘 보임 → 두 그룹핑 체계가 시각적으로 충돌하지 않음.
- 노드는 항상 두 hull/zone보다 위 → 클릭 영역 보장.

### 2.4 근거

- **둥근 사각형 + 점선**: L7 hull과 같은 점선 패턴이지만 hull은 polygon, Zone은 정렬된 직사각형이라 시각적으로 명확히 구분. 둥근 모서리(`rx=10`)는 카드/모달과 동일한 라운드 체계.
- **헤더 32px**: 글로벌 `.btn-icon` 28px + 4px 여유. 클릭 적중률과 라벨 가독성 모두 확보.
- **헤더 hover 오버레이를 흰색 4%로 처리**: Zone 색상이 6가지로 변동하므로 hover 색을 색상별로 만들 수 없음. 흰색 알파를 얹는 방식이 6색 모두에 안전하게 동작.
- **라운드 모서리 직각 보정**: 헤더 `<rect>`에 `rx=10`을 주면 헤더 하단 모서리도 둥글어져 본문 사각형과 어긋남. 덮개 `<rect>`로 헤더 하단을 직각으로 만든다.

---

## 3. Zone 생성 플로우 (§3.6)

### 3.1 확정 스펙

- 캔버스 빈 영역 **더블클릭** → 기존 `addNodeMenu`에 "Zone" 항목을 **노드 5종 다음, 구분선으로 분리하여** 추가.
- 캔버스 빈 영역 **우클릭** → 기존 `canvasContextMenu`의 "노드 추가" 서브메뉴 외부, 같은 레벨에 "Zone 추가" 항목 추가.
- 생성 직후: **인라인 이름 프롬프트 없음**. 기본 이름(`graph.zone.defaultName`) + `blue` 색상으로 즉시 생성하고, **자동으로 인라인 편집 모드 진입**(input 포커스). 사용자가 그대로 Enter 치면 기본 이름 유지.

### 3.2 add-node-menu 추가 항목

```html
<div class="add-node-menu-divider"></div>
<button @click="onAddZoneMenuSelect()">
  <svg class="menu-icon" viewBox="0 0 14 14" fill="none">
    <rect
      x="1.25" y="1.25" width="11.5" height="11.5"
      rx="2"
      stroke="currentColor" stroke-width="1"
      stroke-dasharray="2,1.5"
    />
  </svg>
  {{ t('graph.zone.addZone') }}
</button>
```

### 3.3 생성 핸들러 (자동 편집 진입 추가)

```typescript
async function onAddZoneMenuSelect() {
  addNodeMenu.value.visible = false
  const pos = pendingNodePosition ?? { x: 0, y: 0 }
  const zone = graphStore.addZone({
    name: t('graph.zone.defaultName'),
    color: 'blue',
    nodeIds: [],
  })
  graphStore.savePositions({ ...graphStore.getPositions(), [zone.id]: pos })

  // 다음 tick에 인라인 편집 모드 진입 + 전체 선택
  await nextTick()
  editingZoneId.value = zone.id
  editingZoneName.value = zone.name
  await nextTick()
  zoneNameInputRef.value?.select()
}
```

`onCanvasAddZone()`도 동일 로직.

### 3.4 근거

- 이름을 즉시 input으로 띄우는 패턴은 macOS Finder/Notion의 "새 폴더" UX와 동일 → 학습 비용 0.
- 별도 모달/프롬프트는 inline 편집 가능한 영역에서는 과한 인터럽션. 그래프 캔버스의 흐름을 끊지 않는다.
- 더블클릭 + 우클릭 두 경로 제공은 노드 추가와 동일한 mental model을 이어감.

---

## 4. Zone 편집 UX (§3.7, §3.8)

### 4.1 이름 편집: 인라인 input

`<foreignObject>` 안의 HTML `<input>`. 이미 §2.2 (9)번에 위치. 스타일은 §10에 정의.

동작 규약:
- 진입: Zone 헤더 더블클릭, 또는 우클릭 메뉴 → "이름 변경", 또는 생성 직후 자동
- 확정: Enter 또는 blur. 빈 문자열이면 변경 취소.
- 취소: Escape (변경 무효).
- 다른 영역 클릭(`@click.stop`/`@mousedown.stop`)은 캔버스 이벤트로 전파되지 않음 (드래그 시작 방지).

### 4.2 색상 변경: 우클릭 → 서브메뉴 6색 팔레트

```html
<div v-if="zoneContextMenu.visible" class="context-menu zone-context-menu"
  :style="{ left: zoneContextMenu.x + 'px', top: zoneContextMenu.y + 'px' }"
  @click.stop>
  <button @click="onZoneRename">{{ t('graph.zone.rename') }}</button>

  <div class="submenu-item"
    @mouseenter="zoneContextMenu.activeSubmenu = 'color'"
    @mouseleave="zoneContextMenu.activeSubmenu = null">
    <span>{{ t('graph.zone.changeColor') }}</span>
    <span class="submenu-arrow">&#9654;</span>

    <div v-if="zoneContextMenu.activeSubmenu === 'color'" class="submenu zone-color-submenu">
      <button
        v-for="c in zoneColorPresets"
        :key="c"
        class="zone-color-option"
        :class="{ 'is-active': currentZoneColor === c }"
        @click="onZoneChangeColor(c)"
      >
        <span class="zone-color-swatch"
          :style="{
            background: cssVar(`--zone-${c}-bg`),
            borderColor: cssVar(`--zone-${c}-border`),
          }"
        ></span>
        <span>{{ t(`graph.zone.colors.${c}`) }}</span>
      </button>
    </div>
  </div>

  <div class="context-divider"></div>
  <button class="danger" @click="onZoneDelete">{{ t('common.delete') }}</button>
</div>
```

`zoneColorPresets: readonly ZoneColor[] = ['blue','green','purple','orange','pink','cyan']`.

### 4.3 설명(description) 편집

기획서 §2.1에 `description?` 필드는 정의되어 있으나 §3에서 편집 UI가 없음. **MVP 범위에서는 편집 UI를 제공하지 않는다**. 향후 사이드 패널이 도입되면 그곳에 추가. 데이터 필드는 import/export로만 보존.

> 근거: 모달은 캔버스 흐름을 끊고, 사이드 패널은 별도 인프라가 필요. MVP는 이름+색상까지가 가치/비용 균형점.

### 4.4 근거

- 색상 스와치는 **bg + border 두 색을 모두 보여줘야** 실제 렌더링과 일치 → `background: bg, border: 1.5px solid border` 패턴.
- 활성 색상에는 앰버 outer ring (`box-shadow: 0 0 0 2px var(--accent-focus)`)으로 현재 선택 표시. 서브메뉴 자체에 앰버 발광은 쓰지 않음(과함).

---

## 5. 노드 → Zone 소속 인터랙션 (§3.5)

### 5.1 드래그 중 시각 피드백

노드 드래그 중, **현재 노드 중심**이 들어 있는 Zone을 매 프레임 계산하여 `dropTargetZoneId`에 저장. §2.2 (1)번 `<rect class="zone-bg">`가 자동으로 앰버 오버레이/스트로크로 전환됨.

```typescript
const dropTargetZoneId = ref<string | null>(null)

function updateDropTarget(nodeX: number, nodeY: number) {
  for (const zone of zoneRects.value) {
    if (
      nodeX >= zone.x + NODE_HALF_W &&
      nodeX <= zone.x + zone.width - NODE_HALF_W &&
      nodeY >= zone.y + ZONE_HEADER_H &&
      nodeY <= zone.y + zone.height
    ) {
      dropTargetZoneId.value = zone.id
      return
    }
  }
  dropTargetZoneId.value = null
}
```

`startNodeDrag`의 `handleMove` 콜백 끝에 `updateDropTarget(n.x, n.y)` 추가. `handleUp`에서 `dropTargetZoneId.value = null` 후 `resolveNodeZone(nodeId)` 호출.

### 5.2 드롭 완료 피드백

토스트 없음. 무성한 알림 대신, **Zone 헤더에 0.4초 앰버 글로우 펄스**:

```css
@keyframes zone-attach-pulse {
  0%   { filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); }
  40%  { filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.55)); }
  100% { filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); }
}
.zone-group--just-attached {
  animation: zone-attach-pulse 0.4s ease-out;
}
```

```typescript
const justAttachedZoneId = ref<string | null>(null)
function flashZoneAttach(zoneId: string) {
  justAttachedZoneId.value = zoneId
  setTimeout(() => { justAttachedZoneId.value = null }, 400)
}
```

`resolveNodeZone`이 새 Zone 소속을 발생시킨 경우 `flashZoneAttach(zoneId)` 호출. 이미 같은 Zone에 있던 경우는 호출하지 않음.

### 5.3 노드를 Zone 밖으로 빼낼 때

별도 시각 피드백 없음. Zone에서 빠져나오면 Zone의 `nodeIds`에서 제거되고, `zoneRects` 재계산 시 Zone bounds가 자동으로 줄어듦.

### 5.4 근거

- Zone 영역 자체를 앰버로 바꾸는 방식은 6색 어떤 색이든 시각 충돌 없이 동작 (Zone 색이 사라지고 액션 색만 남음).
- 펄스는 0.4s로 짧게 — 사용자가 작업을 이어가는 데 방해가 되지 않음. 토스트는 마우스 이동 중에 인지 부담이 큼.
- `drop-shadow` 필터는 SVG `<g>`에서도 잘 동작하며 박스 그림자보다 둥근 모서리에 자연스럽게 붙음.

---

## 6. Zone 드래그 (전체 이동) (§3.4)

### 6.1 드래그 가능 영역

- **Zone 헤더(상단 32px) 한정**. 본문 영역은 `pointer-events="none"` (§2.2의 `.zone-bg`).
- 본문은 클릭/드래그를 가로채지 않으므로, Zone 위의 노드는 평소처럼 드래그/선택 가능.

### 6.2 커서

- 기본 헤더: `cursor: grab`
- 드래그 중: `cursor: grabbing` (`draggingZoneId === zone.id` 일 때)
- readOnly: `cursor: default`

### 6.3 드래그 중 시각 상태

- `.zone-group--dragging` 클래스가 붙는다:
  ```css
  .zone-group--dragging .zone-bg {
    filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35));
  }
  ```
- 내부 노드: 기존 force simulation의 `fx/fy` 고정 패턴을 그대로 사용 (기획서 §3.4 코드 그대로). 노드 자체는 시각 변화 없음.

### 6.4 Zone bounds 변화 애니메이션 (auto-fit)

`zoneRects`는 매 tick computed되므로, Zone bounds는 프레임마다 즉시 갱신된다. 별도 transition을 주면 force simulation 진동과 충돌하므로 **transition 없음**. 단, 노드 드래그가 끝나서 Zone에서 멀어지는 순간만은 부드럽게 보이도록 `<rect class="zone-bg">`에 다음을 적용:

```css
.zone-bg {
  /* 드래그 중에는 transition 없이 즉시 추종, 드래그 끝나면 부드럽게 */
  transition: x 0.18s ease-out, y 0.18s ease-out, width 0.18s ease-out, height 0.18s ease-out;
}
.zone-group--dragging .zone-bg,
.zone-group--node-dragging .zone-bg {
  transition: none;
}
```

### 6.5 근거

- 헤더만 드래그: 본문 클릭이 노드 선택과 충돌하지 않도록 하는 가장 명확한 방법. Figma의 프레임/섹션과 동일한 패턴.
- drop-shadow는 박스 그림자와 달리 SVG `<g>`에 적용해도 모서리를 정확히 따라감.

---

## 7. Zone 우클릭 메뉴 / 삭제 (§3.8)

### 7.1 항목 순서와 라벨

```
이름 변경 (graph.zone.rename)
색상 변경 (graph.zone.changeColor)         ▶  [6색 서브메뉴]
─────
삭제 (common.delete)        ← .danger 클래스
```

### 7.2 삭제 동작

- **확인 다이얼로그 없음**. 삭제 즉시 `graphStore.deleteZone(id)` 호출.
- 내부 노드는 유지(소속만 해제). 이는 기획서 §3.11 인터랙션 표와 일치.
- 복구 수단: 전역 `Ctrl+Z` (이미 `saveSnapshot()`이 `deleteZone` 내부에서 호출됨).

### 7.3 삭제 애니메이션

MVP는 transition 없이 즉시 사라지게 한다. 사용자가 undo로 즉시 복구 가능하므로 충분.

### 7.4 근거

- 확인 다이얼로그를 두면 색상 변경 같은 빈번한 액션과 다른 동선으로 사용자가 인지함. undo 보장이 있는 한 즉시 삭제가 표준 (Notion/Figma 동일).

---

## 8. 미니맵 표시 (§3.9)

### 8.1 확정 스펙

기획서 §3.9의 코드를 따르되, 다음 사항을 추가/명시:
- 미니맵에서 Zone은 노드 점보다 **뒤에** 그린다 (`<g class="minimap-zones">`를 `<g class="minimap-nodes">` 앞에 배치).
- 라운드: `rx="2"` (캔버스 본체의 `rx="10"`보다 작음 — 미니맵 스케일에서 자연스럽게 보이는 값).
- `stroke-dasharray` 생략 (스케일에 따라 점선이 잘게 나와 노이즈가 됨). 실선 0.5px만.
- opacity **0.7** (0.6은 차콜 미니맵 배경에서 거의 안 보임).

```html
<rect v-for="mz in minimapZones" :key="'mz-' + mz.id"
  :x="mz.mx" :y="mz.my" :width="mz.mw" :height="mz.mh"
  rx="2"
  :fill="cssVar(`--zone-${mz.color}-bg`)"
  :stroke="cssVar(`--zone-${mz.color}-border`)"
  stroke-width="0.5"
  opacity="0.7"
/>
```

### 8.2 근거

- 미니맵의 목적은 "어디 있는지" 빠른 인지. 점선·라벨·노드 카운트 등은 모두 노이즈가 됨. 색상 영역만으로 충분히 식별 가능.

---

## 9. 기타 결정 사항

### 9.1 빈 Zone (내부 노드 0개) 처리

- **자동 삭제하지 않는다**. 사용자가 "먼저 공간을 만든 뒤 노드를 채우는" 워크플로우를 보장 (기획서 §3.6 빈 Zone 생성 후 드래그로 채움 가정).
- 빈 Zone에는 `graph.zone.emptyHint` ("노드를 여기로 드래그하세요" / "Drag nodes here") 안내 표시 (§2.2 (8)).
- 고아 빈 Zone은 우클릭 → 삭제로 정리.

### 9.2 다중 선택 시 Zone 처리

- Zone은 **노드가 아니므로 박스 선택/`multiSelectedIds` 대상에 포함하지 않는다**. 기존 선택 로직 변경 불필요.
- Zone 자체에는 선택 상태가 없음. 우클릭 메뉴와 더블클릭 편집만으로 모든 액션 수행 가능.
- 박스 선택으로 여러 노드를 골라 드래그 → 멤버 일부가 Zone에 들어가면 그 노드들만 자동 소속(`resolveNodeZone`을 각 노드에 호출).

### 9.3 readOnly 모드

- 모든 인터랙션 차단: 헤더 드래그, 더블클릭 편집, 우클릭 메뉴 disabled.
- Zone 자체는 그대로 렌더링됨 (정보 전달).
- 빈 Zone 안내 텍스트는 숨김(`v-if="zone.isEmpty && !readOnly"`).

### 9.4 i18n 키 (기획서 §4 + 추가)

기획서 §4의 키를 모두 사용. 추가 필요 키:
- `graph.zone.colors.{blue,green,purple,orange,pink,cyan}`
- `common.delete` — 기존 키 재사용.

---

## 10. 구현 요약

### 10.1 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `client/src/style.css` | Zone CSS 변수 21개 (6색 × 3 + 헤더hover/drop overlay/drop stroke), `.zone-name-input`, `.zone-color-swatch`, `.zone-color-option`, `.zone-context-menu`, `.add-node-menu-divider`, `.zone-group` 관련 SVG 클래스, `@keyframes zone-attach-pulse` |
| `client/src/components/GraphCanvas.vue` | §2.2 SVG 블록, §2.1 상수, §3·4·5·6·7·8의 핸들러, Zone 관련 ref 및 computed |
| `client/src/types/index.ts` | 기획서 §2.1, §2.2 그대로 |
| `client/src/stores/graph.ts` | 기획서 §2.4 그대로 |
| `client/src/i18n/locales/{ko,en}.ts` | 기획서 §4 그대로 |
| `server/src/types/index.ts` + `server/src/services/graphService.ts` | 기획서 §2.5 그대로 |
| `docs/guide/style_guide.md` | "Zone 색상 프리셋" 섹션 추가 (변수 표 + 사용 규칙) |

### 10.2 style.css 추가 블록 전체

```css
/* ── Zone 색상 프리셋 ── */
:root {
  --zone-blue-bg:     rgba(59, 130, 246, 0.08);
  --zone-blue-border: rgba(59, 130, 246, 0.35);
  --zone-blue-text:   #93b4f5;

  --zone-green-bg:     rgba(34, 197, 94, 0.08);
  --zone-green-border: rgba(34, 197, 94, 0.35);
  --zone-green-text:   #86efac;

  --zone-purple-bg:     rgba(168, 85, 247, 0.08);
  --zone-purple-border: rgba(168, 85, 247, 0.35);
  --zone-purple-text:   #d8b4fe;

  --zone-orange-bg:     rgba(249, 115, 22, 0.08);
  --zone-orange-border: rgba(249, 115, 22, 0.35);
  --zone-orange-text:   #fdba74;

  --zone-pink-bg:     rgba(236, 72, 153, 0.08);
  --zone-pink-border: rgba(236, 72, 153, 0.35);
  --zone-pink-text:   #f9a8d4;

  --zone-cyan-bg:     rgba(6, 182, 212, 0.08);
  --zone-cyan-border: rgba(6, 182, 212, 0.35);
  --zone-cyan-text:   #67e8f9;

  --zone-header-hover-overlay: rgba(255, 255, 255, 0.04);
  --zone-drop-target-overlay:  rgba(245, 158, 11, 0.10);
  --zone-drop-target-stroke:   rgba(245, 158, 11, 0.65);
}

/* ── Zone 인라인 이름 편집 input ── */
.zone-name-input {
  width: 100%;
  height: 100%;
  padding: 0 6px;
  background: var(--bg-input);
  border: 1px solid var(--border-strong);
  border-radius: 4px;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.zone-name-input:focus {
  border-color: var(--accent-focus);
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
}

/* ── add-node-menu의 Zone 항목 구분선 ── */
.add-node-menu-divider {
  height: 1px;
  background: var(--border-default);
  margin: 4px 0;
}

/* ── Zone 컨텍스트 메뉴 색상 서브메뉴 ── */
.zone-color-submenu {
  min-width: 140px;
  padding: 4px 0;
}
.zone-color-option {
  display: flex !important;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 6px 14px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  text-align: left;
  cursor: pointer;
}
.zone-color-option:hover {
  background: var(--border-default);
}
.zone-color-option.is-active {
  color: var(--accent-soft);
}
.zone-color-swatch {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1.5px solid transparent;
  flex-shrink: 0;
  box-sizing: border-box;
}
.zone-color-option.is-active .zone-color-swatch {
  box-shadow: 0 0 0 2px var(--accent-focus);
}

/* ── Zone SVG 그룹 상태 ── */
.zone-group .zone-bg {
  transition: x 0.18s ease-out, y 0.18s ease-out,
              width 0.18s ease-out, height 0.18s ease-out;
}
.zone-group--dragging .zone-bg,
.zone-group--node-dragging .zone-bg {
  transition: none;
}
.zone-group--dragging .zone-bg {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.35));
}

/* 노드 드롭 완료 펄스 */
@keyframes zone-attach-pulse {
  0%   { filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); }
  40%  { filter: drop-shadow(0 0 10px rgba(245, 158, 11, 0.55)); }
  100% { filter: drop-shadow(0 0 0 rgba(245, 158, 11, 0)); }
}
.zone-group--just-attached .zone-bg {
  animation: zone-attach-pulse 0.4s ease-out;
}
```

### 10.3 script 추가 ref/computed

```typescript
import { ref, computed, nextTick } from 'vue'

// --- Zone 상태 ref ---
const editingZoneId = ref<string | null>(null)
const editingZoneName = ref('')
const zoneNameInputRef = ref<HTMLInputElement | null>(null)
const hoveredZoneId = ref<string | null>(null)
const draggingZoneId = ref<string | null>(null)
const dropTargetZoneId = ref<string | null>(null)
const justAttachedZoneId = ref<string | null>(null)

const zoneContextMenu = ref<{
  visible: boolean
  x: number
  y: number
  zoneId: string | null
  activeSubmenu: 'color' | null
}>({ visible: false, x: 0, y: 0, zoneId: null, activeSubmenu: null })

const zoneColorPresets: readonly ZoneColor[] =
  ['blue','green','purple','orange','pink','cyan'] as const

const currentZoneColor = computed(() => {
  const id = zoneContextMenu.value.zoneId
  if (!id) return null
  return graphStore.zones.find(z => z.id === id)?.color ?? null
})
```

`zoneRects` computed에는 기획서 §3.2 코드에 `memberCount` 필드 추가:

```typescript
return {
  id: zone.id, name: zone.name, color: zone.color,
  x: ..., y: ..., width: ..., height: ...,
  isEmpty: false,
  memberCount: members.length,
}
```

### 10.4 주의사항

- **Zone `<g>`는 반드시 L7 hull `<path>` 직전에 삽입**. 다른 위치에 두면 z-order 깨짐.
- `<rect class="zone-bg">`는 반드시 `pointer-events="none"`. 그렇지 않으면 본문 영역이 노드/링크 클릭을 가린다.
- `<rect class="zone-header">`만 이벤트를 받는다. `@mousedown.stop`로 캔버스 박스 선택·노드 드래그 트리거를 방지.
- `editingZoneId`로 편집 중일 때 `<text>` 라벨을 `v-if`로 숨기지 않으면 input과 겹친다 (§2.2 (6) 조건 확인).
- `foreignObject` 안의 input은 SVG 좌표계 안에 있으므로 캔버스 줌/팬과 함께 자동으로 따라옴 — 별도 transform 불필요.
- 노드 드래그(`startNodeDrag`)와 다중 선택 드래그 양쪽 모두에 `updateDropTarget` (move) + `resolveNodeZone` (up) 호출 추가 필요. Zone 드래그(`onZoneHeaderMouseDown`)에는 호출하지 말 것 — 멤버 노드들이 자기 Zone 안에 있으므로 무한 self-attach 방지.
- `flashZoneAttach`는 `removeNodeFromZone`에서 호출하지 않음 (해제 시 펄스 없음).
- `zoneContextMenu`는 캔버스 다른 곳을 클릭하면 닫혀야 함 — 기존 `closeMenus()` 함수에 `zoneContextMenu.value.visible = false` 추가.
- `delete` 키 글로벌 핸들러가 노드 삭제용으로 동작 중이라면, 편집 중(`editingZoneId !== null`)일 때는 동작 가드 필요 — `keydown` 핸들러에서 `if (editingZoneId.value) return`.
- L7 hull은 `pathMode` 시 매우 옅게(0.03) 처리되어 있는데, Zone도 동일하게 0.15로 옅게 처리 (§2.2 `:opacity` 바인딩) → 경로 분석 모드에서 두 그룹 모두 뒤로 물러나 노드와 경로에 집중되도록.

---

## 11. 기획서 체크리스트와의 매핑

| 기획서 섹션 | 본 가이드 항목 |
|---|---|
| §3.1 색상 프리셋 | §1 |
| §3.2 SVG 렌더링 | §2 |
| §3.3 와이어프레임 | §2.2 (시각적 일치) |
| §3.4 헤더 드래그 | §6 |
| §3.5 소속 자동 판정 | §5 |
| §3.6 생성 UI | §3 |
| §3.7 인라인 편집 | §4.1 |
| §3.8 컨텍스트 메뉴 | §4.2, §7 |
| §3.9 미니맵 | §8 |
| §3.10 영향도 | (디자인 변경 없음) |
| §3.11 인터랙션 표 | §3, §4, §5, §6, §7 (전체) |
| §4 i18n | §9.4 |
| §5 파일 체크리스트 | §10.1 |
| §6 제약 조건 | 본 문서 상단 "제약 조건" |
