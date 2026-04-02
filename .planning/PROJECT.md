# Node Text Readability Improvement

## What This Is

서버 토폴로지 에디터(GraphCanvas)의 노드 내부 텍스트 가독성을 개선하는 프로젝트. 현재 노드 텍스트(특히 서버 이름)가 작아서 한눈에 파악하기 어려운 문제를 해결한다. 노드 크기(187x74px)는 유지하면서 텍스트 크기, 행간, 잘림 처리를 개선한다.

## Core Value

노드 이름이 캔버스에서 즉시 읽히는 것. 줌아웃 상태에서도 서버 이름을 빠르게 식별할 수 있어야 한다.

## Requirements

### Validated

- [x] CSS 변수 시스템으로 그래프 노드 텍스트 스타일 관리 (Validated in Phase 1: CSS Foundation)
- [x] infra/dns 노드 인라인 스타일 제거, CSS 변수로 대체 (Validated in Phase 1: CSS Foundation)
- [x] node-meta WCAG AA 4.5:1 대비율 충족 (Validated in Phase 1: CSS Foundation)

### Active

- [ ] 1행(node-label) 폰트 크기를 키워 서버 이름이 더 명확하게 보이도록 개선
- [ ] 2행(node-sub) 폰트 크기를 키워 부가 정보(팀명, 타입 등) 가독성 향상
- [ ] 3행(node-meta) 폰트 크기를 키워 메타 정보(IP, host:port 등) 가독성 향상
- [ ] 3행 간 행간(dy) 조정으로 텍스트가 답답하지 않게 배치
- [ ] 글자 수 기준 truncate를 실제 렌더링 너비 고려 방식으로 개선 (한글/영문 혼합 대응)

### Out of Scope

- 노드 크기(187x74px) 변경 -- 현재 크기 유지가 전제 조건
- 가변 크기 노드 -- D3 force simulation 충돌 감지 복잡도 증가
- 연결 핸들/포트 힌트 -- 별도 프로젝트
- 연결선 베지어 커브 -- 별도 프로젝트
- hover 툴팁 개선 -- 이미 구현되어 있고 이번 범위 아님

## Context

- `GraphCanvas.vue`가 2,746줄의 핵심 컴포넌트로, 노드 렌더링/인터랙션 전체를 담당
- 현재 텍스트 스펙: 1행 11px bold 700, 2행 9px bold 600 (opacity 0.65), 3행 9.5px (opacity 0.5)
- 행 위치: dy=-9, 6, 19 (행간 약 15px)
- 텍스트 잘림: `truncate(text, 20)` -- 글자 수 기준, 한글/영문 너비 차이 미반영
- 텍스트 시작점: x=-52 (아이콘 구분선 우측), text-anchor="start"
- 노드 5종(server, l7, infra, external, dns) 모두 같은 레이아웃 공유
- infra/dns는 밝은 배경에 어두운 텍스트, 나머지는 어두운 배경에 흰색 텍스트
- 스타일 가이드: CSS 변수 필수, 색상 하드코딩 금지 (`docs/guide/style_guide.md`)

## Constraints

- **CSS 변수**: 폰트 크기 변경 시 `style.css`의 CSS 변수 시스템 사용 필수
- **노드 크기**: 187x74px 유지 -- 텍스트는 이 영역 안에서 개선
- **5종 노드 일관성**: 모든 노드 타입에 동일한 텍스트 레이아웃 규칙 적용
- **SVG 렌더링**: foreignObject 없이 순수 SVG text 요소 사용 (현재 방식 유지)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 노드 크기 유지 (187x74) | D3 force simulation 안정성, 기존 레이아웃 호환 | -- Pending |
| SVG 순수 텍스트 유지 | foreignObject는 D3 zoom/drag와 호환성 이슈 가능 | -- Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check -- still the right priority?
3. Audit Out of Scope -- reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-03 after Phase 1 completion*
