import { WhatNextScenario } from './types';

export const WHAT_NEXT_SCENARIOS: WhatNextScenario[] = [
  {
    id: 'sunday-offering',
    triggerQuestion: 'I received Sunday Offering or Midweek Tithes.',
    shortAnswer: 'Log the collection batch in Income and attach the signed count sheet.',
    recommendedRoute: '/income',
    routeButtonLabel: 'Go to Income & Tithes',
    rolesAllowed: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    ruleSummary: 'Never combine designated gifts with regular operating tithes. Follow church offering count procedures before entry.',
    steps: [
      'Follow church offering count procedures to verify and sign the paper offering sheet.',
      'Open Income and click "Record Contribution".',
      'Select the Service Date, enter total offering amount, and tag the appropriate fund.',
      'Photograph or scan the signed sheet and upload it as a Receipt/Document attachment.',
      'Deposit the cash/checks in the church bank account and retain the bank deposit slip.'
    ]
  },
  {
    id: 'personal-purchase',
    triggerQuestion: 'I purchased something using my personal credit card or cash for church ministry.',
    shortAnswer: 'Record the purchase in Expenses under the member\'s name, then settle in Reimbursements.',
    recommendedRoute: '/reimbursements',
    routeButtonLabel: 'Open Reimbursements',
    rolesAllowed: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    ruleSummary: 'The purchase itself represents the church expense. Do NOT record the reimbursement payout check as a second expense!',
    steps: [
      'Submit the itemized store receipt showing date, merchant, and items.',
      'Record the item in Expenses under the ministry category (books the expense).',
      'Open Reimbursements to see the remaining balance owed to the person.',
      'When the church issues the payout check, record the Reimbursement Allocation.',
      'If the purchaser donates part of the cost, enter that under Personally Absorbed.'
    ]
  },
  {
    id: 'received-refund',
    triggerQuestion: 'I returned an item or received a merchant credit/refund.',
    shortAnswer: 'Apply as a Refund Credit Adjustment to lower what the church owes.',
    recommendedRoute: '/reimbursements',
    routeButtonLabel: 'Review Refund Guidance',
    rolesAllowed: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    ruleSummary: 'A refund reduces the purchase liability; it is NOT new church income and does NOT increase reimbursement capacity.',
    steps: [
      'Locate the original purchase record in Reimbursements or Transactions.',
      'Enter the return amount under "Refund / Credit Adjustment".',
      'The system automatically recalculates Net Covered and reduces Remaining Balance.',
      'Do not enter the refund as a general church donation or income item.'
    ]
  },
  {
    id: 'have-receipt',
    triggerQuestion: 'I have a paper receipt or vendor invoice.',
    shortAnswer: 'Upload the scan or photo directly into Document Center and link it.',
    recommendedRoute: '/documents',
    routeButtonLabel: 'Open Document Center',
    rolesAllowed: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    ruleSummary: 'Supporting evidence must be attached to maintain complete supporting documentation and keep your Audit Health Score high.',
    steps: [
      'Take a legible photo or PDF scan of the document (under 10MB).',
      'Open Document Center and click "Upload Document".',
      'Select Document Type (Receipt, Invoice, Check, Statement) and document date.',
      'Link the document to its related Transaction ID or Reimbursement record.',
      'Verify the document status updates from Unlinked to Linked.'
    ]
  },
  {
    id: 'preparing-month-end',
    triggerQuestion: 'I am preparing for Month-End Close.',
    shortAnswer: 'Follow the 10-Step Monthly Finance Workflow in sequence.',
    recommendedRoute: '/monthly-close',
    routeButtonLabel: 'View Monthly Close Checklist',
    rolesAllowed: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    ruleSummary: 'All income, expenses, reimbursements, reconciliations, and audit issues must be verified before locking.',
    steps: [
      'Follow steps 1-8 of the Monthly Finance Workflow.',
      'Verify all bank and credit card statement transactions are matched in Reconciliation.',
      'Resolve any Critical or High severity warnings in the Audit Center (resolve open conditions).',
      'Have the Primary Admin or Backup Admin review and execute the period lock in Monthly Close.'
    ]
  },
  {
    id: 'report-for-presbyter',
    triggerQuestion: 'I need to give the Presbyter or Church Council a financial report.',
    shortAnswer: 'Open Presbyter Reports to generate a sanitized executive summary package.',
    recommendedRoute: '/presbyter-reports',
    routeButtonLabel: 'Open Presbyter Reports',
    rolesAllowed: 'All',
    ruleSummary: 'Presbyter reports are sanitized to protect individual donor privacy while providing complete executive transparency.',
    steps: [
      'Confirm the month has been closed and locked in Monthly Close.',
      'Open Presbyter Reports and select the reporting period.',
      'Review total income, operating expenses, net position, and audit health.',
      'Use the Print / Export function to generate the clean executive PDF package.'
    ]
  },
  {
    id: 'mistake-in-closed-month',
    triggerQuestion: 'I found a mistake or omission in a month that is already closed.',
    shortAnswer: 'Do NOT edit casually. Request an authorized Admin reopening with a documented reason.',
    recommendedRoute: '/monthly-close',
    routeButtonLabel: 'Review Reopening Guidance',
    rolesAllowed: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    ruleSummary: 'Closed periods are locked against further modification. Reopening requires a Primary or Backup Admin and a mandatory audit reason.',
    steps: [
      'Determine whether the correction is a missing receipt or an actual accounting dollar error.',
      'If it is only a late receipt: Upload it as a traceable "Post-Close Evidence Addition" without reopening.',
      'If accounting figures must change: Contact Primary Admin to formally reopen the period with a documented justification.',
      'Make the exact necessary correction and immediately re-close the month.'
    ]
  },
  {
    id: 'designated-capital-project',
    triggerQuestion: 'We are raising funds for a church building improvement or special project.',
    shortAnswer: 'Track it in Capital Projects and distinguish designated gifts from operating tithes.',
    recommendedRoute: '/capital-projects',
    routeButtonLabel: 'Open Capital Projects',
    rolesAllowed: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    ruleSummary: 'Funds given for a stated or designated purpose should remain separately identifiable. Track Designated Funding Position, not just budget ceilings.',
    steps: [
      'Have the Primary Admin or Backup Admin create the project in Capital Projects.',
      'Record designated contributions under the project name in Income.',
      'Attach all contractor bids, invoices, and material receipts in Document Center.',
      'Regularly monitor Designated Funding Position (Gifts Received - Supported Spending).'
    ]
  },
  {
    id: 'reconciliation-needs-review',
    triggerQuestion: 'A transaction in Reconciliation says "Needs Review".',
    shortAnswer: 'Inspect the date, amount, and payee to identify the discrepancy.',
    recommendedRoute: '/reconciliation',
    routeButtonLabel: 'Open Reconciliation',
    rolesAllowed: ['Primary Admin', 'Backup Admin', 'Finance Editor'],
    ruleSummary: 'Transactions are never reconciled automatically. A match requires verified alignment with bank records.',
    steps: [
      'Click on the "Needs Review" row in Reconciliation.',
      'Compare the bank statement amount vs. the ledger recorded amount.',
      'Check if bank fees, sales tax, or merchant processing charges explain the difference.',
      'Correct the ledger entry if an input error occurred, or record the fee adjustment.'
    ]
  }
];
