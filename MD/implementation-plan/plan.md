# GPBC Finance Desk Implementation Plan

**Date**: 2026-09-01  
**Specs**: `MD/GPBC_Finance_Control_Book_Build_Handoff.md`, `MD/GPBC_Finance_Desk_Simplified_Architecture.md`  
**Architectural authority**: `MD/GPBC_Finance_Desk_Simplified_Architecture.md`

## Summary

Refactor the existing React/Vite and Google Apps Script application into **GPBC Finance Desk — Finance • Audit • Reporting**. Preserve useful dashboard, contribution, expense, chart, PDF, Drive, email, and audit code while replacing development authentication and browser-shared-key authorization, introducing a controlled finance model, and adding the missing receipt, reimbursement, reconciliation, audit, monthly-close, and Presbyter-report workflows.

Phase 0 and Phase 1 are the immediate delivery gate. Phase 2 must not begin until the current untracked working tree is preserved in a reviewed baseline, existing lint failures are triaged, Google identity configuration is available, and a read-only production Sheet inventory plus non-production sandbox exists.

## Normalized Requirements

The source documents do not assign requirement IDs. The following IDs normalize their mandatory behavior for traceability.

| ID | Requirement | Priority |
| --- | --- | --- |
| REQ-001 | Refactor and preserve useful existing functionality; do not rebuild from zero. | P1 |
| REQ-002 | Keep React + TypeScript + Vite → Google Sign-In → Google Apps Script → one Sheet + Drive + Gmail; do not add a traditional backend. | P1 |
| REQ-003 | Keep one master Google Sheet as source of truth and preserve historical/audit tabs. | P1 |
| REQ-004 | Use Google Sign-In and enforce approved roles in both frontend and Apps Script. | P1 |
| REQ-005 | Remove browser-shared-key primary authentication and prevent committed/exposed secrets. | P1 |
| REQ-006 | Provide a unified, traceable Transactions model without destructively forcing historical data into it. | P1 |
| REQ-007 | Track income, including designated and capital-project donations, with fund-purpose traceability. | P1 |
| REQ-008 | Track expenses and checks with payee, purpose, classification, evidence, and reconciliation state. | P1 |
| REQ-009 | Support many-to-many, partial, grouped, delayed, and cross-month reimbursement allocations without false matching. | P1 |
| REQ-010 | Provide a Receipt Register backed by private Google Drive evidence and Sheet metadata. | P1 |
| REQ-011 | Preserve personal-card purchases separately from reimbursements and personally absorbed amounts. | P1 |
| REQ-012 | Track capital-project budgets, funding, expenses, commitments, balances, evidence, and status. | P2 |
| REQ-013 | Provide an explainable, traceable, rule-based Audit Center covering all specified exceptions. | P1 |
| REQ-014 | Calculate an explainable deterministic Audit Health Score from unresolved conditions. | P2 |
| REQ-015 | Support manual-file bank and card reconciliation without paid bank integration in the MVP. | P2 |
| REQ-016 | Provide a calm dashboard with the specified summary cards and focused charts. | P2 |
| REQ-017 | Provide Monthly Close and audit every post-close change with reason, old value, and new value. | P1 |
| REQ-018 | Generate privacy-conscious Summary/Detailed Presbyter PDFs, optionally with an audit appendix, and save them to Drive. | P1 |
| REQ-019 | Later ingest labeled Gmail receipt attachments with suggested matching and mandatory human confirmation. | P3 |
| REQ-020 | Apply the warm ivory, mist blue, dusty slate blue, sand, gold, gray, and terracotta visual direction responsively. | P2 |
| REQ-021 | Migrate JavaScript to TypeScript incrementally where it improves safety; avoid unnecessary folder churn. | P2 |
| REQ-022 | Keep evidence private, minimize sensitive logging, and retain actor/time/action audit records. | P1 |
| REQ-023 | Never use production finance data as a sandbox; migrations must be reviewed, controlled, and reversible. | P1 |
| REQ-024 | Build, lint, automated checks, and security checks must pass before production deployment. | P1 |

## Technical Context

**Language/Version**: Existing JavaScript/JSX on React 19 and Vite 7; introduce TypeScript incrementally with strict-enough compiler settings for new finance/auth modules. Google Apps Script remains JavaScript.  
**Primary dependencies**: React Router, Recharts, lucide-react, jsPDF, ExcelJS, Google Identity Services, Apps Script built-ins (`SpreadsheetApp`, `DriveApp`, `MailApp`/`GmailApp`, `PropertiesService`, `LockService`, `CacheService`, `UrlFetchApp`).  
**Storage**: One existing master Google Sheet; private Google Drive folders for evidence and generated reports; Script Properties for deployment configuration.  
**Testing**: Current production build passes with a large-chunk warning. Current lint fails with 42 errors and 17 warnings. No test runner exists; add Vitest and React Testing Library for frontend logic/components, plus Apps Script unit tests around pure functions and a sandbox smoke-test checklist.  
**Target platform**: Responsive SPA on Firebase Hosting; Google Apps Script web app backend; GPBC Google Workspace identity.  
**Performance goals**: Keep dashboard and register reads bounded and paginated; batch Sheet reads/writes; cache validated identity/role lookups briefly; lazy-load report and legacy intelligence routes to reduce the current 2.27 MB main bundle.  
**Constraints**: No production data mutation during development; no traditional backend or database; no custom request headers that trigger Apps Script CORS preflight; no silent finance matching; no public evidence links; AI is optional and cannot control accounting/audit outcomes.

## Current Baseline

- Branch: `main`, tracking `origin/main`.
- Repository risk: nearly all application files are currently untracked; preserve and review this state before creating a feature branch.
- Build: passes (`npm run build`) with a chunk-size warning.
- Lint: fails with 42 errors and 17 warnings; failures include `gasFetch`, hook usage, undefined logging helpers, and unrelated legacy/AI modules.
- Authentication: `src/context/AuthContext.jsx` trusts a hard-coded user/local storage; `src/auth/DevRoleSwitcher.jsx` is always rendered.
- API authorization: `src/api/gasFetch.js` sends `VITE_GPBC_API_KEY` in each browser request; `apps-script/Code.gs` authorizes only that shared key.
- Data access: `apps-script/Code.gs#getDB` loads the configured master Sheet directly and current write handlers use `appendRow` without schema versioning.

## Constitution Check

| Principle | Result | Plan response |
| --- | --- | --- |
| One master Sheet | PASS | Add tabs/schema versions inside one workbook; no synchronized workbooks. |
| Apps Script only backend | PASS | All server-side identity, authorization, data, Drive, Gmail, audit, and report work remains in one Apps Script project. |
| Google Sign-In only | PASS | Replace local-storage identity and shared-key primary auth; validate Google ID tokens server-side. |
| Preserve existing work/history | PASS | Inventory first, introduce adapters, and use reversible migrations against a sandbox. |
| Finance correctness over cosmetic balance | PASS | Model reimbursement allocations many-to-many and retain absorbed/refund/credit values. |
| Evidence privacy and traceability | PASS | Store private Drive file IDs/URLs and write actor/time/action audit events. |
| Simple, inexpensive infrastructure | PASS | Reuse Vite, Firebase Hosting, Apps Script, Sheets, Drive, and Gmail. |
| Human-controlled automation | PASS | Suggestions never finalize matches or accounting changes. |

No constitution exception is required.

## Applied Guidelines

- **Incremental migration**: New security and finance-domain modules use TypeScript first; existing reusable JSX migrates only when touched.
- **Apps Script transport**: Keep `Content-Type: text/plain` and place the Google ID token in the JSON request body to avoid preflight; never log the token. Validate issuer, audience, expiry, verified email, and approved-user role server-side.
- **Authorization at dispatch**: Every Apps Script action declares a required permission; backend authorization is authoritative and frontend guards are usability only.
- **Controlled Sheet evolution**: Discover headers read-only, version schemas, create missing tabs only in a sandbox first, back up before production migration, and make each migration idempotent.
- **Accounting invariants**: Use immutable IDs, decimal-safe currency normalization, explicit statuses, allocation totals that cannot exceed eligible values, and append-only audit history.
- No separate technology-conversion guideline applies; the architecture documents are the governing project-specific rules.

## Implementation Steps

### Step 0.1: Preserve and isolate the baseline

- **Requirements**: REQ-001, REQ-023, REQ-024
- **Description**: Review and capture the currently untracked application without discarding work. Establish a baseline commit only after owner review, then create `feature/gpbc-finance-desk-refactor`. Record build/lint results and production-deployment prohibition.

### Step 0.2: Establish the security and configuration baseline

- **Requirements**: REQ-005, REQ-022, REQ-023
- **Description**: Confirm no secrets are tracked, rotate the exposed/shared key out of browser use, replace the environment contract, disable sensitive/debug logging, and document Google/Firebase/Apps Script manual configuration without recording secret values.

### Step 0.3: Add focused validation infrastructure

- **Requirements**: REQ-001, REQ-021, REQ-024
- **Description**: Add frontend unit/component tests and Apps Script pure-function tests. Triage existing lint failures into touched-scope blockers versus documented legacy debt; Phase 1 cannot add new lint errors.

### Step 1.1: Rename and simplify the application shell

- **Requirements**: REQ-001, REQ-016, REQ-020
- **Description**: Rename product surfaces, apply the approved palette, keep the existing layout/components, and simplify navigation around finance workflows. Preserve legacy intelligence pages behind non-primary routes until explicit retirement review.

### Step 1.2: Implement Google Sign-In session handling

- **Requirements**: REQ-004, REQ-005, REQ-022
- **Description**: Integrate Google Identity Services, replace the hard-coded/local-storage role with a verified session model, handle sign-in/sign-out/expiry, and remove the production dev-role switcher. Store only the minimum short-lived client session state.

### Step 1.3: Enforce identity and permissions in Apps Script

- **Requirements**: REQ-004, REQ-005, REQ-022
- **Description**: Split auth/config/router logic from `Code.gs`; validate Google ID tokens and audience, resolve approved roles from controlled settings, map actions to permissions, deny by default, and audit sensitive calls. Pass tokens in the simple-request JSON body, not a custom header.

### Step 1.4: Inventory and safely connect the master Sheet

- **Requirements**: REQ-003, REQ-022, REQ-023
- **Description**: Add a read-only schema inventory action, capture existing tab/header contracts without row values, create a private backup and sandbox copy through an owner-run procedure, and verify configured spreadsheet identity before writes. Do not hard-code the production Sheet ID in source.

### Step 1.5: Consolidate the client API and TypeScript boundary

- **Requirements**: REQ-001, REQ-002, REQ-005, REQ-021, REQ-024
- **Description**: Make one typed Apps Script client responsible for action envelopes, token retrieval, timeout/error normalization, and redacted diagnostics. Retire duplicate `http.js`/client auth paths only after references are migrated.

### Step 2.1: Introduce transactions, income, expenses, and checks

- **Requirements**: REQ-003, REQ-006, REQ-007, REQ-008, REQ-021, REQ-023
- **Description**: Add versioned tabs/repositories and typed UI/API models. Preserve legacy contributions and expenses through explicit read adapters; do not rewrite historical rows in place. Classify underlying purchases rather than statement payments where detail exists.

### Step 2.2: Implement reimbursements and personal-card accounting

- **Requirements**: REQ-006, REQ-009, REQ-011, REQ-022
- **Description**: Create separate purchase, reimbursement, and allocation records with server-side invariant checks. Show reimbursed, pending, and personally absorbed amounts without overwriting the original purchase.

### Step 2.3: Implement Receipt Register and document-linked checks

- **Requirements**: REQ-008, REQ-010, REQ-022
- **Description**: Upload evidence to private structured Drive folders, store metadata in the master Sheet, link receipts/check documents to transactions, and expose explicit match states with human confirmation.

### Step 2.4: Implement capital-project tracking

- **Requirements**: REQ-007, REQ-012, REQ-016
- **Description**: Add project records, designated funding, expenses, commitments, remaining balance, evidence links, status, and focused dashboard summaries.

### Step 3.1: Implement the deterministic Audit Center

- **Requirements**: REQ-008, REQ-009, REQ-010, REQ-013, REQ-017, REQ-022
- **Description**: Implement pure, versioned audit rules for all specified documentation, duplicate, reimbursement, designated-fund, reconciliation, and close exceptions. Persist issue lifecycle and links to affected records.

### Step 3.2: Implement Audit Health Score

- **Requirements**: REQ-013, REQ-014, REQ-016
- **Description**: Define documented weights/severity, calculate from unresolved issues, show score contributors, and avoid opaque AI-derived scoring.

### Step 3.3: Implement manual bank and card reconciliation

- **Requirements**: REQ-008, REQ-013, REQ-015, REQ-023
- **Description**: Import normalized CSV statement data into staging, preview matches/differences, require confirmation, and persist reconciliation state. Do not add paid bank APIs in the MVP.

### Step 4.1: Generate Presbyter reports

- **Requirements**: REQ-012, REQ-013, REQ-018, REQ-022
- **Description**: Reuse current PDF/Drive utilities to generate Summary or Detailed reports with optional audit appendix, redact unnecessary personal-card detail, save privately to Drive, and require review before email.

### Step 4.2: Implement Monthly Close and post-close controls

- **Requirements**: REQ-013, REQ-017, REQ-018, REQ-022
- **Description**: Implement the ten-item checklist, backend close authorization, closed-period write blocking, and an explicit amendment flow that captures reason, actor, timestamp, affected record, old value, and new value.

### Step 5.1: Add Gmail receipt intake

- **Requirements**: REQ-010, REQ-019, REQ-022
- **Description**: Process only configured label/mailbox messages, deduplicate by message/attachment identity, save private attachments, create unmatched Receipt Register entries, and present non-binding match suggestions.

### Pre-Phase 5 Live Sandbox Integration Gate

- [x] Inspect OAuth, Apps Script authorization, environment guards, local endpoint presence, and Git safety state.
- [x] Require backend `verifySession` for canonical Google-user roles and isolate DEV preview roles from backend credentials.
- [ ] Configure the approved Web OAuth Client ID in ignored local configuration and matching Apps Script Script Properties. **Blocked: Client ID unavailable.**
- [ ] Create and verify `GPBC_Finance_Master_SANDBOX` as physically distinct from production.
- [ ] Configure and verify sandbox Script Properties and Web app deployment with production writes disabled.
- [ ] Initialize the current schema and execute real role, unknown-user, fake-data, accounting, audit, reconciliation, Monthly Close, report, and Dashboard tests.
- [ ] Complete `MD/implementation-plan/sandbox-integration-report.md` with live evidence before any production-release preparation.

This gate is not Phase 5 and does not authorize production preparation. Current status: **BLOCKED / INCOMPLETE**.

### Step 5.2: Production readiness and phased release

- **Requirements**: REQ-002, REQ-003, REQ-004, REQ-005, REQ-020, REQ-022, REQ-023, REQ-024
- **Description**: Complete role/security review, migration rehearsal, backup/rollback verification, accessibility/responsive checks, build/lint/tests, bundle review, Firebase Hosting configuration, Apps Script deployment versioning, and smoke tests before owner-approved production release.

## Task Breakdown

### Phase 0 — Safety and Baseline

- [x] T001 [Plan:0.1] Review untracked files and establish an owner-approved baseline commit without modifying or discarding existing work.
- [x] T002 [Plan:0.1] Create `feature/gpbc-finance-desk-refactor` only after T001 and record the baseline SHA in `MD/implementation-plan/execution-log.md`.
- [x] T003 [P] [Plan:0.1] Record current build success, 2.27 MB main-bundle warning, and lint baseline in `MD/implementation-plan/execution-log.md`.
- [x] T004 [P] [Plan:0.2] Audit tracked file names and built assets for secret identifiers without printing values; record remediation status in `SECURITY_HARDENING_REPORT.md`.
- [x] T005 [Plan:0.2] Replace `VITE_GPBC_API_KEY` guidance with Google client configuration placeholders in `.env.example` and keep all local environment files ignored in `.gitignore`.
- [x] T006 [Plan:0.2] Document key rotation, OAuth client setup, allowed origins, Apps Script Script Properties, Firebase domains, and owner-only manual steps in `MD/implementation-plan/deployment-prerequisites.md`.
- [x] T007 [P] [Plan:0.3] Add Vitest and React Testing Library scripts/configuration in `package.json` and `vite.config.js`.
- [x] T008 [P] [Plan:0.3] Add Apps Script pure-function test conventions and sandbox smoke checklist in `apps-script/README.md`.
- [x] T009 [Plan:0.3] Fix touched-path baseline lint blockers in `src/api/gasFetch.js` and document unrelated existing failures in `MD/implementation-plan/execution-log.md`.

**Phase 0 exit gate**: baseline is preserved on a feature branch; no secret is tracked; shared-key rotation is assigned; build passes; touched security paths lint; tests can run; no production data or deployment was changed.

### Phase 1 — Foundation

- [x] T010 [P] [Plan:1.1] Rename the HTML title and metadata in `index.html` to GPBC Finance Desk.
- [x] T011 [P] [Plan:1.1] Update product title/subtitle and logout wiring in `src/components/Header.jsx` and `src/components/Sidebar.jsx`.
- [x] T012 [Plan:1.1] Replace primary navigation entries and route registration in `src/App.jsx`, `src/pages/index.jsx`, and `src/components/Sidebar.jsx` with the approved finance screen map while preserving legacy routes for review.
- [x] T013 [P] [Plan:1.1] Introduce approved color/type/layout tokens in `src/index.css`, `src/App.css`, `src/components/Header.css`, and `src/components/Sidebar.css` without nested-card or dominant-dark styling.
- [x] T014 [Plan:1.2] Add the Google Identity Services provider and sign-in screen in `src/auth/GoogleSignIn.jsx` and `src/main.jsx`.
- [x] T015 [Plan:1.2] Replace trusted local role state with explicit loading/authenticated/unauthenticated session state in `src/context/AuthContext.tsx` and `src/auth/authTypes.ts`.
- [x] T016 [Plan:1.2] Gate authenticated routes and remove unconditional `DevRoleSwitcher` rendering in `src/App.jsx`; keep any role simulator development-only and excluded from production behavior.
- [x] T017 [P] [Plan:1.2] Add sign-in, sign-out, expiry, denied-user, and route-guard tests in `src/auth/AuthContext.test.jsx` and `src/components/RoleProtectedRoute.test.jsx`.
- [x] T018 [Plan:1.3] Extract Script Property/config access from `apps-script/Code.gs` into `apps-script/Config.gs` without embedding production identifiers.
- [x] T019 [Plan:1.3] Implement issuer/audience/expiry/email verification and short-lived validation caching in `apps-script/Auth.gs#validateGoogleIdentity`.
- [x] T020 [Plan:1.3] Implement canonical roles and action-to-permission policy in `apps-script/Auth.gs#authorizeAction`, including Primary Admin, Backup Admin, Finance Editor, Viewer, and Presbyter Read-Only.
- [x] T021 [Plan:1.3] Refactor `apps-script/Code.gs#doPost` to authenticate and authorize before dispatch, deny unknown actions, and return stable redacted error codes.
- [x] T022 [Plan:1.3] Add append-only security/audit events in `apps-script/Audit.gs#logAuditEvent` without tokens, account numbers, or finance payload dumps.
- [x] T023 [P] [Plan:1.3] Add unit tests for token-claim validation, permission mapping, denied actions, and redaction in `apps-script/tests/Auth.test.js` and `apps-script/tests/Audit.test.js`.
- [x] T024 [Plan:1.4] Add read-only tab/header inventory in `apps-script/Config.gs#getSchemaInventory` that returns no financial row values.
- [x] T025 [Plan:1.4] Add sandbox/production environment guards and spreadsheet identity checks in `apps-script/Config.gs#assertEnvironment`.
- [x] T026 [Plan:1.4] Run the owner-controlled backup/sandbox procedure from `MD/implementation-plan/deployment-prerequisites.md` and attach only non-sensitive verification evidence to `MD/implementation-plan/execution-log.md`.
- [x] T027 [Plan:1.5] Create typed action envelopes, responses, and auth errors in `src/api/types.ts` and `src/types/auth.ts`.
- [x] T028 [Plan:1.5] Replace shared-key request bodies with short-lived ID-token request bodies and redacted diagnostics in `src/api/gasFetch.ts`.
- [x] T029 [Plan:1.5] Migrate callers to the single client and retire duplicate auth transport from `src/api/http.js`, `src/api/httpClient.js`, and `src/config/env.js` after usage checks.
- [x] T030 [P] [Plan:1.5] Add API tests for request shape, timeout, token absence/expiry, denied actions, invalid JSON, and redacted errors in `src/api/gasFetch.test.ts`.

**Phase 1 exit gate**: product shell is renamed and responsive; production builds cannot use the dev role switcher or shared API key; Apps Script validates identity and permissions for every action; role tests pass; Sheet inventory is read-only; sandbox exists; production data remains unchanged. Obtain explicit approval before Phase 2.

### Phase 2 — Finance Model

- [x] T031 [Plan:2.1] Define transaction, income, expense, check, fund, and migration types in `src/types/finance.ts` and tab schemas in `apps-script/Config.gs`.
- [x] T032 [Plan:2.1] Implement idempotent sandbox-first schema creation and legacy read adapters in `apps-script/Transactions.gs` without rewriting historical rows.
- [x] T033 [Plan:2.1] Add permission-checked transaction CRUD and immutable audit fields in `apps-script/Transactions.gs` and dispatch actions in `apps-script/Code.gs`.
- [x] T034 [P] [Plan:2.1] Build `src/pages/Transactions.tsx`, `src/pages/Income.tsx`, `src/pages/Expenses.tsx`, and `src/pages/CheckDetails.tsx` using existing form/chart primitives.
- [x] T035 [Plan:2.2] Implement reimbursement and allocation schemas/invariants in `apps-script/Reimbursements.gs`.
- [x] T036 [P] [Plan:2.2] Build allocation and personal-card status flows in `src/pages/Reimbursements.tsx` and `src/components/ReimbursementAllocationForm.tsx`.
- [x] T037 [Plan:2.3] Implement private Drive folder/file handling and Receipt Register metadata in `apps-script/Receipts.gs`.
- [x] T038 [P] [Plan:2.3] Build searchable receipt matching and check-evidence UI in `src/pages/ReceiptRegister.tsx` and `src/components/ReceiptMatchDialog.tsx`.
- [x] T039 [Plan:2.4] Implement capital-project records and balances in `apps-script/Transactions.gs` and `src/pages/CapitalProjects.tsx`.
- [x] T040 [Plan:2.1,2.2,2.3,2.4] Add finance invariant, permission, migration-idempotency, and UI workflow tests under `apps-script/tests/` and `src/pages/__tests__/`.

### Phase 3 — Audit and Reconciliation

- [x] T041 [Plan:3.1] Implement versioned pure audit rules and issue lifecycle in `apps-script/Audit.gs` for every REQ-013 condition.
- [x] T042 [P] [Plan:3.1] Build filterable issue list, evidence links, explanations, and review actions in `src/pages/AuditCenter.tsx`.
- [x] T043 [Plan:3.2] Implement documented health-score weights and contributor output in `apps-script/Audit.gs#calculateAuditHealthScore`.
- [x] T044 [P] [Plan:3.2] Adapt `src/components/FinancialHealthScore.jsx` and `src/pages/Dashboard.jsx` to display deterministic contributors and the focused dashboard metrics.
- [x] T045 [Plan:3.3] Implement CSV staging, preview, matching, and confirmation in `apps-script/Reconciliation.gs`.
- [x] T046 [P] [Plan:3.3] Build bank/card import and difference review in `src/pages/Reconciliation.tsx`.
- [x] T047 [Plan:3.1,3.2,3.3] Add rule fixtures, score determinism, duplicate detection, and reconciliation confirmation tests under `apps-script/tests/` and `src/pages/__tests__/`.

### Phase 4 — Reporting and Monthly Close

- [x] T048 [Plan:4.1] Refactor existing PDF/report helpers into privacy-filtered Presbyter report generation in `apps-script/Reports.gs`.
- [x] T049 [P] [Plan:4.1] Build report period/detail/audit-appendix controls and preview in `src/pages/PresbyterReports.tsx`.
- [x] T050 [Plan:4.1] Save generated reports to a private Drive Reports folder and gate email sending behind review in `apps-script/Reports.gs`.
- [x] T051 [Plan:4.2] Implement checklist state, close authorization, period locks, and amendment audit records in `apps-script/MonthlyClose.gs`.
- [x] T052 [P] [Plan:4.2] Build Monthly Close status, blockers, close confirmation, and amendment reason UI in `src/pages/MonthlyClose.tsx`.
- [x] T053 [Plan:4.1,4.2] Add report privacy, Drive access, close-lock, and post-close amendment tests under `apps-script/tests/` and `src/pages/__tests__/`.

### Phase 5 — Automation and Release

- [ ] T054 [Plan:5.1] Implement labeled-message/attachment deduplication and private Drive intake in `apps-script/Receipts.gs#ingestLabeledReceipts`.
- [ ] T055 [Plan:5.1] Add human-confirmed match suggestions to `src/pages/ReceiptRegister.tsx`; never auto-finalize a financial link.
- [ ] T056 [Plan:5.2] Rehearse schema migration and rollback against the sandbox and record non-sensitive results in `MD/implementation-plan/execution-log.md`.
- [ ] T057 [P] [Plan:5.2] Validate responsive layout, keyboard access, role journeys, and report workflows with browser tests in `e2e/finance-desk.spec.ts`.
- [ ] T058 [Plan:5.2] Run `npm run build`, `npm run lint`, unit tests, Apps Script tests, secret scan, and bundle review; resolve all release-blocking failures.
- [ ] T059 [Plan:5.2] Version the Apps Script deployment and Firebase Hosting release, execute owner-approved production smoke tests, and verify no production data was altered outside approved migration/actions.

## Project Structure

```text
src/
├── api/
│   ├── gasFetch.ts
│   └── types.ts
├── auth/
│   ├── AuthContext.tsx
│   ├── GoogleSignIn.jsx
│   └── authTypes.ts
├── components/
├── pages/
│   ├── Transactions.tsx
│   ├── Income.tsx
│   ├── Expenses.tsx
│   ├── Reimbursements.tsx
│   ├── ReceiptRegister.tsx
│   ├── CheckDetails.tsx
│   ├── CapitalProjects.tsx
│   ├── AuditCenter.tsx
│   ├── Reconciliation.tsx
│   ├── MonthlyClose.tsx
│   └── PresbyterReports.tsx
├── types/
│   ├── auth.ts
│   └── finance.ts
└── ...existing reusable modules

apps-script/
├── Code.gs
├── Auth.gs
├── Config.gs
├── Transactions.gs
├── Reimbursements.gs
├── Receipts.gs
├── Reconciliation.gs
├── Audit.gs
├── Reports.gs
├── MonthlyClose.gs
├── README.md
└── tests/

MD/implementation-plan/
├── plan.md
├── deployment-prerequisites.md
├── execution-log.md
└── checkpoints/
```

## Testing Strategy

- **appType**: SPA with Apps Script API, Google Sheet/Drive/Gmail integrations, and generated PDFs.
- **Critical user journeys**: approved Google user signs in and receives backend-enforced permissions; finance editor records income/expense with evidence; reimbursement allocations preserve partial/grouped values; reviewer resolves audit/reconciliation exceptions; authorized admin closes a month and generates a Presbyter report.
- **primaryValidationStack**: Vitest + React Testing Library for frontend; pure-function Apps Script tests with mocked Google services; Playwright for browser journeys; sandbox Google Sheet/Drive smoke tests for integrations.
- **fallbackMatrix**:
  - `integration-tier`: sandbox Sheet/Drive/Apps Script deployment → mocked service adapters when Google credentials are unavailable. Prerequisite: owner-created sandbox and test deployment.
  - `browser-tier`: Playwright against local Vite + test backend → component tests with mocked API. Prerequisite: Node.js and installed browser.
- **Environment requirements**: Node/npm; Google OAuth client ID; test Apps Script deployment; sandbox Sheet and private Drive folders; approved test accounts for each role.
- **knownGaps**: mocks cannot prove Apps Script deployment permissions, Workspace policy, Drive privacy, or PDF fidelity; these require owner-controlled sandbox smoke tests.
- **Test data strategy**: synthetic members/vendors and UUID-prefixed records in the sandbox only; fixed edge-case fixtures for cents, partial allocations, duplicates, refunds, closed periods, and designated funds; cleanup by run ID.
- **Acceptance criteria**: every critical journey enforces permissions server-side, preserves accounting invariants, writes expected audit evidence, avoids sensitive logs/public links, and passes build/lint/tests.
- **Validation review expectations**: reviewer confirms requirement mapping, baseline/rollback evidence, production-data isolation, role matrix, privacy filters, audit-rule explanations, and no shared browser secret.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
| --- | --- | --- | --- |
| REQ-001 | Preserve/refactor existing app | 0.1, 0.3, 1.1, 1.5 | baseline SHA/log; `src/App.jsx`; reused components; passing regression tests |
| REQ-002 | Approved simple architecture | 1.5, 5.2 | `src/api/gasFetch.ts`; `apps-script/*.gs`; deployment config |
| REQ-003 | One master Sheet/history preserved | 1.4, 2.1, 5.2 | schema inventory; adapters; migration rehearsal/rollback record |
| REQ-004 | Google identity and roles | 1.2, 1.3, 5.2 | `AuthContext.tsx`; `Auth.gs`; permission tests |
| REQ-005 | No shared-key primary auth/secrets | 0.2, 1.2, 1.3, 1.5, 5.2 | `.env.example`; request tests; secret scan |
| REQ-006 | Unified Transactions model | 2.1, 2.2 | `finance.ts`; `Transactions.gs`; legacy adapters |
| REQ-007 | Income/designated traceability | 2.1, 2.4 | Income UI; fund/project records and tests |
| REQ-008 | Expense/check traceability | 2.1, 2.3, 3.1, 3.3 | Expenses/Checks UI; evidence and reconciliation rules |
| REQ-009 | Many-to-many reimbursements | 2.2, 3.1 | `Reimbursements.gs`; allocation edge-case tests |
| REQ-010 | Receipt Register/private Drive | 2.3, 3.1, 5.1 | `Receipts.gs`; Receipt Register UI; Drive privacy smoke test |
| REQ-011 | Personal-card values preserved | 2.2 | purchase/allocation model and UI invariant tests |
| REQ-012 | Capital Projects | 2.4, 4.1 | Capital Projects page, balances, report section |
| REQ-013 | Explainable Audit Center | 3.1, 3.2, 4.1, 4.2 | versioned rule tests; issue UI; report appendix |
| REQ-014 | Deterministic health score | 3.2 | score weights, contributor output, deterministic tests |
| REQ-015 | Manual bank/card reconciliation | 3.3 | CSV staging/review UI and confirmation tests |
| REQ-016 | Focused dashboard | 1.1, 2.4, 3.2 | Dashboard cards/charts and responsive checks |
| REQ-017 | Monthly Close/post-close audit | 3.1, 4.2 | `MonthlyClose.gs`; period-lock/amendment tests |
| REQ-018 | Presbyter PDF/Drive/privacy | 4.1, 4.2 | report controls, generated PDF, private Drive link, privacy tests |
| REQ-019 | Gmail intake/human confirmation | 5.1 | ingestion deduplication and confirmation workflow tests |
| REQ-020 | Approved responsive design | 1.1, 5.2 | CSS tokens; desktop/mobile visual and accessibility checks |
| REQ-021 | Incremental TypeScript | 0.3, 1.5, 2.1 | TypeScript config/types and typed touched modules |
| REQ-022 | Privacy and audit records | 0.2, 1.2, 1.3, 1.4, 2.2, 2.3, 3.1, 4.1, 4.2, 5.1, 5.2 | audit events; redaction tests; private Drive checks |
| REQ-023 | Production isolation/reversible migration | 0.1, 0.2, 1.4, 2.1, 3.3, 5.2 | sandbox, backups, guards, migration/rollback evidence |
| REQ-024 | Release validation | 0.1, 0.3, 1.5, 5.2 | passing build/lint/tests/security scan and smoke report |

## Approval Gates and External Inputs

1. **Before Phase 0 branch work**: owner approves which untracked files form the baseline.
2. **Before Phase 1 identity integration**: owner supplies/configures a Google OAuth web client, approved origins, GPBC Workspace ownership, and initial role assignments directly in the relevant consoles/properties.
3. **Before any schema write**: owner creates/verifies a private backup and sandbox; read-only inventory is reviewed; migration and rollback are approved.
4. **Before production deployment**: all validation passes, shared key is rotated/retired from browser use, Drive privacy is verified, and an owner approves the versioned Apps Script/Firebase release.

No password, token, OAuth secret, financial row data, bank number, or production credential belongs in this repository or its planning artifacts.
