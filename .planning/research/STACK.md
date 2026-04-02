# Stack Research: SVG Node Text Readability

**Date:** 2026-04-02
**Confidence:** HIGH

## SVG Text Rendering Techniques

### Font Sizing

- **Minimum readable size in SVG**: 10px at 1x zoom. Below this, anti-aliasing artifacts make text illegible.
- **Current project**: 9px (node-sub) and 9.5px (node-meta) are below this threshold.
- **Recommendation**: Minimum 10px for all text, 12-13px for primary labels.
- **Confidence**: HIGH -- well-established typography standard.

### text-rendering Attribute

- `text-rendering: optimizeLegibility` -- improves kerning/ligatures but slower.
- `text-rendering: geometricPrecision` -- AVOID. Causes text to scale non-uniformly with SVG transforms on some browsers.
- **Recommendation**: Use `optimizeLegibility` on node text groups, or leave as default (`auto`).
- **Confidence**: HIGH.

### Font Choice

- **Proportional fonts** (Inter, Pretendard): Better for names, labels. More readable at small sizes.
- **Monospace fonts** (JetBrains Mono, Fira Code): Better for IPs, host:port, technical identifiers.
- **Recommendation**: Proportional for label/sub rows, monospace for meta row (IPs, ports).
- **Confidence**: MEDIUM -- depends on aesthetic preference.

## Truncation Approach

### Current: Character Count (`truncate(text, 20)`)

- **Problem**: Korean characters are ~1.6x wider than Latin. 20 Korean chars overflow; 20 Latin chars are truncated too early.
- **Problem**: SVG text has no CSS `text-overflow: ellipsis` support.

### Option A: Canvas measureText() (Recommended)

- Create offscreen canvas, set font, measure text width in pixels.
- Synchronous, fast (<1ms for 300+ measurements), no DOM dependency.
- Works before SVG text is rendered (compatible with Vue declarative model).
- **Confidence**: HIGH.

### Option B: getComputedTextLength()

- Requires text element to be in DOM first.
- Returns 0 for unmounted elements.
- Fights Vue's declarative rendering model (need to render, measure, re-render).
- **Confidence**: LOW -- not recommended for this use case.

### Option C: Heuristic Width Estimation

- Assign width multiplier per character range (Latin ~0.6, CJK ~1.0, digits ~0.55).
- Fast, no DOM/canvas needed. Less accurate but good enough for truncation.
- **Confidence**: MEDIUM -- fallback if Canvas approach has issues.

## CSS Variables Strategy

- Current `--text-xs` (11px) is shared across the entire UI.
- Graph text needs independent variables to avoid side effects.
- **Recommendation**: Add dedicated CSS variables:
  - `--graph-label-size` (12-13px)
  - `--graph-sub-size` (10-11px)
  - `--graph-meta-size` (10px)
- **Confidence**: HIGH.

## foreignObject vs Pure SVG Text

- **foreignObject**: Allows HTML/CSS inside SVG. Supports `text-overflow: ellipsis`, rich formatting.
- **Problems**: Inconsistent cross-browser (especially Safari), breaks D3 zoom/drag in some cases, complicates SVG export.
- **Recommendation**: Stay with pure SVG text. The readability problems are solvable without foreignObject.
- **Confidence**: HIGH.

---
*Research: 2026-04-02*
