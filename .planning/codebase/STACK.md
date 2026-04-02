# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript 5.5.3 - Used throughout both client and server

**JavaScript/Modules:**
- ES2020+ (client via ESNext), ES2022 (server)

## Runtime

**Environment:**
- Node.js - Server runtime
- Browser (modern, ES2020+ compatible) - Client runtime

**Package Manager:**
- npm (npm workspaces)
- Lockfile: `package-lock.json` present

## Frameworks

**Core - Client:**
- Vue 3 3.4.0 - Frontend SPA framework using Composition API
- Vue Router 4.3.0 - Client-side routing
- Pinia 2.1.7 - State management (stores at `client/src/stores/`)
- Vite 5.0.0 - Build tool and dev server (config: `client/vite.config.ts`)
- Vite SSG 28.3.0 - Static site generation for landing pages

**Core - Server:**
- Express 4.21.0 - HTTP API framework
- TypeScript 5.5.3 - Static type checking

**ORM & Database:**
- Prisma 5.22.0 - ORM and database toolkit
  - Client: `@prisma/client` 5.22.0
  - Schema: `server/prisma/schema.prisma`
  - Migrations: `server/prisma/migrations/`

**Testing:**
- @playwright/test 1.58.2 - E2E testing framework (root devDependencies, no tests written yet)

**Build & Dev:**
- ts-node-dev 2.0.0 - Auto-restarting TypeScript development server (`npm run dev:server` uses `ts-node-dev --respawn`)
- vue-tsc 2.0.0 - Vue 3 TypeScript compiler for type checking

## Key Dependencies

**Authentication & Security:**
- jsonwebtoken 9.0.2 - JWT token generation and verification
  - Access Token: 15 minutes (configurable via JWT_ACCESS_EXPIRES_IN env var)
  - Refresh Token: 30 days (configurable via JWT_REFRESH_EXPIRES_IN env var)
- bcryptjs 2.4.3 - Password hashing with 12 salt rounds
- google-auth-library 10.6.2 - Google OAuth 2.0 client for ID token verification
- helmet 7.1.0 - Express security middleware (CORS, CSP, XSS, clickjacking protection)

**Encryption:**
- crypto (Node.js built-in) - Used by `cryptoService.ts`
  - Algorithm: AES-256-GCM for sensitive data encryption (email, username)
  - HMAC-SHA256 for deterministic hashing (email lookup, uniqueness checks)

**HTTP & API:**
- axios 1.7.0 - HTTP client for API calls and OAuth flows
  - Client-side wrapper: `client/src/api/http.ts` with JWT interceptor
  - GitHub OAuth: `fetch()` for OAuth code exchange (no axios)
  - Google OAuth: `google-auth-library`

**Validation:**
- express-validator 7.2.0 - Request validation and sanitization

**Utilities:**
- dotenv 16.4.5 - Environment variable loading
- cors 2.8.5 - CORS middleware (origin: `process.env.CLIENT_ORIGIN` or `http://localhost:5173`)
- vue-i18n 10.0.8 - Internationalization (unused strings detected in codebase)
- @unhead/vue 2.1.12 - Head management for SSR/SSG

**Logging:**
- winston 3.19.0 - Structured logging framework
  - Location: `server/src/lib/logger.ts`
  - Format: Timestamped, colorized, includes metadata and stack traces

**D3 Visualization:**
- d3 7.9.0 - Force-directed graph visualization
  - Types: @types/d3 7.4.3
  - Used in `client/src/components/GraphCanvas.vue` for topology rendering

## Configuration

**Environment Variables - Server:**

Required in `server/.env`:
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

Example: `server/.env.example`

**Environment Variables - Client:**

Optional in `client/.env`:
- `VITE_GOOGLE_CLIENT_ID` - Google Client ID for frontend OAuth flow
- `VITE_GITHUB_CLIENT_ID` - GitHub Client ID for frontend OAuth flow

Example: `client/.env.example`

**TypeScript Configuration:**

- Server: `server/tsconfig.json`
  - Target: ES2022
  - Module: commonjs
  - Strict mode enabled
  - Source maps and declarations enabled

- Client: `client/tsconfig.json`
  - Target: ES2020
  - Module: ESNext
  - Strict mode enabled
  - No unused locals/parameters checking

**Build Configuration:**

- Server: Compiles TypeScript to `dist/` directory
- Client: Vite SSG with pre-rendering of routes `['/', '/login', '/register', '/guide']`
- Dev proxy: Vite routes `/api/*` to `http://localhost:3001`

## Platform Requirements

**Development:**
- Node.js (version not explicitly specified, recommend 18+)
- PostgreSQL 12+ (via Docker)
- Docker & Docker Compose
- Git

**Database:**
- PostgreSQL 12+
- Connection via Docker Compose: `docker-compose up -d`
- Data persistence: `./pgdata/` volume

**Production:**
- Node.js 18+
- PostgreSQL 12+ (managed)
- Environment variables for all secrets
- HTTPS recommended

---

*Stack analysis: 2026-04-02*
