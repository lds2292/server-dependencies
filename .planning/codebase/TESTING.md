# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Framework

**Runner:**
- Playwright (`@playwright/test` v1.58.2)
- Configured as root devDependency in `package.json`
- E2E only; no unit test framework (Jest/Vitest) present

**Assertion Library:**
- Playwright's built-in `expect()` API
- Example: `expect(token).toBeTruthy()`, `await expect(page.locator(...)).toBeVisible()`

**Run Commands:**
```bash
# E2E tests (from root)
npx playwright test                    # Run all tests
npx playwright test --debug            # Debug mode with inspector
npx playwright test --headed           # Run in headed browser
npx playwright test --project chromium # Single browser
```

> Note: Test run commands not explicitly configured in `package.json` scripts; run manually or via IDE

## Test File Organization

**Location:**
- All test files in `/e2e/` directory at root level
- Separate from `client/` and `server/` workspaces
- Helper utilities in `/e2e/helpers/`

**Naming:**
- Two-digit prefix + topic: `01-auth.spec.ts`, `05-graph-nodes.spec.ts`, `10-import-export.spec.ts`
- Descriptive naming indicates test sequence/priority

**Structure:**
```
e2e/
├── 01-auth.spec.ts           # Authentication flows
├── 02-account.spec.ts        # Account management
├── 03-projects.spec.ts       # Project CRUD
├── 04-members.spec.ts        # Team member management
├── 05-graph-nodes.spec.ts    # Node creation/editing
├── 06-graph-edges.spec.ts    # Dependency creation
├── 07-graph-data.spec.ts     # Data persistence
├── 08-graph-canvas.spec.ts   # Canvas interaction
├── 09-impact-analysis.spec.ts# Impact analysis features
├── 10-import-export.spec.ts  # CSV/Terraform import/export
├── 11-audit-log.spec.ts      # Audit logging
├── 12-i18n-ui.spec.ts        # Internationalization
└── helpers/
    └── auth.ts               # Shared test utilities
```

## Test Structure

**Suite Organization:**
```typescript
test.describe.serial('01. Authentication', () => {
  test.describe('TC-1.1 Registration', () => {
    test('TC-1.1.1 Normal registration', async ({ page }) => {
      // Test implementation
    })

    test('TC-1.1.2 Duplicate email', async ({ page }) => {
      // Test implementation
    })
  })

  // Additional test groups
})
```

**Test Case Naming:**
- Hierarchical: `TC-X.Y.Z` format (Test Case number)
- Example: `TC-1.1.1` = Test Case 1, Group 1, Case 1
- Natural language description after number

**Setup/Teardown:**
- `test.beforeAll()`: Runs before all tests in suite (used for one-time setup like user registration)
  ```typescript
  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    user = await register(page)
    projectId = await createProject(page, `GraphNodeTest-${Date.now()}`)
    await page.close()
  })
  ```
- `test.describe.serial()`: Ensures tests run in declared order (sequential execution)
- No `afterEach` or `afterAll` cleanup observed; pages closed manually

**Assertion Patterns:**
```typescript
// Visibility assertions
await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5000 })
expect(page.url()).toContain('/register')

// Truthiness
expect(token).toBeTruthy()

// Content assertions
const text = await element.textContent()
expect(beforeText).not.toBe(afterText)
```

## Mocking

**Framework:** 
- No mocking framework used; tests interact with real browser and live API
- Playwright's native capabilities for input simulation and HTTP interception

**Patterns:**
- User input via `.fill()`, `.click()`, `.press()`:
  ```typescript
  await page.locator('input[type="email"]').fill(user.email)
  await page.locator('button.btn-auth-submit').click()
  await page.keyboard.press('e')  // Toggle edit mode with E key
  ```

**What to Mock:** Not applicable—tests are integration/E2E focused, not unit tests

**What NOT to Mock:** Nothing mocked; all APIs and UI interactions are real

## Fixtures and Factories

**Test Data:**
- User factory in `e2e/helpers/auth.ts`:
  ```typescript
  export function uniqueUser(prefix = 'testuser') {
    userCounter++
    return {
      email: `${prefix}${userCounter}@test.com`,
      username: `${prefix}${userCounter}`,
      password: 'Test1234!@',
    }
  }
  ```
- Counter-based unique generation to avoid collisions across test runs

**Shared Setup Functions (from `e2e/helpers/auth.ts`):**

```typescript
// Registration and login
export async function register(page: Page, user?: { ... }): Promise<{ ... }>
export async function login(page: Page, user: { email: string; password: string }): Promise<void>
export async function logout(page: Page): Promise<void>

// Project creation
export async function createProject(page: Page, name?: string): Promise<string>

// Node creation
export async function addNode(
  page: Page,
  kind: 'server' | 'l7' | 'infra' | 'external' | 'dns',
  name: string
): Promise<void>

// Auth state management
export function uniqueUser(prefix = 'testuser'): { ... }
export async function ensureLoggedOut(page: Page): Promise<void>
```

**Location:**
- All fixtures in `e2e/helpers/auth.ts`
- Imported in test files as needed

## Coverage

**Requirements:** Not enforced (no coverage configuration detected)

**View Coverage:** Not configured; no coverage reporting in npm scripts

## Test Types

**Unit Tests:** Not present
- No test files in `client/src/**/*.test.ts` or `server/src/**/*.test.ts`
- No Jest/Vitest configuration
- All tests are E2E via Playwright

**Integration Tests:** All tests are integration-level
- Test user workflows across client and server
- Exercise real APIs and database (via docker-compose PostgreSQL)
- Example from `01-auth.spec.ts`:
  ```typescript
  test('TC-1.1.1 Normal registration', async ({ page }) => {
    const user = uniqueUser()
    await page.goto('/register')
    // Fill form fields
    await page.locator('button.btn-auth-submit').click()
    // Assert success
    await page.waitForURL('**/projects', { timeout: 10000 })
    const token = await page.evaluate(() => localStorage.getItem('refreshToken'))
    expect(token).toBeTruthy()
  })
  ```

**E2E Tests:** All Playwright tests are E2E
- Full user journeys from UI to API to database
- Test coverage areas:
  - **01-auth.spec.ts**: Registration, login, logout, password validation
  - **02-account.spec.ts**: Account settings, deactivation
  - **03-projects.spec.ts**: Project creation, editing, deletion
  - **04-members.spec.ts**: Team member invitation, role assignment
  - **05-graph-nodes.spec.ts**: Server/L7/Infra/DNS/External node CRUD
  - **06-graph-edges.spec.ts**: Dependency creation and deletion
  - **07-graph-data.spec.ts**: Graph persistence and versioning
  - **08-graph-canvas.spec.ts**: Canvas interaction (zoom, pan, drag)
  - **09-impact-analysis.spec.ts**: Path analysis and node impact
  - **10-import-export.spec.ts**: CSV and Terraform import
  - **11-audit-log.spec.ts**: Audit log creation and filtering
  - **12-i18n-ui.spec.ts**: Multi-language UI rendering

## Common Patterns

**Async Testing:**
```typescript
// Wait for navigation
await page.waitForURL('**/projects**', { timeout: 30000 })

// Wait for element visibility
await expect(page.locator('.node-card')).toBeVisible({ timeout: 3000 })

// Wait for specific timeout (polling)
await page.waitForTimeout(500)

// Wait for selector to appear in DOM
await page.waitForSelector('.modal, .modal-overlay', { timeout: 5000 })
```

**Selector Patterns:**
- CSS classes: `.error-msg`, `.btn-primary`, `.modal-backdrop`
- Input attributes: `input[type="email"]`, `input[autocomplete="username"]`, `input[required]`
- Text content: `.filter({ hasText: 'text' })`
- Multiple selectors (OR): `.modal, .modal-overlay`
- Attribute selectors: `button[class*="node-item"]`

**Error/State Testing:**
```typescript
test('TC-1.1.2 Duplicate email', async ({ page }) => {
  // Set up duplicate condition
  const dup = uniqueUser('dup')
  
  // Fill form with duplicate email
  await page.locator('input[type="email"]').fill(registeredUser.email)
  // ... other fields ...
  
  // Submit and assert error
  await page.locator('button.btn-auth-submit').click()
  await expect(page.locator('.form-error')).toBeVisible({ timeout: 5000 })
})
```

**Modal Interaction:**
```typescript
// Click to open modal
const addBtn = page.locator('.btn-add')
await addBtn.click()
await page.waitForTimeout(400)

// Fill modal form
const nameInput = page.locator('.modal input[required]').first()
await nameInput.fill(name)

// Submit modal
const saveBtn = page.locator('.modal .btn-primary')
await saveBtn.first().click()
```

**Page Navigation:**
```typescript
// Navigate to URL
await page.goto('/register')

// Navigate and wait
await page.goto(`/projects/${projectId}`)
await page.waitForTimeout(2000)  // Wait for rendering

// Check current URL
expect(page.url()).toContain('/register')
```

**Conditional Testing (Resilience):**
```typescript
// Check if element exists before interaction
const nodeCard = page.locator('.node-card, [class*="node-item"]').first()
if (await nodeCard.isVisible({ timeout: 3000 }).catch(() => false)) {
  await nodeCard.dblclick()
}

// Fallback selectors (compatibility)
const modal = page.locator('.modal, .modal-overlay')
const nameInput = page.locator('.modal input[type="text"], .modal .form-input').first()
```

## Pre-test Requirements

**Database:**
```bash
docker-compose up -d  # Start PostgreSQL for integration tests
```

**Running Servers:**
```bash
npm run dev:client    # Vite dev server on :5173
npm run dev:server    # Express dev on :3001
```

**Environment:**
- Client: Configured to proxy `/api` to `http://localhost:3001` via Vite dev config
- Server: Expects `CLIENT_ORIGIN` env var (defaults to `http://localhost:5173`)
- Tests run against live services, not mocked APIs

## Known Gaps

**No Unit Tests:**
- Service layer (`authService.ts`, `graphService.ts`) untested at unit level
- Utility functions (`csvParser.ts`, `terraformParser.ts`) untested
- Vue composables and store logic tested only through E2E

**No Component Tests:**
- Vue components (e.g., `GraphCanvas.vue`, `ServerModal.vue`) tested only through full page E2E

**Limited Coverage:** 
- Only happy paths and basic error cases covered
- Edge cases (network failures, concurrent operations) not tested
- Performance/load testing not present

**Missing Snapshot Tests:** No visual regression testing configured

---

*Testing analysis: 2026-04-02*
