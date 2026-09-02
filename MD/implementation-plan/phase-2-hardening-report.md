# GPBC Finance Desk — Phase 2 Hardening & Accounting Correctness Report

**Date**: 2026-09-01  
**Target Scope**: Phase 2 Hardening & Correctness Gate  
**Branch**: `feature/gpbc-finance-desk-refactor`  
**Governing Architecture**: `MD/GPBC_Finance_Desk_Simplified_Architecture.md`  

---

## 1. Security & Fail-Closed Guard Hardening

### A. Production Sheet Fail-Open Condition Fixed
- **Prior Issue**: `getConfig()` had silent fallback to `PRODUCTION_SPREADSHEET_ID` if `GPBC_SHEET_ID` was not configured, and defaulted `GPBC_ENVIRONMENT` to `"production"`.
- **Hardened Implementation** in [`apps-script/Config.gs`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/Config.gs):
  - `getConfig()` now returns unconfigured strings (`""`) without silent fallbacks.
  - `assertSandboxSheet(operationName)` enforces:
    1. If `GPBC_SHEET_ID` is missing: **BLOCKS** execution.
    2. If `GPBC_ENVIRONMENT` is missing on write: **BLOCKS** execution.
    3. If operation is development/schema (`initializeSandboxSchema`, migrations, seeds): **ALWAYS BLOCKS** if targeted at production spreadsheet ID `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s`, regardless of environment label.
    4. If environment is `"sandbox"` or `"development"` and `GPBC_SHEET_ID` points to production ID: **BLOCKS** execution.
  - `getDB(isWrite, operationName)` fails closed on any missing configuration.

### B. Runtime Dev-Mock-Token Bypass Removed
- **Prior Issue**: `validateGoogleIdentity()` contained an unconditional bypass for token `"dev-mock-token"`.
- **Hardened Implementation** in [`apps-script/Auth.gs`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/Auth.gs):
  - Completely removed `"dev-mock-token"` runtime bypass.
  - Deployed Apps Script will strictly reject any magic or unverified token.
  - Added regression test in [`apps-script/tests/FinanceModel.test.js`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/tests/FinanceModel.test.js) proving unverified tokens fail verification.

### C. Deny-by-Default Authorization (No Domain Auto-Elevation)
- **Prior Issue**: `getApprovedUser()` auto-elevated any `@gracepraise.church` email to `Primary Admin` or `Finance Editor`, and defaulted unknown accounts to `Viewer`.
- **Hardened Implementation** in [`apps-script/Auth.gs`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/Auth.gs):
  - Removed all domain-based auto-elevation and substring pattern matching.
  - **Explicit Allowlist Only**: User role is resolved strictly by exact match in `GPBC_APPROVED_USERS` JSON Script Property.
  - Unknown accounts (whether external `@gmail.com` or `@gracepraise.church`) return `null` and are **DENIED ACCESS** by default.

### D. Google Client ID Mandatory Enforcement
- In `validateGoogleIdentity()`: If `GOOGLE_CLIENT_ID` is blank or unconfigured in Script Properties, authentication **FAILS CLOSED** with a configuration error rather than skipping audience validation.
- Token claims verified: `sub`, `aud`, `iss` (`accounts.google.com`), `email_verified`, `exp`.

### E. SHA-256 Token Cache Key Generation
- Token cache key now uses a one-way `Utilities.computeDigest(SHA_256, idToken)` hash rather than a plain substring slice. Raw tokens are never stored in cache keys.

---

## 2. Accounting Model Correctness

### A. Reimbursement Double-Counting Resolution
- **Accounting Issue**: When a personal card church purchase ($100) was recorded as an expense, a subsequent church reimbursement check ($100) also recorded as an expense resulted in $200 of reported expenses for a $100 purchase.
- **Hardened Implementation**:
  - `Personal-Card Church Purchase` is recorded with `direction: "EXPENSE"`, `accountingImpact: "EXPENSE"` (recognizing church operating expense at purchase time).
  - `Reimbursement` payout is recorded with `direction: "EXPENSE"`, `accountingImpact: "SETTLEMENT"` (cash disbursement settling payable liability, excluded from church operating expenses).
  - Operating expense aggregations in [`apps-script/Transactions.gs`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/Transactions.gs) and [`src/pages/Transactions.jsx`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/src/pages/Transactions.jsx) sum ONLY `accountingImpact === 'EXPENSE'`.
  - Result: `$100 purchase + $100 reimbursement = $100 recognized church expense, $100 settlement payout`.

### B. Many-to-Many Allocation Invariant & Defaulting
- In [`apps-script/Reimbursements.gs`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/Reimbursements.gs):
  - If multiple allocation rows are provided, each row must specify an explicit non-negative `allocatedAmount`. Multi-row requests no longer default blank rows to the entire reimbursement sum.
  - Validates that the sum of allocations matches `totalReimbursedAmount`.
  - When linking to a purchase, calculates existing historical allocations: `priorAllocations + newAllocation + absorbed <= originalPurchaseAmount`. Allocation overages are rejected.

### C. Canonical Capital Project Financials
- In [`apps-script/Transactions.gs#getCapitalProjects`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/Transactions.gs):
  - `Capital_Projects` tab stores only metadata (`projectId`, `projectName`, `approvedBudget`, `status`, `notes`).
  - `designatedDonationsReceived`, `expensesPaid`, `otherFunding`, and `remainingDesignatedBalance` are dynamically derived from canonical `Transactions` matching `capitalProjectId`.

### D. Check Details & Receipt Match Validation
- In [`apps-script/Receipts.gs`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/Receipts.gs):
  - `matchReceiptToTransaction` verifies that both the `receiptId` and `transactionId` exist in their respective tabs before applying links.
  - `addCheckDetail` verifies that referenced transactions exist and checks for duplicate check numbers across non-voided checks.

---

## 3. Test Suite & Implementation Parity

- **Direct Function Imports**: [`apps-script/tests/Auth.test.js`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/tests/Auth.test.js) and [`apps-script/tests/FinanceModel.test.js`](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/apps-script/tests/FinanceModel.test.js) directly test the runtime functions from `Config.gs`, `Auth.gs`, `Transactions.gs`, `Reimbursements.gs`, and `Receipts.gs`.
- **Test Results**: **39/39 passing tests** across 5 test suites:
  - `Auth.test.js`: 7 tests
  - `FinanceModel.test.js`: 20 tests
  - `gasFetch.test.ts`: 4 tests
  - `financeApi.test.ts`: 5 tests
  - `AuthContext.test.jsx`: 3 tests
- **TypeScript**: `tsc --noEmit` passes with 0 errors.
- **Production Build**: `vite build` passes cleanly.
- **Lint Result**: **31 errors, 19 warnings** (0 errors in touched files; matches Phase 1 baseline).

---

## 4. Sandbox Configuration Status

- **Code Definition**: Idempotent schema initialization logic (`SCHEMA_DEFINITIONS`) is complete and test-verified in `apps-script/Transactions.gs`.
- **Live Sandbox Binding Status**: **`SANDBOX CONFIGURATION PENDING`**  
  A physical Google Sheet copy named `GPBC_Finance_Master_SANDBOX` must be created by the church owner, and its Spreadsheet ID set in Script Properties (`GPBC_SHEET_ID`) along with `GPBC_ENVIRONMENT = sandbox` prior to running live schema initialization.
- **Production Safety Verification**: Production Sheet ID `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s` has NOT been modified and cannot be written to by development routines.
