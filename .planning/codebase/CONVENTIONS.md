# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- Vue components: PascalCase (e.g., `ServerModal.vue`, `GraphCanvas.vue`)
- TypeScript/JavaScript modules: camelCase (e.g., `authService.ts`, `graphApi.ts`)
- Composables: camelCase with `use` prefix (e.g., `useApi.ts`, `useContactValidation.ts`)
- Stores: camelCase (e.g., `auth.ts`, `graph.ts`, `project.ts`)
- Utilities: camelCase (e.g., `errorMessage.ts`, `terraformParser.ts`)
- Routes: camelCase (e.g., `auth.ts`, `projects.ts`, `invitations.ts`)
- Controllers: camelCase with `Controller` suffix (e.g., `authController.ts`)
- Services: camelCase with `Service` suffix (e.g., `authService.ts`, `graphService.ts`)
- Middleware: camelCase (e.g., `authenticate.ts`)

**Functions:**
- camelCase: `generateAccessToken()`, `verifyPassword()`, `getServers()`, `addNode()`
- Async functions: same camelCase pattern, named descriptively (e.g., `issueTokens()`, `loadProjects()`)
- Helper functions prefixed with context (e.g., `maskEmail()`, `maskPhone()` in `graphService.ts`)

**Variables:**
- camelCase for all variable declarations (e.g., `registeredUser`, `projectId`, `isDuplicate`)
- Constants: UPPER_SNAKE_CASE (e.g., `SALT_ROUNDS`, `BASE_URL`)
- Boolean prefixes: `is`, `can`, `has` (e.g., `isEdit`, `canWrite`, `hasFirewall`)

**Types:**
- Interfaces: PascalCase (e.g., `Server`, `AuthTokenPayload`, `ConflictItem`)
- Type aliases: PascalCase (e.g., `DependencyType`, `D3Node`, `GraphData`)
- Enums: Not used in this codebase; union types preferred (e.g., `type DependencyType = 'http' | 'tcp' | 'websocket' | 'dns' | 'other'`)

**Stores (Pinia):**
- Store names: camelCase with `use` prefix (e.g., `useGraphStore`, `useProjectStore`, `useAuthStore`)
- Store functions: camelCase verbs (e.g., `loadProjects()`, `addServer()`, `updateMemberRole()`)
- Store state: Composition API with `ref()` and `computed()` (e.g., `const projects = ref<Project[]>([])`)

## Code Style

**Formatting:**
- ESLint configured in TypeScript strict mode
- Line length: No hardcoded limit enforced, but patterns suggest ~100-120 character practical maximum
- Indentation: 2 spaces (inferred from codebase style)

**Linting:**
- TypeScript strict mode enabled in both workspaces:
  - Client: `tsconfig.json` with `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
  - Server: `tsconfig.json` with `strict: true`, `forceConsistentCasingInFileNames: true`
- Vue: `vue-tsc --noEmit` for type checking before build
- No Prettier config file detected; formatting appears to be manual or IDE-based

**Trailing Commas:**
- Pattern observed: trailing commas used in multi-line objects/arrays
- Example from `graph.ts`: `{ ...data, l7Nodes: [...] }`

## Import Organization

**Order:**
1. External libraries (`vue`, `pinia`, `express`, `prisma/client`, etc.)
2. Type imports (`import type { ... } from`)
3. Relative internal imports (`from '../stores'`, `from '../services'`)
4. CSS/style imports (last position)

**Examples:**

Client composable (`useApi.ts`):
```typescript
import { useGraphStore } from '../stores/graph'
import type { Server, L7Node, AnyNode, Dependency } from '../types'
```

Server controller (`authController.ts`):
```typescript
import { Request, Response } from 'express'
import * as authService from '../services/authService'
import * as auditLogService from '../services/auditLogService'
import prisma from '../prisma'
import logger from '../lib/logger'
```

**Path Aliases:**
- `client/tsconfig.json`: No path aliases configured
- `server/tsconfig.json`: No path aliases configured
- Module resolution: `bundler` (client), relative imports only

**Barrel Files:**
- Used sparingly; `client/src/types/index.ts` exports all type definitions
- Some APIs use named exports (e.g., `authService` imported as `* as authService`)

## Error Handling

**Patterns:**
- Server: Custom error objects with `code` field for API responses
  - Pattern: `throw Object.assign(new Error(message), { code: 'ERROR_CODE' })`
  - Example from `authService.ts`: `throw Object.assign(new Error('Email is already taken'), { code: 'EMAIL_TAKEN' })`
  - Error codes: `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `ACCESS_DENIED`, `NOT_FOUND`, `ALREADY_MEMBER`, `CONFLICT`
- Controller error handling: try-catch with error code dispatch
  - Extract error object: `const e = err as { code?: string; message?: string }`
  - Check code and respond with 400-level HTTP status
  - Fallback to 500 for unknown errors
- Client: API error extraction via `getErrorMessage()` composable in `errorMessage.ts`
  - Maps error `code` to i18n translation key: `errors.${code}`
  - Falls back to generic `common.serverError` if code not found

**Custom Error Classes:**
- Server: `ConflictError` class for optimistic locking conflicts in `graphService.ts`
  - Extends `Error`, adds `code = 'CONFLICT'` and `current` field

**Validation:**
- Server: `express-validator` for route input validation (imported but detailed usage not shown)
- Client: HTML5 validation attributes (e.g., `required`, `minlength`)
- Vue components: Computed properties for validation state (e.g., `isDuplicate`, `isEdit`)

## Logging

**Framework:** Winston (`server/src/lib/logger.ts`)

**Configuration:**
```typescript
- Level: 'info' (production-ready, but configurable)
- Format: Structured with timestamp, level, message, metadata, stack traces
- Transport: Console only (no file logging in current setup)
- Timestamp: ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.SSSZ`)
- Colors: Enabled in console transport
```

**Patterns:**
- Info logs: Successful operations with metadata
  - Example: `logger.info('AUTH login success', { userId: result.user.id, email: result.user.email, ipAddress })`
- Warn logs: Expected failures, suspicious activity
  - Example: `logger.warn('AUTH login blocked - deactivated', { email, ipAddress })`
- Error logs: Unexpected errors requiring investigation
  - Example: `logger.error('AUTH login error', { email, error: (err as Error).message })`
- HTTP middleware logs: Auto-logged on response finish with method, path, status, duration, userId
  - Location: `server/src/app.ts` middleware

**What to Log:**
- Authentication events (login, register, logout, refresh token)
- Authorization failures
- Data conflicts (concurrent edits)
- HTTP errors (4xx, 5xx)
- Don't log: passwords, tokens, sensitive user data (though email is logged—consider impact)

**Client:**
- No structured logging framework; uses `console` implicitly through API calls
- Vue dev console warnings: Handled by Vue 3 in dev mode

## Comments

**When to Comment:**
- Comments are minimal in this codebase; code is generally self-documenting
- Comments used for complex algorithms or non-obvious logic

**JSDoc/TSDoc:**
- Minimal usage; observed in `useApi.ts`:
  ```typescript
  /**
   * 데이터 레이어 추상화 composable.
   * 현재는 Pinia store를 직접 사용하며, 차후 백엔드 API로 교체 시
   * 이 파일의 구현만 변경하면 됩니다.
   */
  ```
- Function signatures: Type hints via TypeScript are primary documentation
- No `@param`, `@returns` decorators observed; rely on TypeScript inference

**inline Comments:**
- Used for explaining non-obvious state transitions or business logic
- Example from `graph.ts`: comments for merge conflict handling steps

## Function Design

**Size:** 
- Typical range: 20-60 lines for service functions
- Utility functions: 5-15 lines
- Component methods: Extracted to composables/stores when logic exceeds 30 lines

**Parameters:**
- Prefer single object parameter for multiple related values
  - Example: `function createProject(name: string, description?: string)`
  - Example: `async function sendInvitation(projectId: string, identifier: string, role: ProjectMemberRole)`
- Optional parameters use `?` suffix with default fallbacks

**Return Values:**
- Explicit return types required (TypeScript strict mode)
- Async functions: `Promise<Type>` or `Promise<void>`
- API response pattern: `{ data: T, status: number }` (Axios response shape)
- Void returns for side-effect-only functions (mutations, event handlers)

**Reactive State (Vue):**
- Composable pattern: Return object with reactive methods and computed values
- Example from `useApi()`: Returns object with method pairs (`getServers()`, `addServer()`, etc.)
- Store pattern: Use Pinia with `defineStore()` and Composition API

## Module Design

**Exports:**
- Named exports preferred for multiple functions/types in a module
- Default exports: Used for single primary concern (e.g., `export default app`)
- Services: Named exports of individual functions (e.g., `export async function register()`)
- Stores: Default export of store definition (e.g., `export const useGraphStore = defineStore()`)

**Barrel Files:**
- Minimal usage; `client/src/types/index.ts` re-exports all type definitions
- Routes: No barrel file; each route file exported individually

**Module Organization (Layers):**
- Client: `api/` (HTTP), `stores/` (state), `composables/` (logic), `components/` (UI), `views/` (pages)
- Server: `routes/` (endpoints) → `controllers/` (handlers) → `services/` (business logic) → `prisma` (data)
- Middleware: Applied in `app.ts` before routes

## CSS/Styling Conventions

**System:**
- CSS variable-based design system in `client/src/style.css`
- All colors hardcoded as `var(--name)` references; no inline hex colors in component styles

**No Scoped Style Overrides:**
- Global button classes (`.btn-primary`, `.btn-ghost`, `.btn-danger`) reused; scoped styles only for layout
- Node type colors: Semantic CSS variables (e.g., `--node-srv-color`, `--node-l7-color`)

**Text Styling:**
- Font sizes: CSS variables only (e.g., `var(--text-sm)`, `var(--text-xl)`)
- Monospace for technical data: `font-family: var(--font-mono)` for IPs, ports, hashes

---

*Convention analysis: 2026-04-02*
