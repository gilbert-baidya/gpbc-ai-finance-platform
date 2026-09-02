# GPBC Finance Desk Sandbox Integration Report

**Date**: 2026-09-02  
**Branch**: `feature/gpbc-finance-desk-refactor`  
**Starting commit**: `afb66c6d1221c1e2491ce7d488c742c9d8831372`  
**Status**: BLOCKED ON OWNER-CONTROLLED GOOGLE CONFIGURATION

## Safety Verification

| Check | Result |
| --- | --- |
| Working tree | Existing uncommitted Dashboard/UI work preserved; no files reverted |
| Production data | Not accessed or modified |
| Production deployment | Not performed |
| Phase 5 | Not started |
| Production write control | Source defaults fail closed; project reports record `GPBC_PRODUCTION_WRITES_ENABLED=false`; live Script Property not independently readable from this workspace |
| Production Sheet isolation | Development/schema/reset operations permanently reject the protected production Sheet ID |
| Missing configuration | Fails closed |
| Unknown users | Denied by exact allowlist lookup |
| Audience validation | Mandatory; missing or mismatched `GOOGLE_CLIENT_ID` is rejected |
| Runtime preview token | Removed; DEV preview roles now hold no ID token and cannot authorize backend calls |

## Configuration Status

| Integration item | Status |
| --- | --- |
| `.env.local` ignored by Git | Confirmed |
| `VITE_GPBC_API_URL` | Configured locally; deployment identity and sandbox target not verified |
| `VITE_GOOGLE_CLIENT_ID` | Missing; no value invented |
| Frontend client secret | Not used or stored |
| Apps Script `GOOGLE_CLIENT_ID` | Not verifiable from repository |
| `GPBC_APPROVED_USERS` | Not verifiable from repository |
| `GPBC_ENVIRONMENT=sandbox` | Not verifiable from repository |
| Non-production `GPBC_SHEET_ID` | Not available or verified |
| Physical sandbox Sheet | Not created or verified |
| Sandbox schema | Not initialized |
| Sandbox Apps Script deployment | Existing local endpoint present, but sandbox deployment/configuration not verified |

The local environment also contains the deprecated `VITE_GPBC_API_KEY`. The active finance transport does not use it, but legacy client modules still reference it. Remove and rotate it only through the owner-controlled credential process; it was not printed, copied, or changed during this task.

## Security Hardening Completed

- Google sign-in no longer infers a role from an email domain or substring.
- `AuthContext` calls authenticated `verifySession` and accepts only a backend-returned canonical role.
- DEV preview roles remain available for presentation testing but do not create, store, or send an ID token.
- Apps Script returns a clean deny-by-default response when a cryptographically valid Google user is absent from `GPBC_APPROVED_USERS`.
- No token logging, audience bypass, shared-key fallback, OAuth secret, endpoint, Sheet ID, or production setting was added.

## Live Validation Status

No live claim is made. The following remain **NOT RUN** because Google OAuth and the physical sandbox are not owner-configured:

- Primary Admin, Finance Editor, Viewer, Presbyter Read-Only, and unknown-account real sign-in tests
- Fake transaction, reimbursement, allocation, receipt, check, and capital-project workflow
- Audit Engine and reconciliation live tests
- Monthly Close close/block/reopen/reclose workflow
- Presbyter Report generation or email
- Dashboard transition from unavailable to live values

## Automated Validation

| Check | Result |
| --- | --- |
| `npm test` | PASS — 10 files, 88 tests |
| Focused auth tests | PASS — frontend and Apps Script authorization suites |
| `npm run typecheck` | PASS — 0 errors |
| Touched-file diagnostics | PASS — no editor diagnostics; touched JSX lint-clean |
| `npm run lint` | FAIL — 49 errors and 18 warnings in pre-existing legacy/unrelated files; current ESLint config excludes `.ts`, `.tsx`, and `.gs` |
| `npm run build` | PASS — existing large-chunk warning remains |

## Required Manual Google Steps

1. Open **Google Cloud Console > APIs & Services > Credentials**, create/select a **Web application** OAuth client, add only `http://127.0.0.1:5173` as the Authorized JavaScript origin for this task, and copy the public Client ID.
2. Paste that Client ID into ignored `.env.local` as `VITE_GOOGLE_CLIENT_ID=<CLIENT_ID>`; do not add a client secret.
3. In Google Drive, create a private Google Sheet named `GPBC_Finance_Master_SANDBOX`, confirm it is not the production Sheet, and copy its Sheet ID.
4. Open the existing Apps Script project, then **Project Settings > Script Properties**. Set `GOOGLE_CLIENT_ID` to the same Client ID, `GPBC_ENVIRONMENT=sandbox`, `GPBC_SHEET_ID=<SANDBOX_ID>`, `GPBC_APPROVED_USERS=<VALID_JSON_ALLOWLIST>`, and `GPBC_PRODUCTION_WRITES_ENABLED=false`.
5. In Apps Script, create or identify the sandbox Web app deployment, copy its `/exec` URL, and set ignored `.env.local` `VITE_GPBC_API_URL=<SANDBOX_EXEC_URL>`. Do not reuse an unverified production deployment.
6. Restart with `npm run dev -- --host 127.0.0.1`, sign in as an approved Primary Admin, then run `initializeSandboxSchema()` only after the UI/backend confirms the sandbox environment and non-production Sheet identity.

## Gate Decision

Sandbox integration is **NOT COMPLETE**. Production-release preparation may **NOT** begin. Resume at the real Google Primary Admin sign-in test after the six owner-controlled steps above are complete.