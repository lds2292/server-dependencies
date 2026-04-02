# Pitfalls Research: SVG Node Text Readability

**Date:** 2026-04-02
**Confidence:** HIGH

## Critical Pitfalls

### P1: Character-Count Truncation Ignoring Rendered Width
- **Issue**: `truncate(text, 20)` treats Korean and Latin characters as equal width. Korean chars are ~1.6x wider.
- **Warning signs**: Korean server names overflow node boundaries; Latin names are truncated too early.
- **Prevention**: Use Canvas `measureText()` to calculate actual pixel width before truncating.
- **Phase**: Must address in truncation improvement phase.

### P2: Export Fidelity -- Hardcoded Style Block
- **Issue**: `exportGraph()` has a separate copy of text CSS at line ~2244-2247. Changes to scoped CSS won't automatically propagate.
- **Warning signs**: Exported PNG/SVG shows different font sizes than canvas.
- **Prevention**: Update export style block immediately after changing scoped CSS. Add a comment linking the two locations.
- **Phase**: Must be part of every CSS change phase.

### P3: dy Attribute Fragility
- **Issue**: Current vertical positions (dy=-9, 6, 19) are tuned for 11px/9px/9.5px fonts. Changing font sizes without adjusting dy will cause text overlap or misalignment.
- **Warning signs**: Text lines overlap, text extends below node boundary.
- **Prevention**: Recalculate dy values whenever font sizes change. Test with all 5 node types.
- **Phase**: Must accompany font size changes.

### P4: SVG Text Cannot Use CSS text-overflow
- **Issue**: SVG `<text>` elements don't support `text-overflow: ellipsis`. Truncation must be done in JavaScript before rendering.
- **Warning signs**: Attempting CSS ellipsis on SVG text has no effect.
- **Prevention**: Accept this limitation. All truncation logic must be in the `truncate()` function.
- **Phase**: Awareness -- don't waste time trying CSS solutions.

## Moderate Pitfalls

### P5: getComputedTextLength() Returns 0 for Unmounted Elements
- **Issue**: If text measurement is attempted before SVG elements are in DOM, returns 0.
- **Warning signs**: All text appears truncated to empty or shows "..." only.
- **Prevention**: Use Canvas `measureText()` instead (works without DOM).
- **Phase**: Truncation implementation.

### P6: Font Loading Race Condition
- **Issue**: If Pretendard (or other custom font) hasn't loaded when `measureText()` is called, measurements use fallback font widths.
- **Warning signs**: Text truncation is inconsistent on first load vs subsequent loads.
- **Prevention**: Use `document.fonts.ready` promise before first measurement, or use heuristic widths as fallback.
- **Phase**: Truncation implementation.

### P7: Performance with Per-Node Text Measurement
- **Issue**: Calling `measureText()` for every text line on every render could slow down with 100+ nodes.
- **Warning signs**: Lag when panning/zooming with many nodes.
- **Prevention**: Measure only when node data changes (not on every frame). Cache measurements. Canvas `measureText()` is fast (~0.003ms per call), so 300 nodes = ~1ms total.
- **Phase**: Truncation implementation -- build with caching from the start.

### P8: Cross-Browser Font Rendering Width Differences
- **Issue**: Same font/size renders 1-3px differently across Chrome, Firefox, Safari.
- **Warning signs**: Text fits in Chrome but overflows in Firefox.
- **Prevention**: Add 5-10px safety margin to available text width. Don't truncate at exact boundary.
- **Phase**: Testing phase.

### P9: Zoom-Level Text Awareness
- **Issue**: Even with larger fonts, text becomes unreadable at low zoom levels.
- **Warning signs**: Users zoomed out on large graphs can't read any node text.
- **Prevention**: Out of scope for now, but design truncation API to be zoom-aware for future use.
- **Phase**: Future -- not current scope.

## Minor Pitfalls

### P10: Ellipsis Character Width Not Reserved
- **Issue**: When truncating, the "..." (or "...") takes up ~8-12px that should be reserved from available width.
- **Warning signs**: Truncated text + ellipsis overflows node boundary.
- **Prevention**: Subtract ellipsis width from available space before measuring.
- **Phase**: Truncation implementation.

### P11: x=-52 Position Constant Should Not Change
- **Issue**: Text start position `x=-52` is relative to the icon separator line. Changing this breaks alignment.
- **Warning signs**: Text overlaps with icon area or has uneven left margin.
- **Prevention**: Keep x=-52 unchanged. Only modify dy (vertical) and font-size.
- **Phase**: Awareness.

### P12: Hardcoded Inline fill:rgba() on infra/dns Nodes
- **Issue**: Lines 302-303 and 310-311 have inline `style="fill:rgba(15,23,42,...)"` that bypass CSS variable system.
- **Warning signs**: Violates project style guide. Colors won't respond to theme changes.
- **Prevention**: Replace with CSS variables (`--graph-text-dark`, `--graph-text-dark-sub`).
- **Phase**: CSS cleanup phase.

## Phase-Specific Warnings

| Phase | Watch For |
|-------|-----------|
| CSS Variables | Don't modify `--text-xs` -- it's used elsewhere. Create new variables. |
| Font Size Changes | Always update dy values in the same commit. Always update export block. |
| Truncation | Use Canvas measureText, not getComputedTextLength. Reserve ellipsis width. |
| Testing | Check all 5 node types. Check Korean + English names. Check export output. |

---
*Research: 2026-04-02*
