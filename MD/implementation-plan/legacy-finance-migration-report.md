# Legacy Finance Migration Report

**Date**: 2026-09-02
**Source**: `GPBC Finance Report - July & August 2026`
**Target**: `GPBC_Finance_Master_SANDBOX`
**Stage**: Controlled sandbox migration complete
**Migration run ID**: `LEGACY-2026-JUL-AUG-V1`
**Write gate**: `EXECUTED_IDEMPOTENTLY`

## Safety Result

- The historical workbook was read only. It was not edited.
- Exactly 297 historical rows were written across nine canonical/evidence tabs on the first run.
- A second invocation wrote zero rows and skipped all 297 deterministic identities.
- Production writes remain disabled.
- The prior `$10.00` TEST income and linked transaction remain unchanged and are excluded from every historical total below.
- The executor is Admin-only, sandbox-ID/title locked, confirmation gated, source-control gated, and production-forbidden.
- Phase 5 was not started.

## Source Controls

| Source sheet | Data rows | Primary disposition |
| --- | ---: | --- |
| Presbyter Summary | 19 | Skip: derived/control |
| July 2026 | 26 | Skip: duplicates primary detail rows |
| August 2026 | 31 | Skip: duplicates primary detail rows |
| Offering Deposits | 9 | Link as evidence to Income Detail |
| Expense Detail | 39 | Classify as direct expense or settlement |
| Income Detail | 18 | Classify as ordinary income or settlement return |
| Finance Charts | 32 | Skip: derived/control |
| Check Details | 8 | Import and link as check evidence |
| Receipt Register | 10 | Import and link as receipt evidence |
| Capital One Audit Trail | 43 | Import to reconciliation staging |
| June Purchase Support | 45 | Import 40 purchases; skip 5 summaries |

All 280 populated source rows have a group-level disposition. The analyzer passed every expected row-count and source-total control.

## Migrated Canonical Records

| Record group | Count |
| --- | ---: |
| Transactions | 114 |
| Income Detail | 17 |
| Expense Detail | 85 |
| Reimbursements | 10 |
| Reimbursement Allocations | 9 |
| Receipt evidence | 10 |
| Check evidence | 8 |
| Reconciliation staging lines | 43 |
| Offering evidence links | 9 |
| Capital projects | 1 |
| Approved review categories retained in dry run | 7 |

The 114 transactions comprise 17 ordinary-income records, 28 direct expenses, 57 underlying personal-card purchases, 11 settlement outflows, and one settlement inflow.

## Financial Controls

| Control | Amount |
| --- | ---: |
| Legacy income/cash inflows | `$11,207.05` |
| Legacy expense/cash outflows | `$12,138.94` |
| Legacy cash net | `-$931.89` |
| Canonical ordinary income | `$10,796.05` |
| Canonical recognized expenses | `$11,485.66` |
| Settlement inflows | `$411.00` |
| Settlement outflows | `$4,680.07` |

Cash controls and recognized-expense controls intentionally differ. Reimbursement/card payouts and the rental-deposit return are settlements; underlying purchases carry the expense impact.

## Accounting Decisions

- The `$411.00` reimbursement return is `SETTLEMENT`, not ordinary income.
- The outgoing `$411.00` duplicate/extra reimbursement and its same-day return remain a linked settlement reversal pair.
- The `$1,000.00` rental-deposit return is `SETTLEMENT`, not operating expense.
- The two July reimbursements totaling `$1,356.17` do not receive invented item allocations across `$1,648.42` of June purchases.
- June support creates 40 underlying `EXPENSE` proposals with `2026-06` month precision because exact dates are absent.
- Distinct Capital One merchandise/dining debits from June 30 onward create underlying purchase proposals. Overlapping June card lines remain reconciliation evidence for June support instead of becoming duplicate expenses.
- Receipt item children link to their aggregate Walmart transactions and do not create duplicate expenses.
- Exact source-supported allocations cover the `$716.36` card payment, `$150.00` retreat groceries, `$17.38` Domino's payment, `$304.47` Amazon reimbursement, `$289.57` AliExpress reimbursement, `$24.12` partial AliExpress payment, and `$411.00` Alibaba reimbursement. Nine allocation rows total `$1,912.90`.
- The `$25.50` AliExpress purchase retains `$1.38` unresolved. The `$411.96` Alibaba purchase retains `$0.96` unresolved. Neither difference is marked personally absorbed without evidence.

## Approved Review Outcomes

- All 11 human-review decisions were approved on 2026-09-02 and retained in `legacy-finance-critical-review.md`.
- Month-only June dates, missing claimant evidence, two unallocated July reimbursements, three unlinked merchant credits, and `$2.34` of partial balances remain visibly reviewable.
- The Electrical Panel project uses the approved `$5,200.00` budget metadata while importing only source-supported income and expense rows.
- The rental-deposit return and the outgoing/returned `$411.00` pair are settlements, not operating income or expense.
- Approved unresolved findings no longer block this run; any new source control failure or unreviewed category still blocks writes.

## Validation

- First execution: `written=297`, `skipped=0`; second execution: `written=0`, `skipped=297`.
- Final sandbox row counts including the TEST pair: Transactions 115, Income Detail 18, Expense Detail 85, Reimbursements 10, Allocations 9, Receipts 10, Checks 8, Projects 1, and Reconciliation 43.
- Historical totals independently queried from Sheets: ordinary income `$10,796.05`, recognized expenses `$11,485.66`, settlement inflows `$411.00`, settlement outflows `$4,680.07`, allocations `$1,912.90`.
- Reimbursement statuses: five Fully Reimbursed, two Needs Review, two Partially Reimbursed, and one Reversed.
- Deterministic audit completed with 143 trace-linked findings: 95 high and 48 medium, no critical findings. Health score: 53.
- The unchanged TEST transaction remains `TXN-20260902-17336`, `$10.00`, `TEST Sandbox Donor`.
- Full suite: 12 files and 110 tests passed. TypeScript, production build, editor diagnostics, and `git diff --check` passed; the existing bundle-size warning remains.
- Final Apps Script deployment: `GPBC Finance Desk Sandbox API`, version 9.
- Real-auth localhost visual verification is blocked by Google Identity HTTP 403 even though the sandbox OAuth client contains both exact local origins. Direct authenticated Sheets verification and Apps Script editor execution succeeded.
- Production was not written or deployed. `GPBC_PRODUCTION_WRITES_ENABLED` remains false. Phase 5 remains not started.
