# Codebase Concerns

**Analysis Date:** 2026-04-02

## Tech Debt

**Type Safety Issues - Weak Typing in Graph Data:**
- Issue: `GraphDataJson` interface uses `unknown[]` for all node arrays, allowing unsafe type casts throughout codebase
- Files: `server/src/types/index.ts`, `server/src/services/graphService.ts`, `client/src/stores/graph.ts`
- Impact: No compile-time validation of node structure. Easy to pass malformed data; runtime errors not caught until render/save. Silent failures when optional fields are missing.
- Fix approach: Create strongly-typed `Server`, `L7Node`, `InfraNode`, `ExternalNode`, `DnsNode` interfaces and use them in `GraphDataJson` instead of `unknown[]`. Add discriminated union types to force proper shape validation.

**Type Casting Anti-pattern - Excessive `as any` Usage:**
- Issue: 20+ `as any` casts in client components, particularly `GraphCanvas.vue` (25+ casts), avoiding type safety
- Files: `client/src/components/GraphCanvas.vue` (lines 199, 239, 302, 303, 1192, 1322, 1346, 2082, 2083, 2084, 2085, 2120, 2121, 2136, 2138, 2139, 2142, 2147), `client/src/components/ImpactPanel.vue`
- Impact: TypeScript provides no error detection for typos in property access, refactoring breaks silently, component becomes tightly coupled to runtime structure
- Fix approach: Create and export proper node type discriminators in `client/src/types/index.ts`. Use `node as L7Node` instead of `node as any`, with type guards. Use Vue's `defineProps<T>()` with specific types instead of generic.

**Large, Complex Components - Maintenance Risk:**
- Issue: `GraphCanvas.vue` is 2,746 lines with multiple concerns (rendering, interaction, state management, calculations)
- Files: `client/src/components/GraphCanvas.vue`
- Impact: Difficult to debug, modify, or test. High cognitive load. Performance implications for large graphs.
- Fix approach: Extract L7 member rendering to separate component, extract path calculation logic to composable, split node rendering by type into separate sub-components.

**Magic Numbers and Hardcoded Values:**
- Issue: Timeouts, intervals, sizes scattered throughout (e.g., 30min idle timeout, 5min warning, 10sec throttle)
- Files: `client/src/composables/useIdleTimeout.ts`, `client/src/stores/graph.ts` (autosave interval 30), `server/src/services/authService.ts` (30-day recovery window), `server/src/app.ts` (10mb limit)
- Impact: Hard to maintain, inconsistent policy enforcement across codebase
- Fix approach: Create `src/config/constants.ts` (client) and `src/config/constants.ts` (server) with documented timeout/size policies.

## Error Handling Gaps

**Silent Audit Log Failures:**
- Issue: Audit log creation failures are silently caught with `.catch(() => {})`
- Files: `server/src/controllers/authController.ts` (lines 69, 174, 218, 250, 286, 322), `server/src/controllers/projectController.ts` (lines 77, 88, 102, 113, 144, 154, 188), `server/src/controllers/invitationController.ts` (lines 25, 43, 61, 72)
- Impact: Security audit trail is unreliable. Failed logs go unnoticed, making forensics impossible. 17 instances of silent failures in critical paths.
- Fix approach: Log failures to dedicated error channel. Wrap audit log calls in try-catch that logs to separate "audit_failures" stream. Consider circuit-breaker pattern if DB is unreliable.

**Weak Error Typing - Type Coercion in Error Handling:**
- Issue: Error objects cast to `{ code?: string; message?: string }` or `as unknown as { deactivatedAt: Date }` in controllers
- Files: `server/src/controllers/authController.ts` (lines 31, 58, 104, 145, 172, 226, 244), `server/src/middleware/authenticate.ts`
- Impact: No guarantee error has expected properties. Accessing undefined properties silently fails. Difficult to debug error flow.
- Fix approach: Create `ApplicationError` class extending Error with `code` and optional metadata. Throw only `ApplicationError` instances from services.

**Incomplete Error Recovery in Graph Conflicts:**
- Issue: Graph merge conflict resolution merges local + server state but doesn't validate result
- Files: `client/src/stores/graph.ts` (lines 306-334)
- Impact: User resolves conflicts, saves merged state, but no validation that result is structurally sound. Could save invalid graph.
- Fix approach: Add validation after merge, before sending to server. Use Zod or similar schema validator.

## Security Considerations

**Encryption Key Derivation Not Hardened:**
- Issue: `ENCRYPTION_KEY` used directly as AES-256 key without key derivation function (KDF). Single key across all users.
- Files: `server/src/services/cryptoService.ts` (lines 8-14, 57-59)
- Impact: If ENCRYPTION_KEY is compromised, all encrypted data (emails, IPs) for all users is exposed. No per-user or per-project key isolation. Key rotation would require re-encrypting entire database.
- Fix approach: Use PBKDF2 or Argon2 to derive key from master secret + project ID or user ID. Implement key versioning with rotation strategy.

**HMAC-SHA256 Used as Hash for Passwords/Lookup:**
- Issue: User email hashed with HMAC-SHA256 using same `ENCRYPTION_KEY` for uniqueness validation
- Files: `server/src/services/authService.ts` (line 63, 81, 131, 195), `server/src/services/projectService.ts` (line 105, 195)
- Impact: If key is exposed, attacker can forge email hashes and look up users. No salt on hash beyond the key. HMAC not designed for password hashing.
- Fix approach: Use bcrypt or Argon2 for email lookup hash. Use cryptographic hash function (SHA-256) with per-record salt for sensitive lookups.

**Contact Information Partially Masked - Inconsistent Masking:**
- Issue: Email and phone masked in `getGraph()` but raw data accessible via `getRawNodeContacts()` with no permission check
- Files: `server/src/services/graphService.ts` (lines 42-58, 129-134)
- Impact: `unmask_contacts` permission controls visibility of masked data, but raw API can be called by READONLY users to get unmasked contacts. Permission check missing on `getRawNodeContacts()`.
- Fix approach: Add permission check in `getRawNodeContacts()`. Better: store raw and masked versions separately, never expose raw on public endpoints.

**CORS Origin Hardcoded in Production:**
- Issue: `CLIENT_ORIGIN` defaults to localhost in development, but no validation that it matches expected domains
- Files: `server/src/app.ts` (lines 15-18)
- Impact: If env var not set, dev origin is allowed (security hole). No whitelist of allowed origins.
- Fix approach: Require explicit `CLIENT_ORIGIN` configuration. Validate against whitelist. Reject requests with mismatched origin.

**Session Token Storage in localStorage:**
- Issue: Refresh token stored in browser localStorage, vulnerable to XSS
- Files: `client/src/api/http.ts` (lines 29, 55, 56)
- Impact: XSS can steal refresh tokens and create long-lived sessions as user. No httpOnly flag possible in SPA.
- Fix approach: Implement token rotation with short-lived access tokens. Consider moving refresh logic to secure backend endpoint (Backend-For-Frontend pattern).

## Performance Bottlenecks

**Graph Rendering with Large Datasets:**
- Issue: D3 force simulation renders all nodes/links at once, no virtualization or progressive loading
- Files: `client/src/components/GraphCanvas.vue` (full component)
- Impact: 1000+ node graphs will cause browser lag. No LOD (Level of Detail) or culling. Path highlighting does O(n) iteration on every interaction.
- Fix approach: Implement canvas-based rendering with quadtree or R-tree spatial index. Implement incremental rendering with requestAnimationFrame batching.

**Conflict Detection Merges Entire Graph State:**
- Issue: `mergeNodeArrays()` creates 3-way merge by comparing JSON serialization of entire node arrays
- Files: `client/src/stores/graph.ts` (lines 45-130)
- Impact: For large graphs, JSON.stringify() on every merge is expensive. No early-exit for identical data. No batching.
- Fix approach: Use structural equality check with memoization. Cache JSON representation. Consider differential sync approach.

**Missing Database Indexes on Hot Query Paths:**
- Issue: `ProjectMember.findUnique()` called repeatedly in permission checks without caching
- Files: `server/src/services/projectService.ts` (line 27-32), `server/src/services/invitationService.ts` (line 6-10)
- Impact: Every graph save, every edit triggers full DB query. No query result caching in request context. No request-scoped cache.
- Fix approach: Add request-scoped cache decorator. Batch permission checks. Use DataLoader pattern for N+1 query reduction.

**No Rate Limiting on API Endpoints:**
- Issue: Graph save, contact update, invitation endpoints lack rate limiting
- Files: `server/src/routes/projects.ts`, `server/src/routes/graphController.ts`
- Impact: Users can hammer endpoints, causing DB overload. No protection against accidental spam from buggy clients.
- Fix approach: Add express-rate-limit middleware with per-user buckets. Implement exponential backoff on client.

## Fragile Areas

**Graph Conflict Resolution State Machine:**
- Issue: Conflict state is transient, not persisted. If page refreshes during conflict resolution, state is lost.
- Files: `client/src/stores/graph.ts` (lines 18-24, 306-338)
- Impact: User in middle of resolving conflicts loses all work if browser crashes. Conflict resolution UI doesn't show "unsaved changes" warning.
- Fix approach: Persist conflict state to localStorage with recovery UI. Add unsaved changes indicator to conflict modal.

**CSV/Terraform Import Validation Minimal:**
- Issue: CSV parser only validates presence of required columns, not data format/consistency
- Files: `client/src/utils/csvParser.ts`, `client/src/utils/terraformParser.ts`
- Impact: Invalid IP addresses, malformed terraform, missing node references silently succeed in parsing but fail at save. User given no feedback until server rejects.
- Fix approach: Add comprehensive validation layer. Validate IPs, ports, DNS records, circular dependencies before presenting import preview.

**Account Deletion with Lingering References:**
- Issue: When user account deleted, audit logs set `userId` to null, but emails/IPs in audit logs remain
- Files: `server/src/services/authService.ts` (lines 464-467)
- Impact: Audit logs become incomplete (no user context). GDPR right-to-be-forgotten not fully satisfied - user identifiers still in logs.
- Fix approach: Hash or redact user identifiers in audit logs during deletion. Implement audit log retention policy.

**L7 Member Synchronization Not Atomic:**
- Issue: L7 node `memberServerIds` stored in graph data, but members can be deleted independently
- Files: `server/src/services/projectService.ts`, `server/src/services/graphService.ts`
- Impact: Stale references: L7 node can reference deleted servers. No validation on save.
- Fix approach: Add referential integrity check on graph save. Implement cascade delete or prevent deletion if referenced by L7.

## Scaling Limits

**Single Encryption Key for All Data:**
- Issue: One `ENCRYPTION_KEY` env var used for all encrypted fields across all users/projects
- Files: `server/src/services/cryptoService.ts`
- Impact: Database snapshots leak all encrypted data if master key is not rotated. No key versioning. Scaling horizontally requires all instances share same key (no isolation).
- Fix approach: Implement key versioning with `keyId` field in encrypted prefix. Support multiple keys in rotation. Consider HSM for key management in production.

**Refresh Token Never Expires During Session:**
- Issue: Session token stored in DB, but refresh token JWT has independent expiration (30 days)
- Files: `server/src/services/authService.ts` (lines 30-34, 50-52), `server/src/services/authService.ts` (lines 496-506)
- Impact: If refresh token leaked, attacker has 30 days to use it. Session DB cleanup doesn't invalidate JWT. No audit trail of token usage.
- Fix approach: Reduce JWT expiry to 1 day. Implement opaque session tokens instead of JWTs. Add token usage audit log.

**No Pagination on Large Data Sets:**
- Issue: `findMany()` queries in services not paginated (projects, invitations, audit logs)
- Files: `server/src/services/projectService.ts` (line 40), `server/src/services/invitationService.ts` (lines 46, 65), `server/src/services/auditLogService.ts`
- Impact: Users with 10k+ projects/invitations load entire dataset into memory. Large audit logs slow down queries.
- Fix approach: Add limit/offset parameters to findMany queries. Implement cursor-based pagination for better performance.

## Dependencies at Risk

**bcryptjs Version Pinning:**
- Issue: Using bcryptjs but no lock on major version
- Files: `server/package.json`
- Impact: Minor version updates could introduce performance regressions or security issues without notice.
- Fix approach: Lock bcryptjs to specific version. Monitor security advisories.

**Prisma Client Generation Not Versioned:**
- Issue: `prisma generate` output not committed, relies on `npm install` step
- Files: `server/prisma/schema.prisma`
- Impact: Different versions of Prisma Client could be generated on different machines. CI/CD may use wrong types.
- Fix approach: Commit `.prisma/client` directory or document generation requirement clearly.

## Missing Critical Features

**No Input Validation on Graph Data:**
- Issue: Server accepts graph data without schema validation
- Files: `server/src/controllers/graphController.ts`
- Impact: Malformed graph data accepted and stored, corrupting project state. No rollback possible.
- Fix approach: Add Zod/Yup schema validation. Validate node IDs, dependency references, required fields.

**No Audit Trail for Graph Data Changes:**
- Issue: Graph modifications not logged (only auth/membership changes are audited)
- Files: `server/src/services/graphService.ts`, `server/src/services/auditLogService.ts`
- Impact: Cannot trace who made which graph changes, when, or why. No rollback capability.
- Fix approach: Create `GraphAuditLog` table. Log all graph modifications with before/after diffs.

## Test Coverage Gaps

**No Unit Tests for Services:**
- Issue: 20 e2e tests exist, but zero unit tests for authService, graphService, projectService
- Files: `server/src/services/*`
- Impact: Refactoring is risky. Edge cases in encryption, merging, permissions not covered. CI doesn't catch regressions.
- Fix approach: Create unit test suite for all services. Mock Prisma. Test error cases, edge cases (empty graphs, circular dependencies).

**No Tests for Conflict Resolution Algorithm:**
- Issue: Graph merge conflict logic is complex 3-way merge, but only tested in e2e if at all
- Files: `client/src/stores/graph.ts` (lines 45-130)
- Impact: Bug in merge logic could silently corrupt user data. No regression tests for various conflict scenarios.
- Fix approach: Extract merge algorithm to pure function. Create comprehensive test suite with fixtures (add/delete/modify conflicts).

**Client Component Tests Missing:**
- Issue: Complex components like GraphCanvas, modals, views not unit tested
- Files: `client/src/components/*.vue`, `client/src/views/*.vue`
- Impact: UI bugs not caught until e2e testing. Component refactoring breaks layout unexpectedly. No snapshot testing.
- Fix approach: Set up @vue/test-utils + vitest. Create component snapshot tests at minimum. Mock API calls.

**No API Contract Tests:**
- Issue: Server API changes not validated against client expectations
- Files: `server/src/routes/*`, `client/src/api/*`
- Impact: API versioning breaks silently. Client could request deprecated endpoints. No automated compatibility check.
- Fix approach: Add API contract tests (e.g., Pact). Generate OpenAPI spec from Express router.

---

*Concerns audit: 2026-04-02*
