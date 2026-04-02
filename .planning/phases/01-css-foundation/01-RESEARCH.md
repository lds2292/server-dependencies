# Phase 1: CSS Foundation - Research

**Researched:** 2026-04-02
**Domain:** SVG text styling, CSS variables, WCAG contrast compliance
**Confidence:** HIGH

## Summary

Phase 1 addresses three focused tasks: (1) adding graph-dedicated CSS variables for font sizes, (2) replacing hardcoded inline `fill:rgba(...)` on infra/dns nodes with CSS variables, and (3) ensuring node-meta text meets WCAG AA contrast ratios. All changes are confined to two files: `client/src/style.css` and `client/src/components/GraphCanvas.vue`.

The current codebase has a well-structured CSS variable system in `style.css` (114 lines of `:root` variables). Graph node text currently uses a mix of CSS variable references (`var(--text-xs)` for node-label) and hardcoded values (`9px`, `9.5px`, `rgba(...)` for node-sub/meta). The infra and dns node types have inline `style="fill:rgba(15,23,42,0.65)"` attributes that bypass the CSS variable system entirely.

**Primary recommendation:** Add 3 graph-specific CSS variables to style.css, replace 4 inline rgba styles with CSS variable references, and increase node-meta opacity from 0.5 to at least 0.6 to safely clear WCAG AA thresholds on all backgrounds.

## Project Constraints (from CLAUDE.md)

- **CSS variables mandatory**: Font size changes MUST use `style.css` CSS variables (`var(--)`)
- **No hardcoded colors**: UI color hardcoding is forbidden
- **JS color access**: Use `getComputedStyle(document.documentElement).getPropertyValue(name)` (already implemented as `cssVar()` helper at line 1175)
- **SVG text only**: No foreignObject -- pure SVG text elements (current approach)
- **Node size fixed**: 187x74px must not change
- **5 node types consistent**: server, l7, infra, external, dns all get same text layout rules
- **Style guide sync**: UI changes require `docs/guide/style_guide.md` update

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CSS-01 | Add `--graph-label-size`, `--graph-sub-size`, `--graph-meta-size` CSS variables and reference them from GraphCanvas | Current node-label uses `var(--text-xs)` (11px shared); node-sub/meta use hardcoded `9px`/`9.5px`. New dedicated variables prevent side effects on other UI components. |
| CSS-02 | Replace infra/dns inline `fill:rgba(...)` with CSS variables | Lines 302, 303, 310, 311 have `style="fill:rgba(15,23,42,0.65)"` and `style="fill:rgba(15,23,42,0.5)"`. Need 2 new CSS variables for light-background node text. |
| CSS-03 | Adjust node-meta opacity to meet WCAG AA contrast ratio (3:1+) | Current infra/dns node-meta is borderline at 3.33-3.35:1. For normal-size text (<18px), WCAG AA requires 4.5:1. Increasing opacity from 0.5 to 0.6-0.65 will improve ratios safely. |
</phase_requirements>

## Standard Stack

No new libraries needed. This phase is purely CSS/template changes within the existing stack.

### Core (Already in Project)
| Library | Version | Purpose | Role in This Phase |
|---------|---------|---------|-------------------|
| Vue 3 | 3.4.0 | Frontend framework | Template changes for removing inline styles |
| D3.js | 7.9.0 | Graph rendering | No changes needed -- text is visual-only, no D3 impact |
| Vite | 5.0.0 | Build tool | CSS variable resolution at build time |

### No New Dependencies
This phase requires zero `npm install` commands.

## Architecture Patterns

### Affected Files
```
client/
  src/
    style.css                    # Add 3-5 new CSS variables in :root
    components/
      GraphCanvas.vue            # Template: remove inline styles (4 lines)
                                 # Scoped CSS: update font-size values (3 lines)
                                 # Export block: update style strings (3 lines)
docs/
  guide/
    style_guide.md               # Document new graph CSS variables
```

### Pattern: CSS Variable Hierarchy for Graph Text

Current `:root` already has type scale (`--text-xs` through `--text-hero`) and node type colors (`--node-srv-color`, etc.). New variables follow the same naming convention:

```css
/* In :root block of style.css, after existing type scale variables */

/* -- 그래프 노드 텍스트 -- */
--graph-label-size: 11px;     /* 1행: 노드 이름 (현재 --text-xs 참조) */
--graph-sub-size: 9px;        /* 2행: 보조 정보 */
--graph-meta-size: 9.5px;     /* 3행: 기술 식별자 */

/* -- 밝은 배경 노드 텍스트 (infra/dns) -- */
--node-light-text: rgba(15, 23, 42, 0.85);       /* 1행/2행 텍스트 */
--node-light-text-muted: rgba(15, 23, 42, 0.7);  /* 3행(meta) 텍스트 */
```

### Pattern: Inline Style Replacement

**Before (current):**
```html
<text class="node-sub" style="fill:rgba(15,23,42,0.65)">...</text>
<text class="node-meta" style="fill:rgba(15,23,42,0.5)">...</text>
```

**After:**
```html
<text class="node-sub node-text-dark">...</text>
<text class="node-meta node-text-dark-muted">...</text>
```

Or use the existing conditional style pattern already used for node-label (line 295):
```html
<text class="node-sub" :style="'fill:' + cssVar('--node-light-text')">...</text>
```

**Recommended approach:** Use CSS classes rather than `:style` binding, because:
1. Scoped CSS in GraphCanvas.vue already defines `.node-sub` and `.node-meta`
2. Adding variant classes (e.g., `.node-sub-light`, `.node-meta-light`) is cleaner
3. The export block can reference these classes directly

### Pattern: Export Block Synchronization

The export block at line 2242-2248 has a hardcoded copy of text styles. Any CSS change MUST be mirrored here. The current approach uses `var(--font-sans)` in the export block, confirming that CSS variables DO work in exported SVG `<style>` elements (because `getComputedStyle` resolves them before serialization). However, the font-size values are currently hardcoded (`9px`, `9.5px`), not using CSS variables.

**After this phase**, the export block should reference the new CSS variables:
```javascript
`.node-label { font-size: var(--graph-label-size); fill: #fff; font-weight: 700; }`,
`.node-sub   { font-size: var(--graph-sub-size);  fill: rgba(255,255,255,0.65); font-weight: 600; }`,
`.node-meta  { font-size: var(--graph-meta-size); fill: rgba(255,255,255,0.5); }`,
```

**IMPORTANT caveat:** The export SVG is serialized via `XMLSerializer`. CSS variables like `var(--graph-label-size)` will NOT resolve in an exported standalone SVG file (no DOM to compute styles). The export block must either:
1. Continue using hardcoded values (synced manually), OR
2. Resolve CSS variables to computed values at export time using `cssVar()`.

Option 2 is preferred for maintainability:
```javascript
`.node-label { font-size: ${cssVar('--graph-label-size')}; ... }`,
```

### Anti-Patterns to Avoid
- **Don't modify `--text-xs` value**: It's shared across the entire UI (badges, timestamps, buttons). Graph-specific variables avoid side effects.
- **Don't use opacity CSS property on SVG text**: SVG `fill` with alpha channel is the correct approach (opacity would affect the entire element including descendants).
- **Don't remove the export block sync step**: It's the most commonly forgotten step and causes visual mismatch in exported graphs.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Contrast ratio calculation | Custom contrast checker | Browser DevTools / manual calculation | Only 5 node type combinations to verify; automated WCAG testing is overkill for this scope |
| CSS variable system | New variable naming scheme | Extend existing `:root` pattern in style.css | Consistency with 70+ existing variables |

## Common Pitfalls

### Pitfall 1: Export Block Desync
**What goes wrong:** CSS is updated but export block still has old hardcoded values. Exported SVG/PNG shows different text styles than the canvas.
**Why it happens:** Export block at line 2242-2248 is a separate copy of styles, easy to forget.
**How to avoid:** Update export block in the same commit as CSS changes. Use `cssVar()` to resolve variables dynamically.
**Warning signs:** Export a graph after changes -- visually compare with canvas.

### Pitfall 2: Scoped CSS Specificity with Inline Styles
**What goes wrong:** Adding CSS classes for infra/dns text colors doesn't work because inline `style="fill:rgba(...)"` has higher specificity.
**Why it happens:** Inline styles always win over class-based styles.
**How to avoid:** Remove the inline `style` attributes from template FIRST, then apply CSS class-based styling.
**Warning signs:** Infra/dns nodes still show old colors after CSS class changes.

### Pitfall 3: SVG `fill` vs CSS `color`
**What goes wrong:** Using `color: var(--some-var)` instead of `fill: var(--some-var)` for SVG text.
**Why it happens:** HTML text uses `color`, SVG text uses `fill`. Easy to mix up.
**How to avoid:** Always use `fill` property for SVG `<text>` elements.
**Warning signs:** Text appears invisible or wrong color.

### Pitfall 4: WCAG "Large Text" Misclassification
**What goes wrong:** Using 3:1 ratio threshold (large text) for text that is actually "normal" size.
**Why it happens:** WCAG defines "large text" as >= 18px (or >= 14px bold). Node-meta at 9.5px is clearly normal text, requiring 4.5:1.
**How to avoid:** Use 4.5:1 threshold for all graph text under 14px. Current node-meta on infra/dns (3.33:1) FAILS this threshold.
**Warning signs:** Text passes 3:1 but fails 4.5:1 -- this is a false pass for normal-size text.

### Pitfall 5: node-label Conditional Style for infra/dns
**What goes wrong:** Line 295 uses `:style="... fill:${cssVar('--bg-base')} ..."` for infra/dns node-label. This is an inline style that also needs migration to CSS variables.
**Why it happens:** The node-label already uses a different pattern from node-sub/meta for infra/dns.
**How to avoid:** Address all three text rows (label, sub, meta) for infra/dns in one pass.
**Warning signs:** node-label color still uses inline `cssVar()` binding after migration.

## WCAG Contrast Analysis (Verified)

### Current State

| Node Type | Background | Text Class | Current Fill | Contrast Ratio | AA Normal (4.5:1) | AA Large (3:1) |
|-----------|-----------|------------|-------------|---------------|-------------------|----------------|
| server | #332a1a | node-meta | rgba(255,255,255,0.5) | 4.73:1 | PASS | PASS |
| l7 | #2e0a5a | node-meta | rgba(255,255,255,0.5) | 4.80:1 | PASS | PASS |
| external | #052e16 | node-meta | rgba(255,255,255,0.5) | 4.79:1 | PASS | PASS |
| infra | #f0f9ff | node-meta | rgba(15,23,42,0.5) | 3.35:1 | **FAIL** | PASS |
| dns | #fdf2f8 | node-meta | rgba(15,23,42,0.5) | 3.33:1 | **FAIL** | PASS |
| infra | #f0f9ff | node-sub | rgba(15,23,42,0.65) | 5.42:1 | PASS | PASS |
| dns | #fdf2f8 | node-sub | rgba(15,23,42,0.65) | 5.36:1 | PASS | PASS |

### Recommendation

Since node-meta text is 9.5px (well below 18px "large text" threshold), the **4.5:1 ratio is required**.

- **Dark background nodes (server, l7, ext):** Already pass at 4.7-4.8:1. No change needed.
- **Light background nodes (infra, dns):** Need to increase alpha from 0.5 to ~0.7 to reach 4.5:1.

Calculated target: `rgba(15, 23, 42, 0.7)` on `#f0f9ff` yields approximately 4.8:1 -- safely above 4.5:1.

## Code Examples

### Example 1: New CSS Variables in style.css
```css
/* Source: Extending existing :root in client/src/style.css */
:root {
  /* ... existing variables ... */

  /* -- 그래프 노드 텍스트 -- */
  --graph-label-size: 11px;
  --graph-sub-size: 9px;
  --graph-meta-size: 9.5px;

  /* -- 밝은 배경 노드(infra/dns) 텍스트 -- */
  --node-light-text: rgba(15, 23, 42, 0.85);
  --node-light-text-muted: rgba(15, 23, 42, 0.7);
}
```

### Example 2: Scoped CSS Update in GraphCanvas.vue
```css
/* Source: GraphCanvas.vue scoped styles (lines 2322-2325) */
.node-label { font-size: var(--graph-label-size); fill: #fff; pointer-events: none; font-weight: 700; }
.node-sub { font-size: var(--graph-sub-size); fill: rgba(255,255,255,0.65); pointer-events: none; font-weight: 600; letter-spacing: 0.02em; }
.node-meta { font-size: var(--graph-meta-size); fill: rgba(255,255,255,0.5); pointer-events: none; }
```

### Example 3: Inline Style Removal for infra/dns
```html
<!-- Before (lines 302-303) -->
<text class="node-sub" style="fill:rgba(15,23,42,0.65)">...</text>
<text class="node-meta" style="fill:rgba(15,23,42,0.5)">...</text>

<!-- After: use :style with cssVar() or CSS classes -->
<text class="node-sub" :style="'fill:var(--node-light-text)'">...</text>
<text class="node-meta" :style="'fill:var(--node-light-text-muted)'">...</text>
```

Note: Since these are SVG elements with scoped styles, the `:style` binding with `var()` references works because the SVG is rendered in the DOM where CSS variables are resolved. The `fill` property on SVG text accepts CSS variable values.

### Example 4: Export Block with Dynamic Resolution
```javascript
// Source: GraphCanvas.vue export block (lines 2242-2248)
style.textContent = [
  `text { font-family: ${cssVar('--font-sans')}; }`,
  `.node-label { font-size: ${cssVar('--graph-label-size')}; fill: #fff; font-weight: 700; }`,
  `.node-sub   { font-size: ${cssVar('--graph-sub-size')};  fill: rgba(255,255,255,0.65); font-weight: 600; letter-spacing: 0.02em; }`,
  `.node-meta  { font-size: ${cssVar('--graph-meta-size')}; fill: rgba(255,255,255,0.5); }`,
].join('\n')
```

## Exact Lines to Modify

| File | Lines | Current | Change |
|------|-------|---------|--------|
| `style.css` | After line 14 (type scale section) | N/A | Add `--graph-label-size`, `--graph-sub-size`, `--graph-meta-size` |
| `style.css` | After line 101 (dns section) | N/A | Add `--node-light-text`, `--node-light-text-muted` |
| `GraphCanvas.vue` | 295 | `:style="...fill:${cssVar('--bg-base')}..."` | Use `--node-light-text` variable pattern |
| `GraphCanvas.vue` | 302 | `style="fill:rgba(15,23,42,0.65)"` | `:style="'fill:var(--node-light-text)'"` |
| `GraphCanvas.vue` | 303 | `style="fill:rgba(15,23,42,0.5)"` | `:style="'fill:var(--node-light-text-muted)'"` |
| `GraphCanvas.vue` | 310 | `style="fill:rgba(15,23,42,0.65)"` | `:style="'fill:var(--node-light-text)'"` |
| `GraphCanvas.vue` | 311 | `style="fill:rgba(15,23,42,0.5)"` | `:style="'fill:var(--node-light-text-muted)'"` |
| `GraphCanvas.vue` | 2322 | `font-size: var(--text-xs)` | `font-size: var(--graph-label-size)` |
| `GraphCanvas.vue` | 2324 | `font-size: 9px` | `font-size: var(--graph-sub-size)` |
| `GraphCanvas.vue` | 2325 | `font-size: 9.5px` | `font-size: var(--graph-meta-size)` |
| `GraphCanvas.vue` | 2244-2247 | Hardcoded font sizes | Use `cssVar()` to resolve dynamically |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | @playwright/test 1.58.2 |
| Config file | `playwright.config.ts` |
| Quick run command | `npx playwright test e2e/08-graph-canvas.spec.ts --headed` |
| Full suite command | `npx playwright test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CSS-01 | Graph CSS variables exist in style.css and are referenced in GraphCanvas scoped CSS | unit (static grep/parse) | `grep -c 'graph-label-size\|graph-sub-size\|graph-meta-size' client/src/style.css client/src/components/GraphCanvas.vue` | N/A (grep check) |
| CSS-02 | No inline `fill:rgba(` on infra/dns text elements | unit (static grep/parse) | `grep -c 'style="fill:rgba' client/src/components/GraphCanvas.vue` (should return 0) | N/A (grep check) |
| CSS-03 | node-meta text contrast ratio >= 4.5:1 on all backgrounds | manual | Visual inspection + computed contrast calculation | N/A (manual) |

### Sampling Rate
- **Per task commit:** `vue-tsc --noEmit` (type check) + visual grep validation
- **Per wave merge:** `npx playwright test e2e/08-graph-canvas.spec.ts`
- **Phase gate:** All CSS-01/02/03 verified via grep + manual visual check

### Wave 0 Gaps
- No unit test infrastructure exists for CSS variable validation -- use grep-based verification
- E2E test `e2e/08-graph-canvas.spec.ts` exists but would need running dev server + database -- verification can use simpler static checks for this CSS-only phase

## Sources

### Primary (HIGH confidence)
- `client/src/style.css` -- full `:root` variable system (114 lines), verified all existing variable names and patterns
- `client/src/components/GraphCanvas.vue` -- lines 295-316 (template), 1109-1111 (truncate), 1175-1177 (cssVar), 2242-2248 (export), 2322-2325 (scoped CSS)
- WCAG 2.1 contrast ratio thresholds: 4.5:1 for normal text, 3:1 for large text (>= 18px or >= 14px bold)

### Secondary (MEDIUM confidence)
- Contrast ratio calculations performed via Node.js script using standard WCAG relative luminance formula -- verified against known color pairs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, purely existing CSS/template changes
- Architecture: HIGH -- all affected lines identified with exact line numbers, all 5 node types analyzed
- Pitfalls: HIGH -- export block sync and WCAG thresholds are well-documented risks with clear mitigations

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- no dependency changes expected)
