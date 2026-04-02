# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

**OAuth 2.0 Authentication:**
- Google - User OAuth login/registration
  - SDK/Client: `google-auth-library` 10.6.2 (`OAuth2Client`)
  - Implementation: `server/src/services/googleAuthService.ts`
  - Endpoint: ID token verification via Google's `verifyIdToken()` API
  - Auth: `GOOGLE_CLIENT_ID` env var (client-side and server-side)
  - Flow: Frontend sends ID token → Backend verifies → Creates/links user account

- GitHub - User OAuth login/registration
  - Implementation: `server/src/services/githubAuthService.ts`
  - Endpoints: 
    - `https://github.com/login/oauth/access_token` - Code → Token exchange
    - `https://api.github.com/user` - User profile fetch
    - `https://api.github.com/user/emails` - Email verification
  - Auth: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` env vars
  - Flow: Frontend sends authorization code → Backend exchanges for access token → Fetches user data
  - Client library: Native `fetch()` (not wrapped)

## Data Storage

**Databases:**

- PostgreSQL (primary)
  - Connection string: `DATABASE_URL` env var
  - Format: `postgresql://user:password@localhost:5432/dbname`
  - ORM: Prisma (`@prisma/client` 5.22.0)
  - Migration tool: Prisma Migrate (`prisma migrate dev`, `prisma migrate deploy`)
  - Schema location: `server/prisma/schema.prisma`
  - Migrations: `server/prisma/migrations/` (19+ migration files)

**Prisma Models:**
- User (with encrypted email field)
- Session (refresh token storage)
- Project (infrastructure topology projects)
- ProjectMember (role-based membership)
- ProjectInvitation (collaboration invitations)
- GraphData (D3 graph topology data, positions, contacts)
- AuditLog (action tracking and security audits)
- OAuthAccount (third-party account linking)

**File Storage:**
- Local filesystem only (no cloud storage integrations)
- Graph data persisted as JSON in PostgreSQL (`GraphData.data` field)
- Node positions stored in JSON (`GraphData.positions` field)

**Caching:**
- None detected - No Redis or Memcached integration

## Authentication & Identity

**Auth Provider:**
- Custom + OAuth 2.0 hybrid approach

**Implementation:**

*Custom Password-based:*
- `server/src/services/authService.ts` - Email/password registration and login
- Password hashing: bcryptjs (12 salt rounds)
- Password verification: bcrypt.compare()
- User email encrypted: AES-256-GCM (`cryptoService.ts`)
- User email lookup: HMAC-SHA256 hash (`emailHash` field) for deterministic querying

*OAuth Flows:*
- Google OAuth: ID token verification (no server-to-server exchange required)
- GitHub OAuth: Authorization code flow with token exchange
- Account linking: Users can connect multiple OAuth providers to one account
- Auto-merge: If OAuth email matches existing account, automatically link provider

**Token Management:**
- JWT Access Token: 15 minutes (httpOnly recommended but not enforced)
- JWT Refresh Token: 30 days, stored in `Session` table
- Token location: Sent in `Authorization: Bearer <token>` header
- Refresh flow: Client sends refresh token to `/api/auth/refresh` endpoint
- Middleware: `server/src/middleware/authenticate.ts` - JWT verification per route

## Monitoring & Observability

**Error Tracking:**
- None detected - No Sentry, DataDog, or similar integration

**Logs:**
- Winston 3.19.0 structured logging
  - Location: `server/src/lib/logger.ts`
  - Output: Console only (colorized in development)
  - Metadata included: userId, method, path, status code, duration
  - Stack traces: Captured for errors
  - Audit trail: `AuditLog` table for security events
    - Fields: action, status, userId, email, ipAddress, userAgent, failReason, nodeId
    - Indexed for: projectId, userId, email, action, status (all sorted by creation date DESC)

## CI/CD & Deployment

**Hosting:**
- Not specified - Codeless platform requirements in documentation

**CI Pipeline:**
- Not detected - No GitHub Actions, GitLab CI, or other CI/CD configuration

**Development Server:**
- Vite dev server: `npm run dev:client` (port 5173)
- Express dev server: `npm run dev:server` (port 3001, ts-node-dev with auto-reload)
- Dev proxy: Vite proxies `/api/*` to `http://localhost:3001`

**Build:**
- Client: `npm run build` → Vite SSG build with `vite-ssg`
- Server: `npm run build` → TypeScript compilation to `dist/` directory
- Server start: `npm start` → Runs `node dist/server.js`

## Environment Configuration

**Required Environment Variables:**

*Server (.env):*
```
DATABASE_URL=postgresql://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
ENCRYPTION_KEY=<64-hex-characters>
GOOGLE_CLIENT_ID=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

*Client (.env):*
```
VITE_GOOGLE_CLIENT_ID=...
VITE_GITHUB_CLIENT_ID=...
```

**Secrets Location:**
- Development: `.env` and `.env.example` files in workspace roots
- Production: Environment variable injection (container/platform-specific)
- Never committed: `.env` is in `.gitignore`

**Encryption Key Generation:**
```bash
# Generate 32-byte hex string for ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# or openssl rand -hex 32
```

## Webhooks & Callbacks

**Incoming Webhooks:**
- None detected

**Outgoing Webhooks:**
- None detected

**Email/Notifications:**
- None detected - No email service integration (SendGrid, AWS SES, etc.)

## Data Encryption

**Sensitive Data Protection:**

- User email: AES-256-GCM encrypted (`encrypt()` in `cryptoService.ts`)
- Email lookup: HMAC-SHA256 hash stored in `emailHash` field
  - Deterministic hash allows equality queries without decryption
  - Enables uniqueness constraints
  - Uses ENCRYPTION_KEY as HMAC key

**Database Fields:**
- `User.email` - Encrypted with AES-256-GCM (IV + Auth Tag + Ciphertext in format: `enc:<iv>:<authTag>:<ciphertext>`)
- `User.emailHash` - HMAC-SHA256 hash for lookups
- `User.username` - Plaintext (non-sensitive)
- `User.passwordHash` - bcryptjs hash (BCRYPT format, one-way)

## Integration Testing

**Test Framework:**
- @playwright/test 1.58.2
- Configuration: Not present yet
- Status: No tests written (noted in CLAUDE.md)

---

*Integration audit: 2026-04-02*
