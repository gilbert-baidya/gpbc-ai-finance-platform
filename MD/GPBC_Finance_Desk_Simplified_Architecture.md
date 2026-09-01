# GPBC Finance Desk — Simplified Architecture & Product Direction

## Product Name

# GPBC Finance Desk

**Subtitle:** Finance • Audit • Reporting

Recommended folder / repository name:

```text
gpbc-finance-desk
```

Recommended future URL:

```text
finance.gracepraise.church
```

---

# 1. Product Goal

GPBC Finance Desk should be a simple, low-maintenance finance, audit, receipt, reimbursement, dashboard, and PDF-reporting application for Grace and Praise Bangladeshi Church.

The system should help church leadership:

- review income and expenses
- track offerings and donations
- track designated funds and capital projects
- track personal-card purchases and church reimbursements
- attach receipts and supporting documents
- track checks
- identify audit gaps
- reconcile transactions
- generate polished Presbyter PDF reports
- close each month cleanly

The product should feel like a simple finance application, not a raw spreadsheet and not a complicated enterprise accounting platform.

---

# 2. Simplified Architecture

Use this architecture only:

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

That should be the complete backend architecture for the initial product.

Do not introduce a traditional backend server unless a future requirement absolutely requires it.

---

# 3. Frontend

Use:

- React
- TypeScript
- Vite
- Responsive layout
- Firebase Hosting
- Lightweight chart library

Main screens:

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

The UI should feel like an application rather than a spreadsheet.

---

# 4. Authentication

Use **Google Sign-In only**.

Do not create a separate username/password system.

Suggested roles:

- Primary Admin
- Backup Admin
- Finance Editor
- Viewer
- Presbyter Read-Only

Production ownership should be through a GPBC Google Workspace account.

A personal Gmail account may be authorized as a backup administrator.

Do not store Google passwords.

Do not use a client-side shared API key as the primary authentication mechanism.

---

# 5. Backend

Use **Google Apps Script only**.

Apps Script should handle:

- reading Google Sheets
- writing Google Sheets
- reimbursement matching
- receipt metadata
- audit checks
- Drive links
- PDF generation
- report generation
- Gmail integration
- monthly-close logic

Avoid:

- Node/Express server
- AWS
- Cloud Run
- Kubernetes
- SQL database
- MongoDB
- separate REST server
- microservices
- unnecessary Firebase database usage

The goal is one lightweight Google-native backend.

---

# 6. One Master Google Sheet

Use one Google Sheet as the accounting source of truth.

Current production spreadsheet ID:

```text
1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s
```

Do not create multiple accounting workbooks requiring synchronization.

Multiple tabs inside one spreadsheet are allowed.

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

Existing historical and audit tabs must be preserved during migration.

---

# 7. Supporting Documents

Use Google Drive for:

- receipts
- invoices
- check images
- bank statements
- Capital One statements
- reimbursement evidence
- Amazon screenshots
- AliExpress receipts
- Walmart receipts
- project documentation
- generated reports

The Google Sheet should store links to these files.

Sensitive files must remain private.

Never expose bank routing/account numbers publicly.

---

# 8. Email Intake

Recommended future receipt mailbox:

```text
receipts@gracepraise.church
```

Alternative:

Use an existing church mailbox with Gmail label:

```text
GPBC Finance
```

Later, Apps Script can:

1. read labeled finance emails
2. save attachments to Drive
3. create Receipt Register entries
4. attempt transaction matching
5. flag unresolved items

This is not required for the first release.

---

# 9. Reimbursement Model

The church often purchases items using personal accounts/cards.

The system must NOT assume:

```text
one receipt = one reimbursement
```

It must support:

- exact reimbursement
- partial reimbursement
- grouped reimbursement
- delayed reimbursement
- cross-month reimbursement
- personally absorbed expenses
- merchant refunds
- card credits
- one reimbursement covering several purchases
- several reimbursements covering one purchase

Example:

```text
Purchase Cost:          $25.50
Church Reimbursement:  $24.12
Personally Absorbed:    $1.38
```

Preserve all values rather than forcing false matches.

---

# 10. Dashboard

Top cards:

- Total Income
- Total Expenses
- Net Position
- Sunday Offering
- Special Donations
- Designated Donations
- Missing Receipts
- Pending Reimbursements
- Audit Health Score

Charts:

- Income Sources donut chart
- Expense Categories donut chart
- Reimbursement Status
- Capital Project Funding
- Monthly Income vs Expense

Capital projects should show:

- donations received
- expenses paid
- remaining designated balance
- pending commitments
- project status

---

# 11. Audit Center

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

Statuses:

- Cleared
- Reviewed
- Needs Receipt
- Needs Explanation
- Pending Match
- Partial Reimbursement
- Missing Documentation
- Possible Duplicate
- Reconciled

Start with a rule-based audit engine.

Do not add expensive AI infrastructure in the first version.

---

# 12. Presbyter PDF Report

Add a button:

# Generate Presbyter Report

Options:

- Month
- Date Range
- Summary / Detailed
- Include Audit Appendix

Suggested report sections:

1. GPBC header
2. Reporting period
3. Executive financial summary
4. Total Income
5. Total Expenses
6. Net Position
7. Income donut chart
8. Expense donut chart
9. Sunday Offering
10. Special / Designated Donations
11. Capital Projects
12. Major Expenses
13. Reimbursements
14. Audit / Documentation Status
15. Notes and explanations
16. Prepared for Presbyter Review

Do not expose unnecessary personal-card details in standard Presbyter reports.

---

# 13. Monthly Close

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

Then mark:

```text
MONTH CLOSED
```

If a closed month changes later, log:

- user
- date
- reason
- old value
- new value

---

# 14. Design Direction

Do not use:

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

Overall feeling:

**peaceful, trustworthy, premium, clean, church-appropriate, easy on the eyes**

App title:

# GPBC Finance Desk

Subtitle:

**Finance • Audit • Reporting**

---

# 15. Existing Application Strategy

The old GPBC finance application should be **refactored**, not rebuilt from zero.

Reuse:

- React/Vite structure
- dashboard components
- charts
- contributions UI
- expenses UI
- PDF utilities
- Google Apps Script integration
- Google Drive utilities
- email/report utilities
- audit logging
- useful UI components

Refactor:

- authentication
- API security
- reimbursement data model
- receipt workflows
- finance schema
- audit rules
- visual design

Build new inside the same application:

- Receipt Register UI
- Reimbursement workflow
- Reimbursement Allocations
- Card Reconciliation
- Audit Center
- Capital Projects
- Monthly Close
- Presbyter Report
- Gmail Receipt Intake

---

# 16. Security Priority

Before production development:

1. remove committed `.env.local` secrets
2. add `.env.local` to `.gitignore`
3. rotate any exposed API key
4. remove browser-shared API-key authentication
5. replace development auth with Google Sign-In
6. restrict access to approved Google users
7. keep financial documents private

Never expose actual secret values in logs or source code.

---

# 17. Recommended Project Structure

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

The Apps Script files may be split logically, but they remain one Apps Script backend project.

---

# 18. Development Phases

## Phase 0 — Safety

- create Git branch
- back up old code
- remove secrets
- rotate exposed key
- verify local build
- do not modify production finance data

## Phase 1 — Foundation

- rename product to GPBC Finance Desk
- implement Google Sign-In
- add role-based access
- harden Apps Script security
- connect safely to existing master Sheet
- redesign dashboard palette

## Phase 2 — Finance Model

- master Transactions
- reimbursements
- reimbursement allocations
- receipts
- personal-card purchases
- designated donations
- capital projects

## Phase 3 — Audit

- Audit Center
- missing-receipt rules
- duplicate rules
- partial-reimbursement rules
- card reconciliation
- bank reconciliation
- Audit Health Score

## Phase 4 — Reporting

- Presbyter Report
- PDF generation
- save PDF to Drive
- email report
- Monthly Close

## Phase 5 — Automation

- Gmail receipt intake
- suggested receipt matching
- optional AI assistance
- optional read-only bank integration later

---

# 19. Non-Negotiable Principles

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

---

# 20. First Development Prompt

After placing this file in the project root, use:

> Read `GPBC_Finance_Desk_Simplified_Architecture.md` and `GPBC_Finance_Control_Book_Build_Handoff.md` completely before modifying code.
>
> The product is now named **GPBC Finance Desk**.
>
> The architecture must remain intentionally simple:
>
> React + TypeScript + Vite
> → Google Sign-In
> → Google Apps Script
> → one master Google Sheet + Google Drive + Gmail.
>
> Do not introduce a traditional backend server, SQL database, MongoDB, AWS, Cloud Run, or other infrastructure unless a specific requirement cannot reasonably be handled by this architecture and approval is obtained first.
>
> We are refactoring the existing application, not rebuilding from scratch.
>
> First:
> 1. create a new Git branch,
> 2. confirm production finance data will not be modified,
> 3. identify files that must change for product renaming and security hardening,
> 4. provide the exact Phase 0 + Phase 1 implementation plan,
> 5. wait for approval before modifying application behavior.
