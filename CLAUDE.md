# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

서버 인프라의 의존성(서버 간 연결 관계)을 시각화하고 관리하는 웹 애플리케이션.
프로젝트별로 멤버를 초대하고, D3 기반 그래프로 서버 토폴로지를 편집/공유한다.

## Commands

```bash
# 의존성 설치
npm install

# 개발 서버 (프론트엔드 :5173, 백엔드 :3001)
npm run dev:client
npm run dev:server

# 빌드
npm run build                          # 전체 (client + server)
npm run build --workspace=client       # client만
npm run build --workspace=server       # server만

# 타입 체크 (client)
cd client && npx vue-tsc --noEmit

# DB (Docker PostgreSQL)
docker-compose up -d                   # 시작
docker-compose down                    # 중지

# Prisma (server 워크스페이스)
npm run db:migrate --workspace=server  # 마이그레이션 생성/적용
npm run db:generate --workspace=server # Prisma Client 재생성
npm run db:studio --workspace=server   # DB GUI
```

테스트 프레임워크: `@playwright/test` (루트 devDependencies). 테스트 파일은 아직 없음.

## Architecture

npm workspaces 모노레포: `client/` (Vue 3 SPA) + `server/` (Express API).

### Client (`client/`)
- **Vue 3 Composition API** + TypeScript, **Vite** 빌드
- **Pinia** 상태 관리: `graph.ts` (노드/엣지/undo-redo), `project.ts`, `auth.ts`
- **D3.js** force simulation으로 그래프 렌더링 (`GraphCanvas.vue` — 핵심 컴포넌트)
- API 호출: `api/http.ts`의 Axios 인스턴스 (interceptor로 JWT 자동 첨부, 토큰 갱신)
- Vite dev proxy: `/api` -> `http://localhost:3001`

### Server (`server/`)
- **Express** + TypeScript, `ts-node-dev`로 개발 시 자동 재시작
- **Prisma ORM** + PostgreSQL
- 계층: `routes/` -> `controllers/` -> `services/`
- JWT 인증: Access Token(15분) + Refresh Token(30일, Session 테이블)
- `cryptoService.ts`: AES-256-GCM으로 민감 데이터(email, username) 암호화 저장, HMAC-SHA256 해시로 조회
- 로깅: Winston
- 역할 기반 접근 제어: `MASTER > ADMIN > WRITER > READONLY`

### Graph Data Model
노드 4종: `server`, `l7` (로드밸런서), `infra` (DB/캐시), `external` (외부 서비스), `dns`
L7 노드는 `memberServerIds`로 하위 서버를 참조하며, 경로 탐색 시 멤버까지 자동 확장.
그래프 데이터는 `GraphData.data` (JSON)에 암호화되어 저장, `positions`는 별도 JSON 필드.
낙관적 잠금: `GraphData.version` 필드로 동시 편집 충돌 감지.

## 개발 가이드 문서
- [Client 개발 가이드](docs/guide/client.md) — Vue 3, Pinia, D3, 라우트, 상태 관리
- [Server 개발 가이드](docs/guide/server.md) — Express, Prisma, JWT, API 엔드포인트
- [스타일 가이드](docs/guide/style_guide.md) — CSS 변수 시스템, 색상, 폰트, 컴포넌트 패턴

## Code Style Rules

- **스타일 가이드는 필수**. UI 변경 시 `docs/guide/style_guide.md`도 함께 수정할 것
- 이모지 사용 금지
- **UI 색상 하드코딩 금지** — 반드시 `client/src/style.css`의 CSS 변수(`var(--)`) 사용
- JS/TS에서 색상이 필요한 경우 `getComputedStyle(document.documentElement).getPropertyValue(name)` 으로 CSS 변수를 읽을 것
- 버튼은 `style.css`의 글로벌 클래스(`.btn-primary`, `.btn-ghost`, `.btn-danger` 등) 사용. scoped에서 외형 재정의 금지 (레이아웃 속성만 허용)
- SVG 아이콘은 `Icon.vue` 컴포넌트 사용 (반복 사용되는 기능적 아이콘만. 장식용/일회용은 인라인)
- native `<select>` 대신 `CustomSelect` 컴포넌트 사용

<!-- GSD:project-start source:PROJECT.md -->
## Project

**Node Text Readability Improvement**

서버 토폴로지 에디터(GraphCanvas)의 노드 내부 텍스트 가독성을 개선하는 프로젝트. 현재 노드 텍스트(특히 서버 이름)가 작아서 한눈에 파악하기 어려운 문제를 해결한다. 노드 크기(187x74px)는 유지하면서 텍스트 크기, 행간, 잘림 처리를 개선한다.

**Core Value:** 노드 이름이 캔버스에서 즉시 읽히는 것. 줌아웃 상태에서도 서버 이름을 빠르게 식별할 수 있어야 한다.

### Constraints

- **CSS 변수**: 폰트 크기 변경 시 `style.css`의 CSS 변수 시스템 사용 필수
- **노드 크기**: 187x74px 유지 -- 텍스트는 이 영역 안에서 개선
- **5종 노드 일관성**: 모든 노드 타입에 동일한 텍스트 레이아웃 규칙 적용
- **SVG 렌더링**: foreignObject 없이 순수 SVG text 요소 사용 (현재 방식 유지)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 5.5.3 - Used throughout both client and server
- ES2020+ (client via ESNext), ES2022 (server)
## Runtime
- Node.js - Server runtime
- Browser (modern, ES2020+ compatible) - Client runtime
- npm (npm workspaces)
- Lockfile: `package-lock.json` present
## Frameworks
- Vue 3 3.4.0 - Frontend SPA framework using Composition API
- Vue Router 4.3.0 - Client-side routing
- Pinia 2.1.7 - State management (stores at `client/src/stores/`)
- Vite 5.0.0 - Build tool and dev server (config: `client/vite.config.ts`)
- Vite SSG 28.3.0 - Static site generation for landing pages
- Express 4.21.0 - HTTP API framework
- TypeScript 5.5.3 - Static type checking
- Prisma 5.22.0 - ORM and database toolkit
- @playwright/test 1.58.2 - E2E testing framework (root devDependencies, no tests written yet)
- ts-node-dev 2.0.0 - Auto-restarting TypeScript development server (`npm run dev:server` uses `ts-node-dev --respawn`)
- vue-tsc 2.0.0 - Vue 3 TypeScript compiler for type checking
## Key Dependencies
- jsonwebtoken 9.0.2 - JWT token generation and verification
- bcryptjs 2.4.3 - Password hashing with 12 salt rounds
- google-auth-library 10.6.2 - Google OAuth 2.0 client for ID token verification
- helmet 7.1.0 - Express security middleware (CORS, CSP, XSS, clickjacking protection)
- crypto (Node.js built-in) - Used by `cryptoService.ts`
- axios 1.7.0 - HTTP client for API calls and OAuth flows
- express-validator 7.2.0 - Request validation and sanitization
- dotenv 16.4.5 - Environment variable loading
- cors 2.8.5 - CORS middleware (origin: `process.env.CLIENT_ORIGIN` or `http://localhost:5173`)
- vue-i18n 10.0.8 - Internationalization (unused strings detected in codebase)
- @unhead/vue 2.1.12 - Head management for SSR/SSG
- winston 3.19.0 - Structured logging framework
- d3 7.9.0 - Force-directed graph visualization
## Configuration
- `DATABASE_URL` - PostgreSQL connection string (format: `postgresql://user:password@host:port/dbname`)
- `JWT_ACCESS_SECRET` - Secret for signing access tokens
- `JWT_REFRESH_SECRET` - Secret for signing refresh tokens
- `JWT_ACCESS_EXPIRES_IN` - Access token expiry (default: "15m")
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiry (default: "30d")
- `PORT` - Server port (default: 3001)
- `CLIENT_ORIGIN` - CORS origin for client (default: `http://localhost:5173`)
- `ENCRYPTION_KEY` - 64-character hex string (32 bytes) for AES-256-GCM encryption
- `GOOGLE_CLIENT_ID` - OAuth 2.0 Client ID for Google
- `GITHUB_CLIENT_ID` - OAuth 2.0 Client ID for GitHub
- `GITHUB_CLIENT_SECRET` - OAuth 2.0 Client Secret for GitHub
- `VITE_GOOGLE_CLIENT_ID` - Google Client ID for frontend OAuth flow
- `VITE_GITHUB_CLIENT_ID` - GitHub Client ID for frontend OAuth flow
- Server: `server/tsconfig.json`
- Client: `client/tsconfig.json`
- Server: Compiles TypeScript to `dist/` directory
- Client: Vite SSG with pre-rendering of routes `['/', '/login', '/register', '/guide']`
- Dev proxy: Vite routes `/api/*` to `http://localhost:3001`
## Platform Requirements
- Node.js (version not explicitly specified, recommend 18+)
- PostgreSQL 12+ (via Docker)
- Docker & Docker Compose
- Git
- PostgreSQL 12+
- Connection via Docker Compose: `docker-compose up -d`
- Data persistence: `./pgdata/` volume
- Node.js 18+
- PostgreSQL 12+ (managed)
- Environment variables for all secrets
- HTTPS recommended
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- Vue components: PascalCase (e.g., `ServerModal.vue`, `GraphCanvas.vue`)
- TypeScript/JavaScript modules: camelCase (e.g., `authService.ts`, `graphApi.ts`)
- Composables: camelCase with `use` prefix (e.g., `useApi.ts`, `useContactValidation.ts`)
- Stores: camelCase (e.g., `auth.ts`, `graph.ts`, `project.ts`)
- Utilities: camelCase (e.g., `errorMessage.ts`, `terraformParser.ts`)
- Routes: camelCase (e.g., `auth.ts`, `projects.ts`, `invitations.ts`)
- Controllers: camelCase with `Controller` suffix (e.g., `authController.ts`)
- Services: camelCase with `Service` suffix (e.g., `authService.ts`, `graphService.ts`)
- Middleware: camelCase (e.g., `authenticate.ts`)
- camelCase: `generateAccessToken()`, `verifyPassword()`, `getServers()`, `addNode()`
- Async functions: same camelCase pattern, named descriptively (e.g., `issueTokens()`, `loadProjects()`)
- Helper functions prefixed with context (e.g., `maskEmail()`, `maskPhone()` in `graphService.ts`)
- camelCase for all variable declarations (e.g., `registeredUser`, `projectId`, `isDuplicate`)
- Constants: UPPER_SNAKE_CASE (e.g., `SALT_ROUNDS`, `BASE_URL`)
- Boolean prefixes: `is`, `can`, `has` (e.g., `isEdit`, `canWrite`, `hasFirewall`)
- Interfaces: PascalCase (e.g., `Server`, `AuthTokenPayload`, `ConflictItem`)
- Type aliases: PascalCase (e.g., `DependencyType`, `D3Node`, `GraphData`)
- Enums: Not used in this codebase; union types preferred (e.g., `type DependencyType = 'http' | 'tcp' | 'websocket' | 'dns' | 'other'`)
- Store names: camelCase with `use` prefix (e.g., `useGraphStore`, `useProjectStore`, `useAuthStore`)
- Store functions: camelCase verbs (e.g., `loadProjects()`, `addServer()`, `updateMemberRole()`)
- Store state: Composition API with `ref()` and `computed()` (e.g., `const projects = ref<Project[]>([])`)
## Code Style
- ESLint configured in TypeScript strict mode
- Line length: No hardcoded limit enforced, but patterns suggest ~100-120 character practical maximum
- Indentation: 2 spaces (inferred from codebase style)
- TypeScript strict mode enabled in both workspaces:
- Vue: `vue-tsc --noEmit` for type checking before build
- No Prettier config file detected; formatting appears to be manual or IDE-based
- Pattern observed: trailing commas used in multi-line objects/arrays
- Example from `graph.ts`: `{ ...data, l7Nodes: [...] }`
## Import Organization
- `client/tsconfig.json`: No path aliases configured
- `server/tsconfig.json`: No path aliases configured
- Module resolution: `bundler` (client), relative imports only
- Used sparingly; `client/src/types/index.ts` exports all type definitions
- Some APIs use named exports (e.g., `authService` imported as `* as authService`)
## Error Handling
- Server: Custom error objects with `code` field for API responses
- Controller error handling: try-catch with error code dispatch
- Client: API error extraction via `getErrorMessage()` composable in `errorMessage.ts`
- Server: `ConflictError` class for optimistic locking conflicts in `graphService.ts`
- Server: `express-validator` for route input validation (imported but detailed usage not shown)
- Client: HTML5 validation attributes (e.g., `required`, `minlength`)
- Vue components: Computed properties for validation state (e.g., `isDuplicate`, `isEdit`)
## Logging
- Level: 'info' (production-ready, but configurable)
- Format: Structured with timestamp, level, message, metadata, stack traces
- Transport: Console only (no file logging in current setup)
- Timestamp: ISO 8601 format (`YYYY-MM-DDTHH:mm:ss.SSSZ`)
- Colors: Enabled in console transport
- Info logs: Successful operations with metadata
- Warn logs: Expected failures, suspicious activity
- Error logs: Unexpected errors requiring investigation
- HTTP middleware logs: Auto-logged on response finish with method, path, status, duration, userId
- Authentication events (login, register, logout, refresh token)
- Authorization failures
- Data conflicts (concurrent edits)
- HTTP errors (4xx, 5xx)
- Don't log: passwords, tokens, sensitive user data (though email is logged—consider impact)
- No structured logging framework; uses `console` implicitly through API calls
- Vue dev console warnings: Handled by Vue 3 in dev mode
## Comments
- Comments are minimal in this codebase; code is generally self-documenting
- Comments used for complex algorithms or non-obvious logic
- Minimal usage; observed in `useApi.ts`:
- Function signatures: Type hints via TypeScript are primary documentation
- No `@param`, `@returns` decorators observed; rely on TypeScript inference
- Used for explaining non-obvious state transitions or business logic
- Example from `graph.ts`: comments for merge conflict handling steps
## Function Design
- Typical range: 20-60 lines for service functions
- Utility functions: 5-15 lines
- Component methods: Extracted to composables/stores when logic exceeds 30 lines
- Prefer single object parameter for multiple related values
- Optional parameters use `?` suffix with default fallbacks
- Explicit return types required (TypeScript strict mode)
- Async functions: `Promise<Type>` or `Promise<void>`
- API response pattern: `{ data: T, status: number }` (Axios response shape)
- Void returns for side-effect-only functions (mutations, event handlers)
- Composable pattern: Return object with reactive methods and computed values
- Example from `useApi()`: Returns object with method pairs (`getServers()`, `addServer()`, etc.)
- Store pattern: Use Pinia with `defineStore()` and Composition API
## Module Design
- Named exports preferred for multiple functions/types in a module
- Default exports: Used for single primary concern (e.g., `export default app`)
- Services: Named exports of individual functions (e.g., `export async function register()`)
- Stores: Default export of store definition (e.g., `export const useGraphStore = defineStore()`)
- Minimal usage; `client/src/types/index.ts` re-exports all type definitions
- Routes: No barrel file; each route file exported individually
- Client: `api/` (HTTP), `stores/` (state), `composables/` (logic), `components/` (UI), `views/` (pages)
- Server: `routes/` (endpoints) → `controllers/` (handlers) → `services/` (business logic) → `prisma` (data)
- Middleware: Applied in `app.ts` before routes
## CSS/Styling Conventions
- CSS variable-based design system in `client/src/style.css`
- All colors hardcoded as `var(--name)` references; no inline hex colors in component styles
- Global button classes (`.btn-primary`, `.btn-ghost`, `.btn-danger`) reused; scoped styles only for layout
- Node type colors: Semantic CSS variables (e.g., `--node-srv-color`, `--node-l7-color`)
- Font sizes: CSS variables only (e.g., `var(--text-sm)`, `var(--text-xl)`)
- Monospace for technical data: `font-family: var(--font-mono)` for IPs, ports, hashes
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Client: Vue 3 SPA with state management (Pinia) and D3-based graph visualization
- Server: Express REST API with service layer and role-based access control
- Real-time graph collaboration with optimistic locking (version-based conflict detection)
- Separation of concerns: presentation layer (Vue components) → state management (Pinia stores) → API layer (Axios HTTP client) → server controllers → services → database (Prisma ORM)
## Layers
- Purpose: Vue 3 SPA with responsive UI for graph editing, project management, and authentication
- Location: `client/src/`
- Contains: Vue components, views, styling (CSS variables)
- Depends on: State management (Pinia), API layer (Axios), routing (Vue Router), utilities
- Used by: Browser/end users
- Purpose: Centralized state using Pinia stores
- Location: `client/src/stores/`
- Contains: `auth.ts` (authentication), `project.ts` (project metadata), `graph.ts` (node/edge/undo-redo)
- Depends on: API layer, localStorage
- Used by: Vue components, composables, views
- Purpose: Axios HTTP client with JWT interceptors and token refresh
- Location: `client/src/api/`
- Contains: `http.ts` (base client, interceptors), `authApi.ts`, `projectApi.ts`, `graphApi.ts`
- Depends on: Network, server endpoints
- Used by: Pinia stores, components
- Purpose: Express route handlers mapping URLs to controller actions
- Location: `server/src/routes/`
- Contains: `auth.ts`, `projects.ts`, `invitations.ts`
- Depends on: Controllers
- Used by: Express app, middleware
- Purpose: HTTP request handlers with basic validation and error mapping
- Location: `server/src/controllers/`
- Contains: `authController.ts`, `projectController.ts`, `graphController.ts`, `invitationController.ts`
- Depends on: Services, logging, middleware
- Used by: Routes
- Purpose: Business logic, database operations, external authentication
- Location: `server/src/services/`
- Contains: `authService.ts` (auth logic, JWT, password), `projectService.ts` (project/member ops), `graphService.ts` (graph data with conflict detection), `cryptoService.ts` (AES-256-GCM encryption), `auditLogService.ts`, OAuth services
- Depends on: Prisma ORM, external auth providers
- Used by: Controllers
- Purpose: PostgreSQL schema with Prisma ORM
- Location: `server/prisma/schema.prisma`
- Contains: User, Project, ProjectMember, GraphData, Session, AuditLog, ProjectInvitation, OAuthAccount
- Depends on: PostgreSQL
- Used by: Prisma Client from services
- Purpose: Cross-cutting concerns
- Location: `server/src/middleware/`
- Contains: `authenticate.ts` (JWT verification), CORS/helmet in `app.ts`
- Depends on: Services
- Used by: Express routes
## Data Flow
## Key Abstractions
- Purpose: Encapsulates heterogeneous node types and dependencies as a single JSON structure
- Examples: `client/src/types/index.ts` (Server, L7Node, InfraNode, ExternalServiceNode, DnsNode, Dependency)
- Pattern: Union type `AnyNode = Server | L7Node | ...`, discriminated by `nodeKind` field
- Encoding: Client sends/receives plain JSON; server encrypts specific fields before storage
- L7 membership: L7 nodes reference server IDs via `memberServerIds`, path traversal expands L7 to members
- Purpose: Isolated state management for auth, project, graph concerns
- Examples: `client/src/stores/auth.ts`, `project.ts`, `graph.ts`
- Pattern: Composition API (ref + computed), actions for async operations, state reset on logout
- Conflict resolution: `graph.ts` maintains snapshot history, three-way merge for concurrent edits
- Purpose: Prevent boilerplate, ensure consistent encryption/decryption
- Examples: `authService.decryptUserFields()`, `graphService.encryptGraphData()`, `projectService.decryptProjectMembers()`
- Pattern: Functions wrapping Prisma queries to transparently handle crypto
- Purpose: PII (email, phone) masking for external service contacts
- Examples: `maskEmail()`, `maskPhone()` in `graphService.ts`
- Pattern: Client stores contacts unmasked; server masks on send, client unmasks if role permits
## Entry Points
- Location: `client/src/main.ts`
- Triggers: Browser load of `http://localhost:5173` or built SPA
- Responsibilities: 
- Location: `server/src/server.ts`
- Triggers: `npm run dev` or `node dist/server.js`
- Responsibilities:
- Location: `server/src/app.ts`
- Triggers: Imported by `server.ts`
- Responsibilities:
- Location: `client/src/router/index.ts`
- Triggers: Every route navigation
- Responsibilities:
## Error Handling
- `401 Unauthorized`: Missing/invalid token, trigger re-login via interceptor
- Token refresh: `http.interceptors.response` catches 401, retries with new token if refresh succeeds
- Refresh failure: Clears tokens, redirects to `/login`
- `403 Forbidden`: User lacks permission for action (returned by `checkPermission`)
- Example: READONLY user tries to write graph → 403 with code `ACCESS_DENIED`
- `409 Conflict`: Graph version mismatch, return current state for merge
- `400 Bad Request`: Validation failure (from express-validator)
- Custom codes: `EMAIL_TAKEN`, `USERNAME_TAKEN`, `INVALID_CREDENTIALS`, `ACCOUNT_DEACTIVATED`
- `500 Internal Server Error`: Uncaught exceptions
- Logged to Winston with context: method, path, userId, duration, error message
## Cross-Cutting Concerns
- Framework: Winston (server-side)
- Patterns:
- Express-validator for request body/query validation (in controllers)
- Client-side Vue form validation (required, email format, password strength)
- Custom validation: Role assignment (only manageable roles), email uniqueness via HMAC
- JWT-based with two token types:
- OAuth2: Google (via `google-auth-library`) and GitHub (custom verification)
- Middleware: `authenticate()` extracts and verifies access token on protected routes
- User email: AES-256-GCM encrypted on write, decrypted on read
- Email lookup: HMAC-SHA256 hash for unique constraint and queries (without decryption)
- Graph data: Server-side encryption for IPs and contacts before storage
- Contact masking: Email `e***@example.com`, phone `010-****-1234` (regex-based)
- Crypto service: `client/src/services/cryptoService.ts` handles all encryption/decryption
- Framework: Vue-i18n
- Locales: `client/src/i18n/locales/` (en.ts, ko.ts)
- Runtime: Query parameter `?lang=ko` or `?lang=en`
- Default: Browser language detection or `en`
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
