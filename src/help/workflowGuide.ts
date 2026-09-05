import { WorkflowStep } from './types';

export const MONTHLY_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    stepNumber: 1,
    title: 'Record Income',
    action: 'Enter all tithes, Sunday offerings, special collections, and online giving for the month.',
    purpose: 'Establishes the church recognized revenue foundation for the accounting period before recording expenses or closing.',
    targetRoute: '/income',
    routeLabel: 'Open Income & Tithes',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    roleBadgeText: 'Requires Finance Editor or Admin',
    prerequisites: [
      'Physical offering count sheets or verification records according to church procedures',
      'Bank deposit slip or electronic donation batch receipt'
    ],
    completionChecklist: [
      'Verify transaction date matches the actual service date or receipt date',
      'Distinguish general tithes from designated campaign gifts (e.g., Electrical Panel or Building Fund)',
      'Confirm the total recorded matches the bank deposit amount exactly'
    ],
    proTip: 'Always select the appropriate active accounting period in the top header before entering batch contributions.'
  },
  {
    stepNumber: 2,
    title: 'Record Recognized Expenses',
    action: 'Log all church purchases, vendor bills, utility bills, and approved operational disbursements.',
    purpose: 'Ensures all obligations and church expenses are recognized in the correct period when the purchase occurred.',
    targetRoute: '/expenses',
    routeLabel: 'Open Expenses',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    roleBadgeText: 'Requires Finance Editor or Admin',
    prerequisites: [
      'Vendor invoice, payment voucher, or debit/credit card transaction slip',
      'Approval according to church operational procedures'
    ],
    completionChecklist: [
      'Check category coding (e.g., Utilities, Worship Supplies, Facilities Maintenance)',
      'Ensure purchase date matches invoice/receipt date, not necessarily when the invoice was keyed',
      'For personal card purchases by members, enter the purchase here first before managing reimbursements'
    ],
    proTip: 'The purchase itself is the recognized church expense. Do not wait for a reimbursement payout check to record the expense.'
  },
  {
    stepNumber: 3,
    title: 'Attach Receipts / Supporting Documents',
    action: 'Upload scans or photos of paper receipts, invoices, checks, and statements into Document Center.',
    purpose: 'Helps maintain supporting documentation for church financial records and internal review.',
    targetRoute: '/documents',
    routeLabel: 'Open Document Center',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    roleBadgeText: 'Requires Finance Editor or Admin',
    prerequisites: [
      'Legible PDF, JPG, or PNG document under 10MB',
      'Transaction ID or vendor name ready for linking'
    ],
    completionChecklist: [
      'Select the correct Document Type (Receipt, Invoice, Check, Bank Statement)',
      'Link the uploaded file directly to its corresponding Transaction or Reimbursement record',
      'Verify document status updates from Unlinked to Linked'
    ],
    proTip: 'You can upload receipts directly from individual Transaction rows using the paperclip icon modal without leaving the Transactions screen.'
  },
  {
    stepNumber: 4,
    title: 'Review Reimbursements',
    action: 'Verify personal out-of-pocket church purchases, apply refund credit adjustments, note absorbed amounts, and log reimbursement allocations.',
    purpose: 'Settles church liabilities to individuals accurately without double-counting expenses or distorting financial reports.',
    targetRoute: '/reimbursements',
    routeLabel: 'Open Reimbursements',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    roleBadgeText: 'Requires Finance Editor or Admin',
    prerequisites: [
      'Submitted member reimbursement claim with itemized store receipts attached',
      'Approved purchase recorded in Expenses'
    ],
    completionChecklist: [
      'Confirm Net Covered = Allocated Payout + Personally Absorbed Amount + Refund/Credit Adjustment',
      'Verify Remaining Balance accurately reflects what the church still owes the individual',
      'Ensure any vendor card refund is applied as a credit adjustment, not recorded as new income'
    ],
    proTip: 'Remember: Reimbursement payout settles the church liability; it is NOT a second expense. Do not enter a duplicate expense for the payout check.'
  },
  {
    stepNumber: 5,
    title: 'Review Capital Projects / Designated Funds',
    action: 'Track designated offerings against approved budgets and verified project expenditures.',
    purpose: 'Maintains transparency for special capital projects and helps track designated funds.',
    targetRoute: '/capital-projects',
    routeLabel: 'Open Capital Projects',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    roleBadgeText: 'Editing requires Admin; Review open to Editors',
    prerequisites: [
      'Designated gifts logged in Income Detail',
      'Project-related contractor invoices and receipts linked in Document Center'
    ],
    completionChecklist: [
      'Check Designated Funding Position (Received Gifts minus Supported Expenses)',
      'Confirm approved budget is established or noted as "Not Set" without assumptions',
      'Inspect any funding position or remaining designated balance'
    ],
    proTip: 'Funds given for a stated or designated purpose should remain separately identifiable and should be used consistently with the church\'s approved purpose. Never combine designated balances into general operating surplus.'
  },
  {
    stepNumber: 6,
    title: 'Reconcile Records',
    action: 'Match recorded ledger entries against official monthly bank statements and credit card summaries.',
    purpose: 'Verifies that every entry in GPBC Finance Desk corresponds to actual cleared bank cash movements.',
    targetRoute: '/reconciliation',
    routeLabel: 'Open Reconciliation',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    roleBadgeText: 'Requires Finance Editor or Admin',
    prerequisites: [
      'Monthly bank statement and credit card statement uploaded into Document Center',
      'All cash and check receipts recorded for the period'
    ],
    completionChecklist: [
      'Review UNMATCHED and PARTIALLY_MATCHED transactions',
      'Investigate any NEEDS_REVIEW items for date discrepancies or fee differences',
      'Verify that all matched transactions satisfy deterministic criteria before marking RECONCILED'
    ],
    proTip: 'Historical transactions are NOT automatically reconciled simply because they are old. Reconciliation requires formal comparison against bank evidence.'
  },
  {
    stepNumber: 7,
    title: 'Resolve Audit Issues',
    action: 'Run the deterministic audit engine to inspect missing receipts, over-allocations, or unlinked records.',
    purpose: 'Helps identify missing receipts, over-allocations, or unlinked records before closing the month.',
    targetRoute: '/audit',
    routeLabel: 'Open Audit Center',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    roleBadgeText: 'Requires Finance Editor or Admin',
    prerequisites: [
      'Income, Expenses, Reimbursements, and Bank Reconciliation completed for the month'
    ],
    completionChecklist: [
      'Address Critical and High severity issues first (missing receipts, duplicate entries)',
      'Understand that marking an issue "Reviewed" acknowledges it but does NOT cure score deductions until resolved',
      'Aim to resolve open audit conditions before proceeding to monthly close'
    ],
    proTip: 'The Audit Health Score is computed mathematically: 100 minus capped severity deductions. A higher score indicates fewer unresolved issues under configured audit rules.'
  },
  {
    stepNumber: 8,
    title: 'Review Monthly Summary',
    action: 'Inspect top-level net position, income vs. expense trends, cash flow, and ministry distributions on the Dashboard.',
    purpose: 'Gives finance leadership an organized overview of church financial recordkeeping for the period.',
    targetRoute: '/dashboard',
    routeLabel: 'Open Dashboard',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    roleBadgeText: 'Visible to all Finance roles',
    prerequisites: [
      'Audit issues reviewed and bank reconciliation verified'
    ],
    completionChecklist: [
      'Confirm Total Income matches bank deposit totals and giving registers',
      'Verify Total Recognized Expenses aligns with operational records',
      'Inspect Net Financial Position (Surplus/Deficit) for the month'
    ],
    proTip: 'Switch between current and prior months using the header Period Selector to analyze month-over-month trends.'
  },
  {
    stepNumber: 9,
    title: 'Close the Month',
    action: 'Review the pre-close readiness checklist, confirm completeness, and execute the official month-end close lock.',
    purpose: 'Locks the accounting period against accidental modifications, supporting consistent church financial recordkeeping.',
    targetRoute: '/monthly-close',
    routeLabel: 'Open Monthly Close',
    requiredRoles: ['Primary Admin', 'Backup Admin'],
    roleBadgeText: 'Requires Primary Admin or Backup Admin',
    prerequisites: [
      'Open critical audit issues resolved or reviewed',
      'Bank statement reconciliation items verified',
      'Supporting evidence attached and categorized'
    ],
    completionChecklist: [
      'Review the automated readiness audit score and warnings',
      'Provide Administrator confirmation initials or name',
      'Confirm the period status shifts to CLOSED and records lock'
    ],
    proTip: 'Complete month-end review and close in a timely manner according to GPBC\'s approved finance process. Reopening is restricted to Admins and requires a documented reason.'
  },
  {
    stepNumber: 10,
    title: 'Review / Generate Presbyter Reports',
    action: 'Make sanitized executive finance reports available for the Church Presbyter, Pastor, and leadership.',
    purpose: 'Provides clear governance visibility and summary reporting while limiting operational and donor-sensitive details.',
    targetRoute: '/presbyter-reports',
    routeLabel: 'Open Presbyter Reports',
    requiredRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
    roleBadgeText: 'Available for Executive Review',
    prerequisites: [
      'Month successfully closed and reviewed'
    ],
    completionChecklist: [
      'Verify Net Position, Offering aggregates, and Audit Health indicators',
      'Confirm individual donor identities and personal payment methods are restricted from executive summaries',
      'Download or print summary report package for leadership meetings'
    ],
    proTip: 'Presbyter Read-Only accounts access this view to provide leadership with clear financial oversight while limiting operational and donor-sensitive details.'
  }
];
