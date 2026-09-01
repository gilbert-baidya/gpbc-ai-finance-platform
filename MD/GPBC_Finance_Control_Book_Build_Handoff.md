# GPBC Finance Control Book — Build Handoff

## Product

# GPBC Finance Desk

**Subtitle:** Finance • Audit • Reporting

Recommended repository / folder:

```text
gpbc-finance-desk
```

Recommended future URL:

```text
finance.gracepraise.church
```

---

# 1. Purpose of This Handoff

This document is the detailed implementation handoff for the GPBC finance application.

The objective is to turn the existing church finance application into a simple, secure, low-maintenance finance and audit workspace for Grace and Praise Bangladeshi Church.

This is NOT a request to rebuild the application from zero.

The existing application already contains useful frontend, Google Apps Script, Google Sheets, Drive, PDF, reporting, chart, and audit-related work.

The recommended strategy is:

# REFACTOR THE EXISTING APPLICATION

Preserve useful code, remove insecure patterns, simplify the architecture, and add the missing finance-control workflows.

---

# 2. Existing Application — Known Starting Point

The existing repository has been audited and currently includes a strong reusable foundation.

Observed architecture:

```text
React + Vite SPA
      |
      v
Client API wrapper
      |
      v
Google Apps Script
      |
      +--> Google Sheets
      +--> Google Drive
      +--> MailApp / Gmail
```

Known reusable areas include:

- Dashboard
- Contributions / income UI
- Expense UI
- Charts
- PDF / export utilities
- Google Apps Script backend
- Google Drive utilities
- Email / report utilities
- Audit logging
- API wrappers
- reusable React components

Known gaps / risks include:

- development authentication stub
- no production Google Sign-In flow
- browser-shared API-key authentication
- `.env.local` secret exposure risk
- no structured reimbursement model
- no Receipt Register workflow
- no reimbursement allocation workflow
- no card reconciliation workflow
- no bank reconciliation workflow
- no centralized Audit Center
- no Monthly Close workflow
- no Presbyter-specific finance report
- no Gmail receipt intake

The frontend currently contains JavaScript in important areas. The target direction is React + TypeScript + Vite, but migration should be incremental and controlled rather than a destructive rewrite.

---

# 3. Target Architecture

Use this architecture:

```text
React + TypeScript + Vite
        |
        v
Google Sign-In
        |
        v
Google Apps Script
      /     |      \
     v      v       v
Google   Google    Gmail
Sheets   Drive     / Workspace
```

This should remain the complete backend architecture for the initial production version.

Do NOT add a traditional backend unless a future requirement genuinely cannot be handled by the approved Google-native architecture.

Avoid:

- Node/Express production backend
- SQL database
- PostgreSQL
- MySQL
- MongoDB
- Supabase
- AWS
- Cloud Run
- Kubernetes
- microservices
- unnecessary Firebase database usage
- separate accounting workbooks requiring synchronization

Firebase Hosting is acceptable for the frontend.

---

# 4. One Master Google Sheet

Use ONE master Google Sheet as the accounting source of truth.

Current production spreadsheet ID:

```text
1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s
```

Production data must be treated as sensitive.

Do not casually modify, delete, reorder, normalize, or migrate production finance data while developing.

Recommended long-term tabs:

- Transactions
- Income Detail
- Expense Detail
- Reimbursements
- Reimbursement Allocations
- Receipt Register
- Check Details
- Capital Projects
- Audit Issues
- Monthly Close
- Settings
- Presbyter Report

Existing historical and audit tabs must be preserved.

---

# 5. Core Financial Principle

GPBC Finance Desk should behave like a finance application, not like a raw spreadsheet.

Every financial record should be traceable.

The system should make it easy to answer:

- What money came in?
- What money went out?
- Why was it spent?
- Who was paid?
- Which fund paid for it?
- Was a receipt attached?
- Was the purchase made personally?
- Was the purchaser reimbursed?
- Was the reimbursement partial or complete?
- Was the transaction reconciled?
- Is the documentation complete?
- Is the month ready to close?
- Can the transaction be explained to church oversight?

---

# 6. Master Transactions Model

The long-term financial backbone should be a unified Transactions model.

A transaction should be able to represent:

- offering
- general donation
- special donation
- designated donation
- expense
- reimbursement payment
- refund
- card credit
- transfer
- check payment
- Zelle payment
- personal-card church purchase
- capital-project income
- capital-project expense

Recommended conceptual fields include:

```text
transactionId
date
type
direction
amount
payeeOrPayer
description
category
fund
paymentMethod
checkNumber
source
personalPurchase
reconciliationStatus
receiptStatus
notes
createdBy
createdAt
updatedBy
updatedAt
```

Exact implementation may evolve after the current production Sheet schema is inspected.

Do not break historical data merely to force it into a new model.

Migration must be controlled and reversible.

---

# 7. Income

Track at minimum:

- Sunday Offering
- General Donation
- Special Donation
- Designated Donation
- Capital Project Donation
- Other Income

The UI should support:

- date
- amount
- donor / payer where applicable
- donation type
- designated fund
- payment method
- notes
- receipt / evidence where applicable

Designated money must remain traceable to its purpose.

---

# 8. Expenses

Track:

- vendor / payee
- date
- amount
- category
- purpose
- payment method
- check number if applicable
- fund
- project
- receipt
- explanation
- personal-card indicator
- reimbursement relationship
- reconciliation status

The system must not treat a credit-card statement payment as the final expense classification when underlying church purchases are available.

Underlying purchases should be classified when possible.

---

# 9. Reimbursements — Critical Requirement

Do NOT assume:

```text
one receipt = one reimbursement
```

The application must support:

- exact reimbursement
- partial reimbursement
- grouped reimbursement
- delayed reimbursement
- cross-month reimbursement
- personally absorbed expense
- merchant refund
- card credit
- one reimbursement covering several purchases
- several reimbursements covering one purchase

Example:

```text
Purchase Cost:          $25.50
Church Reimbursement:  $24.12
Personally Absorbed:    $1.38
```

The system must preserve all three numbers.

Do not force an incorrect match merely to make the ledger look balanced.

Recommended relationship:

```text
Purchase / Expense
        |
        v
Reimbursement Allocation
        |
        v
Reimbursement
```

Use a separate Reimbursement Allocations area so a many-to-many relationship is possible.

---

# 10. Receipt Register

Create a central Receipt Register.

A receipt record should be able to store:

```text
receiptId
date
merchant
amount
documentType
driveFileId
driveUrl
source
emailMessageId
matchedTransactionId
matchStatus
notes
createdBy
createdAt
```

Supported evidence may include:

- receipt
- invoice
- screenshot
- check image
- bank statement page
- credit-card statement page
- reimbursement form
- purchase confirmation
- email attachment
- merchant refund evidence

Google Drive is the evidence store.

The Sheet stores metadata and Drive links.

Sensitive evidence remains private.

---

# 11. Check Details

For check payments, support:

- check number
- date
- amount
- payee
- purpose
- related transaction
- invoice / receipt
- check image or supporting documentation
- reconciliation status

Audit logic should flag a check that has only a check number but no payee/purpose/evidence.

---

# 12. Personal-Card Purchases

A church purchase made using a personal card/account must remain visible as a church expense even when reimbursement occurs later.

The application should show:

- purchase amount
- purchaser
- purchase date
- merchant
- church purpose
- receipt
- amount reimbursed
- amount still pending
- personally absorbed amount
- reimbursement date(s)
- reconciliation status

Do not overwrite the original purchase merely because reimbursement occurred.

---

# 13. Capital Projects

Capital Projects should support:

- project name
- status
- approved budget
- designated donations received
- other funding
- expenses paid
- pending commitments
- remaining designated balance
- related receipts
- notes

Dashboard reporting should make project funding transparent.

---

# 14. Supporting Documents in Google Drive

Use Google Drive for:

- receipts
- invoices
- check images
- bank statements
- Capital One statements
- Apple Card statements
- reimbursement evidence
- Amazon receipts/screenshots
- AliExpress receipts
- Walmart receipts
- project documentation
- generated Presbyter reports

Suggested high-level Drive structure:

```text
GPBC Finance/
├── Receipts/
├── Statements/
├── Checks/
├── Reimbursements/
├── Capital Projects/
└── Reports/
```

Do not make sensitive folders publicly accessible.

Never expose bank routing numbers or account numbers in public documents or logs.

---

# 15. Audit Center

Build a central Audit Center.

The first version must be rule-based and explainable.

Do not add expensive AI infrastructure for basic audit logic.

Automatically identify:

- missing receipt
- missing explanation
- missing payee
- missing check documentation
- unmatched reimbursement
- partial reimbursement
- possible duplicate
- unreconciled merchant refund
- personal-card purchase without reimbursement
- reimbursement without supporting purchase
- designated-fund discrepancy
- bank reconciliation difference
- card reconciliation difference
- uncategorized transaction
- receipt/payment amount discrepancy
- incomplete monthly close

Suggested statuses:

- Cleared
- Reviewed
- Needs Receipt
- Needs Explanation
- Pending Match
- Partial Reimbursement
- Missing Documentation
- Possible Duplicate
- Reconciled

Each audit issue should be traceable to the affected transaction or supporting record.

---

# 16. Audit Health Score

The dashboard may display an Audit Health Score.

The score must be derived from deterministic conditions.

Examples:

- missing receipts reduce score
- unresolved duplicate warnings reduce score
- unreconciled card/bank differences reduce score
- unresolved reimbursements reduce score
- incomplete monthly close reduces score

The score should be explainable.

Users must be able to see what issues are lowering it.

---

# 17. Bank and Card Reconciliation

The system should eventually support reconciliation against:

- church bank account
- Capital One
- Apple Card
- other church/payment accounts when needed

Reconciliation should not require direct bank API integration in the first version.

Initial workflow may use manually uploaded/exported statement data.

Do not add paid banking infrastructure during the MVP unless explicitly approved.

---

# 18. Dashboard

Recommended top cards:

- Total Income
- Total Expenses
- Net Position
- Sunday Offering
- Special Donations
- Designated Donations
- Missing Receipts
- Pending Reimbursements
- Audit Health Score

Recommended charts:

- Income Sources
- Expense Categories
- Monthly Income vs Expense
- Reimbursement Status
- Capital Project Funding

The dashboard should remain calm and readable.

Do not overload it with every available metric.

---

# 19. Monthly Close

Add a formal Monthly Close workflow.

Checklist:

- Bank statement reviewed
- Card statements reviewed
- Income reconciled
- Expenses reconciled
- Receipts reviewed
- Checks reviewed
- Reimbursements reviewed
- Designated funds reviewed
- Audit exceptions reviewed
- Presbyter report generated

When complete:

```text
MONTH CLOSED
```

A closed month should not silently change later.

If a closed period is edited, create an audit record containing:

- user
- date/time
- reason
- affected record
- old value
- new value

---

# 20. Presbyter Report

Add:

# Generate Presbyter Report

Options:

- Month
- Date Range
- Summary
- Detailed
- Include Audit Appendix

Recommended report sections:

1. GPBC header
2. Reporting period
3. Executive financial summary
4. Total Income
5. Total Expenses
6. Net Position
7. Income chart
8. Expense chart
9. Sunday Offering
10. Special / Designated Donations
11. Capital Projects
12. Major Expenses
13. Reimbursements
14. Audit / Documentation Status
15. Notes and explanations
16. Prepared for Presbyter Review

The standard report should not expose unnecessary personal-card details.

Generate the PDF through the existing reusable PDF / Apps Script / Drive functionality where practical.

Save the generated report to Google Drive.

Emailing the report may be supported after review.

---

# 21. Gmail Receipt Intake

This is a later automation phase.

Recommended mailbox:

```text
receipts@gracepraise.church
```

Alternative:

Use a church Gmail / Workspace mailbox with label:

```text
GPBC Finance
```

Future Apps Script workflow:

1. read labeled finance emails
2. inspect attachments
3. save attachments to Drive
4. create Receipt Register records
5. suggest possible transaction matches
6. flag unresolved receipts
7. require human confirmation before financial matching is finalized

Automation should assist, not silently rewrite financial records.

---

# 22. Authentication

Production authentication must use Google Sign-In.

Do not create a second username/password system.

Recommended roles:

- Primary Admin
- Backup Admin
- Finance Editor
- Viewer
- Presbyter Read-Only

Authorization must not depend only on hiding frontend buttons.

Apps Script must enforce access to sensitive actions.

Production ownership should use a GPBC Google Workspace account.

A personal Gmail account may be approved as backup administrator.

Never store Google passwords.

---

# 23. Security Requirements

Before production work:

1. remove committed `.env.local` secrets
2. add local secret files to `.gitignore`
3. rotate any exposed API key
4. remove browser-shared API-key authentication
5. replace dev authentication with Google Sign-In
6. restrict access to approved users
7. keep Drive evidence private
8. avoid logging sensitive finance data
9. never print actual secret values in audit reports
10. never commit passwords, tokens, private keys, or OAuth secrets

The current development auth stub and shared API-key pattern are not acceptable for production.

---

# 24. Apps Script Responsibilities

Google Apps Script should remain the backend.

Responsibilities include:

- reading Google Sheets
- writing Google Sheets
- validating authorization
- creating/updating transactions
- reimbursements
- reimbursement allocations
- receipt metadata
- Drive operations
- audit rules
- report generation
- PDF generation
- Gmail intake
- monthly-close logic
- audit-log writes

Recommended logical files:

```text
apps-script/
├── Code.gs
├── Auth.gs
├── Transactions.gs
├── Reimbursements.gs
├── Receipts.gs
├── Audit.gs
├── Reports.gs
└── Config.gs
```

These remain one Apps Script project.

---

# 25. Frontend Responsibilities

Use:

- React
- TypeScript
- Vite
- responsive layout
- lightweight charting
- Firebase Hosting

Recommended screens:

- Dashboard
- Transactions
- Income
- Expenses
- Reimbursements
- Receipt Register
- Check Details
- Capital Projects
- Audit Center
- Monthly Close
- Presbyter Reports
- Settings

Target source organization:

```text
src/
├── components/
├── pages/
├── api/
├── hooks/
├── context/
├── utils/
└── types/
```

Do not perform unnecessary folder churn.

Migrate JavaScript to TypeScript incrementally where it improves safety.

---

# 26. Existing Code — Reuse / Refactor / Build New

## REUSE

Prefer reusing:

- React/Vite foundation
- dashboard components
- metric cards
- existing charts
- Contributions UI
- Expenses UI
- existing API abstraction
- Google Apps Script integration
- Google Drive PDF utilities
- export utilities
- tax/report PDF functionality
- audit logging
- public assets / letterhead
- reusable form components

## REFACTOR

Refactor:

- authentication
- API security
- Apps Script authorization
- reimbursement data model
- receipt workflow
- finance schema
- audit rules
- role enforcement
- visual design
- navigation
- selected JavaScript modules toward TypeScript

## BUILD NEW

Build:

- unified Transactions UI/model
- Receipt Register
- reimbursement workflow
- Reimbursement Allocations
- personal-card reimbursement view
- Card Reconciliation
- Bank Reconciliation
- Audit Center
- Capital Projects
- Monthly Close
- Presbyter Report
- Gmail Receipt Intake

---

# 27. Visual Design Direction

Avoid:

- dominant black
- dominant purple
- dominant green
- fluorescent colors
- aggressive bright red

Preferred palette:

- Warm Ivory
- Mist Blue
- Dusty Slate Blue
- Soft Sand
- Champagne Gold
- Warm Gray
- Muted Terracotta for warnings

Desired feeling:

**peaceful, trustworthy, premium, clean, church-appropriate, easy on the eyes**

The application should feel professional without feeling like enterprise accounting software.

---

# 28. Recommended Project Structure

```text
gpbc-finance-desk/
├── src/
│   ├── components/
│   ├── pages/
│   ├── api/
│   ├── hooks/
│   ├── context/
│   ├── utils/
│   └── types/
│
├── apps-script/
│   ├── Code.gs
│   ├── Auth.gs
│   ├── Transactions.gs
│   ├── Reimbursements.gs
│   ├── Receipts.gs
│   ├── Audit.gs
│   ├── Reports.gs
│   └── Config.gs
│
├── public/
├── docs/
├── audit/
├── package.json
├── README.md
├── .env.example
├── .gitignore
├── GPBC_Finance_Control_Book_Build_Handoff.md
└── GPBC_Finance_Desk_Simplified_Architecture.md
```

---

# 29. Development Phases

## Phase 0 — Safety

- create a dedicated Git branch
- preserve existing work
- back up code
- remove committed secrets
- rotate exposed API key
- add proper `.gitignore`
- verify baseline build
- inventory existing integrations
- do not modify production finance data
- do not deploy production changes

## Phase 1 — Foundation

- rename product to GPBC Finance Desk
- implement Google Sign-In
- implement backend role enforcement
- harden Apps Script security
- safely connect to the existing master Sheet
- update design palette
- clean navigation
- preserve reusable code

## Phase 2 — Finance Model

- Transactions
- Income Detail
- Expense Detail
- Reimbursements
- Reimbursement Allocations
- Receipt Register
- personal-card purchases
- designated donations
- Capital Projects
- Check Details

## Phase 3 — Audit

- central Audit Center
- missing receipt rules
- missing explanation rules
- duplicate rules
- reimbursement rules
- bank reconciliation
- card reconciliation
- Audit Health Score

## Phase 4 — Reporting and Close

- Presbyter Report
- PDF generation
- Drive save
- email workflow
- Monthly Close
- closed-period audit logging

## Phase 5 — Automation

- Gmail receipt intake
- suggested matching
- optional AI assistance
- optional read-only bank integration later

AI should remain optional.

Do not make AI a dependency for core accounting or audit behavior.

---

# 30. Acceptance Principles

The product is ready for production only when:

- production authentication uses Google Sign-In
- unauthorized users cannot perform finance writes
- no client-side shared secret is used as primary auth
- one master Google Sheet remains the source of truth
- existing finance history is preserved
- receipts/evidence remain private in Drive
- reimbursements support many-to-many allocations
- partial reimbursements are preserved correctly
- audit issues are explainable
- closed-month changes are logged
- reports can be generated without exposing unnecessary personal financial details
- build/tests pass
- no secret values are committed
- no destructive migration happens without an explicit reviewed plan

---

# 31. Non-Negotiable Principles

1. One master Google Sheet.
2. Google Apps Script is the backend.
3. No traditional backend server unless absolutely necessary.
4. Google Drive stores evidence.
5. Google Sign-In controls access.
6. Never force incorrect reimbursement matches.
7. Keep audit evidence traceable.
8. Keep the UI simple.
9. Keep infrastructure inexpensive.
10. Preserve useful existing work.
11. Protect church financial data.
12. PDF reporting must be easy for church oversight.
13. Production finance data must not be used as a development sandbox.
14. AI may assist later but must not control the accounting system.

---

# 32. Development Agent Instruction

Before modifying code, the coding agent must read BOTH:

```text
GPBC_Finance_Control_Book_Build_Handoff.md
GPBC_Finance_Desk_Simplified_Architecture.md
```

If there is a conflict, use:

`GPBC_Finance_Desk_Simplified_Architecture.md`

as the final architectural authority.

The coding agent should inspect the repository before deciding what to replace.

Do not rebuild existing working features unnecessarily.

---

# 33. Ready-to-Paste Initial VS Code Prompt

> Read `GPBC_Finance_Control_Book_Build_Handoff.md` and `GPBC_Finance_Desk_Simplified_Architecture.md` completely before modifying code.
>
> Treat `GPBC_Finance_Desk_Simplified_Architecture.md` as the final architectural authority.
>
> The product is **GPBC Finance Desk — Finance • Audit • Reporting**.
>
> We are refactoring the existing application, not rebuilding it from scratch.
>
> Target architecture:
>
> React + TypeScript + Vite
> → Google Sign-In
> → Google Apps Script
> → one master Google Sheet + Google Drive + Gmail.
>
> Do not introduce Node/Express, SQL, MongoDB, Supabase, AWS, Cloud Run, Kubernetes, microservices, or another traditional backend.
>
> First perform Phase 0 and Phase 1:
>
> 1. inspect Git status and preserve existing work
> 2. create/use branch `feature/gpbc-finance-desk-refactor`
> 3. verify the existing build
> 4. inventory reusable code
> 5. audit secrets and authentication without exposing secret values
> 6. do not modify production finance data
> 7. do not deploy to production
> 8. rename the product safely
> 9. prepare/implement Google Sign-In and role-based authorization scaffolding
> 10. harden Apps Script security
> 11. begin the approved visual/navigation refactor
> 12. document all findings and changes
>
> Preserve existing dashboard, contribution, expense, chart, PDF, Drive, email, Apps Script, and audit functionality where it is useful.
>
> Work autonomously through routine engineering decisions.
>
> If an external Google credential or console setting is required, document the exact manual step and continue with everything that can be completed safely.
>
> Before finishing, run build/type-check/lint/tests where available, inspect the Git diff, verify no secret was newly committed, and confirm production finance data was not modified.
>
> Do not begin Phase 2 until Phase 0/1 is validated.
