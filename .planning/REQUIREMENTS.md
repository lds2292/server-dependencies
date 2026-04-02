# Requirements: Node Text Readability

**Defined:** 2026-04-02
**Core Value:** 노드 이름이 캔버스에서 즉시 읽히는 것

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### CSS Foundation

- [ ] **CSS-01**: 그래프 전용 CSS 변수 추가 (`--graph-label-size`, `--graph-sub-size`, `--graph-meta-size`)
- [ ] **CSS-02**: infra/dns 노드의 인라인 `fill:rgba(...)` 스타일을 CSS 변수로 대체
- [ ] **CSS-03**: node-meta opacity를 WCAG AA 대비율(4.5:1 이상)을 충족하도록 조정

### Font Size & Spacing

- [ ] **FONT-01**: 1행(node-label) 폰트 크기를 12-13px로 증가하여 서버 이름 명확화
- [ ] **FONT-02**: 2행(node-sub) 폰트 크기를 10-11px로 증가
- [ ] **FONT-03**: 3행(node-meta) 폰트 크기를 10px으로 증가
- [ ] **FONT-04**: dy 값(-9, 6, 19)을 새 폰트 크기에 맞게 재계산하여 행간 최적화
- [ ] **FONT-05**: 모든 5종 노드 타입(server, l7, infra, external, dns)에서 텍스트가 노드 경계 내에 위치

### Smart Truncation

- [ ] **TRUNC-01**: Canvas `measureText()`를 사용한 너비 기반 텍스트 잘림 함수 구현
- [ ] **TRUNC-02**: 한글/영문/숫자 혼합 텍스트에서 노드 경계를 초과하지 않도록 정확한 잘림
- [ ] **TRUNC-03**: 말줄임("...") 너비를 잘림 계산에 포함
- [ ] **TRUNC-04**: 폰트 로딩 완료 후 측정하도록 보장 (레이스 컨디션 방지)

### Export Sync

- [ ] **EXPORT-01**: exportGraph() 스타일 블록을 새 CSS 값과 동기화

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Zoom Adaptation

- **ZOOM-01**: 줌 레벨에 따라 2행/3행 텍스트 숨김/표시 (줌아웃 시 1행만 표시)
- **ZOOM-02**: 줌 레벨별 폰트 크기 자동 조절

### Advanced Truncation

- **ATRUNC-01**: IP 주소 중간 잘림 (`10.0...100`)
- **ATRUNC-02**: 3행 메타 텍스트에 모노스페이스 폰트 적용

## Out of Scope

| Feature | Reason |
|---------|--------|
| 노드 크기 변경 (187x74) | D3 force simulation 안정성, 프로젝트 제약 |
| foreignObject 텍스트 | 크로스 브라우저 이슈 (Safari), SVG export 호환성 |
| 리치 텍스트 (볼드/링크) | 서버 토폴로지 식별에 불필요한 복잡도 |
| 동적 줌 스케일링 | 100+ 노드에서 성능 리스크, v2로 검토 |
| 가변 크기 노드 | force simulation 충돌 감지 복잡도 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CSS-01 | Phase 1 | Pending |
| CSS-02 | Phase 1 | Pending |
| CSS-03 | Phase 1 | Pending |
| FONT-01 | Phase 2 | Pending |
| FONT-02 | Phase 2 | Pending |
| FONT-03 | Phase 2 | Pending |
| FONT-04 | Phase 2 | Pending |
| FONT-05 | Phase 2 | Pending |
| TRUNC-01 | Phase 3 | Pending |
| TRUNC-02 | Phase 3 | Pending |
| TRUNC-03 | Phase 3 | Pending |
| TRUNC-04 | Phase 3 | Pending |
| EXPORT-01 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
