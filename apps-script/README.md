# GPBC Finance Desk — Google Apps Script Backend

This directory contains the Google Apps Script backend codebase for **GPBC Finance Desk — Finance • Audit • Reporting**.

---

## 1. File Structure

- `Code.gs`: Request router (`doPost`, `doGet`), payload parsing, error handling, dispatch.
- `Auth.gs`: Google ID token claim validation, audience verification, user lookup, role authorization.
- `Config.gs`: Script Properties access, church info, schema definitions, environment assertion (`assertEnvironment`), read-only schema inventory (`getSchemaInventory`).
- `Transactions.gs`: (Phase 2) Master Transactions, Income, Expense, Check CRUD and read adapters.
- `Reimbursements.gs`: (Phase 2) Reimbursement records, allocations, personal-card purchases.
- `Receipts.gs`: (Phase 2/5) Receipt Register metadata, Drive evidence management, Gmail intake.
- `Audit.gs`: (Phase 3) Deterministic audit rules, health score calculation, append-only audit event logging.
- `Reports.gs`: (Phase 4) Presbyter PDF generation, Drive export, email dispatch.
- `MonthlyClose.gs`: (Phase 4) Monthly close checklist, period locks, amendment logging.
- `tests/`: Pure-function unit tests for authentication, authorization, and audit rules.

---

## 2. Security & Authorization Conventions

1. **Simple Transport**: Requests from the frontend React application are sent via `fetch` with `Content-Type: text/plain` (avoiding preflight CORS) and JSON body:
   ```json
   {
     "action": "getDashboardSummary",
     "idToken": "<Google_ID_Token>",
     "payload": { "month": 0, "year": 2026 }
   }
   ```
2. **Server-Side Token Verification**: The backend validates token expiry, issuer (`accounts.google.com` or `https://accounts.google.com`), audience (`GOOGLE_CLIENT_ID`), and `email_verified`.
3. **Role Authorization**: Every action maps to minimum required roles:
   - `Primary Admin`: Full access (read, write, audit, close, settings, user management).
   - `Backup Admin`: Full access.
   - `Finance Editor`: Read, write transactions/receipts/reimbursements/contributions, view reports.
   - `Viewer`: Read dashboard, transactions, receipts, reports (no writes, no close, no settings).
   - `Presbyter Read-Only`: Read Presbyter reports, dashboard financial summary, audit summary.
4. **Redacted Diagnostics**: Sensitive details, full payloads, and tokens are never logged or returned in error strings.

---

## 3. Sandbox Smoke Checklist

Before deploying any changes to the production Apps Script project:

1. [ ] Deploy first to a staging/test Apps Script deployment linked to `GPBC_Finance_Master_SANDBOX`.
2. [ ] Test `doGet` health check endpoint returns `status: "Running"`.
3. [ ] Test unauthorized request without token returns `{ success: false, error: "Unauthorized" }`.
4. [ ] Test request with valid Google ID token for an approved user returns data according to role permissions.
5. [ ] Test request with valid Google ID token for an unapproved email returns `{ success: false, error: "Access Denied: Unapproved user" }`.
6. [ ] Test read-only inventory (`getSchemaInventory`) returns tab names and header structures without modifying sheets.
7. [ ] Confirm no tokens, passwords, or personal account numbers appear in Apps Script Execution Logs.
