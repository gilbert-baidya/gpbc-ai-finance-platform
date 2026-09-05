# GPBC Finance Desk — Master Architecture & Document Center Foundation

## 1. Master Finance Architecture Principle
GPBC Finance Desk is built on **ONE canonical master financial ledger** across all months and years.
- **Single Source of Truth**: The master spreadsheet (`GPBC_Finance_Master_SANDBOX` in sandbox, and `GPBC_Finance_Master` in production) remains the permanent accounting database.
- **No Monthly Copies**: The system does **not** create separate workbooks or duplicate table structures for September 2026, October 2026, or future years (2027+).
- **Time as a Runtime Dimension**: Month and Year are runtime query parameters and UI dimensions filtering the canonical tables (`Transactions`, `Income Detail`, `Expense Detail`, `Reimbursements`, `Receipt_Register`, `Document_Register`, `Monthly_Close`, etc.).

---

## 2. Global Finance Period Architecture

### 2.1 State Management & Persistence
The financial time dimension is managed universally through `PeriodContext` (`src/context/PeriodContext.tsx`) and consumed via the `usePeriod()` hook:
- **`periodKey`**: Canonical `YYYY-MM` format (e.g. `2026-09`).
- **`year`**: Numeric year (e.g. `2026`).
- **`month`**: 1-based numeric month (1–12, e.g. `9`).
- **`monthName`**: Full month name (e.g. `September`).
- **`periodLabel`**: User-facing label (e.g. `September 2026`).
- **`startDate` & `endDate`**: Authoritative UTC date boundaries (e.g. `2026-09-01` to `2026-09-30`), with leap-year precision for February.
- **Persistence**: Persisted locally in browser storage (`localStorage['gpbc_finance_period_key']`) across page reloads.

### 2.2 Global Period Selector Component
Rendered prominently in the top header (`src/components/Header.jsx`) and available for standalone page inclusion (`src/components/PeriodSelector.jsx`):
- **Previous Month**: Jumps backward by 1 month, decrementing year when transitioning from January to December.
- **Month Dropdown**: Direct selection of January through December.
- **Year Dropdown**: Direct selection of supported financial years (2024–2030).
- **Next Month**: Jumps forward by 1 month, incrementing year when transitioning from December to January.
- **Current Month Shortcut**: Quick one-click shortcut returning to today's active calendar month.

---

## 3. Canonical Document Register (`Document_Register`)

### 3.1 Role & Separation from `Receipt_Register`
- **`Receipt_Register`**: Retained for existing receipt-matching accounting workflows and transaction reconciliation.
- **`Document_Register`**: Universal evidence registry and metadata catalogue for all church financial evidence (invoices, checks, reimbursement receipts, bank statements, credit card statements, capital project contracts, and presbyter reports).

### 3.2 Canonical 31-Column Schema Definition

| Column | Type | Description |
|---|---|---|
| `documentId` | String | Unique canonical document identifier (e.g., `DOC-202609-123456`) |
| `documentType` | String | Category (`Receipt`, `Invoice`, `Check`, `Reimbursement Evidence`, `Bank Statement`, `Credit Card Statement`, `Capital Project`, `Finance Report`, `Other Supporting Document`) |
| `title` | String | User-facing descriptive title (e.g., `Home Depot - Sanctuary Paint`) |
| `originalFileName` | String | Original client-side filename (e.g., `receipt_scan.pdf`) |
| `storedFileName` | String | Normalized safe filename (e.g., `2026-09-02_Receipt_Home_Depot_abc123.pdf`) |
| `mimeType` | String | MIME type (e.g., `application/pdf`, `image/png`, `image/jpeg`) |
| `fileSize` | Number | File size in bytes (max 15MB) |
| `driveFileId` | String | Google Drive file ID |
| `driveFileUrl` | String | Private Google Drive viewing URL |
| `driveFolderId` | String | Target Google Drive folder ID |
| `documentDate` | String | Transaction or document date (`YYYY-MM-DD`) |
| `financeYear` | Number | Authoritative financial year (e.g., `2026`) |
| `financeMonth` | Number | Authoritative financial month (1–12) |
| `relatedEntityType` | String | Target entity type (`TRANSACTION`, `EXPENSE`, `INCOME`, `REIMBURSEMENT`, `CHECK`, `CAPITAL_PROJECT`, `REPORT`, `NONE`) |
| `relatedEntityId` | String | Foreign key identifier of the primary related record |
| `relatedTransactionId` | String | Linked `transactionId` in `Transactions` table |
| `relatedReimbursementId`| String | Linked `reimbursementId` in `Reimbursements` table |
| `relatedCapitalProjectId`| String | Linked `projectId` in `Capital_Projects` table |
| `relatedCheckId` | String | Linked `checkId` or check number |
| `source` | String | Intake channel (`Manual Upload`, `Direct Attachment`, `System Generated`, `Gmail Intake`) |
| `contentHash` | String | SHA-256 binary hash for duplicate detection |
| `status` | String | Document lifecycle state (`Linked`, `Unlinked`, `Needs Review`, `Archived`) |
| `isPostCloseAddition` | Boolean | True if uploaded or linked after accounting period close |
| `postCloseReason` | String | Mandatory documented reason for post-close evidence addition |
| `addedAfterCloseAt` | String | ISO timestamp when post-close evidence was added |
| `addedAfterCloseBy` | String | User email who added evidence after close |
| `closedPeriodReference`| String | Period key of closed month (e.g., `2026-07`) |
| `notes` | String | Internal audit and accounting notes |
| `uploadedBy` | String | Verified user email / actor |
| `uploadedAt` | String | ISO 8601 creation timestamp |
| `updatedAt` | String | ISO 8601 last modification timestamp |

---

## 4. Google Drive Hierarchy & Sandbox Isolation

### 4.1 Strict Environment Isolation
- **Sandbox Root Folder**: `"GPBC Finance Supporting Documents - SANDBOX"`.
- **Folder ID**: `1wnAT7gS4qT8XKQsFvPFNWWNDZLUhxfBx`.
- **Script Property**: `GPBC_DRIVE_ROOT_FOLDER_ID=1wnAT7gS4qT8XKQsFvPFNWWNDZLUhxfBx`.
- **Safety Invariant**: Sandbox uploads are strictly quarantined from the production evidence repository. Production folder IDs are never written to in development or sandbox modes.

### 4.2 Deterministic, Automatic Folder Hierarchy
Folders are created idempotently on demand upon the first upload into a period:
```text
GPBC Finance Supporting Documents - SANDBOX (1wnAT7gS4qT8XKQsFvPFNWWNDZLUhxfBx)
└── 2026
    ├── 08 - August
    │   ├── Receipts
    │   ├── Invoices
    │   ├── Checks
    │   └── Reports
    └── 09 - September
        ├── Receipts
        ├── Invoices
        ├── Checks
        ├── Reimbursements
        ├── Bank Statements
        ├── Credit Card Statements
        ├── Capital Projects
        ├── Reports
        └── Other
```

---

## 5. Traceable Closed-Period Evidence Policy

### 5.1 Accounting Invariant
- A closed month continues to **strictly block changes to accounting records**:
  - Transaction amounts, accounts, fund allocations, and reconciliation balances cannot be altered.
  - The month is **not** reopened.

### 5.2 Traceable Post-Close Evidence Addition
- Authorized users (`Primary Admin`, `Backup Admin`, `Finance Editor`) may add legitimate supporting evidence (e.g., late vendor invoices, receipts) after close.
- **Mandatory Reason**: Requires an explicit `postCloseReason`. If missing, the upload is rejected.
- **Audit Metadata**: Populates `isPostCloseAddition = true`, `postCloseReason`, `addedAfterCloseAt`, `addedAfterCloseBy`, and `closedPeriodReference`.
- **Audit Status**: Flags document as `Needs Review` for complete audit visibility.

---

## 6. Duplicate Protection & Privacy

- **SHA-256 Binary Digest**: Computed on every file payload.
- **Pre-Upload Registry Check**: Existing matching hashes return a duplicate warning without writing new Drive files or rows.
- **Private Access Control**: Drive files inherit folder permissions within Google Workspace without public "Anyone with the link" access.

---

## 7. Security & Role Permissions Matrix

| Action | Primary Admin | Backup Admin | Finance Editor | Viewer | Presbyter Read-Only |
|---|:---:|:---:|:---:|:---:|:---:|
| `getDocuments` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `uploadDocument` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `linkDocumentToEntity` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `updateDocumentStatus` | ✅ | ✅ | ✅ | ❌ | ❌ |
| `deleteDocument` (Archive) | ✅ | ✅ | ❌ | ❌ | ❌ |
