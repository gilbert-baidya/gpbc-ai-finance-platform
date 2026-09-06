# GPBC Finance Desk Production Release Plan

**Status: PLAN ONLY — NO PHASE HAS BEEN EXECUTED**

Production remains unchanged. Google authentication, Apps Script deployment, Netlify deployment, workbook changes, Drive changes, schema migration, and production writes are prohibited until the manual gates below are satisfied.

## Authoritative Release References

- Production Script ID: `1BgtzueL8xAfkMX_OtVdjhwUF5XmAw3-zvqsUK74uPsv0TJFre00zupvS`
- Production workbook: `1QW6DA3vBiY08qJXw-XRK71-q21kWMLVnnMaQBPnX8fE`
- Sandbox workbook: `1y3kTt5MTMvi4XTEDL6ZgydIX4NDMYGFdHx5w4QCQAwA`
- Expected production schema after controlled migration: 19 tabs

**MANUAL GATE:** PRODUCTION DEPLOYMENT ID — MANUAL VERIFICATION REQUIRED BEFORE RELEASE. The deployment ID must be verified against the Production Script ID before Phase D. Do not infer it from a source URL or historical version label.

## Phases

### Phase A — Production backup

Create and independently verify a timestamped production workbook and Drive evidence backup. Record backup IDs and human approval. Do not modify the production workbook before backup evidence exists.

### Phase B — Verify production deployment identity

Manually verify the Apps Script production deployment ID, deployment version, web-app access policy, and Netlify upstream mapping. Record the evidence and approve the gate.

### Phase C — Production schema migration to 19 tabs

Run the approved, idempotent migration against the authoritative production workbook only after backup evidence and migration approval. Verify headers, tab count, row counts, formulas, and rollback readiness.

### Phase D — Apps Script release

After the manual deployment gate passes, publish the reviewed Apps Script version to the verified production deployment. Confirm `GPBC_PRODUCTION_WRITES_ENABLED=false` during validation.

### Phase E — Netlify release

Publish the reviewed frontend and server functions only after the Apps Script endpoint mapping is verified. Confirm same-origin routing, server-only OpenAI credentials, and no sandbox endpoint in the production browser bundle.

### Phase F — Smoke test with writes still FALSE

Run health, authentication, RBAC, route, statement import review, committee packet, reconciliation, and mobile smoke checks. Confirm no workbook or Drive mutation and keep production writes disabled.

### Phase G — Controlled production write enablement

Only after human finance-owner sign-off, backup verification, migration verification, deployment verification, and smoke-test evidence may the production write guard be enabled in a separately approved change.

### Phase H — Rollback

Disable production writes, revert the verified Apps Script deployment and Netlify release, restore the approved workbook/Drive backup if required, and document the incident and reconciliation checks before any retry.

## Required Release Evidence

- Manual verification of the production deployment ID and Script ID mapping
- Production workbook and Drive backup evidence
- 19-tab schema migration approval and verification
- Apps Script and Netlify release records
- Smoke-test results with writes disabled
- Secret and bundle scan results
- Human finance-owner sign-off