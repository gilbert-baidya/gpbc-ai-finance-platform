# GPBC Finance Desk — Phase 2 Historical Data Migration & Sandbox Plan

**Date**: 2026-09-01  
**Status**: DRAFT FOR OWNER REVIEW (NO PRODUCTION MIGRATION PERFORMED)  
**Governing Architecture**: `MD/GPBC_Finance_Desk_Simplified_Architecture.md`  

---

## 1. Objectives & Non-Destructive Principles

1. **Non-Destructive Invariant**: Historical production rows in `CONTRIBUTIONS`, `EXPENSES`, `IMPORT_2025_CONTRIBUTIONS`, and `MEMBERS` will **NEVER** be modified or deleted in-place.
2. **Adapter First**: The frontend and Apps Script backend read historical records transparently via bidirectional read adapters.
3. **Sandbox Rehearsal**: The migration procedure described below is rehearsed and validated **ONLY** in `GPBC_Finance_Master_SANDBOX`.
4. **Approval Gate**: Actual migration to the master workbook requires explicit church owner review and a verified pre-migration backup copy.

---

## 2. Source-to-Target Mapping

### A. Contributions Mapping (`CONTRIBUTIONS` → `Transactions` & `Income Detail`)

| Source Column (`CONTRIBUTIONS`) | Target Field (`Transactions`) | Transformation Rule |
|---|---|---|
| `ContributionID` | `transactionId` | Mapped directly (prefixed if needed: `TXN-CTR-xxx`) |
| `Date` | `transactionDate` | Normalized to ISO `YYYY-MM-DD` |
| `ContributionType` | `transactionType` | Mapped to enum (`Tithe` → `Sunday Offering` / `General Donation`, `Building Fund` → `Designated Donation`, `Mission` → `Designated Donation`) |
| `'INCOME'` | `direction` | Set to `INCOME` |
| `Amount` | `amount` | Numeric positive currency float |
| `FullName` | `payeeOrPayer` | Donor full name |
| `ServiceType` + `Notes` | `description` | Formatted descriptive note |
| `'General'` / Fund | `fundId` | Inferred from `ContributionType` |
| `PaymentMethod` | `paymentMethod` | Cash, Check, Zelle, etc. |
| `Notes` | `notes` | Preserved directly |
| `EnteredBy` | `createdBy` | System / user identifier |
| `CreatedAt` | `createdAt` | ISO timestamp |

---

### B. Expenses Mapping (`EXPENSES` → `Transactions` & `Expense Detail`)

| Source Column (`EXPENSES`) | Target Field (`Transactions`) | Transformation Rule |
|---|---|---|
| `ExpenseID` | `transactionId` | Mapped directly (prefixed `TXN-EXP-xxx`) |
| `Date` | `transactionDate` | Normalized to ISO `YYYY-MM-DD` |
| `'Expense'` | `transactionType` | Set to `Expense` (or `Personal-Card Church Purchase` if marked) |
| `'EXPENSE'` | `direction` | Set to `EXPENSE` |
| `Amount` | `amount` | Numeric positive currency float |
| `Vendor` | `payeeOrPayer` | Payee / vendor name |
| `Category` + `Notes` | `description` | Preserved |
| `Category` | `category` | Mapped to category list |
| `PaymentMethod` | `paymentMethod` | Church Card, Check, Zelle, Personal Card |
| `Notes` | `notes` | Preserved directly |

---

## 3. Ambiguity & Manual Review Strategy

1. **Reimbursements & Personal-Card Expenses**:
   - Historical records that mention "Reimbursement" or personal payments in `Notes` are flagged with `reconciliationStatus: 'Pending Match'` rather than guessing relationships.
   - Church leadership reviews these in the Reimbursements UI to establish explicit `Reimbursement_Allocations`.
2. **Designated Funds & Capital Projects**:
   - Building Fund and Capital campaign gifts are mapped to `fundId: 'Building'` with linked project IDs flagged for verification.
3. **Duplicate Detection**:
   - Records sharing identical date, amount, donor/payee, and payment method are imported with `notes: '[FLAGGED POSSIBLE DUPLICATE]'` and queued for review in Phase 3.

---

## 4. Rollback & Disaster Recovery Strategy

1. **Pre-Migration Snapshot**:
   - Full spreadsheet copy created before any operation: `GPBC_Finance_Master_BACKUP_YYYYMMDD_HHMMSS`.
2. **Idempotent / Repeatable Execution**:
   - Migration script checks `Transactions` for existing `transactionId`. Re-running will update or skip already migrated rows without creating duplicates.
3. **Rollback Action**:
   - If migration fails, new tabs can be cleared safely while historical tabs (`MEMBERS`, `CONTRIBUTIONS`, `EXPENSES`) remain 100% untouched.

---

## 5. Validation Protocol

1. **Sum Validation**: Total income in `Transactions` MUST exactly equal the sum of `CONTRIBUTIONS` amount for every historical year.
2. **Count Validation**: Total rows in `Transactions` where `direction === 'INCOME'` MUST match total rows in `CONTRIBUTIONS`.
3. **Expense Sum Validation**: Total expenses in `Transactions` MUST exactly equal the sum of `EXPENSES` amount.
