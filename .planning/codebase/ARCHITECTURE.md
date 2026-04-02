# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Monorepo (npm workspaces) with layered client-server architecture.

**Key Characteristics:**
- Client: Vue 3 SPA with state management (Pinia) and D3-based graph visualization
- Server: Express REST API with service layer and role-based access control
- Real-time graph collaboration with optimistic locking (version-based conflict detection)
- Separation of concerns: presentation layer (Vue components) → state management (Pinia stores) → API layer (Axios HTTP client) → server controllers → services → database (Prisma ORM)

## Layers

**Presentation Layer (Client):**
- Purpose: Vue 3 SPA with responsive UI for graph editing, project management, and authentication
- Location: `client/src/`
- Contains: Vue components, views, styling (CSS variables)
- Depends on: State management (Pinia), API layer (Axios), routing (Vue Router), utilities
- Used by: Browser/end users

**State Management Layer (Client):**
- Purpose: Centralized state using Pinia stores
- Location: `client/src/stores/`
- Contains: `auth.ts` (authentication), `project.ts` (project metadata), `graph.ts` (node/edge/undo-redo)
- Depends on: API layer, localStorage
- Used by: Vue components, composables, views

**API/HTTP Layer (Client):**
- Purpose: Axios HTTP client with JWT interceptors and token refresh
- Location: `client/src/api/`
- Contains: `http.ts` (base client, interceptors), `authApi.ts`, `projectApi.ts`, `graphApi.ts`
- Depends on: Network, server endpoints
- Used by: Pinia stores, components

**Server Route Layer:**
- Purpose: Express route handlers mapping URLs to controller actions
- Location: `server/src/routes/`
- Contains: `auth.ts`, `projects.ts`, `invitations.ts`
- Depends on: Controllers
- Used by: Express app, middleware

**Controller Layer (Server):**
- Purpose: HTTP request handlers with basic validation and error mapping
- Location: `server/src/controllers/`
- Contains: `authController.ts`, `projectController.ts`, `graphController.ts`, `invitationController.ts`
- Depends on: Services, logging, middleware
- Used by: Routes

**Service Layer (Server):**
- Purpose: Business logic, database operations, external authentication
- Location: `server/src/services/`
- Contains: `authService.ts` (auth logic, JWT, password), `projectService.ts` (project/member ops), `graphService.ts` (graph data with conflict detection), `cryptoService.ts` (AES-256-GCM encryption), `auditLogService.ts`, OAuth services
- Depends on: Prisma ORM, external auth providers
- Used by: Controllers

**Database Layer:**
- Purpose: PostgreSQL schema with Prisma ORM
- Location: `server/prisma/schema.prisma`
- Contains: User, Project, ProjectMember, GraphData, Session, AuditLog, ProjectInvitation, OAuthAccount
- Depends on: PostgreSQL
- Used by: Prisma Client from services

**Middleware Layer (Server):**
- Purpose: Cross-cutting concerns
- Location: `server/src/middleware/`
- Contains: `authenticate.ts` (JWT verification), CORS/helmet in `app.ts`
- Depends on: Services
- Used by: Express routes

## Data Flow

**Authentication (Login → Protected Route):**

1. Client: User submits credentials via LoginView
2. Client: API layer calls `authApi.login(email, password)` (HTTP POST)
3. Server: Route `/api/auth/login` → `authController.login()`
4. Server: `authService.login()` verifies password against bcrypt hash
5. Server: If valid, generates JWT access token (15m) and refresh token (30d)
6. Server: Stores refresh token in Session table, returns tokens to client
7. Client: `setAccessToken()` in store, `localStorage.setItem('refreshToken', token)`
8. Client: Pinia auth store updates `user` ref with user data
9. Client: Router guards check `auth.isLoggedIn`, allow navigation to protected routes
10. Client: All subsequent API calls attach JWT via interceptor: `Authorization: Bearer {accessToken}`

**Graph Save (Optimistic Locking with Conflict Detection):**

1. Client: User edits graph (adds node, draws edge) → mutation in `graph.ts` store
2. Client: Undo/redo stack updates locally with snapshot-based history
3. Client: User clicks "Save" → calls `graphApi.saveGraph(projectId, graphData, clientVersion)`
4. Server: Controller checks project access via `assertProjectAccess()`
5. Server: `graphService.saveGraph()` loads current DB version, compares:
   - If `clientVersion === dbVersion`: Save succeeds, increment version, return new version
   - If `clientVersion < dbVersion`: Conflict detected
     - Three-way merge algorithm: baseVersion → clientChanges vs serverChanges
     - Merge conflicts via `mergeNodeArrays()` with conflict detection
     - Return 409 with current state and merge conflicts to client
6. Client: If 409, display `GraphConflictModal` showing conflicting changes
7. Client: User resolves conflicts (keep mine/server/merged), re-saves with new version

**Graph Data Storage (Encryption & Masking):**

1. Client: Graph contains node data (servers with IPs, external services with contacts)
2. Client: Sends entire `GraphData` object to server
3. Server: `graphService.encryptGraphData()`:
   - Server IPs (internal, NAT) → AES-256-GCM encrypted
   - L7 load balancer IPs → encrypted
   - External service contacts (email, phone) → encrypted, masked with regex patterns
4. Server: Stores encrypted JSON in `GraphData.data` field
5. Server: Node positions stored separately in `GraphData.positions` (not encrypted)
6. Server: Contact masking rules: `e***@example.com`, `010-****-1234`
7. Client: On fetch, `graphApi.getGraph()` returns decrypted data for editing

**Role-Based Access Control (RBAC):**

1. Client: User with project membership has role in `ProjectMember.role` (MASTER/ADMIN/WRITER/READONLY)
2. Server: Middleware `authenticate()` extracts JWT, sets `req.user` with userId/email/username
3. Server: Controller calls `assertProjectAccess()` → `projectService.getProjectById()`
4. Server: Check: `project.members.some(m => m.userId === req.user.userId)` for membership
5. Server: For permission-gated actions, call `checkPermission(projectId, userId, action)`
6. Server: `permissions.can(role, action)` checks role→permission mapping:
   - MASTER: All permissions (write_graph, write_contacts, add_member, manage_admin, delete_project)
   - ADMIN: Write, contact, add writer/readonly, view logs (no delete_project)
   - WRITER: Write graph, write contacts, unmask
   - READONLY: Read only, can unmask
7. Client: Pinia computed `canWrite`, `canAdmin`, `isMaster` based on current user role
8. Server: Returns 403 if action not allowed

## Key Abstractions

**GraphData Abstraction:**
- Purpose: Encapsulates heterogeneous node types and dependencies as a single JSON structure
- Examples: `client/src/types/index.ts` (Server, L7Node, InfraNode, ExternalServiceNode, DnsNode, Dependency)
- Pattern: Union type `AnyNode = Server | L7Node | ...`, discriminated by `nodeKind` field
- Encoding: Client sends/receives plain JSON; server encrypts specific fields before storage
- L7 membership: L7 nodes reference server IDs via `memberServerIds`, path traversal expands L7 to members

**Pinia Store Modules:**
- Purpose: Isolated state management for auth, project, graph concerns
- Examples: `client/src/stores/auth.ts`, `project.ts`, `graph.ts`
- Pattern: Composition API (ref + computed), actions for async operations, state reset on logout
- Conflict resolution: `graph.ts` maintains snapshot history, three-way merge for concurrent edits

**Service-to-Database Mapping:**
- Purpose: Prevent boilerplate, ensure consistent encryption/decryption
- Examples: `authService.decryptUserFields()`, `graphService.encryptGraphData()`, `projectService.decryptProjectMembers()`
- Pattern: Functions wrapping Prisma queries to transparently handle crypto

**Encrypted Contact Storage:**
- Purpose: PII (email, phone) masking for external service contacts
- Examples: `maskEmail()`, `maskPhone()` in `graphService.ts`
- Pattern: Client stores contacts unmasked; server masks on send, client unmasks if role permits

## Entry Points

**Client Entry Point:**
- Location: `client/src/main.ts`
- Triggers: Browser load of `http://localhost:5173` or built SPA
- Responsibilities: 
  - Initialize Vue app with ViteSSG (static site generation for pre-rendered routes)
  - Register Pinia store plugin
  - Register i18n (internationalization)
  - Set up router with authentication guards
  - Load CSS variables from `style.css`

**Server Entry Point:**
- Location: `server/src/server.ts`
- Triggers: `npm run dev` or `node dist/server.js`
- Responsibilities:
  - Load environment variables from `.env`
  - Initialize Express app from `app.ts`
  - Start listening on PORT (3001 default)
  - Start background job: `startPurgeJob()` to expire deactivated accounts

**Express App Setup:**
- Location: `server/src/app.ts`
- Triggers: Imported by `server.ts`
- Responsibilities:
  - Register middleware: helmet (security), cors, JSON parser
  - Request logging via Winston
  - Register route handlers: `/api/auth`, `/api/projects`, `/api/invitations`
  - Health check endpoint: `GET /api/health`

**Router Guards:**
- Location: `client/src/router/index.ts`
- Triggers: Every route navigation
- Responsibilities:
  - Check `meta.requiresAuth` on target route
  - Initialize session from refresh token in localStorage
  - Redirect to login if session expired and route requires auth
  - Prevent logged-in users from accessing public-only routes (hero, login, register)
  - Handle `?lang=` query parameter for i18n switching
  - Validate project access before allowing `/projects/:id` routes

## Error Handling

**Strategy:** HTTP status codes + typed error objects with `code` field for client-side routing.

**Patterns:**

**Authentication Errors:**
- `401 Unauthorized`: Missing/invalid token, trigger re-login via interceptor
- Token refresh: `http.interceptors.response` catches 401, retries with new token if refresh succeeds
- Refresh failure: Clears tokens, redirects to `/login`

**Authorization Errors:**
- `403 Forbidden`: User lacks permission for action (returned by `checkPermission`)
- Example: READONLY user tries to write graph → 403 with code `ACCESS_DENIED`

**Business Logic Errors:**
- `409 Conflict`: Graph version mismatch, return current state for merge
- `400 Bad Request`: Validation failure (from express-validator)
- Custom codes: `EMAIL_TAKEN`, `USERNAME_TAKEN`, `INVALID_CREDENTIALS`, `ACCOUNT_DEACTIVATED`

**Server Errors:**
- `500 Internal Server Error`: Uncaught exceptions
- Logged to Winston with context: method, path, userId, duration, error message

## Cross-Cutting Concerns

**Logging:**
- Framework: Winston (server-side)
- Patterns:
  - Automatic HTTP request logging: status, method, path, duration, userId
  - Service-level logs: `logger.info()`, `logger.warn()`, `logger.error()`
  - Audit logging: `auditLogService.createAuditLog()` for auth events (LOGIN, LOGOUT, REGISTER, DELETE_ACCOUNT)
  - Context: Include userId, projectId, email, IP address, user agent

**Validation:**
- Express-validator for request body/query validation (in controllers)
- Client-side Vue form validation (required, email format, password strength)
- Custom validation: Role assignment (only manageable roles), email uniqueness via HMAC

**Authentication:**
- JWT-based with two token types:
  - Access token (15 minutes): For API requests
  - Refresh token (30 days): Stored in Session table for rotation
- OAuth2: Google (via `google-auth-library`) and GitHub (custom verification)
- Middleware: `authenticate()` extracts and verifies access token on protected routes

**Encryption:**
- User email: AES-256-GCM encrypted on write, decrypted on read
- Email lookup: HMAC-SHA256 hash for unique constraint and queries (without decryption)
- Graph data: Server-side encryption for IPs and contacts before storage
- Contact masking: Email `e***@example.com`, phone `010-****-1234` (regex-based)
- Crypto service: `client/src/services/cryptoService.ts` handles all encryption/decryption

**Internationalization (i18n):**
- Framework: Vue-i18n
- Locales: `client/src/i18n/locales/` (en.ts, ko.ts)
- Runtime: Query parameter `?lang=ko` or `?lang=en`
- Default: Browser language detection or `en`

---

*Architecture analysis: 2026-04-02*
