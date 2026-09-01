# GPBC Finance Desk — Phase 2 Sandbox Schema Inventory & Tab Strategy

**Date**: 2026-09-01  
**Target Spreadsheet**: `GPBC_Finance_Master_SANDBOX` (Non-production copy)  
**Production Spreadsheet (READ-ONLY)**: `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s`  
**Authoritative Reference**: `MD/GPBC_Finance_Desk_Simplified_Architecture.md`  

---

## 1. Safety Guard & Sheet Isolation

- **Production Sheet Rule**: Production Spreadsheet ID `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s` is locked as strictly **READ-ONLY**.
- **Development Safety Assertion**: Any schema initialization, migration, or write action checks `assertSandboxSheet()` in `apps-script/Config.gs` and immediately aborts if directed at the production ID.
- **Single Workbook Invariant**: All Phase 2 tabs and historical legacy tabs reside within **one single master workbook**. No multi-workbook synchronization is used.

---

## 2. Preserved Historical Sheets (Pre-existing Structure)

The following tabs exist in the legacy workbook and are **100% preserved** without destructive schema modification or row deletion:

### A. `MEMBERS`
- **Purpose**: Member directory and profiles
- **Columns**: `[MemberID, FullName, FamilyName, Address, City, State, Zip, Phone, Email, Language, CreatedAt, EnvelopeNumber, Status, Notes]`

### B. `CONTRIBUTIONS`
- **Purpose**: Legacy tithe and offering contributions record
- **Columns**: `[ContributionID, MemberID, FullName, Date, ServiceType, ContributionType, Amount, PaymentMethod, Notes, EnteredBy, CreatedAt]`

### C. `IMPORT_2025_CONTRIBUTIONS`
- **Purpose**: Historical 2025 giving totals from imported ledger
- **Columns**: `[Donor Name, Total, ...]`

### D. `EXPENSES`
- **Purpose**: Legacy expense records
- **Columns**: `[ExpenseID, Date, Category, Vendor, Amount, PaymentMethod, Notes, CreatedAt]`

### E. `SOCAL_REPORT_EXPORT`
- **Purpose**: Exported monthly SoCal network reports
- **Columns**: `[Month, Year, Type, Category, Amount, Notes, ExportedAt]`

### F. `AUDIT_LOGS`
- **Purpose**: Append-only security and operational audit trail
- **Columns**: `[Timestamp, Actor, Action, Status, Details]`

---

## 3. Phase 2 Canonical Schema (Sandbox Tabs)

The Phase 2 schema is initialized idempotently in the sandbox workbook with the following defined structures:

### 1. `Transactions` (Canonical Master Ledger)
| Col Index | Field Name | Type | Description / Constraints |
|---|---|---|---|
| 0 | `transactionId` | String | Unique ID (`TXN-YYYYMMDD-XXXXX` or `TXN-timestamp`) |
| 1 | `transactionDate` | String/Date | ISO Date (`YYYY-MM-DD`) |
| 2 | `transactionType` | Enum | Sunday Offering, General Donation, Special Donation, Designated Donation, Capital Project Donation, Expense, Reimbursement, Refund, Card Credit, Transfer, Check Payment, Personal-Card Church Purchase, Capital Project Expense, Other Income, Other Expense |
| 3 | `direction` | Enum | `INCOME`, `EXPENSE`, `TRANSFER` |
| 4 | `amount` | Number | Decimal currency amount (> 0) |
| 5 | `payeeOrPayer` | String | Member name, donor, vendor, claimant, or payee |
| 6 | `description` | String | Description of purpose / church justification |
| 7 | `category` | String | Accounting / ministry category |
| 8 | `fundId` | String | General, Building, Missions, Youth, Benevolence, Designated |
| 9 | `capitalProjectId` | String | Optional linked capital project ID (`PRJ-XXXX`) |
| 10 | `paymentMethod` | Enum | Cash, Check, Zelle, Credit Card, Debit Card, ACH / Bank Transfer, Personal Card, Other |
| 11 | `checkNumber` | String | Check number if applicable |
| 12 | `personalPurchase` | Boolean | `TRUE` if paid with personal card/account |
| 13 | `claimantName` | String | Name of purchaser for reimbursements |
| 14 | `reconciliationStatus` | Enum | `Unreconciled`, `Pending Match`, `Reconciled`, `Discrepancy` |
| 15 | `receiptStatus` | Enum | `Attached`, `Needs Receipt`, `Exempt`, `Pending Match` |
| 16 | `receiptId` | String | Linked Receipt Register ID (`RCP-XXXX`) |
| 17 | `notes` | String | Operational or auditor notes |
| 18 | `createdBy` | String | Authenticated user email |
| 19 | `createdAt` | String | ISO Timestamp |
| 20 | `updatedBy` | String | Authenticated user email |
| 21 | `updatedAt` | String | ISO Timestamp |

---

### 2. `Income Detail`
| Col Index | Field Name | Description |
|---|---|---|
| 0 | `incomeId` | Unique ID (`INC-XXXX`) |
| 1 | `date` | Income receipt date |
| 2 | `memberOrDonorId` | Member ID (`MBR-XXXX`) or Donor identifier |
| 3 | `donorName` | Full name of giver |
| 4 | `incomeType` | Sunday Offering, General Donation, Special Donation, Designated Donation, Capital Project Donation, Other Income |
| 5 | `serviceType` | Sunday Service, Wednesday Service, Online, Special Event |
| 6 | `amount` | Income amount |
| 7 | `fundId` | Destination fund |
| 8 | `capitalProjectId` | Linked Capital Project ID if designated |
| 9 | `paymentMethod` | Cash, Check, Zelle, Bank Transfer |
| 10 | `checkNumber` | Donor check number if applicable |
| 11 | `envelopeNumber` | Member envelope number |
| 12 | `notes` | Additional giving notes |
| 13 | `transactionId` | Linked canonical transaction ID |
| 14 | `createdBy` | User email |
| 15 | `createdAt` | Timestamp |

---

### 3. `Expense Detail`
| Col Index | Field Name | Description |
|---|---|---|
| 0 | `expenseId` | Unique ID (`EXP-XXXX`) |
| 1 | `date` | Expense transaction date |
| 2 | `payee` | Vendor or person paid |
| 3 | `amount` | Expense amount |
| 4 | `category` | Ministry Expense, Utilities, Supplies, Facilities, Honorarium, etc. |
| 5 | `purpose` | Ministry purpose explanation |
| 6 | `paymentMethod` | Church Card, Check, Zelle, ACH, Personal Card |
| 7 | `checkNumber` | Church disbursement check number |
| 8 | `fundId` | Source fund |
| 9 | `capitalProjectId` | Linked Capital Project ID if applicable |
| 10 | `personalCardPurchase` | `TRUE` if paid personally |
| 11 | `claimantName` | Purchaser requesting reimbursement |
| 12 | `receiptId` | Linked Receipt Register ID |
| 13 | `notes` | Expense notes |
| 14 | `transactionId` | Linked canonical transaction ID |
| 15 | `createdBy` | User email |
| 16 | `createdAt` | Timestamp |

---

### 4. `Reimbursements`
| Col Index | Field Name | Description |
|---|---|---|
| 0 | `reimbursementId` | Unique ID (`RMB-XXXX`) |
| 1 | `reimbursementDate` | Date reimbursement was paid or approved |
| 2 | `claimantName` | Church member / leader being reimbursed |
| 3 | `claimantEmail` | Email of claimant |
| 4 | `totalPurchaseAmount` | Sum of underlying eligible purchase amounts |
| 5 | `totalReimbursedAmount` | Actual amount paid out by church |
| 6 | `totalPersonallyAbsorbed` | Amount absorbed by purchaser as a donation |
| 7 | `remainingReimbursable` | Amount pending future reimbursement |
| 8 | `status` | `Pending`, `Approved`, `Partially Reimbursed`, `Fully Reimbursed`, `Rejected` |
| 9 | `paymentMethod` | Church Check, Zelle, Bank Transfer |
| 10 | `checkNumber` | Reimbursement check number |
| 11 | `notes` | Explanatory notes |
| 12 | `createdBy` | User email |
| 13 | `createdAt` | Timestamp |
| 14 | `updatedBy` | User email |
| 15 | `updatedAt` | Timestamp |

---

### 5. `Reimbursement_Allocations` (Many-to-Many Linking)
| Col Index | Field Name | Description |
|---|---|---|
| 0 | `allocationId` | Unique ID (`ALC-XXXX`) |
| 1 | `reimbursementId` | Linked Reimbursement ID (`RMB-XXXX`) |
| 2 | `purchaseTransactionId` | Linked Purchase Transaction ID (`TXN-XXXX`) |
| 3 | `allocatedAmount` | Portion of reimbursement allocated to this purchase |
| 4 | `personallyAbsorbedAmount` | Portion absorbed personally on this purchase |
| 5 | `refundCreditAdjustment` | Adjustments for merchant refunds / credits |
| 6 | `notes` | Specific allocation notes |
| 7 | `createdBy` | User email |
| 8 | `createdAt` | Timestamp |

---

### 6. `Receipt_Register`
| Col Index | Field Name | Description |
|---|---|---|
| 0 | `receiptId` | Unique ID (`RCP-XXXX`) |
| 1 | `receiptDate` | Date on the receipt |
| 2 | `merchant` | Store / vendor (e.g. Amazon, Walmart, AliExpress, Home Depot) |
| 3 | `amount` | Total amount on receipt document |
| 4 | `documentType` | Receipt, Invoice, Statement, Check Image, Screenshot, Order Confirmation |
| 5 | `driveFileId` | Private Google Drive File ID |
| 6 | `driveUrl` | Private Google Drive View URL |
| 7 | `source` | `Manual Upload`, `Direct Attachment`, `Gmail Intake` |
| 8 | `emailMessageId` | Gmail message ID if ingested |
| 9 | `matchedTransactionId` | Linked canonical transaction ID |
| 10 | `matchStatus` | `Unmatched`, `Pending Review`, `Matched` |
| 11 | `notes` | Description / discrepancy explanation |
| 12 | `createdBy` | User email |
| 13 | `createdAt` | Timestamp |
| 14 | `updatedAt` | Timestamp |

---

### 7. `Check_Details`
| Col Index | Field Name | Description |
|---|---|---|
| 0 | `checkId` | Unique ID (`CHK-XXXX`) |
| 1 | `checkNumber` | Check number |
| 2 | `checkDate` | Date on the check |
| 3 | `amount` | Check amount |
| 4 | `payee` | Person or organization check was written to |
| 5 | `purpose` | Ministry reason for disbursement |
| 6 | `transactionId` | Linked canonical transaction ID |
| 7 | `invoiceReceiptId` | Linked Receipt ID (`RCP-XXXX`) |
| 8 | `driveFileId` | Drive File ID of check image/voucher |
| 9 | `driveUrl` | Drive View URL |
| 10 | `reconciliationStatus` | `Unreconciled`, `Cleared`, `Voided` |
| 11 | `notes` | Check memo / notes |
| 12 | `createdBy` | User email |
| 13 | `createdAt` | Timestamp |
| 14 | `updatedAt` | Timestamp |

---

### 8. `Capital_Projects`
| Col Index | Field Name | Description |
|---|---|---|
| 0 | `projectId` | Unique ID (`PRJ-XXXX`) |
| 1 | `projectName` | Project Name (e.g. Sanctuary Sound System, Fellowship Hall Renovation) |
| 2 | `status` | `Planning`, `Active`, `On Hold`, `Completed` |
| 3 | `approvedBudget` | Total approved budget |
| 4 | `designatedDonationsReceived` | Total designated gifts received |
| 5 | `otherFunding` | Church general allocations / grants |
| 6 | `expensesPaid` | Total capital expenditures paid |
| 7 | `pendingCommitments` | Committed/contracted expenses pending payment |
| 8 | `remainingDesignatedBalance` | `(Donations + Other) - Expenses Paid` |
| 9 | `notes` | Project scope / milestone notes |
| 10 | `createdBy` | User email |
| 11 | `createdAt` | Timestamp |
| 12 | `updatedAt` | Timestamp |

---

## 4. Idempotent Initialization Strategy

Schema initialization is implemented in `apps-script/Transactions.gs#initializeSandboxSchema`.
- Checks that the destination spreadsheet is **NOT** the production ID `1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s`.
- Checks for each required tab name: if the tab does not exist, inserts it and populates Row 1 with canonical headers.
- If the tab already exists, inspects Row 1: if headers already match, it makes no changes; if missing columns exist, appends missing columns safely without destroying existing rows.
