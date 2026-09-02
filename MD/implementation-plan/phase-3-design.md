# GPBC Finance Desk — Phase 3 Technical Design & Rule Specification

**Product**: [GPBC Finance Desk](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/README.md)  
**Subtitle**: **Finance • Audit • Reporting**  
**Governing Architecture**: `MD/GPBC_Finance_Desk_Simplified_Architecture.md`  
**Phase**: Phase 3 — Audit & Reconciliation Center  
**Status**: Technical Design & Specification (Pre-Implementation Gating)  

---

## 1. Architectural Principles

1. **100% Deterministic & Explainable**: Every audit issue is triggered by an unambiguous rule evaluation against canonical ledger data. No opaque or non-deterministic AI generation is used for compliance evaluation.
2. **Explainable Health Score**: The Audit Health Score is calculated directly from active unresolved audit issues with published point deductions and category caps.
3. **No External Paid Banking Services**: Bank and card statement reconciliation uses standard CSV/manual statement uploads without Plaid or recurring third-party subscriptions.
4. **Zero Account Number Storage**: Statement imports do not persist banking routing or full account numbers to Google Sheets or application state.

---

## 2. Deterministic Audit Rules Catalog

### Rule 1: Missing Receipt for Expense (`RULE-RCP-001`)
- **Category**: Receipts & Evidence
- **Severity**: `HIGH`
- **Input Data**: `Transactions`, `Expense Detail`, `Receipt_Register`
- **Condition**: `direction === 'EXPENSE'` AND `receiptStatus !== 'Exempt'` AND (`receiptId === ''` OR `receiptStatus === 'Needs Receipt'`) AND `amount >= 25.00`
- **Result Status**: `Needs Receipt`
- **Recommended Action**: Upload receipt image or invoice to Receipt Register and link to transaction.
- **Affected Record ID**: `transactionId` / `expenseId`
- **Evidence Link**: Link to Google Drive folder or Receipt Register modal.
- **Resolution State**: `Cleared` when valid receipt is attached.

---

### Rule 2: Missing Payee or Vendor Name (`RULE-PAY-001`)
- **Category**: Compliance
- **Severity**: `MEDIUM`
- **Input Data**: `Transactions`
- **Condition**: `payeeOrPayer === ''` OR `payeeOrPayer === 'Unknown'` OR `payeeOrPayer === 'N/A'`
- **Result Status**: `Needs Explanation`
- **Recommended Action**: Edit transaction to record specific vendor, merchant, or individual payee.
- **Affected Record ID**: `transactionId`
- **Evidence Link**: N/A
- **Resolution State**: `Cleared` when payee is specified.

---

### Rule 3: Missing Check Voucher / Disbursement Documentation (`RULE-CHK-001`)
- **Category**: Disbursements
- **Severity**: `HIGH`
- **Input Data**: `Transactions`, `Check_Details`
- **Condition**: `paymentMethod === 'Check'` AND (`checkNumber === ''` OR referenced `Check_Details.driveUrl === ''`) AND `amount >= 100.00`
- **Result Status**: `Missing Documentation`
- **Recommended Action**: Record check number and upload signed voucher/copy to Check Details.
- **Affected Record ID**: `transactionId` / `checkId`
- **Evidence Link**: Drive URL to check voucher.
- **Resolution State**: `Cleared` when voucher attachment is verified.

---

### Rule 4: Unallocated Reimbursement Payout Balance (`RULE-RMB-001`)
- **Category**: Reimbursements
- **Severity**: `HIGH`
- **Input Data**: `Reimbursements`, `Reimbursement_Allocations`
- **Condition**: `totalReimbursedAmount > sum(allocatedAmount)` across linked allocations.
- **Result Status**: `Partial Reimbursement`
- **Recommended Action**: Allocate unassigned reimbursement funds to underlying church expense transactions.
- **Affected Record ID**: `reimbursementId`
- **Evidence Link**: Linked reimbursement breakdown.
- **Resolution State**: `Cleared` when all disbursed reimbursement funds are fully allocated.

---

### Rule 5: Over-Allocated Reimbursement Purchase (`RULE-RMB-002`)
- **Category**: Reimbursements
- **Severity**: `CRITICAL`
- **Input Data**: `Transactions`, `Reimbursement_Allocations`
- **Condition**: `sum(allocatedAmount + personallyAbsorbedAmount) > purchaseAmount` for any `purchaseTransactionId`.
- **Result Status**: `Discrepancy`
- **Recommended Action**: Adjust allocation amounts or record explicit refund credit adjustment.
- **Affected Record ID**: `purchaseTransactionId` / `reimbursementId`
- **Evidence Link**: Allocation audit view.
- **Resolution State**: `Cleared` when aggregate allocations equal or fall below purchase cost.

---

### Rule 6: Possible Duplicate Transaction (`RULE-DUP-001`)
- **Category**: Compliance
- **Severity**: `MEDIUM`
- **Input Data**: `Transactions`
- **Condition**: Two or more transactions with identical `amount`, identical `direction`, identical `payeeOrPayer`, and `transactionDate` within 3 calendar days of each other.
- **Result Status**: `Possible Duplicate`
- **Recommended Action**: Review whether transaction was entered twice or confirm distinct valid payments.
- **Affected Record ID**: `[transactionId_1, transactionId_2]`
- **Evidence Link**: Side-by-side transaction comparison.
- **Resolution State**: `Reviewed` (confirmed intentional duplicate) or `Cleared` (duplicate removed/voided).

---

### Rule 7: Unlinked Merchant Refund / Card Credit (`RULE-REF-001`)
- **Category**: Receipts & Evidence
- **Severity**: `MEDIUM`
- **Input Data**: `Transactions`, `Reimbursement_Allocations`
- **Condition**: `transactionType === 'Refund'` OR `transactionType === 'Card Credit'` without linked original purchase or adjustment.
- **Result Status**: `Needs Explanation`
- **Recommended Action**: Link refund to original expense transaction or record allocation offset.
- **Affected Record ID**: `transactionId`
- **Evidence Link**: Credit memo / receipt.
- **Resolution State**: `Cleared` when offset is reconciled.

---

### Rule 8: Designated Fund Overdraft (`RULE-FND-001`)
- **Category**: Compliance
- **Severity**: `CRITICAL`
- **Input Data**: `Transactions` aggregated by `fundId`
- **Condition**: `fundId !== 'General'` AND `sum(Income) - sum(Operating Expenses) < 0`
- **Result Status**: `Discrepancy`
- **Recommended Action**: Transfer operating support or correct misclassified expense allocations.
- **Affected Record ID**: `fundId`
- **Evidence Link**: Fund balance ledger.
- **Resolution State**: `Cleared` when designated balance returns to >= $0.00.

---

### Rule 9: Unreconciled Bank / Card Statement Line (`RULE-REC-001`)
- **Category**: Reconciliation
- **Severity**: `HIGH`
- **Input Data**: `Bank_Staging`, `Transactions`
- **Condition**: Staged bank/card statement transaction older than 30 days with `matchStatus === 'Unmatched'`.
- **Result Status**: `Pending Match`
- **Recommended Action**: Match against existing ledger transaction or record missing expense/income entry.
- **Affected Record ID**: `statementLineId`
- **Evidence Link**: Statement line reference.
- **Resolution State**: `Reconciled` when matched to ledger.

---

### Rule 10: Uncategorized Transaction (`RULE-CAT-001`)
- **Category**: Compliance
- **Severity**: `LOW`
- **Input Data**: `Transactions`
- **Condition**: `category === ''` OR `category === 'Uncategorized'` OR `category === 'General'`
- **Result Status**: `Needs Explanation`
- **Recommended Action**: Assign appropriate ministry budget category.
- **Affected Record ID**: `transactionId`
- **Evidence Link**: N/A
- **Resolution State**: `Cleared` when category is assigned.

---

### Rule 11: Receipt vs Transaction Discrepancy (`RULE-DIS-001`)
- **Category**: Receipts & Evidence
- **Severity**: `HIGH`
- **Input Data**: `Transactions`, `Receipt_Register`
- **Condition**: `Transactions.receiptId === Receipt_Register.receiptId` AND `Math.abs(Transactions.amount - Receipt_Register.amount) >= 0.01`
- **Result Status**: `Discrepancy`
- **Recommended Action**: Review receipt for sales tax, tip, or split purchase items and update transaction.
- **Affected Record ID**: `transactionId` / `receiptId`
- **Evidence Link**: Receipt document link.
- **Resolution State**: `Cleared` when amounts reconcile.

---

## 3. Audit Issues Schema (`Audit_Issues`)

The `Audit_Issues` tab will store persistent and transient audit findings:

| Column Index | Field Name | Type | Description |
|---|---|---|---|
| A | `auditIssueId` | String | Unique finding identifier (`AUD-YYYYMMDD-XXXX`) |
| B | `ruleId` | String | Evaluated rule (`RULE-RCP-001`, etc.) |
| C | `severity` | String | `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO` |
| D | `status` | String | Resolution state (`Needs Receipt`, `Needs Explanation`, etc.) |
| E | `entityType` | String | Target entity (`Transaction`, `Expense`, `Reimbursement`, etc.) |
| F | `entityId` | String | ID of target entity (`TXN-XXXX`, `RMB-XXXX`, etc.) |
| G | `title` | String | Short finding summary |
| H | `description` | String | Detailed explanation of discrepancy |
| I | `amount` | Number | Financial amount involved |
| J | `detectedAt` | ISO Date | Timestamp of rule evaluation |
| K | `detectedBy` | String | Engine or user identifier (`System Engine`) |
| L | `assignedTo` | String | User assigned for resolution |
| M | `resolutionNotes` | String | Pastor / Treasurer explanation |
| N | `resolvedBy` | String | Email of resolver |
| O | `resolvedAt` | ISO Date | Timestamp of resolution |
| P | `evidenceUrl` | String | Google Drive evidence link |

---

## 4. Deterministic Audit Health Score Model

### Scoring Formula
$$\text{Audit Health Score} = \max\left(0, 100 - \sum \text{Severity Deductions}\right)$$

### Point Deduction Matrix
| Severity | Points Deducted per Unresolved Issue | Category Cap |
|---|---|---|
| `CRITICAL` | 15 points | Max 45 points |
| `HIGH` | 8 points | Max 32 points |
| `MEDIUM` | 3 points | Max 15 points |
| `LOW` | 1 point | Max 8 points |
| `INFO` | 0 points | 0 points |

### Score Tiers
- **90–100**: **Excellent / Audit Ready** (Clean compliance, minor low-priority items)
- **75–89**: **Good / Action Recommended** (Missing receipts or pending reconciliations)
- **60–74**: **Fair / Review Required** (High-severity issues or unallocated funds)
- **< 60**: **Critical Attention Needed** (Designated fund overdrafts or over-allocations)

---

## 5. Bank & Card Statement Reconciliation Engine

### Architecture
1. **Frontend CSV Parser**: Client-side CSV file parsing for bank statements (Chase, BofA, Wells Fargo) and card statements (Capital One).
2. **Transient Staging Register**:
   - `statementLineId`
   - `statementDate`
   - `description`
   - `amount`
   - `statementType`
   - `matchStatus` (`Unmatched`, `Matched`, `Discrepancy`)
   - `matchedTransactionId`
3. **Deterministic Match Algorithm**:
   - **Exact Match**: Matching date ($\pm 2$ days), exact amount ($0.00$ diff), compatible direction.
   - **Probable Match**: Exact amount ($0.00$ diff), date within $\pm 7$ days, similar payee keywords.
   - **Discrepancy**: Matched reference but amount difference $> \$0.00$.
4. **Safety & Privacy**:
   - Zero storage of banking routing/account numbers.
   - Zero third-party paid API dependencies.
