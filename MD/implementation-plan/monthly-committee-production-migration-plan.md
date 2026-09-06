# Monthly Committee Approval Production Migration Plan

Status: PLAN ONLY. Do not execute until merge review and explicit production authorization.

## Scope

Add persistent committee governance storage to the existing 16-tab production workbook:

- `Committee_Members`
- `Monthly_Committee_Approval`
- `Committee_Approval_Decisions`

Expected production tab count after migration: 19.

This plan does not change production Apps Script, the production workbook, or production Drive.

## Headers

`Committee_Members`:

`memberId`, `fullName`, `roleTitle`, `email`, `phone`, `status`, `effectiveFrom`, `effectiveTo`, `createdBy`, `createdAt`, `updatedBy`, `updatedAt`

`Monthly_Committee_Approval`:

`approvalId`, `periodKey`, `packetVersion`, `isLatestVersion`, `status`, `totalRecognizedExpenses`, `expenseCount`, `receiptsCompleteCount`, `missingEvidenceCount`, `needsClarificationCount`, `reimbursementSettlementTotal`, `capitalProjectTotal`, `packetHash`, `expenseSnapshotJson`, `approvalRuleSnapshot`, `eligibleMemberCount`, `requiredApprovalCount`, `actualApprovalCount`, `meetingDate`, `approvalMethod`, `meetingMinutesRef`, `generalComments`, `overrideApplied`, `overrideReason`, `overrideBy`, `documentId`, `amendmentReason`, `previousApprovalId`, `submittedBy`, `submittedAt`, `finalizedBy`, `finalizedAt`, `createdAt`, `updatedAt`

`Committee_Approval_Decisions`:

`decisionId`, `approvalId`, `periodKey`, `packetVersion`, `memberId`, `memberNameSnapshot`, `memberRoleSnapshot`, `decision`, `decisionDate`, `approvalMethod`, `comment`, `recordedBy`, `recordedAt`

## Idempotency

1. Require the target workbook ID to equal the configured production workbook ID and require `GPBC_ENVIRONMENT=production` with an explicit migration flag.
2. For each tab, locate by exact name. If absent, create it once and write the exact header row.
3. If present, compare the physical header row exactly before making any changes. Abort on mismatch, duplicate tab names, or unexpected existing data.
4. Record a migration run ID and header fingerprints in an audit record. A repeated run returns the existing run result without appending rows or creating duplicate tabs.
5. Never seed committee members or approval decisions during schema migration.

## Verification

1. Record pre-migration tab names, tab count, header rows, workbook ID, and close-control fingerprints.
2. Run the migration in a separately authorized maintenance window.
3. Read the workbook again from a fresh Apps Script process and verify exactly 19 tabs and exact physical headers.
4. Verify all existing 16 tabs have unchanged headers, row counts, close IDs, financial totals, and `reportGenerated` values.
5. Verify `Monthly_Close` and `Monthly_Close_History` are byte-for-byte unchanged.
6. Run read-only application smoke tests, then a controlled committee persistence test with explicitly approved test identities only.
7. Capture rollback evidence and obtain human sign-off before enabling production committee writes.

## Rollback

Before migration, export a versioned workbook backup and preserve the pre-migration tab/header manifest. If verification fails, disable the feature flag and restore the workbook from that backup during the approved maintenance window. Do not delete governance tabs blindly after writes have occurred; reconcile any generated approval/document evidence first, then remove only the migration-created tabs under dual-admin approval.
