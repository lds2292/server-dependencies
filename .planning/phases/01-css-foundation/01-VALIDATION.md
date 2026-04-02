---
phase: 1
slug: css-foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-02
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | grep-based static checks (no test runner needed) |
| **Quick run command** | `grep -q '\-\-graph-label-size' client/src/style.css` |
| **Full suite command** | See per-task automated commands below |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run per-task `<automated>` grep checks
- **After every plan wave:** Run all grep checks + `cd client && npx vue-tsc --noEmit`
- **Before `/gsd:verify-work`:** All automated checks green + manual visual check
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | CSS-01 | grep | `grep -q '\-\-graph-label-size' client/src/style.css` | N/A (grep) | ⬜ pending |
| 01-01-02 | 01 | 1 | CSS-02 | grep | `! grep -q 'style="fill:rgba' client/src/components/GraphCanvas.vue` | N/A (grep) | ⬜ pending |
| 01-01-03 | 01 | 1 | CSS-03 | grep+manual | `grep -q 'node-light-text-muted' client/src/style.css` + manual contrast check | N/A (grep) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing infrastructure covers CSS variable checks via grep
- [x] No additional test framework needed for Phase 1 (CSS variable and inline style verification)

*Existing grep infrastructure covers all phase requirements. No Wave 0 test file creation needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WCAG AA contrast ratio on dark/light backgrounds | CSS-03 | Requires visual rendering context and computed color values | 1. Open graph with infra/dns nodes 2. Use browser DevTools contrast checker 3. Verify ratio >= 4.5:1 for all node-meta text |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
