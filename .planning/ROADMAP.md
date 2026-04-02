# Roadmap: Node Text Readability

## Overview

노드 크기(187x74px)를 유지하면서 GraphCanvas 노드 내부 텍스트의 가독성을 개선한다. CSS 변수 기반을 먼저 구축하고, 폰트 크기/간격을 조정한 뒤, 너비 기반 스마트 잘림을 구현하고, 마지막으로 export 동기화로 마무리한다.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: CSS Foundation** - 그래프 전용 CSS 변수 추가 및 인라인 스타일 정리, 대비율 개선 (completed 2026-04-02)
- [ ] **Phase 2: Font Size & Spacing** - 폰트 크기 증가 및 행간 재계산으로 텍스트 가독성 확보
- [ ] **Phase 3: Smart Truncation** - 너비 기반 텍스트 잘림으로 한글/영문 혼합 정확 대응
- [ ] **Phase 4: Export Sync** - 변경된 스타일을 exportGraph() 블록에 반영

## Phase Details

### Phase 1: CSS Foundation
**Goal**: 그래프 노드 텍스트의 스타일이 CSS 변수 시스템으로 관리되고, 모든 노드 타입에서 WCAG AA 대비율을 충족한다
**Depends on**: Nothing (first phase)
**Requirements**: CSS-01, CSS-02, CSS-03
**Success Criteria** (what must be TRUE):
  1. style.css에 `--graph-label-size`, `--graph-sub-size`, `--graph-meta-size` 변수가 존재하고 GraphCanvas에서 참조된다
  2. infra/dns 노드에 인라인 `fill:rgba(...)` 스타일이 없고, CSS 변수로 대체되어 있다
  3. node-meta 텍스트가 어두운 배경/밝은 배경 모두에서 WCAG AA 대비율(4.5:1 이상)을 충족한다
**Plans:** 1/1 plans complete
**UI hint**: yes

Plans:
- [x] 01-01-PLAN.md -- CSS 변수 추가, 인라인 스타일 제거, WCAG 대비율 개선, 스타일 가이드 업데이트

### Phase 2: Font Size & Spacing
**Goal**: 노드 텍스트가 캔버스에서 즉시 읽히고, 5종 노드 모두에서 텍스트가 노드 경계 안에 깔끔하게 배치된다
**Depends on**: Phase 1
**Requirements**: FONT-01, FONT-02, FONT-03, FONT-04, FONT-05
**Success Criteria** (what must be TRUE):
  1. 1행(node-label) 텍스트가 기존(11px)보다 눈에 띄게 크고 서버 이름이 한눈에 읽힌다
  2. 2행(node-sub)과 3행(node-meta) 텍스트가 기존(9px/9.5px)보다 크고 부가 정보를 쉽게 파악할 수 있다
  3. 3행 텍스트가 행간 조정으로 답답하지 않게 배치되어 있다
  4. server, l7, infra, external, dns 5종 노드 모두에서 텍스트가 노드 경계(187x74) 내에 위치한다
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 02-01: TBD

### Phase 3: Smart Truncation
**Goal**: 한글/영문/숫자 혼합 텍스트가 실제 렌더링 너비 기준으로 정확하게 잘리고, 노드 경계를 초과하지 않는다
**Depends on**: Phase 2
**Requirements**: TRUNC-01, TRUNC-02, TRUNC-03, TRUNC-04
**Success Criteria** (what must be TRUE):
  1. 긴 한글 서버 이름과 긴 영문 서버 이름 모두 노드 경계를 넘지 않고 말줄임("...")으로 잘린다
  2. 한글/영문/숫자 혼합 텍스트(예: "프로덕션-api-server-01")가 노드 폭에 맞게 정확히 잘린다
  3. 페이지 로드 직후에도 텍스트 잘림이 올바르게 적용된다 (폰트 로딩 레이스 컨디션 없음)
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 03-01: TBD

### Phase 4: Export Sync
**Goal**: 그래프 내보내기(SVG/PNG) 결과물이 캔버스에서 보이는 것과 동일한 텍스트 스타일을 가진다
**Depends on**: Phase 1, Phase 2, Phase 3
**Requirements**: EXPORT-01
**Success Criteria** (what must be TRUE):
  1. exportGraph()로 내보낸 SVG/PNG에서 노드 텍스트 크기, 간격, 잘림이 캔버스 화면과 동일하다
  2. export 스타일 블록에 하드코딩된 값이 없고 Phase 1-3의 변경 사항이 모두 반영되어 있다
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. CSS Foundation | 1/1 | Complete   | 2026-04-02 |
| 2. Font Size & Spacing | 0/0 | Not started | - |
| 3. Smart Truncation | 0/0 | Not started | - |
| 4. Export Sync | 0/0 | Not started | - |
