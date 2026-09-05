# GPBC Finance Desk Sandbox Integration Report

**Date**: 2026-09-02  
**Branch**: `feature/gpbc-finance-desk-refactor`  
**Starting commit**: `ccd3313d980fde95bd33cac2fe1109a01e213346`
**Status**: SANDBOX SCHEMA INITIALIZED; FIRST TEST INCOME VERIFIED

## Safety Verification

| Check | Result |
| --- | --- |
| Working tree | Existing uncommitted Dashboard/UI work preserved; no files reverted |
| Production data | Not accessed or modified |
| Production deployment | Not performed |
| Phase 5 | Not started |
| Production write control | Live admin-only preflight reports `GPBC_PRODUCTION_WRITES_ENABLED=false` |
| Production Sheet isolation | Development/schema/reset operations permanently reject the protected production Sheet ID |
| Missing configuration | Fails closed |
| Unknown users | Denied by exact allowlist lookup |
| Audience validation | Mandatory; missing or mismatched `GOOGLE_CLIENT_ID` is rejected |
| Runtime preview token | Removed; DEV preview roles now hold no ID token and cannot authorize backend calls |

## Configuration Status

| Integration item | Status |
| --- | --- |
| `.env.local` ignored by Git | Confirmed |
| `VITE_GPBC_API_URL` | Configured locally with the verified sandbox `/exec` endpoint |
| `VITE_GOOGLE_CLIENT_ID` | Configured locally; client secret not used |
| Frontend client secret | Not used or stored |
| Apps Script `GOOGLE_CLIENT_ID` | Verified indirectly by successful Google ID-token audience validation; value not printed |
| `GPBC_APPROVED_USERS` | Verified indirectly by canonical `Primary Admin` response; value not printed |
| `GPBC_ENVIRONMENT=sandbox` | Confirmed by live admin-only preflight |
| Non-production `GPBC_SHEET_ID` | Confirmed as `GPBC_Finance_Master_SANDBOX`; backend reports `isProductionId=false` |
| Physical sandbox Sheet | Initialized with canonical headers and one controlled TEST income record |
| Sandbox schema | Initialized successfully |
| Sandbox Apps Script project | Connected through clasp to the approved Script ID |
| Sandbox Apps Script deployment | Created as `GPBC Finance Desk Sandbox API`; version 6 |

## Clasp Connection

| Integration item | Status |
| --- | --- |
| Clasp authentication | Authenticated as the approved Primary Admin |
| Target Script ID | Connected to the approved sandbox project |
| Root directory | `apps-script` |
| Push result | 12 files pushed successfully; status synchronized |
| Push contents | `appsscript.json` and 11 runtime `.gs` files |
| Tests/docs/local files | Excluded from push |
| Script Properties | Not read or changed |
| GCP project linking | Not changed |
| Web App deployment | Created; execute as deployer; browser access configured for the application-level token gate |
| Local endpoint | Configured in ignored `.env.local`; no committed URL |

The local environment also contains the deprecated `VITE_GPBC_API_KEY`. The active finance transport does not use it, but legacy client modules still reference it. Remove and rotate it only through the owner-controlled credential process; it was not printed, copied, or changed during this task.

## Security Hardening Completed

- Google sign-in no longer infers a role from an email domain or substring.
- `AuthContext` calls authenticated `verifySession` and accepts only a backend-returned canonical role.
- DEV preview roles remain available for presentation testing but do not create, store, or send an ID token.
- Apps Script returns a clean deny-by-default response when a cryptographically valid Google user is absent from `GPBC_APPROVED_USERS`.
- No token logging, audience bypass, shared-key fallback, OAuth secret, endpoint, Sheet ID, or production setting was added.

## Live Validation Status

- Real Google sign-in succeeded at `http://localhost:5173` as the approved Primary Admin.
- Backend `verifySession` returned the canonical `Primary Admin` role.
- Authenticated preflight confirmed workbook title `GPBC_Finance_Master_SANDBOX`, `environment=sandbox`, `isProductionId=false`, and `productionWritesEnabled=false`.
- `initializeSandboxSchema` created all 14 tabs defined by `SCHEMA_DEFINITIONS`; the original empty `Sheet1` was retained.
- Physical Google Sheets inspection confirmed these tabs: `Sheet1`, `Transactions`, `Income Detail`, `Expense Detail`, `Reimbursements`, `Reimbursement_Allocations`, `Receipt_Register`, `Check_Details`, `Capital_Projects`, `Audit_Issues`, `Reconciliation_Staging`, `Monthly_Close`, `Monthly_Close_History`, `Presbyter_Reports`, and `AUDIT_LOGS`.
- One controlled income was created through `addIncome`: `TEST Sandbox Donor`, `TEST Sandbox Offering`, Sunday Offering, General fund, Cash, `$10.00`, dated `2026-09-02`, with notes `TEST ONLY - sandbox connectivity verification`.
- Income ID `INC-1788373497279` and canonical transaction ID `TXN-20260902-17336` appear exactly once and are linked by the shared transaction ID.
- The Dashboard shows Total Income `$10`, Recognized Expenses `$0`, Net Position `$10`, and no unavailable-data banner.
- Audit Health Score shows `Not calculated yet`; the Audit Engine was not run.
- Transactions shows one matching TEST row at `$10.00`; Income shows one matching canonical detail row at `$10.00`.
- Initial data reads failed because `logAuditEvent()` had been removed during the Phase 3 audit-engine replacement. The non-blocking, redacted logger and documented `AUDIT_LOGS` schema were restored in deployment version 3.
- Deployment version 5 adds the admin-only preflight fields, canonical income reader, Income-page table, and explicit audit-calculation state used by this validation.

The following remain **NOT RUN**:

- Finance Editor, Viewer, Presbyter Read-Only, and unknown-account real sign-in tests
- Expense, reimbursement, allocation, receipt, check, and capital-project workflows
- Audit Engine and reconciliation live tests
- Monthly Close close/block/reopen/reclose workflow
- Presbyter Report generation or email

The Income page's legacy member selector still calls `getMembers`, which requires a legacy `MEMBERS` tab not created by the canonical schema. That loader reports a server error, but it does not affect the canonical Income Detail table or this verified TEST record.

## Automated Validation

| Check | Result |
| --- | --- |
| `npm test` | PASS — 10 files, 94 tests |
| Focused auth tests | PASS — frontend and Apps Script authorization suites |
| `npm run typecheck` | PASS — 0 errors |
| Touched-file diagnostics | PASS — no editor diagnostics; touched Income JSX lint-clean |
| `npm run lint` | FAIL — 54 errors and 18 warnings in legacy/unrelated files; current ESLint config excludes `.ts`, `.tsx`, and `.gs` |
| `npm run build` | PASS — existing large-chunk warning remains |

## Required Next Steps

1. Align the Income entry form's member source with the canonical sandbox schema so it no longer depends on the absent legacy `MEMBERS` tab.
2. Continue with a dedicated fake expense/receipt workflow test only after that integration decision.
3. Keep Phase 5 and all production operations blocked.

## Gate Decision

The Apps Script backend is **CONNECTED, DEPLOYED, AUTHORIZED, SCHEMA-INITIALIZED, AND VERIFIED WITH ONE CONTROLLED TEST INCOME RECORD** against the approved sandbox only. Broader live finance workflows remain untested. Production-release preparation may **NOT** begin. Phase 5 remains **NOT STARTED**.
