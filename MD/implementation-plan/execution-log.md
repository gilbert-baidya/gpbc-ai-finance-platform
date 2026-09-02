# GPBC Finance Desk — Execution & Audit Log

**Date**: 2026-09-01  
**Authoritative Specs**: `MD/GPBC_Finance_Desk_Simplified_Architecture.md`, `MD/GPBC_Finance_Control_Book_Build_Handoff.md`  
**Plan**: `MD/implementation-plan/plan.md`  

---

## 1. Baseline State (Task 1 & Task 2)

- **Initial Commit on main**: `da61bd2` ("first commit" - only contained `README.md`)
- **Untracked Working Tree**: 156 application and documentation files preserved.
- **Action Taken**: Committed all legitimate pre-existing files to `main` as `43aa4ff` ("chore: establish pre-refactor application baseline") and created feature branch `feature/gpbc-finance-desk-refactor`.
- **Active Branch**: `feature/gpbc-finance-desk-refactor`
- **Baseline SHA**: `43aa4ff`
- **Initial Build Status**: `npm run build` PASSED (Vite 7.3.1).
- **Initial Lint Status**: 59 problems (42 errors, 19 warnings).
- **Initial Test Status**: No test runner configured.

---

## 2. Phase 0 & Phase 1 Execution Summary

### A. Security & Authentication Migration (Tasks 3, 4, 5, 6, 7)
- **Shared API Key Retired**: `VITE_GPBC_API_KEY` was removed as the primary authentication mechanism. Transport no longer requires a browser-visible shared secret.
- **Google Sign-In Implementation**:
  - Added `src/types/auth.ts`, `src/types/finance.ts`, and `src/api/types.ts`.
  - Added Google Identity Services integration in `src/auth/GoogleSignIn.jsx` and `src/auth/GoogleSignIn.css`.
  - Added session state management with JWT claims parsing and in-memory active token storage in `src/context/AuthContext.tsx`.
  - Hardened route protection in `src/components/RoleProtectedRoute.jsx`.
  - Restricted `DevRoleSwitcher.jsx` exclusively to local development (`import.meta.env.DEV`), returning `null` in production builds.
- **Transport Architecture**:
  - `src/api/gasFetch.ts`: Uses `text/plain` POST requests to prevent CORS preflight issues while transmitting `{ action, idToken, payload }` in the JSON request body.
  - Eliminated `process.env` browser errors in Vite.
- **Apps Script Backend Hardening**:
  - `apps-script/Config.gs`: Script Properties access (`GPBC_SHEET_ID`, `GOOGLE_CLIENT_ID`, `GPBC_APPROVED_USERS`, `GPBC_ENVIRONMENT`), `assertEnvironment`, read-only `getSchemaInventory`.
  - `apps-script/Auth.gs`: `validateGoogleIdentity` with audience and issuer verification plus caching; `getApprovedUser` role lookup; `authorizeAction` enforcing least-privilege action permissions.
  - `apps-script/Audit.gs`: `logAuditEvent` with append-only logs redacting tokens, passwords, and sensitive finance dumps.
  - `apps-script/Code.gs`: Centralized router authenticating and authorizing every action before dispatch.

### B. Product Identity & UI Refactoring (Tasks 8, 9, 10)
- **Product Rebranding**:
  - Name: **GPBC Finance Desk**
  - Subtitle: **Finance • Audit • Reporting**
  - Updated `index.html`, `README.md`, `src/components/Header.jsx`, `src/components/Sidebar.jsx`, `package.json`.
- **Navigation Architecture**:
  - Overview: Dashboard (`/dashboard`)
  - Finance: Transactions (`/transactions`), Income (`/income`), Expenses (`/expenses`), Reimbursements (`/reimbursements`), Receipt Register (`/receipts`), Check Details (`/checks`)
  - Projects: Capital Projects (`/capital-projects`)
  - Control & Audit: Audit Center (`/audit`), Monthly Close (`/monthly-close`), Presbyter Reports (`/presbyter-reports`)
  - System: Settings (`/settings`)
  - Ministry & Intelligence (Preserved Legacy): Members (`/members`), Contributions (`/contributions`), Letters (`/letters`), AI Reports (`/ai-reports`), Pastoral AI (`/pastoral-intelligence`), Operations (`/operations-command-center`)
- **Color Palette & Visual Foundation**:
  - Added CSS variables in `src/index.css` for Warm Ivory (`#FAF6F0`), Mist Blue (`#EBF3F5`), Dusty Slate Blue (`#2C3E50`), Soft Sand (`#EFEBE4`), Champagne Gold (`#C5A880`), Warm Gray (`#6B7280`), Muted Terracotta (`#C05621`).
  - Redesigned Header and Sidebar to avoid dominant dark/black styling.

### C. Validation Infrastructure (Tasks 2 & 14)
- **Test Suite**: Installed Vitest and React Testing Library. Added automated test suites:
  - `apps-script/tests/Auth.test.js`: 6 unit tests (token claim validation, approved user resolution, role permissions).
  - `src/api/gasFetch.test.ts`: 4 unit tests (request envelopes, header simplicity, body token injection, status error handling).
  - `src/auth/AuthContext.test.jsx`: 3 unit tests (session init, sign-in, role checking, sign-out).
  - **Result**: 13/13 tests pass.
- **TypeScript Check**: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors.
- **Build Status**: `npm run build` passes cleanly in ~4.6 seconds.
- **Lint Progress**:
  - Initial baseline: 42 errors, 17 warnings (59 problems).
  - Current state: 31 errors, 19 warnings (50 problems).
  - **Zero lint errors in any touched security, auth, API, routing, or shell code.**

### D. Production Data Safety & Sandbox Protocol (Tasks 11 & 12)
- Confirmed: **No production finance data was modified**.
- Confirmed: **No production deployment was performed**.
- Existing Production Sheet ID: `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s`.
- Documented backup and sandbox strategy in `MD/implementation-plan/deployment-prerequisites.md`.
- Read-only schema inventory helper (`getSchemaInventory`) returns tab names and header columns only without returning confidential row values.

---

## 3. Phase 2 Execution Summary (Tasks T031–T040)

- **Date Completed**: 2026-09-01
- **Feature Branch**: `feature/gpbc-finance-desk-refactor`
- **Sandbox Safety Assertion**: `apps-script/Config.gs#assertSandboxSheet` enforces rejection of writes targeting production ID `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s`.
- **Identity Verification Hardening**: `apps-script/Auth.gs#validateGoogleIdentity` verifies signature against Google tokeninfo endpoint and validates `iss`, `aud`, `exp`, `email_verified`, and `sub` claims.
- **Master Transactions Model**:
  - Defined canonical schema in `SCHEMA_DEFINITIONS` across 8 tabs.
  - Built `apps-script/Transactions.gs` with transaction CRUD and transparent read adapters for legacy `CONTRIBUTIONS` and `EXPENSES`.
  - Built `src/pages/Transactions.jsx` with filters, metrics, quick add modal, and personal card badges.
- **Many-to-Many Reimbursements & Allocations**:
  - Built `apps-script/Reimbursements.gs` enforcing allocation invariants (`reimbursed + absorbed <= purchase`).
  - Built `src/pages/Reimbursements.jsx` with multi-purchase allocation rows, personally absorbed gift tracking, and status calculations.
- **Receipt Register & Check Details**:
  - Built `apps-script/Receipts.gs` and `src/pages/ReceiptRegister.jsx` with Drive links, document types, and manual matching dialog.
  - Built `src/pages/CheckDetails.jsx` with check numbers, vouchers, payee tracking, and reconciliation states.
- **Capital Projects & Designated Funds**:
  - Built `apps-script/Transactions.gs#getCapitalProjects` and `src/pages/CapitalProjects.jsx` with campaign fundraising progress and available balances.
- **Validation Results**:
  - `vitest`: 29/29 tests pass across 5 suites.
  - `tsc --noEmit`: 0 errors.
  - `npm run build`: Vite build passes cleanly.
  - Production data: 100% untouched.

---

## 4. Phase 2 Hardening & Accounting Correctness Gate

- **Date Completed**: 2026-09-01
- **Feature Branch**: `feature/gpbc-finance-desk-refactor`
- **Fail-Closed Safety**:
  - `apps-script/Config.gs#assertSandboxSheet` blocks operations if `GPBC_SHEET_ID` or `GPBC_ENVIRONMENT` is missing.
  - Development utilities unconditionally block targeting production ID `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s`.
- **Authentication & Authorization Hardening**:
  - Removed `"dev-mock-token"` runtime bypass.
  - `GOOGLE_CLIENT_ID` configuration is mandatory (fails closed).
  - Deny-by-default allowlist: `getApprovedUser()` only assigns roles present in `GPBC_APPROVED_USERS`. Unknown accounts return `null` and are denied.
  - Token cache keys hashed with SHA-256 digests.
- **Accounting Treatment**:
  - Reimbursed payouts classified as `accountingImpact: SETTLEMENT`, eliminating double-counting with personal-card church purchases.
  - Capital project balances derived dynamically from canonical `Transactions`.
  - Multi-allocation defaulting bug fixed with invariant checking (`reimbursed + absorbed <= purchase`).
- **Validation**:
  - Vitest: 39/39 passing tests (direct testing of actual Apps Script functions).
  - TypeScript: 0 errors (`tsc --noEmit`).
  - ESLint: 31 errors (matches Phase 1 baseline, 0 in touched files).
  - Production build: Clean Vite build.
  - Sandbox status: `SANDBOX CONFIGURATION PENDING` (awaiting owner Sheet copy).
  - Production data: 100% untouched.
