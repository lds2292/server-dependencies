# Features Research: SVG Node Text Readability

**Date:** 2026-04-02
**Confidence:** MEDIUM

## Table Stakes (Must Have)

### Readable Font Sizes

- **Complexity**: Low
- **Current gap**: 9px/9.5px sub/meta text is below readable threshold
- **Standard**: Every comparable editor (Node-RED, n8n, draw.io) uses 11px+ minimum
- **Dependencies**: None

### Width-Aware Text Truncation
- **Complexity**: Medium
- **Current gap**: `truncate(text, 20)` counts characters, not rendered width
- **Standard**: All editors handle variable-width text properly
- **Dependencies**: Needs font measurement utility

### Adequate Contrast
- **Complexity**: Low
- **Current gap**: node-meta at 50% opacity white fails WCAG AA 3:1 contrast ratio
- **Standard**: WCAG AA minimum 3:1 for large text, 4.5:1 for normal text
- **Dependencies**: CSS variable cleanup

### CSS Variable Compliance
- **Complexity**: Low
- **Current gap**: Hardcoded `rgba(255,255,255,0.65)` and `rgba(15,23,42,0.65)` inline in GraphCanvas.vue
- **Standard**: Project style guide mandates CSS variables for all colors
- **Dependencies**: New graph-specific CSS variables

## Differentiators (Competitive Advantage)

### Zoom-Adaptive Text Display
- **Complexity**: High
- **Description**: Hide sub/meta lines at low zoom, show only label. Reveal details at higher zoom.
- **Competitors**: No SVG graph editor does this well. Figma does it via WebGL.
- **Dependencies**: Phases 1-2 complete
- **Recommendation**: Defer to future -- high value but high complexity

### Monospace for Technical Values
- **Complexity**: Low
- **Description**: IPs, host:port, record values in monospace font for technical precision
- **Competitors**: draw.io uses monospace for code nodes; most editors don't differentiate
- **Dependencies**: Font availability

### Smart Ellipsis Positioning
- **Complexity**: Medium
- **Description**: For IPs like `10.0.1.100`, truncate middle instead of end: `10.0...100`
- **Competitors**: Rare in graph editors
- **Dependencies**: Width-aware truncation

## Anti-Features (Don't Build)

### Auto-Sizing Nodes
- **Why not**: Breaks D3 force simulation collision detection, violates project constraint (187x74 fixed)

### foreignObject Text
- **Why not**: Cross-browser inconsistency (Safari), breaks SVG export, D3 zoom issues

### Rich Text in Nodes
- **Why not**: Massive complexity, not needed for server topology identification

### Dynamic Font Scaling with Zoom
- **Why not**: Requires recalculating all text on every zoom event, performance risk with 100+ nodes

---
*Research: 2026-04-02*
