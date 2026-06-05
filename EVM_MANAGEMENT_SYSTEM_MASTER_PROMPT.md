# 🗳️ EVM Management System — Master Prompt for Claude


---

## SECTION 0 — Project Identity & Stack Declaration

```
You are a senior full-stack engineering team building a production-grade EVM (Electronic Voting Machine) Management System for the Government of India. The team consists of:

- A full-stack engineer with 15+ years of experience
- A UI/UX designer with 10+ years in Indian government digital systems
- A Microsoft SQL Server database architect
- A React architect who designs clean, scalable project structures
- A senior project manager with deep government project experience
- A security engineer specializing in government-grade application security

### TECH STACK (non-negotiable):
- **Frontend**: React 18 + Vite, React Router v6, Zustand (state management), React Query (server state), React Hook Form + Zod (forms/validation), Axios (HTTP), date-fns, Lucide React (icons)
- **Styling**: Tailwind CSS v3 + custom CSS variables for theme; NO component libraries like MUI or Ant Design — build all UI from scratch
- **Backend**: Node.js + Express.js (REST API)
- **Database**: Microsoft SQL Server (mssql npm package); connection string will be provided by the user
- **Auth**: JWT (access + refresh token pattern), bcrypt for password hashing, helmet.js, express-rate-limit, cors
- **QR/Barcode**: @zxing/library for scanning in-browser; jsbarcode for rendering
- **Security**: helmet, express-rate-limit, express-validator, express-mongo-sanitize equivalent for SQL, HTTPS enforced headers, Content Security Policy, audit logging on all sensitive actions
- **Reporting**: react-to-print, recharts for charts
- **Other**: dotenv, winston (logging), morgan (HTTP logs), multer (if file uploads needed)

### PROJECT STRUCTURE (strictly follow this):
evm-management/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── api/               # All Axios API calls, organized by domain
│   │   ├── assets/            # Static assets
│   │   ├── components/        # Reusable UI components (Button, Modal, Table, etc.)
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   └── forms/
│   │   ├── features/          # Feature-based folders (dashboard, auth, evm, users, reports)
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── evm/
│   │   │   ├── users/
│   │   │   ├── reports/
│   │   │   └── search/
│   │   ├── hooks/             # Custom React hooks
│   │   ├── layouts/           # Page layout wrappers (AdminLayout, AuthLayout)
│   │   ├── routes/            # Route definitions and protected route HOCs
│   │   ├── store/             # Zustand stores
│   │   ├── styles/            # Global CSS and theme variables
│   │   ├── utils/             # Utility functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── vite.config.js
│
├── server/                    # Express backend
│   ├── src/
│   │   ├── config/            # DB config, env config, logger config
│   │   ├── controllers/       # Route controllers, one file per domain
│   │   ├── middleware/        # Auth, error handler, rate limiter, validators
│   │   ├── models/            # DB query functions (no ORM — raw mssql queries)
│   │   ├── routes/            # Express routers
│   │   ├── services/          # Business logic layer
│   │   ├── utils/             # Helper functions, audit logger
│   │   └── app.js             # Express app setup
│   └── server.js              # Entry point
│
├── database/
│   ├── schema.sql             # Full MS SQL Server schema with all tables, indexes, constraints
│   ├── seed.sql               # Initial seed data (admin user, reference data)
│   └── migrations/            # Versioned migration scripts
│
├── .env.example
├── .gitignore
└── README.md

### DESIGN DIRECTION:
- Clean, institutional yet modern — think "India Stack" aesthetic meets enterprise dashboard
- Color palette: Deep navy (#0A1628) as primary, saffron accent (#FF6B00), clean white surfaces, subtle grey hierarchy
- Typography: 'DM Sans' for UI text, 'DM Mono' for codes/IDs/barcodes
- NO purple gradients, NO generic AI aesthetics, NO rounded-everything cards
- Sharp geometry, subtle grid lines, government-grade authority in the layout
- Fully responsive: mobile-first, works on 360px mobile up to 1920px desktop
- All interactive states: hover, focus, active, disabled, loading, error — all defined
- Accessibility: ARIA labels, keyboard navigation, sufficient color contrast (WCAG AA)

### GENERAL RULES:
- NEVER write everything in a single file. Every component, hook, utility, route, controller must be in its own file
- All API calls go in /api/ folder only — never inline fetch() in components
- All hardcoded strings/labels go in a constants file
- All DB queries use parameterized queries — NEVER string-concatenated SQL
- Passwords in connection strings must be wrapped in quotes in the config
- Every destructive or sensitive action must write to an audit_log table
- Session timeout: 30 minutes of inactivity auto-logout
- All forms have client-side + server-side validation

Acknowledge this setup and confirm you are ready to begin building section by section.
```

---

## SECTION 1 — Database Schema (MS SQL Server)

```
Now create the complete Microsoft SQL Server database schema. Save this as database/schema.sql

Create the following tables with proper constraints, indexes, and relationships. Use NVARCHAR for all string fields to support Unicode. All tables must have created_at, updated_at, created_by columns. Use IDENTITY(1,1) for surrogate PKs where applicable.

### TABLES TO CREATE:

**1. states**
- state_id (INT PK IDENTITY), state_code (NVARCHAR(10) UNIQUE), state_name (NVARCHAR(100)), is_active (BIT DEFAULT 1), created_at, updated_at

**2. districts**
- district_id (INT PK IDENTITY), district_code (NVARCHAR(20) UNIQUE), district_name (NVARCHAR(100)), state_id (FK → states), is_active (BIT DEFAULT 1), created_at, updated_at

**3. users**
- user_id (INT PK IDENTITY), user_code (NVARCHAR(50) UNIQUE NOT NULL) [this is the login ID like district_code + suffix], password_hash (NVARCHAR(255) NOT NULL), full_name (NVARCHAR(150)), email (NVARCHAR(150)), phone (NVARCHAR(20)), role (NVARCHAR(20) CHECK IN ('ADMIN', 'STATE_OFFICER', 'DISTRICT_OFFICER')), state_id (FK → states, NULLABLE for ADMIN), district_id (FK → districts, NULLABLE for ADMIN), user_type (NVARCHAR(10) CHECK IN ('PERMANENT', 'TEMPORARY')), valid_from (DATETIME2), valid_until (DATETIME2 NULLABLE), is_active (BIT DEFAULT 1), last_login (DATETIME2), created_by (INT FK → users), created_at, updated_at

**4. evm_units**
- unit_id (INT PK IDENTITY), unit_code (NVARCHAR(100) UNIQUE NOT NULL) [the barcode/QR value], unit_type (NVARCHAR(20) CHECK IN ('CONTROL_UNIT', 'BALLOT_UNIT', 'VVPAT')), manufacturer (NVARCHAR(100)), manufacturing_year (INT), serial_number (NVARCHAR(100)), current_state_id (INT FK → states NULLABLE), current_district_id (INT FK → districts NULLABLE), current_location_description (NVARCHAR(255)), current_status (NVARCHAR(30) CHECK IN ('IN_WAREHOUSE', 'IN_TRANSIT', 'DEPLOYED', 'FAULTY', 'DECOMMISSIONED', 'RETURNED')), is_active (BIT DEFAULT 1), created_at, updated_at, created_by

**5. dispatch_batches**
- batch_id (INT PK IDENTITY), batch_code (NVARCHAR(50) UNIQUE) [auto-generated like BATCH-YYYYMMDD-XXXX], dispatched_by (INT FK → users), from_state_id (INT FK → states), from_district_id (INT FK → districts NULLABLE), to_state_id (INT FK → states), to_district_id (INT FK → districts NULLABLE), dispatch_date (DATETIME2 DEFAULT GETDATE()), expected_arrival (DATETIME2 NULLABLE), actual_arrival (DATETIME2 NULLABLE), dispatch_status (NVARCHAR(20) CHECK IN ('PENDING', 'IN_TRANSIT', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')), remarks (NVARCHAR(500)), total_units (INT DEFAULT 0), received_by (INT FK → users NULLABLE), created_at, updated_at

**6. dispatch_items**
- item_id (INT PK IDENTITY), batch_id (INT FK → dispatch_batches), unit_id (INT FK → evm_units), item_status (NVARCHAR(20) CHECK IN ('DISPATCHED', 'RECEIVED', 'MISSING', 'DAMAGED')), received_at (DATETIME2 NULLABLE), condition_on_receipt (NVARCHAR(20) CHECK IN ('GOOD', 'DAMAGED', 'FAULTY') NULLABLE), remarks (NVARCHAR(255)), created_at, updated_at

**7. evm_movement_history**
- history_id (INT PK IDENTITY), unit_id (INT FK → evm_units), action_type (NVARCHAR(30) CHECK IN ('REGISTERED', 'DISPATCHED', 'RECEIVED', 'DEPLOYED', 'RETURNED', 'REPORTED_FAULTY', 'DECOMMISSIONED')), batch_id (INT FK → dispatch_batches NULLABLE), from_state_id (INT NULLABLE), from_district_id (INT NULLABLE), to_state_id (INT NULLABLE), to_district_id (INT NULLABLE), action_by (INT FK → users), action_date (DATETIME2 DEFAULT GETDATE()), remarks (NVARCHAR(500)), created_at

**8. audit_logs**
- log_id (INT PK IDENTITY), user_id (INT FK → users NULLABLE), action (NVARCHAR(100)), entity_type (NVARCHAR(50)), entity_id (NVARCHAR(100)), old_values (NVARCHAR(MAX) NULLABLE), new_values (NVARCHAR(MAX) NULLABLE), ip_address (NVARCHAR(50)), user_agent (NVARCHAR(500)), created_at (DATETIME2 DEFAULT GETDATE())

**9. refresh_tokens**
- token_id (INT PK IDENTITY), user_id (INT FK → users), token_hash (NVARCHAR(255)), expires_at (DATETIME2), is_revoked (BIT DEFAULT 0), created_at, ip_address (NVARCHAR(50))

Also create:
- All necessary foreign key constraints
- Indexes on: unit_code, batch_code, user_code, state_id, district_id, dispatch_date, current_status, action_date
- A view: vw_evm_current_status joining evm_units + states + districts for easy querying
- A view: vw_dispatch_summary joining dispatch_batches + users + states + districts

Also create database/seed.sql with:
- 5 sample states (use real Indian states: Maharashtra, UP, MP, Rajasthan, Gujarat)
- 3 districts per state
- 1 default ADMIN user with user_code='ADMIN001', password hash placeholder (bcrypt of 'Admin@123#Secure')
- 10 sample EVM units of mixed types

Write clean, commented SQL. No ORM, pure MSSQL syntax.
```

---

## SECTION 2 — Backend: Project Setup & Configuration

```
Now scaffold the complete Node.js/Express backend. Create all files listed below:

**server/package.json** — with all dependencies: express, mssql, bcryptjs, jsonwebtoken, helmet, cors, express-rate-limit, express-validator, dotenv, winston, morgan, date-fns, uuid

**server/.env.example**:
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
DB_SERVER=your_server
DB_PORT=1433
DB_NAME=evm_management
DB_USER=your_db_user
DB_PASSWORD="your_password_with_special_chars#here"
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=false
CLIENT_URL=http://localhost:5173
SESSION_TIMEOUT_MINUTES=30

**server/src/config/database.js** — mssql connection pool with:
- Connection pooling (min: 2, max: 10)
- requestTimeout: 30000
- Password read from env, passed as-is (no parsing)
- Retry logic on initial connect (3 retries, 5s apart)
- Export: getPool(), query(sql, params) helper, transaction() helper
- Parameterized query helper that maps named params {name: value} to mssql inputs

**server/src/config/logger.js** — Winston logger:
- Console transport in dev, file transport in prod
- Log levels: error, warn, info, http, debug
- Log format: timestamp + level + message + metadata

**server/src/app.js** — Express app with:
- helmet() with CSP headers
- cors() configured to CLIENT_URL only
- express-rate-limit: 100 req/15min general, 10 req/15min for auth routes
- morgan HTTP logging
- express.json() with 10mb limit
- All routes mounted
- Global error handler middleware
- 404 handler

**server/src/middleware/auth.middleware.js** — JWT verification middleware:
- verifyToken: checks Authorization Bearer header, validates JWT, attaches req.user
- verifyAdmin: checks role === 'ADMIN'
- checkUserActive: queries DB to confirm user is still active and not expired (for temp users)
- verifyRefreshToken: for refresh endpoint

**server/src/middleware/errorHandler.js** — centralized error handler:
- Handles validation errors (400), auth errors (401/403), not found (404), server errors (500)
- Never exposes stack traces in production
- Logs all 5xx errors via winston

**server/src/middleware/validator.middleware.js** — express-validator chains for:
- loginValidation
- createUserValidation
- createEVMValidation
- dispatchValidation
- Each exported as an array of validation chains + handleValidationErrors middleware

**server/src/utils/auditLogger.js** — audit log utility:
- logAction(userId, action, entityType, entityId, oldValues, newValues, req) → inserts into audit_logs

**server/src/utils/batchCodeGenerator.js** — generates batch codes like BATCH-20240315-A3F9

Create all files now with full working code. No placeholder TODOs — complete implementation.
```

---

## SECTION 3 — Backend: Auth & User Management APIs

```
Create the complete authentication and user management API layer:

**server/src/models/user.model.js** — DB query functions:
- findByUserCode(userCode)
- findById(userId)
- createUser(userData) — hashes password with bcryptjs, 12 rounds
- updateUser(userId, updateData)
- deactivateUser(userId, adminId)
- listUsers(filters: {state_id, district_id, role, user_type, is_active, search}, pagination: {page, limit})
- storeRefreshToken(userId, tokenHash, expiresAt, ipAddress)
- revokeRefreshToken(tokenHash)
- findRefreshToken(tokenHash)
- checkTemporaryUserExpiry() — marks temp users inactive when valid_until has passed

**server/src/services/auth.service.js**:
- login(userCode, password, ipAddress, userAgent):
  → validates credentials, checks active status, checks temp user expiry
  → generates accessToken (30min) + refreshToken (7 days)
  → stores refresh token hash in DB
  → updates last_login
  → returns {user: {...safeFields}, accessToken, refreshToken}
- refresh(refreshToken, ipAddress): validates + rotates refresh token
- logout(refreshToken): revokes refresh token
- generateTokens(userId, role, stateId, districtId): JWT generation helper

**server/src/services/user.service.js**:
- createUser(adminId, userData): creates user, logs audit, sends back sanitized user
- updateUser(adminId, userId, updateData)
- toggleUserStatus(adminId, userId)
- getUsers(filters, pagination)
- getUserDetail(userId): full user info with state/district names

**server/src/controllers/auth.controller.js** — POST /login, POST /refresh, POST /logout

**server/src/controllers/user.controller.js** — GET/POST/PUT/DELETE for user management (admin only)

**server/src/routes/auth.routes.js** — auth router with rate limiting
**server/src/routes/user.routes.js** — user router with auth + admin middleware

All passwords must NEVER be logged. Auth tokens must be HttpOnly cookie OR Authorization header — support both. All inputs sanitized. Implement brute force protection (lock after 5 failed attempts for 15 minutes, stored in DB or in-memory Map).
```

---

## SECTION 4 — Backend: EVM Unit & Dispatch APIs

```
Create the EVM unit management and dispatch system API:

**server/src/models/evm.model.js**:
- findByCode(unitCode)
- findById(unitId)
- createUnit(unitData, createdBy)
- updateUnitStatus(unitId, status, stateId, districtId, locationDesc)
- listUnits(filters: {state_id, district_id, unit_type, status, search}, pagination)
- getUnitHistory(unitId): full movement history with user names, state/district names
- bulkUpdateStatus(unitIds, status, stateId, districtId): for batch receive
- globalSearch(query): searches unit_code, serial_number across evm_units + last known location

**server/src/models/dispatch.model.js**:
- createBatch(batchData, userId): creates dispatch_batches record, returns batch with code
- addItemsToBatch(batchId, unitIds): bulk insert into dispatch_items, validates each unitCode exists
- getBatchById(batchId): full batch with items + unit details
- listBatches(filters: {from_state, to_state, status, date_from, date_to, dispatched_by}, pagination)
- receiveBatch(batchId, receivedById, itemReceipts): updates dispatch_items status, updates evm_units location, inserts movement history for each unit, updates batch status
- cancelBatch(batchId, adminId, reason)
- getPendingReceivables(userId): batches sent TO the current user's state/district

**server/src/services/dispatch.service.js**:
- initiateDispatch(userId, userInfo, dispatchData, scannedUnits):
  → validates all unit codes exist and are not already in transit
  → creates batch
  → bulk inserts dispatch items
  → updates each unit status to IN_TRANSIT
  → inserts movement history for each unit (action: DISPATCHED)
  → logs audit
  → returns batch summary
- receiveDispatch(userId, userInfo, batchId, receipts):
  → validates user's state/district matches batch to_state/district
  → processes each item
  → updates unit current location to user's state/district
  → inserts movement history for each unit (action: RECEIVED)
  → updates batch status
  → logs audit

**server/src/controllers/evm.controller.js** — CRUD for EVM units + lookup by code
**server/src/controllers/dispatch.controller.js** — dispatch + receive endpoints
**server/src/routes/evm.routes.js**
**server/src/routes/dispatch.routes.js**

**server/src/controllers/reports.controller.js**:
- GET /reports/inventory-summary: units by state/district/type/status
- GET /reports/dispatch-history: batches with filters
- GET /reports/movement-timeline: timeline of unit movements
- GET /reports/unit-status-breakdown: pie/bar chart data
- GET /search/global?q=: searches unit_code, batch_code, serial_number, returns unified results
- GET /reference/states: all states
- GET /reference/districts?state_id=: districts by state

All endpoints must return consistent JSON: { success: true, data: {...}, message: '', pagination: {...} }
Errors: { success: false, error: { code: '', message: '', details: [] } }
```

---

## SECTION 5 — Frontend: Vite Setup, Routing & Global Styles

```
Now scaffold the complete React frontend:

**client/vite.config.js** — with proxy to http://localhost:5000, path aliases (@/ → src/)

**client/src/styles/theme.css** — CSS custom properties:
:root {
  /* Colors */
  --color-navy-950: #040D1A;
  --color-navy-900: #0A1628;
  --color-navy-800: #0F2040;
  --color-navy-700: #162B55;
  --color-navy-600: #1E3A6E;
  --color-saffron-500: #FF6B00;
  --color-saffron-400: #FF8534;
  --color-saffron-300: #FFA366;
  --color-white: #FFFFFF;
  --color-grey-50: #F8F9FB;
  --color-grey-100: #F0F2F5;
  --color-grey-200: #E2E6EC;
  --color-grey-300: #C8CFD8;
  --color-grey-500: #8A95A3;
  --color-grey-700: #4A5568;
  --color-grey-900: #1A202C;
  --color-success: #059669;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #2563EB;
  
  /* Typography */
  --font-sans: 'DM Sans', sans-serif;
  --font-mono: 'DM Mono', monospace;
  
  /* Spacing, shadows, radii, transitions... */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.08);
  --shadow-md: 0 4px 16px rgba(0,0,0,0.12);
  --shadow-lg: 0 8px 32px rgba(0,0,0,0.16);
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
}

Import DM Sans and DM Mono from Google Fonts in index.html.

**client/src/routes/index.jsx** — React Router v6 route tree:
- / → redirect to /dashboard if logged in, else /login
- /login → AuthLayout > LoginPage
- /dashboard → AdminLayout > DashboardPage (protected)
- /evm → AdminLayout > EVMListPage (protected)
- /evm/register → AdminLayout > EVMRegisterPage (protected, admin only)
- /dispatch → AdminLayout > DispatchPage (protected)
- /dispatch/:batchId → AdminLayout > DispatchDetailPage (protected)
- /receive → AdminLayout > ReceivePage (protected)
- /users → AdminLayout > UsersPage (protected, admin only)
- /reports → AdminLayout > ReportsPage (protected)
- /search → AdminLayout > GlobalSearchPage (protected)
- /audit → AdminLayout > AuditLogPage (protected, admin only)
- * → NotFoundPage

**client/src/routes/ProtectedRoute.jsx** — checks auth store, redirects to /login if not authenticated, checks role permissions, handles session timeout

**client/src/store/authStore.js** — Zustand store:
- state: { user, accessToken, isAuthenticated, isLoading }
- actions: login, logout, refreshToken, setUser
- Persist to sessionStorage (not localStorage — clears on tab close)
- Auto-logout timer on inactivity (30 min)

**client/src/api/axiosInstance.js** — configured Axios:
- baseURL from env
- Request interceptor: attach Authorization header
- Response interceptor: on 401, attempt token refresh, retry request
- On refresh failure: logout and redirect to /login

**client/src/api/** — one file per domain:
- auth.api.js: login, logout, refresh
- evm.api.js: CRUD + lookup
- dispatch.api.js: create, receive, list
- users.api.js: CRUD
- reports.api.js: all report endpoints
- reference.api.js: states, districts

Create all these files now with complete, working implementation.
```

---

## SECTION 6 — Frontend: Core UI Components

```
Build the complete reusable component library. Every component must be in its own file under client/src/components/. All must be fully responsive and styled using Tailwind + CSS variables from theme.css.

**components/common/Button.jsx** — variants: primary (saffron fill), secondary (navy outline), ghost (transparent), danger (red). Sizes: sm, md, lg. States: loading (spinner), disabled. Full keyboard accessibility.

**components/common/Input.jsx** — text input with label, helper text, error state, prefix/suffix icon slots, character count option. NEVER use placeholder as label.

**components/common/Select.jsx** — custom dropdown (not native select) with search/filter, keyboard navigation, multi-select option, loading state.

**components/common/Modal.jsx** — accessible modal with focus trap, Escape to close, backdrop click to close option, sizes: sm/md/lg/full. Animated entrance/exit.

**components/common/Table.jsx** — data table with sortable columns, pagination controls, loading skeleton rows, empty state illustration, row selection (checkboxes), sticky header, responsive (horizontal scroll on mobile).

**components/common/Badge.jsx** — status badges for EVM statuses, dispatch statuses, user types. Color-coded with dot indicators.

**components/common/Toast.jsx** + **useToast hook** — toast notification system: success, error, warning, info. Stack up to 3. Auto-dismiss with progress bar.

**components/common/Spinner.jsx** — loading spinner, multiple sizes

**components/common/ConfirmDialog.jsx** — confirmation modal for destructive actions

**components/common/Pagination.jsx** — page number navigation with ellipsis

**components/common/SearchInput.jsx** — debounced search input with clear button, 300ms debounce

**components/common/EmptyState.jsx** — illustrated empty state with title + description + optional CTA button

**components/layout/Sidebar.jsx** — collapsible sidebar navigation:
- Logo + app title at top
- Navigation items with icons (Lucide), active state, hover state
- User info card at bottom with logout button
- Collapses to icon-only on mobile (hamburger toggle)
- Nav items: Dashboard, EVM Units, Dispatch, Receive, Users (admin only), Reports, Global Search, Audit Log (admin only)

**components/layout/Header.jsx** — top header bar:
- Page title (dynamic)
- Breadcrumb trail
- User avatar + name with dropdown (Profile, Change Password, Logout)
- Notification bell (future-ready)

**components/layout/AdminLayout.jsx** — Sidebar + Header + main content area with proper spacing

**components/layout/AuthLayout.jsx** — centered card layout for login page

**components/forms/FormField.jsx** — wrapper that connects React Hook Form + Input/Select

Create all components with full Tailwind styling, proper prop types via JSDoc, and inline comments where logic is non-obvious.
```

---

## SECTION 7 — Frontend: Dashboard Page

```
Build the main Dashboard page at client/src/features/dashboard/DashboardPage.jsx

The dashboard must show:

**Top KPI Cards (4 cards in a row, stack on mobile):**
1. Total EVM Units (with breakdown: Control Units / Ballot Units / VVPAT)
2. In Transit (count of units currently moving between locations)
3. Deployed Units (currently at polling stations)
4. Faulty / Under Repair

Each card: large number, trend indicator, icon, saffron accent on hover.

**Quick Actions bar:**
- "New Dispatch" button → navigates to /dispatch
- "Receive Units" button → navigates to /receive
- "Scan & Search" button → opens a quick-scan modal

**Charts section (2 columns, stack on mobile):**
1. Bar chart: EVM Units by State (using recharts BarChart, navy/saffron color scheme)
2. Donut chart: Units by Status breakdown (using recharts PieChart)

**Recent Dispatches table:**
- Last 10 dispatch batches
- Columns: Batch Code, From, To, Units, Status, Date
- Status badges color-coded
- "View All" link

**Pending Receipts section (only shown to non-admin users):**
- Batches pending receipt for the current user's district
- Alert-style card if any pending

All data fetched via React Query (useQuery hooks). Show skeleton loaders while loading. Handle error states gracefully with retry buttons.

Create supporting files:
- features/dashboard/hooks/useDashboardData.js — React Query hooks
- features/dashboard/components/KPICard.jsx
- features/dashboard/components/RecentDispatches.jsx
- features/dashboard/components/PendingReceipts.jsx
- features/dashboard/components/InventoryChart.jsx
- features/dashboard/components/StatusDonut.jsx
```

---

## SECTION 8 — Frontend: Dispatch (Send EVM) Feature

```
Build the complete EVM Dispatch feature — this is the core workflow:

**features/evm/dispatch/DispatchPage.jsx** — multi-step dispatch wizard:

**Step 1: Scan & Add Units**
- QR/Barcode scanner using @zxing/library (camera-based scanning)
- Manual entry fallback input (type code and press Enter)
- As each unit is scanned/entered:
  → API call to GET /evm/lookup/:code to fetch unit details
  → Show unit card: Code, Type (Control/Ballot/VVPAT), Current Location, Status badge
  → If unit is IN_TRANSIT already: show warning, don't add
  → If unit not found: show error toast
  → Scanned units list with remove button for each
- Running count of scanned units: X Control Units, Y Ballot Units, Z VVPATs
- "Next" button (disabled until at least 1 unit scanned)

**Step 2: Destination Selection**
- "Sending From" section: auto-filled from logged-in user's state/district (read-only, shown as info)
- "Sending To" section:
  → State dropdown (all states)
  → District dropdown (filtered by selected state, loaded dynamically)
  → Expected Arrival Date (date picker)
  → Remarks (textarea, optional, max 500 chars)
- Summary panel on right side: list of scanned units count by type
- "Back" and "Confirm Dispatch" buttons

**Step 3: Confirmation & Result**
- Show dispatch batch details: auto-generated Batch Code, From, To, Unit count
- Print/Download dispatch challan (react-to-print)
- "Dispatch Another" and "View Batch" buttons

Supporting files:
- features/evm/dispatch/components/QRScanner.jsx — camera scanner component with torch toggle, camera switch (front/back), pause/resume
- features/evm/dispatch/components/ScannedUnitCard.jsx
- features/evm/dispatch/components/DispatchSummary.jsx
- features/evm/dispatch/components/DispatchChallan.jsx — printable challan template
- features/evm/dispatch/hooks/useDispatch.js — React Query mutation + state management

The scanner must:
- Request camera permission gracefully
- Show fallback if camera not available
- Decode both QR codes and 1D barcodes
- Prevent duplicate scans (check against already-scanned list)
- Play a subtle success sound (Web Audio API) on successful scan
- Visual flash animation on successful scan
```

---

## SECTION 9 — Frontend: Receive EVM Feature & EVM List

```
**features/evm/receive/ReceivePage.jsx** — receive dispatched units:

- List of pending dispatch batches sent TO the current user's state/district
- Each batch card: Batch Code, From location, Expected Arrival, Unit count, Days pending
- "Receive Batch" button on each card

**ReceiveBatchModal.jsx** — modal for processing receipt:
- Batch summary at top
- Table of all units in the batch
- For each unit: checkbox (received/not received), condition dropdown (Good/Damaged/Faulty), remarks
- "Select All Received" quick button
- "Mark All Good" quick button
- Submit confirmation

**features/evm/EVMListPage.jsx** — paginated EVM inventory:
- Filters: State, District, Unit Type, Status — all as dropdowns
- Search by unit code or serial number
- Table: Unit Code (monospace), Type badge, Manufacturer, Year, Current Location, Status badge, Actions (View History)
- "Register New EVM" button (admin only) → ReceiveBatchModal or RegisterEVMPage

**features/evm/EVMDetailPage.jsx** — unit detail with full movement history:
- Unit info card at top
- Movement timeline (vertical timeline component) showing all history events
- Each event: action icon, date, from → to location, done by, remarks
- Current status prominently shown

**components/common/Timeline.jsx** — reusable vertical timeline component

Create all supporting hooks, components in proper subdirectory structure.
```

---

## SECTION 10 — Frontend: User Management & Auth Pages

```
**features/auth/LoginPage.jsx** — login page:
- AuthLayout wrapper
- Government seal / EVM management branding at top
- User ID and Password fields
- Show/hide password toggle
- "Remember this device" checkbox (extends session)
- Login button with loading state
- Error message display (invalid credentials, account locked, expired temp account)
- NO sign-up link (admin creates users)
- Responsive: full height, centered card

**features/users/UsersPage.jsx** — user management (admin only):
- Table of all users with filters: State, District, Role, User Type, Status
- Search by name, user_code
- Per row: User Code, Full Name, Role badge, State/District, Type (Permanent/Temp), Status, Expiry (for temp), Last Login, Actions (Edit, Toggle Active)
- "Create User" button → CreateUserModal

**features/users/components/CreateUserModal.jsx**:
- User Code input (shown as district_code prefix + admin-enters suffix)
- Full Name, Email, Phone
- Role select (STATE_OFFICER, DISTRICT_OFFICER — admin can't create another ADMIN via UI)
- State select → District select (dynamic)
- User Type: Permanent vs Temporary toggle
  → If Temporary: Valid From + Valid Until date pickers
- Password field + Confirm Password with strength indicator
- Form validation with Zod schema

**features/users/components/EditUserModal.jsx** — same form pre-filled, password field optional

**features/users/hooks/useUsers.js** — React Query for user CRUD

Create also:
- features/reports/ReportsPage.jsx with tabs for: Inventory Summary, Dispatch History, Movement Timeline — each tab with filters + recharts visualizations + export to CSV/print button
- features/search/GlobalSearchPage.jsx — full-page search: type 3+ chars to search, shows results in categorized sections (EVM Units, Dispatch Batches), clicking result shows full detail in a slide-over panel
```

---

## SECTION 11 — Security Hardening, Error Boundaries & Final Polish

```
Apply final security hardening and production polish:

**Security (server-side):**
- In server/src/middleware/security.middleware.js:
  → sqlInjectionGuard: scans req.body, req.query, req.params for common SQL injection patterns, rejects with 400
  → xssGuard: sanitizes all string inputs using a simple strip-tags approach
  → Add all middleware to app.js in correct order
- Ensure all DB queries in models use named parameters with mssql's request.input() — audit every model file
- Add CSRF token generation + validation for state-changing requests (POST/PUT/DELETE)
- HTTP security headers via helmet: X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin, Permissions-Policy, HSTS

**Security (client-side):**
- client/src/utils/sanitize.js — DOMPurify-equivalent simple sanitizer for displayed data
- All user-generated content rendered as text (never dangerouslySetInnerHTML)
- Token storage: accessToken in memory (Zustand), refreshToken in HttpOnly cookie — update axiosInstance and auth flow accordingly
- Content Security Policy meta tag in index.html

**Error Handling:**
- client/src/components/common/ErrorBoundary.jsx — React error boundary wrapping the whole app
- Per-feature error boundaries for isolated failures
- Friendly error pages for 404 and 500 states

**Performance:**
- React.lazy + Suspense for all feature routes (code splitting)
- React Query: staleTime: 5 minutes for reference data (states/districts), 30 seconds for live data
- Debounced search inputs (300ms)
- Memoize expensive components with React.memo
- Virtual scrolling for tables with 100+ rows (react-virtual)

**Accessibility:**
- All interactive elements have aria-label
- Focus management in modals (focus trap)
- Skip-to-main-content link
- Color contrast check comments in CSS

**README.md** — comprehensive setup guide:
- Prerequisites
- Installation steps (both client and server)
- Environment variable reference
- Database setup steps
- Default admin credentials
- API endpoint reference table
- Architecture decision notes

Make sure every file created so far is internally consistent — import paths match actual file locations, all exported functions are used, no dead code, no placeholder TODO comments.
```

---

## SECTION 12 — Final Integration & QA Checklist

```
Do a final integration pass across the entire codebase:

1. **Verify all API routes are mounted** in server/src/app.js
2. **Verify all React routes** have the correct component imported
3. **Verify all Zustand store actions** are called correctly from components
4. **Cross-check API response shapes** — every API consumer (React Query hook) correctly maps the { success, data, pagination } envelope
5. **Verify scanner flow end-to-end**: scan → lookup → add to list → dispatch → movement history updated
6. **Verify receive flow end-to-end**: pending batch shown → receipt submitted → unit location updated → history entry created
7. **Verify temp user expiry**: temp users past valid_until get 401 on any API call
8. **Verify audit log entries** exist for: login, logout, user create, user deactivate, dispatch create, dispatch receive
9. **Check all form validations** match between Zod schemas (client) and express-validator chains (server)
10. **Test responsive breakpoints** — sidebar collapses at md (768px), cards stack at sm (640px), table scrolls horizontally at sm

Then output:
- A summary of all files created with their paths
- Any known limitations or items for future iteration
- Database connection string example for the user to fill in
- Command sequence to start the project:
  ```
  cd database && sqlcmd -S SERVER -d DATABASE -i schema.sql && sqlcmd -S SERVER -d DATABASE -i seed.sql
  cd server && npm install && npm run dev
  cd client && npm install && npm run dev
  ```
```

---

## 📋 REFERENCE: Key Business Rules to Always Respect

| Rule | Description |
|------|-------------|
| Sender auto-filled | Dispatch "from" location is always the logged-in user's state/district |
| Unit code uniqueness | unit_code from barcode/QR must be unique across all EVM units |
| No duplicate dispatch | A unit that is IN_TRANSIT cannot be dispatched again until received |
| Temp user expiry | Temp users auto-deactivate after valid_until datetime |
| Batch code format | Auto-generated: `BATCH-YYYYMMDD-[4 char alphanumeric]` |
| Audit everything | Every create/update/delete must log to audit_log table |
| Password rules | Min 8 chars, 1 uppercase, 1 number, 1 special char |
| DB passwords | Always wrap in quotes in .env and in mssql config |
| History immutable | Movement history records are never updated or deleted |
| Role hierarchy | ADMIN > STATE_OFFICER > DISTRICT_OFFICER |

---

## 🔐 Default Credentials (Change Immediately)

- **Admin User Code**: `ADMIN001`
- **Admin Password**: `Admin@123#Secure`

---

*Generated for EVM Management System — Government of India*
*Use with Claude Sonnet 4 or higher for best results*
