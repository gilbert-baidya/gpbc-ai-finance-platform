import { QuickStartStep } from './types';

export const QUICK_START_STEPS: QuickStartStep[] = [
  {
    minute: 1,
    title: 'Master the Period Selector',
    keyTakeaway: 'Always check the active Month & Year before doing anything.',
    targetRoute: '/dashboard',
    instructions: [
      'Look at the top right of the navigation header: you will see the Period Selector dropdown (e.g., "August 2026").',
      'GPBC Finance Desk filters all ledger views, dashboards, and reports according to this selected month.',
      'Notice the environment badge next to the church logo: "PRODUCTION" indicates live church data, while "SANDBOX" is for testing.',
      'Remember: If you ever feel that records are "missing", first check whether the Period Selector is set to the correct month.'
    ]
  },
  {
    minute: 2,
    title: 'Learn How to Record Income',
    keyTakeaway: 'Distinguish general tithes from designated project gifts.',
    targetRoute: '/income',
    instructions: [
      'Navigate to Income & Tithes in the sidebar.',
      'Click "Record Contribution" to open the entry form.',
      'Enter the collection date from the signed physical count sheet.',
      'Choose the Category carefully: General Tithes support general operations, while Designated Funds (like Building or Electrical Panel) must be tagged to their specific project.',
      'Upload the signed count sheet scan to substantiate the deposit.'
    ]
  },
  {
    minute: 3,
    title: 'Learn How to Record an Expense',
    keyTakeaway: 'The original purchase is the recognized church expense.',
    targetRoute: '/expenses',
    instructions: [
      'Navigate to Expenses in the sidebar.',
      'Click "Record Expense" and input the vendor name, purchase date, and amount.',
      'Assign the proper budget category (e.g. Facilities Maintenance, Worship, Outreach).',
      'Golden Rule: If a member bought supplies using personal funds, record the purchase in Expenses under their name first. The subsequent reimbursement check is a liability payout—NOT a second expense!'
    ]
  },
  {
    minute: 4,
    title: 'Attach Receipts & Supporting Proof',
    keyTakeaway: 'Every dollar spent requires supporting audit evidence.',
    targetRoute: '/documents',
    instructions: [
      'Navigate to Document Center or click the paperclip icon directly on any transaction row in the ledger.',
      'Upload clear PDF scans or photos of store receipts, vendor invoices, or deposit slips (under 10MB).',
      'Select the Document Type (Receipt, Invoice, Check, Bank Statement) and link it to the Transaction ID.',
      'Confirm the status changes from "Unlinked" to "Linked". This immediately prevents audit deductions.'
    ]
  },
  {
    minute: 5,
    title: 'Review Reconciliation & Audit Workflow',
    keyTakeaway: 'The Audit Health Score is deterministic; historical records are never auto-reconciled.',
    targetRoute: '/reconciliation',
    instructions: [
      'Open Reconciliation at month-end to match ledger records against uploaded monthly bank statements.',
      'Remember: Historical transactions are NOT automatically reconciled simply because they are old. Each must be verified against bank records.',
      'Open Audit Center to inspect your Audit Health Score (100 baseline minus deductions for missing receipts or over-allocations).',
      'When all records reconcile and the Audit Score is healthy, an authorized Primary or Backup Admin can execute the formal Monthly Close.'
    ]
  }
];
