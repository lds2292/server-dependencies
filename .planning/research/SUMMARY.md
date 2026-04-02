# Research Summary: Node Text Readability

**Date:** 2026-04-02

## Executive Summary

노드 내부 텍스트 가독성 문제는 해결 가능하며, 노드 크기(187x74)를 유지하면서 순수 SVG 텍스트 방식으로 개선할 수 있다. D3 force simulation에 영향 없음.

## Key Findings

**Stack:**
- Canvas `measureText()`가 너비 기반 잘림에 최적 (동기, <1ms for 300+ nodes)
- foreignObject는 불필요 -- 순수 SVG text로 충분
- 그래프 전용 CSS 변수 필요 (`--graph-label-size` 등)

**Table Stakes:**
- 최소 10px 폰트 (현재 9px/9.5px는 가독성 기준 미달)
- 너비 기반 텍스트 잘림 (한글/영문 혼합 대응)
- WCAG AA 대비율 준수 (현재 node-meta 50% opacity 미달)
- CSS 변수 시스템 준수 (현재 인라인 rgba 위반)

**Watch Out For:**
- Export 스타일 블록 동기화 필수 (line ~2244 별도 복사본)
- dy 값은 폰트 크기와 반드시 함께 조정
- `getComputedTextLength()` 사용 금지 -- Vue 선언적 모델과 충돌
- 폰트 로딩 레이스 컨디션 주의

## Recommended Approach

1. **CSS 변수 추가** (zero risk) -- style.css에 그래프 전용 변수
2. **폰트 크기/간격 조정** -- 1행 12-13px, 2행 10-11px, 3행 10px, dy 재계산
3. **너비 기반 truncate** -- Canvas measureText로 실제 픽셀 너비 측정
4. **인라인 스타일 정리** -- infra/dns 노드의 hardcoded rgba를 CSS 변수로
5. **Export 동기화** -- 모든 CSS 변경을 export 블록에 반영

## Roadmap Implications

- 범위가 작고 집중적 -- Standard 단위(5-8 phases)보다는 Coarse(3-5 phases)에 가까움
- 모든 변경이 GraphCanvas.vue + style.css에 집중
- 병렬 작업 가능: CSS 변수 추가 후, 폰트 조정/truncate/정리를 동시 진행

---
*Research summary: 2026-04-02*