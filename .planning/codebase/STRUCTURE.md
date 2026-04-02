# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```
server-dependencies/                      # Monorepo root (npm workspaces)
├── client/                               # Vue 3 SPA frontend workspace
│   ├── src/
│   │   ├── main.ts                      # App entry point (ViteSSG + Pinia + i18n setup)
│   │   ├── App.vue                      # Root component (router outlet)
│   │   ├── style.css                    # Global styles + CSS variables (colors, fonts, spacing)
│   │   ├── router/
│   │   │   └── index.ts                 # Route definitions + authentication guards
│   │   ├── stores/
│   │   │   ├── auth.ts                  # Auth state + login/logout/token management
│   │   │   ├── project.ts               # Project list/details + member management
│   │   │   └── graph.ts                 # Graph nodes/edges/dependencies + undo-redo + conflict detection
│   │   ├── api/
│   │   │   ├── http.ts                  # Axios instance with JWT interceptors + token refresh
│   │   │   ├── authApi.ts               # Auth endpoints
│   │   │   ├── projectApi.ts            # Project endpoints
│   │   │   └── graphApi.ts              # Graph save/load endpoints
│   │   ├── components/
│   │   │   ├── GraphCanvas.vue          # Core D3 graph renderer + interaction handlers
│   │   │   ├── ServerPanel.vue          # Node editing sidebar
│   │   │   ├── ImpactPanel.vue          # Dependency impact analysis
│   │   │   ├── [Modal].vue              # Node creation/edit modals (Server, L7, Infra, External, DNS)
│   │   │   ├── CustomSelect.vue         # Custom dropdown (replaces native select)
│   │   │   ├── CustomCombobox.vue       # Searchable dropdown
│   │   │   ├── Icon.vue                 # SVG icon component
│   │   │   └── [Other].vue              # Auth, project, form components
│   │   ├── views/
│   │   │   ├── HeroView.vue             # Public landing page
│   │   │   ├── LoginView.vue            # Email/password + OAuth login
│   │   │   ├── RegisterView.vue         # Email/password registration
│   │   │   ├── ProjectsView.vue         # User's project list + creation
│   │   │   ├── ProjectView.vue          # Main graph editor with canvas + panels
│   │   │   ├── ProjectSettingsView.vue  # Project name + member management
│   │   │   ├── AuditLogView.vue         # Project audit log viewer
│   │   │   ├── AccountView.vue          # User profile + password change
│   │   │   └── [Auth].View.vue          # OAuth callback handlers
│   │   ├── composables/
│   │   │   ├── useApi.ts                # Shared API call wrapper with error handling
│   │   │   ├── useIdleTimeout.ts        # Session timeout warning
│   │   │   ├── usePageSeo.ts            # Head meta tags (OpenGraph, etc.)
│   │   │   └── [Other].ts               # Contact validation, auth utilities, i18n
│   │   ├── utils/
│   │   │   ├── csvParser.ts             # CSV import parsing (convert to graph format)
│   │   │   ├── terraformParser.ts       # Terraform state import parsing
│   │   │   ├── googleAuth.ts            # Google OAuth client initialization
│   │   │   ├── githubAuth.ts            # GitHub OAuth handler
│   │   │   └── errorMessage.ts          # Error code → user message mapping
│   │   ├── i18n/
│   │   │   ├── index.ts                 # i18n setup + locale switcher
│   │   │   └── locales/
│   │   │       ├── en.ts                # English translations
│   │   │       └── ko.ts                # Korean translations
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript types (Server, L7Node, Dependencies, etc.)
│   │   └── data/
│   │       └── sampleData.ts            # Mock graph data for development
│   ├── public/
│   │   ├── seraph_logo.svg              # Brand logo
│   │   ├── csv-template.csv             # CSV import template
│   │   └── robots.txt, sitemap.xml      # SEO
│   ├── vite.config.ts                   # Vite + Vue plugin + dev proxy to backend
│   ├── tsconfig.json                    # TypeScript config (strict mode)
│   ├── package.json                     # Vue 3, Pinia, D3, Axios, Vue Router, i18n, Vite
│   └── index.html                       # HTML template (entry point)
│
├── server/                               # Express REST API backend workspace
│   ├── src/
│   │   ├── server.ts                    # App startup (listen on PORT)
│   │   ├── app.ts                       # Express setup (middleware, routes, health check)
│   │   ├── prisma.ts                    # Prisma client singleton
│   │   ├── routes/
│   │   │   ├── auth.ts                  # POST /register, /login, /google, /github, /refresh, /logout, etc.
│   │   │   ├── projects.ts              # CRUD projects + members + graph + audit logs
│   │   │   └── invitations.ts           # Invitation endpoints
│   │   ├── controllers/
│   │   │   ├── authController.ts        # Auth actions: register, login, googleLogin, githubLogin, me, etc.
│   │   │   ├── projectController.ts     # Project CRUD + member management + audit log fetching
│   │   │   ├── graphController.ts       # Graph save/load with conflict detection
│   │   │   └── invitationController.ts  # Send/cancel/get invitations
│   │   ├── services/
│   │   │   ├── authService.ts           # JWT generation/verification, password hashing (bcrypt), user registration
│   │   │   ├── projectService.ts        # Project/member queries + RBAC checks + member decryption
│   │   │   ├── graphService.ts          # Graph encryption/decryption, three-way merge, conflict detection
│   │   │   ├── cryptoService.ts         # AES-256-GCM encryption/decryption, HMAC, contact masking
│   │   │   ├── auditLogService.ts       # Create audit log entries (login, logout, registration)
│   │   │   ├── googleAuthService.ts     # Verify Google ID tokens
│   │   │   ├── githubAuthService.ts     # Verify GitHub OAuth codes
│   │   │   └── invitationService.ts     # Invitation creation + acceptance
│   │   ├── middleware/
│   │   │   └── authenticate.ts          # JWT verification middleware (sets req.user)
│   │   ├── lib/
│   │   │   ├── logger.ts                # Winston logger configuration
│   │   │   └── permissions.ts           # RBAC role→permission mapping + canManageTarget
│   │   ├── jobs/
│   │   │   └── purgeExpiredAccounts.ts  # Background job: delete deactivated accounts after 30 days
│   │   ├── scripts/
│   │   │   └── migrateEncryption.ts     # One-time: encrypt existing user emails
│   │   ├── types/
│   │   │   └── index.ts                 # TypeScript interfaces (AuthTokenPayload, GraphDataJson)
│   │   └── tests/                       # (Reserved) Playwright tests in root /e2e
│   │
│   ├── prisma/
│   │   ├── schema.prisma                # Database schema (User, Project, GraphData, Session, AuditLog, etc.)
│   │   ├── migrations/                  # Numbered migration files (auto-generated by Prisma)
│   │   └── migrate-*.ts                 # One-time data migration scripts
│   │
│   ├── tsconfig.json                    # TypeScript config
│   ├── package.json                     # Express, Prisma, JWT, bcryptjs, Winston, OAuth libraries
│   └── dist/                            # Compiled JavaScript (build output)
│
├── e2e/                                  # Playwright E2E tests (monorepo root)
│   ├── fixtures/                        # Test data + shared fixtures
│   ├── auth.spec.ts                     # Auth flow tests
│   ├── projects.spec.ts                 # Project CRUD tests
│   ├── graph.spec.ts                    # Graph editing + conflict resolution
│   └── ...                              # Other test suites
│
├── docs/                                # Documentation (non-code)
│   ├── guide/
│   │   ├── client.md                    # Client development guide (Vue, Pinia, D3, routing)
│   │   ├── server.md                    # Server development guide (Express, Prisma, auth)
│   │   └── style_guide.md               # CSS variables, colors, component patterns
│   ├── design/                          # Feature design docs
│   ├── spec/                            # Feature specifications
│   ├── e2e/                             # E2E test case documentation
│   └── sample/                          # Sample data (local development only)
│
├── .planning/
│   └── codebase/                        # GSD codebase analysis documents (this directory)
│       ├── ARCHITECTURE.md
│       ├── STRUCTURE.md
│       ├── CONVENTIONS.md
│       ├── TESTING.md
│       ├── STACK.md
│       ├── INTEGRATIONS.md
│       └── CONCERNS.md
│
├── .env.example                         # Environment variable template (not in git)
├── .gitignore                           # Exclude node_modules, dist, .env
├── CLAUDE.md                            # Project-specific instructions for Claude
├── package.json                         # Root workspace config
└── README.md                            # Project overview

```

## Directory Purposes

**client/src/:**
- Purpose: Vue 3 single-page application source code
- Contains: Components, views, stores, API clients, utilities, i18n
- Key files: `main.ts` (entry), `App.vue` (root), `style.css` (global design)

**client/src/components/:**
- Purpose: Reusable Vue components (presentational + form inputs)
- Contains: Graph visualization, modals, panels, custom form components
- Key files: `GraphCanvas.vue` (D3 graph), `ServerPanel.vue` (node editor), modal files for each node type

**client/src/views/:**
- Purpose: Page-level components (routed pages)
- Contains: Auth pages (login, register, callbacks), project list, graph editor, settings, audit log
- Key files: `ProjectView.vue` (main graph editor), `ProjectsView.vue` (project list)

**client/src/stores/:**
- Purpose: Pinia state management modules
- Contains: Centralized state for auth, projects, graph + actions for mutations
- Key files: `auth.ts` (user login state), `project.ts` (project metadata), `graph.ts` (graph data + undo-redo)

**client/src/api/:**
- Purpose: HTTP API clients + axios instance configuration
- Contains: API request functions grouped by feature + JWT interceptor logic
- Key files: `http.ts` (base client, interceptors), `graphApi.ts` (graph endpoints)

**client/src/composables/:**
- Purpose: Reusable Vue 3 composition functions
- Contains: Shared hooks for API calls, validation, SEO, auth utilities
- Key files: `useApi.ts` (error handling wrapper)

**client/src/utils/:**
- Purpose: Pure utilities (no Vue coupling)
- Contains: CSV/Terraform import parsers, OAuth handlers, error message mapping
- Key files: `csvParser.ts`, `terraformParser.ts`

**client/public/:**
- Purpose: Static assets served as-is
- Contains: Logo, CSV template, SEO files
- Key files: `seraph_logo.svg` (brand identity)

**server/src/routes/:**
- Purpose: Express route definitions
- Contains: Route handlers mapping (GET/POST/PUT/DELETE) to controller functions
- Key files: `auth.ts` (all auth endpoints), `projects.ts` (project CRUD + graph + members)

**server/src/controllers/:**
- Purpose: HTTP request handlers (input validation → service call → response mapping)
- Contains: Controllers for auth, projects, graphs, invitations
- Key files: `authController.ts` (login/register handling), `graphController.ts` (conflict detection logic)

**server/src/services/:**
- Purpose: Business logic layer (database queries, external APIs, crypto)
- Contains: Service modules for auth, projects, graphs, encryption, OAuth verification
- Key files: `authService.ts` (JWT + password logic), `graphService.ts` (three-way merge), `cryptoService.ts` (AES-256-GCM)

**server/src/middleware/:**
- Purpose: Express middleware (cross-cutting concerns)
- Contains: JWT verification, CORS, security headers (helmet), logging
- Key files: `authenticate.ts` (token verification)

**server/src/lib/:**
- Purpose: Shared utilities not tied to specific feature
- Contains: Logging, permission checking, helpers
- Key files: `permissions.ts` (RBAC mapping), `logger.ts` (Winston setup)

**server/prisma/:**
- Purpose: Database schema + migrations
- Contains: Prisma schema definition, auto-generated migrations
- Key files: `schema.prisma` (User, Project, GraphData models), `migrations/` (version history)

**e2e/:**
- Purpose: End-to-end test automation (Playwright)
- Contains: Test suites for full user flows across client + server
- Key files: Multiple `.spec.ts` files testing auth, projects, graph editing, conflicts

**docs/:**
- Purpose: Human-readable documentation (not code)
- Contains: Development guides, design decisions, test plans, API specs
- Key files: `guide/client.md` (Vue/Pinia patterns), `guide/style_guide.md` (CSS vars)

## Key File Locations

**Entry Points:**

| File | Purpose |
|------|---------|
| `client/src/main.ts` | Vue app initialization (ViteSSG, Pinia, Router) |
| `client/index.html` | HTML template entry point |
| `server/src/server.ts` | Node.js server startup (listen on PORT) |
| `server/src/app.ts` | Express app setup (middleware, routes) |

**Configuration:**

| File | Purpose |
|------|---------|
| `client/vite.config.ts` | Vite dev server (proxy to backend), build config |
| `server/tsconfig.json` | TypeScript compiler options |
| `client/tsconfig.json` | TypeScript compiler options (strict mode) |
| `.env` (not in git) | Environment variables (DB_URL, JWT_SECRET, OAuth keys) |
| `server/prisma/schema.prisma` | Database schema definition |

**Core Logic:**

| File | Purpose |
|------|---------|
| `client/src/components/GraphCanvas.vue` | D3 graph visualization + interaction (drag, zoom, path highlight) |
| `client/src/stores/graph.ts` | Graph state + undo-redo + three-way merge algorithm |
| `server/src/services/graphService.ts` | Graph encryption + conflict detection + contact masking |
| `server/src/services/authService.ts` | JWT generation/verification + password hashing |
| `server/src/services/cryptoService.ts` | AES-256-GCM encryption for emails + IPs + contacts |

**Styling:**

| File | Purpose |
|------|---------|
| `client/src/style.css` | Global CSS + design system (variables, colors, spacing) |
| Component `.vue` files | Scoped component styles (layout adjustments only) |

**Type Definitions:**

| File | Purpose |
|------|---------|
| `client/src/types/index.ts` | Graph node types (Server, L7Node, etc.), dependency types |
| `server/src/types/index.ts` | AuthTokenPayload, GraphDataJson interfaces |

**Database:**

| File | Purpose |
|------|---------|
| `server/prisma/schema.prisma` | Model definitions + relationships |
| `server/prisma/migrations/` | Version-controlled migration history |

## Naming Conventions

**Files:**

| Pattern | Example | Usage |
|---------|---------|-------|
| `.ts` for TypeScript source | `authService.ts` | Server services, utilities |
| `.vue` for Vue components | `GraphCanvas.vue` | UI components, pages |
| `[Feature]Modal.vue` | `ServerModal.vue` | Node creation/edit modals |
| `[Feature]View.vue` | `ProjectView.vue` | Page-level routed components |
| `use[Function].ts` | `useApi.ts` | Vue 3 composition functions |
| `[feature]Api.ts` | `graphApi.ts` | API client functions |
| `[feature]Service.ts` | `authService.ts` | Business logic |
| `[feature]Controller.ts` | `authController.ts` | HTTP handlers |
| `.spec.ts` or `.test.ts` | `graph.spec.ts` | Playwright E2E tests |

**Directories:**

| Pattern | Examples | Purpose |
|---------|----------|---------|
| lowercase plural | `components/`, `routes/`, `services/` | Feature collections |
| explicit feature names | `api/`, `stores/`, `composables/` | Clear intent |
| `[feature]/` | Not used in this codebase | Could be used for feature-based structure |

**TypeScript Types & Interfaces:**

| Pattern | Examples |
|---------|----------|
| PascalCase for types | `Server`, `L7Node`, `GraphData` |
| `is[Type]` for type guards | `isL7(node)` in `types/index.ts` |
| Suffix with names | `ExternalContact`, `ProjectMemberRole` |

**Variables & Functions:**

| Pattern | Examples |
|---------|----------|
| camelCase for functions/vars | `generateId()`, `maskEmail()`, `decryptUserFields()` |
| UPPER_SNAKE_CASE for constants | `SALT_ROUNDS = 12`, `PORT` |
| `is[Condition]` for booleans | `isMaster`, `isLoggedIn`, `canWrite` |

## Where to Add New Code

**New Feature (e.g., "Import from Terraform"):**

1. **Server-side logic:**
   - Create `/server/src/services/terraformImportService.ts` (parse + validate)
   - Add endpoint in `/server/src/routes/projects.ts`: `POST /:id/import/terraform`
   - Add controller: `/server/src/controllers/projectController.ts` → new action `importTerraform()`
   - Call service from controller, return result

2. **Client-side:**
   - Create `/client/src/components/TerraformImportModal.vue` (form UI)
   - Add API function in `/client/src/api/projectApi.ts`: `importTerraform(projectId, fileContent)`
   - Trigger from `/client/src/views/ProjectView.vue` menu button
   - Show modal on click, call API, handle response
   - Update `graph` store on success: `dispatch('loadGraph', projectId)`

3. **Tests:**
   - Add E2E test: `/e2e/import.spec.ts`
   - Test: File upload → validation → graph update → database state

**New Component:**

1. **Presentational UI component:**
   - Create `/client/src/components/[Feature].vue` (Vue SFC)
   - Import in parent component
   - Style: Use global classes from `style.css` (`.btn-primary`, `.input-text`)
   - Scoped styles only for layout, never override colors/fonts

2. **Modal component:**
   - Create `/client/src/components/[Feature]Modal.vue`
   - Pattern: Prop `isOpen`, emit `@close`
   - Form fields: Use `<input>`, `CustomSelect`, `CustomCombobox` (not native `<select>`)
   - Buttons: `.btn-primary`, `.btn-ghost`, `.btn-danger` classes

**New Route:**

1. **Add to router:**
   - Edit `/client/src/router/index.ts`
   - Add route object: `{ path: '/new-route', name: 'newRoute', component: () => import('...'), meta: { requiresAuth: true } }`
   - Add view: `/client/src/views/NewRouteView.vue`

2. **Add authentication guard if needed:**
   - Set `meta: { requiresAuth: true }` on route
   - Existing `setupRouterGuards()` checks this automatically

**New Store Module:**

1. **Create new Pinia store:**
   - Create `/client/src/stores/[feature].ts`
   - Pattern: `defineStore('featureName', () => { ... })`
   - Export `useFeatureStore`

2. **Use in components:**
   - Import: `import { useFeatureStore } from '../stores/feature'`
   - Call in setup: `const store = useFeatureStore()`

**New Utility Function:**

- **Server utility:** `/server/src/lib/[feature].ts`
- **Client utility:** `/client/src/utils/[feature].ts` (pure functions, no Vue)
- **Client composable:** `/client/src/composables/use[Feature].ts` (Vue-aware)

**New Database Schema Change:**

1. Edit `/server/prisma/schema.prisma`
2. Run: `npm run db:migrate --workspace=server`
3. Prisma auto-generates migration file in `/server/prisma/migrations/`
4. Commit migration file + schema.prisma
5. Regenerate Prisma client: `npm run db:generate --workspace=server`

## Special Directories

**client/dist/:**
- Purpose: Production build output
- Generated: `npm run build --workspace=client`
- Committed: No (in .gitignore)
- Contents: Minified JS, CSS, HTML bundles

**server/dist/:**
- Purpose: Compiled JavaScript output
- Generated: `npm run build --workspace=server`
- Committed: No (in .gitignore)
- Contents: .js + .js.map files

**node_modules/:**
- Purpose: Installed dependencies
- Generated: `npm install`
- Committed: No (in .gitignore)
- Size: Large (use .npmrc to manage)

**server/prisma/migrations/:**
- Purpose: Database migration history (version control)
- Generated: Auto-created by `npx prisma migrate dev`
- Committed: Yes (essential for reproducibility)
- Do not edit manually

**e2e/:**
- Purpose: End-to-end tests (runs against both client + server)
- Type: Playwright test suite
- Run: `npx playwright test`
- Committed: Yes

**docs/sample/:**
- Purpose: Local development test data only (Terraform samples, design files)
- Committed: No (in .gitignore)
- Use case: Populate local graph for testing imports

**.planning/codebase/:**
- Purpose: GSD architecture documentation (generated by `/gsd:map-codebase`)
- Committed: Yes
- Content: ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, STACK.md, INTEGRATIONS.md, CONCERNS.md

---

*Structure analysis: 2026-04-02*
