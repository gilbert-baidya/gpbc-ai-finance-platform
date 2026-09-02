# GPBC Finance Desk — Phase 4 Design Document

**Product**: [GPBC Finance Desk](file:///Volumes/GPBC/Church%20app/gpbc-ai-finance-platform/README.md)  
**Subtitle**: **Finance • Audit • Reporting**  
**Phase**: Phase 4 — Monthly Close, Period Locking & Presbyter PDF Reporting  
**Governing Architecture**: `MD/GPBC_Finance_Desk_Simplified_Architecture.md`  
**Date**: 2026-09-01  

---

## 1. Architectural Overview

Phase 4 establishes an authoritative month-end governance and reporting framework for Grace and Praise Bangladeshi Church (GPBC). It ensures that every closed monthly accounting period is verified, reconciled, documented, and frozen from accidental modification, while providing reproducible oversight reporting for church leadership and presbyters.

```
React + TypeScript + Vite
  ├── MonthlyClose.jsx (10-Step Month-End Checklist & Period Locking Controls)
  └── PresbyterReports.jsx (Executive Oversight Reporting & Print/PDF Engine)
         │
         ▼ Google Sign-In + Authenticated gasFetch
Google Apps Script Router (Code.gs)
  ├── MonthlyClose.gs (Readiness Engine, Period Locking, Lifecycle History)
  ├── PresbyterReports.gs (Aggregation Engine, Privacy Controls, Report Archive)
  ├── FinanceMath.gs (Canonical Purchase-Balance & Pure Period Helpers)
  ├── Auth.gs (Fail-Closed Role Permissions & Server-Side Enforcement)
  └── Config.gs (Master Schema Definitions across ONE Workbook)
         │
         ▼ (Fail-Closed Safety Guard)
Master Google Spreadsheet (ONE Workbook)
  ├── Monthly_Close (Authoritative Period Snapshot & Close State)
  ├── Monthly_Close_History (Immutable Lifecycle Audit Log: Close, Reopen, Amend)
  └── Presbyter_Reports (Archived Oversight Reports Metadata)
```

---

## 2. Monthly Close Domain Model & Schema

### `Monthly_Close` Tab
| Column | Type | Description |
|---|---|---|
| `closeId` | String | Unique close identifier (e.g. `CLS-202608-102`) |
| `periodKey` | String | Canonical `YYYY-MM` identifier (e.g. `2026-08`) |
| `periodStart` | String | Period start date (`YYYY-MM-01`) |
| `periodEnd` | String | Period end date (`YYYY-MM-DD`, e.g. `2026-08-31`) |
| `status` | String | `Open`, `Ready`, `Closed`, or `Reopened` |
| `checklistVersion` | String | Checklist schema version (`1.0`) |
| `incomeReviewed` | Boolean | True when income & tithes are reviewed |
| `expensesReviewed` | Boolean | True when operating expenses are verified |
| `receiptsReviewed` | Boolean | True when receipts are verified |
| `checksReviewed` | Boolean | True when check vouchers & numbers are verified |
| `reimbursementsReviewed` | Boolean | True when reimbursement allocations are balanced |
| `bankReconciled` | Boolean | True when checking statement is reconciled |
| `cardsReconciled` | Boolean | True when credit card statement is reconciled |
| `designatedFundsReviewed` | Boolean | True when restricted fund balances are verified |
| `auditIssuesReviewed` | Boolean | True when audit findings are reviewed |
| `reportGenerated` | Boolean | True when presbyter report is generated |
| `openCriticalIssues` | Number | Count of unresolved CRITICAL audit issues at close |
| `openHighIssues` | Number | Count of unresolved HIGH audit issues at close |
| `auditHealthScore` | Number | Captured Audit Health Score (0-100) at close |
| `totalIncome` | Number | Immutable snapshot of total recognized income |
| `totalRecognizedExpenses` | Number | Immutable snapshot of operating expenses (settlements excluded) |
| `netPosition` | Number | Immutable snapshot of net operating surplus / deficit |
| `closedBy` | String | Verified email of Admin closing the period |
| `closedAt` | String | ISO timestamp of close event |
| `reopenedBy` | String | Verified email of Admin reopening the period |
| `reopenedAt` | String | ISO timestamp of reopen event |
| `reopenReason` | String | Mandatory documented justification for reopening |
| `lastAmendedBy` | String | Verified email of last modifier |
| `lastAmendedAt` | String | ISO timestamp of last amendment |
| `amendmentReason` | String | Justification for amendment |
| `notes` | String | General close notes |
| `createdAt` | String | Record creation timestamp |
| `updatedAt` | String | Record update timestamp |

### `Monthly_Close_History` Tab (Immutable Audit Trail)
| Column | Type | Description |
|---|---|---|
| `historyId` | String | Unique history record ID (e.g. `HIST-1725244800000-101`) |
| `closeId` | String | Reference to `Monthly_Close.closeId` |
| `periodKey` | String | Period key (`YYYY-MM`) |
| `actionType` | String | `CLOSE`, `REOPEN`, or `AMEND` |
| `status` | String | Lifecycle status |
| `auditHealthScore` | Number | Audit score at action time |
| `totalIncome` | Number | Income at action time |
| `totalRecognizedExpenses` | Number | Recognized expenses at action time |
| `netPosition` | Number | Net position at action time |
| `openCriticalIssues` | Number | Critical issue count at action time |
| `openHighIssues` | Number | High issue count at action time |
| `performedBy` | String | Actor email |
| `performedAt` | String | Action timestamp |
| `actionReason` | String | Documented justification |
| `notes` | String | Additional notes |

---

## 3. Server-Side Period Locking Policy

Frontend disabling is insufficient for financial integrity. Every write path enforces the centralized `assertPeriodWritable(date, actionName, userEmail, db)` guard:

```javascript
function assertPeriodWritable(transactionDate, actionName, userEmail, dbInstance) {
  if (!transactionDate) return;
  const periodKey = getPeriodKey(transactionDate);
  const isClosed = isDateInClosedPeriod(transactionDate, dbInstance);

  if (isClosed) {
    throw new Error(
      "Period " + periodKey + " is CLOSED. Financial write (" + (actionName || "Action") +
      ") is locked. An authorized Admin must reopen the period with a documented reason before records can be modified."
    );
  }
}
```

### Protected Write Paths:
1. `addTransaction` (`Transactions.gs`)
2. `updateTransaction` (`Transactions.gs`)
3. `addIncome` (`Transactions.gs`)
4. `addExpense` (`Transactions.gs`)
5. `addReimbursement` (`Reimbursements.gs`)
6. `addReimbursementAllocation` (`Reimbursements.gs`)
7. `addReceipt` (`Receipts.gs`)
8. `matchReceiptToTransaction` (`Receipts.gs`)
9. `addCheckDetail` (`Receipts.gs`)
10. `matchReconciliationLine` (`Audit.gs`)

---

## 4. Presbyter Report Architecture & Privacy Protections

### Aggregation Invariants:
1. **Operating Expenses**: Strict exclusion of `SETTLEMENT` payouts (reimbursements) from recognized operating disbursements to prevent double-counting.
2. **Designated Funds**: Dynamic calculation from canonical transactions.
3. **Capital Projects**: Real-time aggregation of approved budget, donations received, expenses paid, and remaining balance.
4. **Audit Appendix**: Non-sensitive summary of compliance findings with actionable recommendations.

### Privacy & Confidentiality Controls:
- Prohibits inclusion of Google ID tokens, banking credentials, full card account numbers, or internal system secrets.
- Reimbursements report high-level claimant totals without personal credit card details.
