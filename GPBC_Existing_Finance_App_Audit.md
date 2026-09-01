# GPBC Existing Finance App Audit

## 1. Executive Summary

This repository is an in-progress React + Vite single-page application front-end paired with a Google Apps Script server-side backend that uses a single Google Spreadsheet as the primary data store. The codebase includes a majority of the UI for member management, contributions, expense entry, charts, tax-letter generation, and audit logging. However, authentication is currently a development stub, reimbursements and receipt management are missing, and an important environment file (`.env.local`) containing the Apps Script URL and API key is committed to the repository (security risk).

I attempted to locate `GPBC_Finance_Control_Book_Build_Handoff.md` as directed but it is not present in the workspace — I could not find the handoff requirements document. Because that file is missing the comparison section below is focused on the prominent requirement you highlighted (ONE MASTER GOOGLE SHEET) and on the code and phase documents that are present (PHASE_4..PHASE_7, README).

Recommendation (short): this project is a strong functional foundation but requires a focused refactor and security hardening before production; recommended path: B — Refactor / restructure (see Section 17).

---

## 2. Current Architecture

Frontend
  - React 19 + Vite SPA (`src/`)
  - UI components: `src/components/*`, pages under `src/pages/*`
  - API client wrapper: `src/api/gasFetch.js`
  - Local/dummy auth: `src/context/AuthContext.jsx` (dev stub)

Authentication
  - Currently a client-side dev stub (`AuthContext.jsx`). No Google Sign-In implemented.
  - API calls use an API key injected by environment variables and sent in request body (see `gasFetch.js`).

Backend / API
  - Google Apps Script project: [apps-script/Code.gs](apps-script/Code.gs)
  - Apps Script implements JSON POST router via `doPost(e)` with many action handlers (members, contributions, tax letters, dashboard summary, audit logging).
  - Apps Script accesses a single Spreadsheet via `PropertiesService.getScriptProperties().getProperty('GPBC_SHEET_ID')`.

Data Storage
  - A single Google Spreadsheet is used as the primary datastore (sheets: `MEMBERS`, `CONTRIBUTIONS`, etc.).
  - Drive + Mail are used for PDF generation and sending (`DriveApp`, `MailApp`).

Google / External Services
  - Google Sheets (SpreadsheetApp) — primary storage
  - Google Drive (DriveApp) — letterhead + PDF conversion
  - Gmail (MailApp) — outgoing emails
  - No external DB (SQL/Mongo/etc.) found — aligned with a small backend preference

Runtime locations
  - Browser: React UI, XLSX/PDF generation in-client, data fetches via `gasFetch`
  - Server-side: Google Apps Script (serverless) — spreadsheet operations, PDF generation, email sending

Deployability / Run state
  - Frontend builds successfully locally (I ran `npm run build` locally — build completed).
  - Apps Script must be deployed separately in Google Workspace. The repository contains the Apps Script source but not the deployed script configuration.
  - Some runtime behavior (auth, Apps Script deployment, and sheet ID configuration) requires environment setup.

Diagram (text):

Frontend (React + Vite)
  |
  -> `gasFetch` (client wrapper) — HTTP POST
  |
  -> Google Apps Script ([apps-script/Code.gs](apps-script/Code.gs))
  |
  -> Google Sheets (single master spreadsheet)
  -> Google Drive (PDF storage/letterhead)
  -> Gmail (MailApp outbound)

---

## 3. Repository Inventory

- [package.json](package.json) — project dependencies and scripts (Vite, React, build tasks).
- [README.md](README.md) — product overview and setup notes.
- [.env.example](.env.example) — environment variable template.
- `.env.local` — present and contains live API URL + API key (SECRET FOUND — see Section 11).
- [apps-script/Code.gs](apps-script/Code.gs) — Google Apps Script backend with `doPost` router and handlers for members, contributions, tax letters, dashboard, and more.
- [src/api/gasFetch.js](src/api/gasFetch.js) — centralized client wrapper for calling Apps Script; enforces CORS-safe requests.
- [src/api/*](src/api) — API helpers: `gpbcApi.js`, `gpbcFinanceApi.js`, `membersApi.js`, `auditApi.js`, `taxApi.js`, `contributionsApi.js`.
- [src/context/AuthContext.jsx](src/context/AuthContext.jsx) — current dev auth stub (not production).
- `src/hooks/*` — many hooks for dashboard, audit logging, AI insights, forecasting, and role guard.
- [src/pages/*](src/pages) and [src/components/*](src/components) — main UI for Dashboard, Contributions, Expenses, Members, Tax Letter generation, Charts, Audit UI hooks.
- [src/utils/*](src/utils) — PDF/Excel exports, statement generation, donor insights, logger, file downloads.
- [audit/run_audit.js](audit/run_audit.js) — local audit runner that calls API endpoints and writes `audit/audit_results.json`.
- [public/](public) — letterhead and asset images for GPBC letter templates.
- Project documentation: `PHASE_4_BACKEND_SPEC.md`, `PHASE_5_BACKEND_SPEC.md`, `PHASE_6_BACKEND_SPEC.md`, `PHASE_7_BACKEND_SPEC.md`, `DESIGN_SYSTEM.md`, `SECURITY_HARDENING_REPORT.md` — planning and architecture notes.

No Firebase project configuration, no SQL or MongoDB usage, no service-account JSON or cloud infra manifests were found.

---

## 4. Current Feature Matrix

Legend: ✅ Working  |  🟡 Partially Implemented  |  🔴 Missing  |  ⚠️ Problematic  |  ❓ Unable to Verify

- Login / authentication: 🟡 Partially Implemented (dev stub `AuthContext.jsx`, no Google Sign-In).
- Dashboard: ✅ Working (Dashboard UI + `gasFetch('getDashboardSummary')`).
- Income tracking: ✅ Working (`Contributions` page + `addContribution` in Apps Script).
- Expense tracking: ✅ Working (`Expenses` page + `addExpense` call exists in UI; Apps Script handler expected).
- Transaction ledger (single unified ledger): 🟡 Partially Implemented (separate CONTRIBUTIONS/EXPENSES sheets; no single consolidated ledger UI).
- Offering tracking: ✅ Working (contribution types present).
- Donation tracking: ✅ Working.
- Designated donations (fund allocations): 🟡 Partially Implemented (contributionType exists; enforcement and reporting unclear).
- Reimbursements: 🔴 Missing (no structured reimbursement model found).
- Partial reimbursements: 🔴 Missing.
- Personal credit-card purchases: 🟡 Partially Implemented (paymentMethod field supports 'Credit Card' but no downstream flows linking personal payments and reimbursements).
- Receipt management (uploads / drive links): 🔴 Missing.
- Google Drive document links: 🟡 Partially Implemented (Apps Script uses DriveApp for PDFs and letterhead; receipts linking not implemented).
- Check tracking: 🟡 Partially Implemented (payment method supports 'Check'; check number / image handling not seen).
- Capital projects: 🔴 Missing (no dedicated capex module).
- Audit trail: ✅ Working (audit API + `useAudit` hook; `audit/run_audit.js` exists for automated checks).
- Missing receipt detection: ⚠️ Problematic (no automated detection logic present).
- Duplicate detection: ⚠️ Problematic (no automated duplicate detection implemented).
- Bank reconciliation: 🔴 Missing.
- Card reconciliation: 🔴 Missing.
- Audit Center (UI): 🔴 Missing (audit utilities exist but central Audit Center UI is not present).
- Audit health score: 🟡 Partially Implemented (component `FinancialHealthScore` exists; rules appear heuristic and not fully connected to reconciliation checks).
- Monthly close: 🔴 Missing.
- Charts: ✅ Working (Recharts, `StorytellingCharts`, `ForecastChart`).
- Presbyter reporting: 🔴 Missing (no domain-specific presbytery reports found).
- PDF generation: ✅ Working (front-end helpers + server-side PDF creation via `DriveApp` in Apps Script).
- Mobile / responsive UI: 🟡 Partially Implemented (responsive classes used; full responsive QA not verified).
- Role-based access: 🟡 Partially Implemented (role matrix and `useRoleGuard` exist; real authentication enforcement is missing).
- Gmail receipt intake: 🔴 Missing (no inbound Gmail processing functions found).

---

## 5. Comparison to GPBC Finance Control Book Requirements

Note: `GPBC_Finance_Control_Book_Build_Handoff.md` was not found in the repository, so the following comparison focuses on the critical requirement you called out ("ONE MASTER GOOGLE SHEET AS ACCOUNTING SOURCE OF TRUTH") and on the code + phase docs available.

- ONE MASTER GOOGLE SHEET: SUPPORTED — the Apps Script reads the sheet ID from script properties (`PropertiesService.getScriptProperties().getProperty('GPBC_SHEET_ID')`) and operates on named sheets (`MEMBERS`, `CONTRIBUTIONS`, etc.). The current architecture is compatible with keeping a single master sheet as the source of truth; however the existing sheet schemas will need controlled migration/versioning and extensions for reimbursements and audit metadata.
  - Reuse: Apps Script read/write layers and frontend APIs can be reused.
  - Est. changes: minor modifications to Apps Script to enforce schema and add audit meta columns; major work to implement complex reimbursement allocations and reconciliation tables.

- Authentication (Google Sign-In required by new requirements): Not implemented. The front-end has a dev stub; the backend currently expects an API key. This needs a major modification: adopt Google Sign-In and validate ID tokens server-side (Apps Script or a small token-verifier layer) instead of client-shared API key.

- Gmail receipt intake, Receipt storage/links, Reconciliation engines, Audit Center: largely missing and will require new development.

- Tax letters / PDF exports: Largely present and reusable.

Bottom line: core building blocks (React + Apps Script + Google Sheets + Drive + Mail) are in place and align with the stated architectural preference; the missing pieces are secure auth, reimbursement data model, receipt capture, and reconciliation — these will require moderate to major work.

---

## 6. Frontend Assessment

- Stack: React 19 + Vite; componentized UI with many reusable pieces (`MetricCard`, `FinancialHealthScore`, `StorytellingCharts`).
- Strengths: clear folder structure, API abstraction (`src/api/*`), hooks for domain logic, PDF/Excel export utilities present.
- Weaknesses: plain JavaScript (no TypeScript), no automated tests, dev auth stub present, bundle size warnings on build (large chunks reported), some components dependent on backend shape and side-effects.
- Recommendation: keep UI components but introduce incremental TypeScript conversion (start with `src/api` and `src/hooks`), add unit tests for key utilities, and optimize bundle chunking.

---

## 7. Backend Assessment

- Primary backend: single Google Apps Script file [apps-script/Code.gs](apps-script/Code.gs) implementing a POST router (`doPost`) and multiple action handlers.
- Strengths: small, serverless, direct SpreadsheetApp usage fits the "one-sheet" approach, DriveApp/MailApp simplify document/email flows.
- Weaknesses / Risks:
  - Current auth model: API key exchanged from client (in `.env.local`) and validated in `Code.gs` via `validateApiKey(k)` — this is insecure when key is committed in the repo and when the client stores the key.
  - Apps Script deployment and script properties must be properly managed (not present in repo). Server-side verification of Google Sign-In ID tokens is not yet implemented.
- Recommendation: keep Apps Script for core sheet ops but remove API-key-in-body pattern and move to verified Google Sign-In (ID token verification) or a small, secure token exchange. Use PropertiesService for sheet id and server-only secrets.

---

## 8. Google Integration Assessment

- Google Sign-In: NOT IMPLEMENTED — must be implemented for production-grade auth.
- Google Sheets API: Apps Script uses `SpreadsheetApp` (direct server-side access) — appropriate for this architecture.
- Apps Script: Present and central at [apps-script/Code.gs](apps-script/Code.gs).
- Google Drive: Used server-side for letterhead and PDF generation (`DriveApp.getFileById`, `getAs('application/pdf')`). Good reuse potential.
- Gmail: `MailApp` used for outgoing thank-you emails. No inbound Gmail processing found.
- Firebase Hosting / Firestore: Not used.

Reusable code: Apps Script handlers, `gasFetch.js`, `gpbcApi.js`, tax-letter code, PDF/ZIP clients and utilities.

Insecure / incomplete items: committed `.env.local` with API URL + API key, dev auth stub, client-side logging in `gasFetch` when `DEV` is true.

---

## 9. Financial Data Model Assessment

Current model (observed):
- Contributions: row-per-contribution with fields (id, memberId, fullName, date, serviceType, contributionType, amount, paymentMethod, notes, enteredBy, createdDate)
- Members: row-per-member
- Expenses: captured via `addExpense` but schema is separate

Assessment: The current simple per-row model handles straightforward contributions and expenses, but it does NOT natively support the nuanced reimbursement scenarios required by the Control Book (exact & partial reimbursements, grouping, delayed reimbursements, merchant refunds, credits and allocations across months).

Required changes (recommendation, not implemented here):
1. Introduce a `TRANSACTIONS` (or `PURCHASES`) sheet to record all purchase-level events with unique IDs for each purchase.
2. Introduce a `REIMBURSEMENTS` sheet that references purchase IDs and allows partial allocations (fields: reimbursementId, purchaseId, amountPaid, date, reimbursedBy, notes, receiptLink).
3. For grouped reimbursements, allow `reimbursementAllocations` linking multiple purchaseIds to one reimbursementId (or a join sheet `REIMBURSEMENT_ALLOCATIONS`).
4. Model refunds and card credits as transaction types referencing original purchases.
5. Add `auditMeta` columns (createdBy, createdAt, sourceImport, externalReference) for traceability.

This change will require moderate-to-major refactoring in Apps Script handlers and in UI flows where reimbursements are recorded and displayed.

---

## 10. Audit & Compliance Readiness

- Audit trail: Present via `logAuditEvent` and `useAudit` hook — good foundation.
- Audit automation: `audit/run_audit.js` exists and performs a set of checks and writes `audit/audit_results.json` — a useful local audit harness.
- Missing/compliance features: missing receipt ingestion, no automated missing-receipt detection, no reconciliation engine, and no central Audit Center UI.

Conclusion: The project can become audit-aware with reasonable effort. The Apps Script + master-sheet model is well-suited to enabling per-row audit metadata and rule-based checks; building the Audit Center and reconciliation workflows will be necessary next steps.

---

## 11. Security Findings

SECRET FOUND
- File: `.env.local`
- Approximate location: repository root
- What was found: contains `VITE_GPBC_API_URL` and `VITE_GPBC_API_KEY` committed into repository
- Risk: HIGH — exposure of the Apps Script endpoint and API key allows attackers or unauthorized users to invoke backend actions if the key is accepted. Client-side distribution of an API key is insecure.
- Recommended remediation: remove `.env.local` from repo, add `.env.local` to `.gitignore`, rotate the exposed API key immediately, and replace API-key-in-body auth with Google Sign-In ID token verification or a server-side session/auth token flow.

Other findings:
- `AuthContext.jsx` is a dev stub permitting role switching — fine for development but must be removed / replaced in production.
- Console logging in `gasFetch.js` and other places logs environment info in DEV — ensure production builds strip verbose logging and never log sensitive values.
- No service-account JSON, no Firebase keys, and no other obvious secret artifacts were found beyond `.env.local`.

---

## 12. Code Quality Scores (1–10)

- Maintainability: 6/10 — modular, but dev stubs and missing tests lower the score.
- TypeScript quality: 1/10 — project is JavaScript (no TypeScript footprints).
- Component organization: 7/10 — components and pages are well organized.
- Service separation: 7/10 — API layer (`src/api`) and Apps Script backend are well separated.
- Error handling: 6/10 — `gasFetch` has good error handling; not all call sites uniformly handle failures.
- State management: 6/10 — Context + hooks are used appropriately; no global complexity.
- Dependency quality: 7/10 — reasonable, mainstream dependencies.
- Outdated packages: 7/10 — core stack is modern (React 19, Vite), but audit occasionally required.
- Naming & clarity: 7/10 — generally clear naming conventions.
- Duplicated / dead code: 6/10 — some duplication and placeholders across phases.
- Unfinished TODOs: 5/10 — several TODOs and placeholder pages remain.
- Testing: 2/10 — no automated tests found.
- Documentation: 7/10 — README and phase docs are thorough.
- Deployment readiness: 6/10 — frontend build works; Apps Script deployment and secrets must be addressed.

---

## 13. UX / Design Assessment

- The codebase includes a design system and CSS variables; many UI components are polished and usable (`MetricCard`, `FinancialHealthScore`, `StorytellingCharts`).
- Current theme (wine + green from README) will need adjustment to the recommended palette (Warm Ivory, Mist Blue, Dusty Slate Blue, Soft Sand, Champagne Gold) to align with the Control Book look-and-feel.
- Reusable components: `MetricCard`, charts, `ContributionForm`, `FinancialHealthScore`, `TaxLetterGenerator`, and `Download` utilities are worth preserving.
- Areas to redesign: top navigation, primary color dominance, form UX for reimbursements/receipts (not present yet), Audit Center UI (not present — must be designed).
- Verdict: preserve the design system core but update color tokens, typography, and create new components for receipts and audits.

---

## 14. Technical Debt

- Committed secrets in `.env.local` (critical).
- Dev auth stub present (must be replaced).
- No unit/integration tests.
- No CI or deployment automation for Apps Script.
- No structured reimbursement model or reconciliation tables.
- Large frontend chunks — requires code-splitting.
- Several PHASE_* docs indicate future features; code contains placeholders.

---

## 15. Reusable Assets

KEEP (as-is / immediate reuse):
- [apps-script/Code.gs](apps-script/Code.gs) — core Apps Script logic (after security changes)
- [src/api/gasFetch.js](src/api/gasFetch.js) and `src/api/*` — API layer and wrappers
- `src/components/*` — many UI components (Contributions, Expenses, Charts, TaxLetter components)
- `src/utils/*` — PDF/Excel export utilities and statement generators
- `audit/run_audit.js` — local audit harness
- `public/*` assets — letterhead and logos

REFACTOR (keep but modify):
- `src/context/AuthContext.jsx` — replace dev stub with Google Sign-In integration
- `src/hooks/useAudit.js` — extend for new audit checks and audit metadata
- `apps-script/Code.gs` — harden auth, add reimbursement and reconciliation handlers
- `src/tenants/*` — refine for multi-tenant security and tenant scoping

REMOVE / DEPRECATE (eventually):
- Dev-only helpers: `DevRoleSwitcher.jsx` (remove from production builds)
- Any committed `.env.local` with production secrets — remove from repo

NEW COMPONENTS REQUIRED:
- Audit Center UI + rule engine
- Receipt capture/upload UI (Drive attachment or direct upload)
- Reimbursement workflows (UI + server-side allocation APIs)
- Bank / Card reconciliation importers
- Gmail intake processor (Apps Script or inbox automation)
- Auth bridge: Google Sign-In client + Apps Script token validation service

---

## 16. Missing Capabilities (summary)

- Secure Google Sign-In authentication and server-side verification
- Robust reimbursement data model and UI
- Receipt upload and Drive linkage
- Gmail receipt intake and automatic matching
- Bank/card statement import and reconciliation tools
- Central Audit Center with rule checks and reconciliation dashboards
- Unit and integration tests + CI/CD automation

---

## 17. Recommendation

Recommendation: B — REFACTOR EXISTING PROJECT

Confidence: 85%

Rationale:
- The repository already contains significant, directly useful work: frontend pages, reusable components, Apps Script handlers for core data, PDF and tax-letter generation, and an audit harness. These align strongly with the Control Book's chosen Google-centric architecture.
- The largest outstanding gaps are security (committed API key and dev auth), a missing formal reimbursement data model, receipt ingestion, and a proper authentication flow. These are significant but focused problems — they are best addressed by refactoring and hardening the existing codebase rather than throwing away the work or only cherry-picking components.
- Full rewrite (D) would be costly and unnecessary because the core integration points (Apps Script + Sheets + Drive) and many UI components are already implemented.

---

## 18. Proposed Target Architecture

React + TypeScript + Vite (front-end)
  └ Google Sign-In (ID token)
      └ Google Apps Script (serverless API) — verifies ID token and performs sheet operations
          ├ Google Sheets (single master spreadsheet) — `MEMBERS`, `CONTRIBUTIONS`, `EXPENSES`, `TRANSACTIONS`, `REIMBURSEMENTS`, `AUDIT_LOG`
          ├ Google Drive (receipt storage, PDFs)
          └ Gmail / MailApp (outgoing) and inbox-processing for receipt intake

Optional for heavy analytics: export sanitized rows to BigQuery for long-term analytics and archival.

---

## 19. Migration Plan (high-level phases)

Phase 0 — Safety & Inventory (1–2 weeks)
- Remove `.env.local` from repository and rotate exposed API keys immediately.
- Add `.env.local` to `.gitignore` and publish secure setup docs for developers.
- Confirm Apps Script `GPBC_SHEET_ID` is set only in script properties (not in repo).

Phase 1 — Secure Authentication & Hardening (2–4 weeks)
- Replace dev `AuthContext` with Google Sign-In on the frontend.
- Update Apps Script to validate Google ID tokens (or add a small token verification Cloud Function if necessary) and stop using API-key-in-body for auth.
- Harden logging and remove verbose DEV-only logs.

Phase 2 — Schema & Reimbursement Model (3–6 weeks)
- Design and implement `TRANSACTIONS`, `REIMBURSEMENTS`, and `REIMBURSEMENT_ALLOCATIONS` sheets.
- Update Apps Script handlers to support creation, allocation, partial reimbursements, refunds, and credit memos.
- Update frontend forms and UX for reimbursements, receipts, and linking.

Phase 3 — Audit Center & Reconciliation (4–8 weeks)
- Implement Audit Center backend rules in Apps Script and frontend UI for audit workflows.
- Add bank/card importers and reconciliation UI.
- Add automated checks for missing receipts, duplicates, and unreconciled items.

Phase 4 — Polishing, Tests & Deployment (2–4 weeks)
- Migrate critical modules to TypeScript incrementally (start with `src/api` and `src/hooks`).
- Add unit tests and E2E tests for critical flows.
- Configure CI for build, lint, and Apps Script deployment (or manual secure deployment instructions).
- Optimize build chunking and performance.

Phase 5 — Rollout & Monitoring
- Staged rollout per-tenant, monitor audit logs, and finalize documentation.

---

## 20. Suggested First Development Milestone

Milestone: "Secure Authentication and Secrets" — deliverables:
- Remove committed `.env.local` and rotate the API key.
- Implement Google Sign-In in the frontend and server-side ID token verification in Apps Script.
- Update `gasFetch.js` to stop sending any sensitive key in the request body.
- Add developer docs for local environment variables and secret handling.

Why first: security must be addressed before further development or handling production financial data.

---

## 21. Questions Requiring My Confirmation

1. Can I assume we should adopt Google Sign-In as the mandatory authentication method for production (yes/no)?
2. Do you want a gradual incremental TypeScript migration or a targeted conversion for specific modules only? (options: full-conversion / API-and-hooks-first / none)
3. Do you prefer Apps Script to continue being the only backend for all business logic, or should sensitive auth/token verification be delegated to a small Cloud Function or Cloud Run service?
4. Please confirm the single master spreadsheet ID to use for production (you provided `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s` in the brief) and whether I should avoid reading from it during the audit (I did not modify or query it).
5. Do you want me to produce a prioritized task list (tickets) for Phase 1 (security + auth) and optionally create branch + PR templates for the team?

---

Appendix / Useful file links
- Apps Script backend: [apps-script/Code.gs](apps-script/Code.gs)
- API wrapper: [src/api/gasFetch.js](src/api/gasFetch.js)
- Dev Auth stub: [src/context/AuthContext.jsx](src/context/AuthContext.jsx)
- Audit harness: [audit/run_audit.js](audit/run_audit.js)
- README + phase docs: [README.md](README.md), [PHASE_4_BACKEND_SPEC.md](PHASE_4_BACKEND_SPEC.md), [PHASE_7_BACKEND_SPEC.md](PHASE_7_BACKEND_SPEC.md)

*End of report.*
