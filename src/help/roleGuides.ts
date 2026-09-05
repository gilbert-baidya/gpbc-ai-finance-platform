import { RoleGuide } from './types';

export const ROLE_GUIDES: Record<string, RoleGuide> = {
  'Primary Admin': {
    role: 'Primary Admin',
    title: 'Primary Admin',
    badgeColor: '#2C3E50',
    summary: 'Full GPBC Finance Desk administration. Responsible for operational stewardship, monthly period close, audit review, and authorized user access management.',
    responsibilities: [
      'Maintain overall financial recordkeeping integrity in accordance with church leadership guidelines',
      'Execute formal Monthly Close locks and review financial summaries for church leadership and presbyter oversight',
      'Evaluate and approve reopened closed periods only when necessary, providing documented audit reasons',
      'Review system environment status and ensure write safeguards operate as intended',
      'Manage access permissions and provide operational guidance to incoming finance editors and administrators'
    ],
    permittedModules: [
      { name: 'Dashboard', path: '/dashboard', accessLevel: 'Full Write' },
      { name: 'Transactions', path: '/transactions', accessLevel: 'Full Write' },
      { name: 'Income & Tithes', path: '/income', accessLevel: 'Full Write' },
      { name: 'Expenses', path: '/expenses', accessLevel: 'Full Write' },
      { name: 'Reimbursements', path: '/reimbursements', accessLevel: 'Full Write' },
      { name: 'Document Center', path: '/documents', accessLevel: 'Full Write' },
      { name: 'Receipt Register', path: '/receipts', accessLevel: 'Full Write' },
      { name: 'Check Details', path: '/checks', accessLevel: 'Full Write' },
      { name: 'Capital Projects', path: '/capital-projects', accessLevel: 'Full Write' },
      { name: 'Reconciliation', path: '/reconciliation', accessLevel: 'Full Write' },
      { name: 'Audit Center', path: '/audit', accessLevel: 'Full Write' },
      { name: 'Monthly Close', path: '/monthly-close', accessLevel: 'Full Write' },
      { name: 'Presbyter Reports', path: '/presbyter-reports', accessLevel: 'Full Write' },
      { name: 'Settings', path: '/settings', accessLevel: 'Full Write' }
    ],
    restrictedActions: [
      'Direct modifications to closed accounting periods without a documented reopening reason',
      'Deleting registered financial documents or records without clear justification'
    ],
    monthlyRoutine: [
      'Early Month (Suggested): Verify prior month bank and card statements are uploaded and categorized in Document Center',
      'Mid Month (Suggested): Review income batches, expense postings, and reimbursement allocations',
      'Pre-Close (Suggested): Run the Audit Center engine to review and resolve open conditions before closing',
      'Month-End (Suggested): Execute the official Monthly Close lock and make Presbyter Reports available'
    ],
    keySafetyReminders: [
      'Financial editing may be disabled during controlled maintenance periods. If an action is unavailable, verify system status.',
      'Always enter adjustments through the application interface to maintain complete audit history; avoid manual spreadsheet editing.'
    ]
  },
  'Backup Admin': {
    role: 'Backup Admin',
    title: 'Backup Admin',
    badgeColor: '#3D5A6C',
    summary: 'Administrative continuity and operational support. Coordinates with the Primary Admin and exercises administrative capabilities according to church governance guidelines.',
    responsibilities: [
      'Provide operational continuity for church financial ledger operations and review',
      'Review and co-verify monthly reconciliations, audit issues, and reimbursement settlements',
      'Execute period close procedures when authorized or designated by church leadership',
      'Assist Finance Editors with transaction entries, split allocations, and document linkage'
    ],
    permittedModules: [
      { name: 'Dashboard', path: '/dashboard', accessLevel: 'Full Write' },
      { name: 'Transactions', path: '/transactions', accessLevel: 'Full Write' },
      { name: 'Income & Tithes', path: '/income', accessLevel: 'Full Write' },
      { name: 'Expenses', path: '/expenses', accessLevel: 'Full Write' },
      { name: 'Reimbursements', path: '/reimbursements', accessLevel: 'Full Write' },
      { name: 'Document Center', path: '/documents', accessLevel: 'Full Write' },
      { name: 'Receipt Register', path: '/receipts', accessLevel: 'Full Write' },
      { name: 'Check Details', path: '/checks', accessLevel: 'Full Write' },
      { name: 'Capital Projects', path: '/capital-projects', accessLevel: 'Full Write' },
      { name: 'Reconciliation', path: '/reconciliation', accessLevel: 'Full Write' },
      { name: 'Audit Center', path: '/audit', accessLevel: 'Full Write' },
      { name: 'Monthly Close', path: '/monthly-close', accessLevel: 'Full Write' },
      { name: 'Presbyter Reports', path: '/presbyter-reports', accessLevel: 'Full Write' },
      { name: 'Settings', path: '/settings', accessLevel: 'Full Write' }
    ],
    restrictedActions: [
      'Uncoordinated policy or configuration changes without Primary Admin alignment',
      'Modifying closed historical periods without documenting a clear business reason'
    ],
    monthlyRoutine: [
      'Coordinate with Finance Editor during routine data entry and receipt attachment review',
      'Review open Audit Center alerts and verify bank statement reconciliation matches',
      'Assist with period close when the Primary Admin is unavailable'
    ],
    keySafetyReminders: [
      'Coordinate with the Primary Admin before executing period close or reopen actions to avoid conflicting updates.',
      'Maintain confidentiality of sensitive giving records and personal financial details.'
    ]
  },
  'Finance Editor': {
    role: 'Finance Editor',
    title: 'Finance Editor',
    badgeColor: '#137333',
    summary: 'Day-to-day finance entry and review role. Responsible for entering weekly contributions, posting operating expenses, uploading receipts, and processing reimbursement allocations.',
    responsibilities: [
      'Enter contributions from verified offering count sheets with accurate service date attribution',
      'Post operating expenses, bills, and purchase invoices with appropriate category classifications',
      'Upload and link supporting receipts, invoices, and vouchers in Document Center',
      'Process member reimbursement records using application allocation formulas to avoid duplicate expense recognition',
      'Perform preliminary transaction matching against bank statements in the Reconciliation module',
      'Review Audit Center alerts to resolve missing receipts or unlinked records promptly'
    ],
    permittedModules: [
      { name: 'Dashboard', path: '/dashboard', accessLevel: 'Full Write' },
      { name: 'Transactions', path: '/transactions', accessLevel: 'Full Write' },
      { name: 'Income & Tithes', path: '/income', accessLevel: 'Full Write' },
      { name: 'Expenses', path: '/expenses', accessLevel: 'Full Write' },
      { name: 'Reimbursements', path: '/reimbursements', accessLevel: 'Full Write' },
      { name: 'Document Center', path: '/documents', accessLevel: 'Full Write' },
      { name: 'Receipt Register', path: '/receipts', accessLevel: 'Full Write' },
      { name: 'Check Details', path: '/checks', accessLevel: 'Full Write' },
      { name: 'Capital Projects', path: '/capital-projects', accessLevel: 'Read Only' },
      { name: 'Reconciliation', path: '/reconciliation', accessLevel: 'Full Write' },
      { name: 'Audit Center', path: '/audit', accessLevel: 'Full Write' },
      { name: 'Monthly Close', path: '/monthly-close', accessLevel: 'Read Only' },
      { name: 'Presbyter Reports', path: '/presbyter-reports', accessLevel: 'Read Only' },
      { name: 'Settings', path: '/settings', accessLevel: 'Read Only' }
    ],
    restrictedActions: [
      'Executing the Monthly Close period lock (Restricted to Primary Admin or Backup Admin)',
      'Reopening closed accounting periods (Restricted to Primary Admin or Backup Admin)',
      'Modifying system configuration or governance parameters',
      'Creating new Capital Projects (Admins create projects; Editors link transactions and receipts)'
    ],
    monthlyRoutine: [
      'Post-Service Routine: Enter weekend contributions and upload supporting count documentation',
      'Routine Entry: Attach receipts for purchases and record reimbursement settlements as they occur',
      'Pre-Close Review: Match entries against bank statements and address open audit alerts',
      'Handoff: Notify the Primary Admin when reconciliations and receipt attachments are complete for the month'
    ],
    keySafetyReminders: [
      'The original purchase represents the recognized church expense; the reimbursement check settles what is owed. Never record a reimbursement payout check as a second expense.',
      'Check the header Period Selector to ensure you are entering records into the intended accounting month.'
    ]
  },
  'Viewer': {
    role: 'Viewer',
    title: 'Viewer',
    badgeColor: '#6B7280',
    summary: 'Read-only operational visibility. Allows authorized committee members and observers to inspect financial reports, ledger transactions, and attached documents without modification rights.',
    responsibilities: [
      'Review income, expenses, and operational summaries across church funds',
      'Inspect attached receipts, invoices, and statements in Document Center for review purposes',
      'Monitor designated capital project balances and expenditures',
      'Confirm that period closes and reconciliations are conducted on schedule'
    ],
    permittedModules: [
      { name: 'Dashboard', path: '/dashboard', accessLevel: 'Read Only' },
      { name: 'Transactions', path: '/transactions', accessLevel: 'Read Only' },
      { name: 'Income & Tithes', path: '/income', accessLevel: 'Read Only' },
      { name: 'Expenses', path: '/expenses', accessLevel: 'Read Only' },
      { name: 'Reimbursements', path: '/reimbursements', accessLevel: 'Read Only' },
      { name: 'Document Center', path: '/documents', accessLevel: 'Read Only' },
      { name: 'Receipt Register', path: '/receipts', accessLevel: 'Read Only' },
      { name: 'Check Details', path: '/checks', accessLevel: 'Read Only' },
      { name: 'Capital Projects', path: '/capital-projects', accessLevel: 'Read Only' },
      { name: 'Reconciliation', path: '/reconciliation', accessLevel: 'Read Only' },
      { name: 'Audit Center', path: '/audit', accessLevel: 'Read Only' },
      { name: 'Monthly Close', path: '/monthly-close', accessLevel: 'Read Only' },
      { name: 'Presbyter Reports', path: '/presbyter-reports', accessLevel: 'Read Only' },
      { name: 'Settings', path: '/settings', accessLevel: 'Read Only' }
    ],
    restrictedActions: [
      'Creating, editing, or deleting any transaction, contribution, or expense record',
      'Uploading or modifying document attachments in Document Center',
      'Altering reconciliation statuses, clearing audit issues, or initiating monthly close'
    ],
    monthlyRoutine: [
      'Review monthly dashboard summaries and category expense trends',
      'Inspect sample transactions and supporting receipts for internal committee review',
      'Review monthly close status and financial summaries'
    ],
    keySafetyReminders: [
      'All write and upload buttons are disabled or hidden for your account to ensure read-only protection.',
      'Print or view reports using built-in views without altering system data.'
    ]
  },
  'Presbyter Read-Only': {
    role: 'Presbyter Read-Only',
    title: 'Presbyter Read-Only',
    badgeColor: '#B39260',
    summary: 'Sanitized financial oversight access. Designed to provide leadership visibility into summary totals, net position, reconciliation status, and closed-period summaries while limiting operational and donor-sensitive details.',
    responsibilities: [
      'Provide administrative and governance oversight to the church fellowship',
      'Review closed-period financial summaries, total tithes and offerings, and operating expense totals',
      'Inspect Audit Health Scores and period close information for general governance review',
      'Review designated capital campaign totals and project positions'
    ],
    permittedModules: [
      { name: 'Presbyter Reports', path: '/presbyter-reports', accessLevel: 'Executive Oversight' },
      { name: 'Help & Training', path: '/help', accessLevel: 'Executive Oversight' }
    ],
    restrictedActions: [
      'Accessing operational finance modules (Transactions, Income Detail, Expense Detail, Reimbursements, Document Center, Settings)',
      'Viewing individual donor identities, member names, check numbers, or private giving histories',
      'Modifying any financial, audit, or configuration records'
    ],
    monthlyRoutine: [
      'Access /presbyter-reports following the conclusion of each month-end close cycle',
      'Review the closed-period financial summary, Audit Health Score, and reconciliation status',
      'Print or review executive finance reports for leadership and oversight meetings'
    ],
    keySafetyReminders: [
      'Your access is focused strictly on sanitized summary reports; operational routes automatically redirect to Presbyter Reports.',
      'All reports presented to you are summarized to protect individual member privacy while providing clear oversight.'
    ]
  }
};
