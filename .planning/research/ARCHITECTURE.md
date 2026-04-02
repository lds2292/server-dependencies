# Architecture Research: SVG Node Text Readability

**Date:** 2026-04-02
**Confidence:** HIGH

## Key Findings

### Zero D3 Impact
Text rendering is purely visual. Changing font sizes, dy offsets, and truncation logic has **no effect** on the force simulation, collision detection, or node positioning. Node dimensions (187x74) remain unchanged, so D3's `forceCollide()` radius stays the same.

### Export Requires Synchronized Update
`exportGraph()` at GraphCanvas.vue line ~2242-2248 has a **hardcoded copy** of text CSS styles:

```javascript
`.node-label { font-size: var(--text-xs); fill: #fff; font-weight: 700; }`,
`.node-sub   { font-size: 9px;  fill: rgba(255,255,255,0.65); font-weight: 600; }`,
`.node-meta  { font-size: 9.5px; fill: rgba(255,255,255,0.5); }`,
```

Any font size change MUST be mirrored in this export block, or exported SVG/PNG will show old sizes.

### Canvas measureText is the Right Truncation Approach
- `getComputedTextLength()` requires DOM-rendered text (fights Vue's declarative model)
- Canvas `measureText()` is synchronous, off-screen, handles 300+ measurements in <1ms
- Create a shared offscreen canvas, set font once per render cycle, measure all node texts

### CSS Variables Need New Dedicated Entries
- Current `--text-xs` (11px) is shared across the entire UI
- Graph text needs independent variables to avoid side effects elsewhere:
  - `--graph-label-size` -- node name
  - `--graph-sub-size` -- secondary info
  - `--graph-meta-size` -- technical identifiers

### Inline Style Debt on infra/dns Nodes
Lines 302-303 and 310-311 have hardcoded `fill:rgba(...)` that override CSS classes:
```html
style="fill:rgba(15,23,42,0.65)"
style="fill:rgba(15,23,42,0.5)"
```
These bypass the CSS variable system. Should be addressed during this pass by creating CSS variables for light-node text colors.

## Component Boundaries

| Component | What Changes | Risk |
|-----------|-------------|------|
| `style.css` | New CSS variables for graph text sizes | Zero -- pure addition |
| `GraphCanvas.vue` template (294-316) | Font size classes, dy values | Low -- visual only |
| `GraphCanvas.vue` scoped CSS (2322-2325) | Font size values, opacity | Low -- visual only |
| `GraphCanvas.vue` truncate function (1109) | Width-aware logic | Medium -- affects all node text |
| `GraphCanvas.vue` export block (2242-2248) | Mirror CSS changes | Low -- but easy to forget |

## Build Order

1. **Step 1**: Add CSS variables to `style.css` (zero risk, pure addition)
2. **Steps 2-4** (parallel):
   - Width-aware truncation function
   - dy offset adjustments in template
   - Scoped CSS font size updates
3. **Step 5**: Sync export style block (MUST follow Step 4)
4. **Step 6**: Remove hardcoded inline fills on infra/dns nodes

## Anti-Patterns to Avoid

- **Don't use `getComputedTextLength()`** -- requires rendered elements, incompatible with Vue reactivity
- **Don't modify node dimensions** -- breaks force simulation collision detection
- **Don't use `text-rendering: geometricPrecision`** -- causes scaling artifacts in WebKit
- **Don't add foreignObject** -- breaks SVG export and has cross-browser issues

---
*Research: 2026-04-02*
