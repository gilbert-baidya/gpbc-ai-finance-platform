import { TroubleshootingItem } from './types';

export const TROUBLESHOOTING_GUIDES: TroubleshootingItem[] = [
  {
    id: 'cannot-sign-in',
    title: 'I cannot sign in to GPBC Finance Desk',
    problem: 'Google Sign-In fails or displays an unauthorized account message.',
    possibleReasons: [
      'You are signed into your browser with a personal Google account not on the church authorized users list.',
      'Browser third-party cookie blocking is preventing Google OAuth credential exchange.',
      'Your authorized session expired after an extended period of inactivity.'
    ],
    safeActionSteps: [
      'Ensure you are signing in with your official church-authorized Google email address.',
      'Check if your browser allows cookies for google.com and your church domain.',
      'Open an Incognito/Private browsing window and attempt to sign in to rule out browser cache conflicts.',
      'Clear your browser cookies and reload the page.'
    ],
    whenToContactAdmin: 'Contact the Primary Admin if your email address needs to be added to the authorized church users directory.',
    keywords: ['login', 'signin', 'google', 'oauth', 'session', 'unauthorized', 'credentials']
  },
  {
    id: 'forbidden-access-denied',
    title: 'I see "Access Denied" or "Forbidden" on a page',
    problem: 'An access barrier screen appears when trying to navigate to a module.',
    possibleReasons: [
      'The module is restricted to specific roles (e.g. Monthly Close and Settings require Admin privileges).',
      'You are logged in as a Presbyter Read-Only user, who is restricted to Presbyter Reports.',
      'Your account role was recently adjusted and requires a refreshed session.'
    ],
    safeActionSteps: [
      'Check the role displayed beneath your name in the top right user card.',
      'Review the Role Guide to confirm whether your role has access to the requested module.',
      'Sign out and sign back in to refresh your assigned role permissions.'
    ],
    whenToContactAdmin: 'Contact the Primary Admin if your ministry duties require upgraded access (e.g., transitioning from Viewer to Finance Editor).',
    keywords: ['forbidden', 'access denied', 'permissions', 'role', 'shield alert', 'restricted']
  },
  {
    id: 'wrong-month-selected',
    title: 'Transactions appear missing or the wrong month is displayed',
    problem: 'You opened a module but only see old entries or don\'t see transactions you just entered.',
    possibleReasons: [
      'The Period Selector in the top header is set to a previous month or year.',
      'The transaction date was entered in a different calendar month than currently viewed.'
    ],
    safeActionSteps: [
      'Look at the Period Selector dropdown in the top right of the navigation header.',
      'Select the exact Month and Year of the records you wish to view.',
      'Verify the date filter inside the page table is set to "All" or includes your target dates.'
    ],
    whenToContactAdmin: 'Only if the Period Selector fails to load available fiscal months.',
    keywords: ['wrong month', 'missing records', 'period selector', 'filter', 'calendar']
  },
  {
    id: 'duplicate-transaction',
    title: 'I accidentally entered a transaction twice',
    problem: 'Duplicate rows appear in the Transactions ledger for the same expense or contribution.',
    possibleReasons: [
      'The submit button was clicked twice during a slow network connection.',
      'Both a manual entry and an electronic batch were recorded for the same event.'
    ],
    safeActionSteps: [
      'Open the Transactions ledger and locate both entries.',
      'Check if the period is open. If open, authorized editors can delete or void the duplicate row.',
      'Ensure the remaining entry has the complete receipt and correct category attached.',
      'Do not attempt to delete rows directly in Google Sheets; use the app interface to preserve audit trail integrity.'
    ],
    whenToContactAdmin: 'If the period is already closed and locked, contact Primary Admin to request a formal correction.',
    keywords: ['duplicate', 'double entry', 'delete transaction', 'twice', 'remove']
  },
  {
    id: 'receipt-missing',
    title: 'A receipt was lost or is missing',
    problem: 'A transaction has no paper or digital receipt to substantiate the purchase.',
    possibleReasons: [
      'The store clerk did not provide a receipt, or the paper slip was misplaced.',
      'The purchaser made an online order and did not save the PDF invoice.'
    ],
    safeActionSteps: [
      'Request the purchaser log in to the merchant portal (e.g. Amazon, Home Depot) to download a duplicate digital invoice.',
      'If an itemized receipt cannot be retrieved, request a signed "Missing Receipt Affidavit" detailing items, dates, and purpose.',
      'Upload the duplicate invoice or signed affidavit into Document Center and link it to the transaction.',
      'The Audit Center will clear the "Needs Receipt" warning once supporting evidence is attached.'
    ],
    whenToContactAdmin: 'Consult Primary Admin according to church policy.',
    keywords: ['missing receipt', 'lost receipt', 'affidavit', 'store receipt', 'needs receipt']
  },
  {
    id: 'document-needs-review',
    title: 'A document in Document Center says "Needs Review"',
    problem: 'An uploaded file is flagged with a warning badge.',
    possibleReasons: [
      'The document was uploaded without being linked to a transaction or project.',
      'The date on the document falls outside the selected finance period.',
      'The file uploaded was illegible or corrupted.'
    ],
    safeActionSteps: [
      'Click on the document in Document Center to inspect the preview.',
      'Click "Link to Record" and assign the appropriate Transaction ID.',
      'Verify that the Document Date and Category match the ledger entry.',
      'If the scan is blurry, upload a clearer replacement scan.'
    ],
    whenToContactAdmin: 'If the document belongs to a closed accounting period and requires an Admin note.',
    keywords: ['needs review', 'unlinked', 'document center', 'blurry', 'attachment']
  },
  {
    id: 'reimbursement-balance-wrong',
    title: 'Reimbursement remaining balance looks incorrect',
    problem: 'The remaining balance owed on a purchase does not match expectations.',
    possibleReasons: [
      'A partial reimbursement check was issued but not logged in Reimbursement Allocations.',
      'A member personally absorbed part of the cost, but it was not entered in "Personally Absorbed".',
      'A store refund or card credit was received and needs to be logged as a Refund Credit Adjustment.',
      'The reimbursement check was accidentally entered as a new expense.'
    ],
    safeActionSteps: [
      'Open Reimbursements and locate the purchase record.',
      'Check the invariant: Net Covered = Allocated + Absorbed + Refund Credit Adjustments.',
      'Check Remaining Balance = Purchase Amount - Net Covered.',
      'Update the appropriate field (Allocated, Absorbed, or Refund Credit) to reflect reality.'
    ],
    whenToContactAdmin: 'If allocations appear corrupted or if an over-allocation error cannot be resolved.',
    keywords: ['reimbursement balance', 'wrong balance', 'net covered', 'remaining balance', 'absorbed']
  },
  {
    id: 'refund-received',
    title: 'A refund was received on a church purchase',
    problem: 'Unsure how to record money returned from a merchant or vendor.',
    possibleReasons: [
      'Goods were returned to a hardware store or an event registration was canceled.'
    ],
    safeActionSteps: [
      'Do NOT record the refund as new Church Income or Donations.',
      'If the purchase was on a church card: Record the refund as a credit adjustment against the original expense category.',
      'If the purchase was out-of-pocket for reimbursement: Enter the return under "Refund / Credit Adjustment" in Reimbursements.',
      'Verify that the remaining liability to the purchaser is reduced by the refund amount.'
    ],
    whenToContactAdmin: 'If the refund spans multiple projects or fiscal years.',
    keywords: ['refund', 'vendor credit', 'store credit', 'return', 'merchant credit']
  },
  {
    id: 'transaction-not-reconciled',
    title: 'A transaction is not reconciling with the bank statement',
    problem: 'A transaction remains UNMATCHED or flags a discrepancy during reconciliation.',
    possibleReasons: [
      'The transaction cleared the bank on the 1st of next month rather than the month of purchase.',
      'A fee (e.g. PayPal/credit card processing fee) caused the deposit amount to differ by a few dollars.',
      'The check has been issued but has not yet been cashed by the recipient (outstanding check).'
    ],
    safeActionSteps: [
      'Inspect the date on the bank statement. If cleared in the subsequent month, it reconciles in that subsequent month\'s statement.',
      'If merchant fees were deducted, split or adjust the ledger entry to account for the processing fee.',
      'If an uncashed check: Leave as UNMATCHED/OUTSTANDING; do not force reconciliation until it clears.'
    ],
    whenToContactAdmin: 'If bank statement figures differ from church records by an unexplained amount after review.',
    keywords: ['not reconciled', 'unmatched', 'reconciliation discrepancy', 'bank statement', 'cleared']
  },
  {
    id: 'audit-issue-remains',
    title: 'An audit issue remains after I marked it "Reviewed"',
    problem: 'Audit Health Score did not improve after clicking "Reviewed" on an audit issue.',
    possibleReasons: [
      'Under GPBC audit rules, "Reviewed" acknowledges that an editor saw the issue, but it does NOT cure the deduction until the underlying problem is fixed.',
      'Points are only restored when the issue reaches "Cleared" or "Reconciled" status.'
    ],
    safeActionSteps: [
      'Inspect the actual issue description (e.g. "Missing Receipt" or "Over-allocated purchase").',
      'Take the required remediation step (e.g. upload the receipt or adjust the allocation).',
      'Run the Audit Engine again. When the condition is cured, the status becomes Cleared and points are restored.'
    ],
    whenToContactAdmin: 'If an issue is a permanent false positive that requires Admin override.',
    keywords: ['audit issue', 'reviewed', 'cleared', 'deduction', 'audit health score']
  },
  {
    id: 'month-already-closed',
    title: 'I need to add or edit records, but the month is CLOSED',
    problem: 'A banner states "Period is CLOSED. Financial write is locked."',
    possibleReasons: [
      'The month-end close procedure was executed, locking the period to protect historical integrity.'
    ],
    safeActionSteps: [
      'If you only need to attach a late receipt: You can attach it as a "Post-Close Addition" in Document Center without unlocking accounting figures.',
      'If transaction amounts or dates must be modified: You cannot edit directly. Contact a Primary or Backup Admin to evaluate a formal reopening.',
      'Never attempt to bypass period locks by manually inserting rows into Google Sheets!'
    ],
    whenToContactAdmin: 'Contact Primary Admin with the exact details and justification for why the closed period must be reopened.',
    keywords: ['closed period', 'locked', 'reopen', 'cannot edit', 'closed month']
  },
  {
    id: 'cannot-see-page',
    title: 'I cannot see a page in the navigation sidebar',
    problem: 'A menu item mentioned by another user is missing from your sidebar.',
    possibleReasons: [
      'The sidebar is customized based on your assigned role (e.g. Presbyter Read-Only only sees Presbyter Reports and Help).',
      'The sidebar is collapsed on narrow screens (click the chevron or hamburger icon to expand).'
    ],
    safeActionSteps: [
      'Check if the sidebar is collapsed; click the expand arrow at the top of the sidebar.',
      'Check your user role in the top header.',
      'Refer to the Role Guide to confirm if your role includes that module.'
    ],
    whenToContactAdmin: 'Contact Primary Admin if your account was assigned the wrong role.',
    keywords: ['missing page', 'sidebar', 'navigation', 'hidden menu', 'collapsed']
  },
  {
    id: 'presbyter-cannot-see-operational',
    title: 'Presbyter cannot see operational modules',
    problem: 'A Presbyter user logs in and only sees Presbyter Reports and Help & Training.',
    possibleReasons: [
      'This is the intended design and security architecture of GPBC Finance Desk.',
      'Presbyter Read-Only users are intentionally isolated from operational modules to protect confidential donor data.'
    ],
    safeActionSteps: [
      'Explain to the Presbyter that /presbyter-reports provides complete executive oversight, net position totals, and governance summary indicators without administrative clutter.',
      'If the Presbyter requires operational editing access as a local church trustee, an Admin must formally update their role to Primary Admin or Finance Editor.'
    ],
    whenToContactAdmin: 'Only if the user\'s role needs to be reassigned in the authorized user directory.',
    keywords: ['presbyter', 'executive oversight', 'sanitized', 'donor privacy']
  },
  {
    id: 'dashboard-vs-cash-difference',
    title: 'Dashboard Net Position differs from bank account cash balance change',
    problem: 'The Net Surplus/Deficit on the Dashboard does not match the change in bank balance.',
    possibleReasons: [
      'Outstanding uncashed checks written this month have not cleared the bank yet.',
      'Reimbursement payout checks settle prior liabilities and move cash without creating a second expense.',
      'Deposits made late on the last day of the month may clear the bank in the following month.'
    ],
    safeActionSteps: [
      'Review the Reconciliation tab to identify outstanding checks and deposits in transit.',
      'Understand the difference between accrual-based recognized expenses and cash disbursements.',
      'Check Reimbursements to see if liability payouts occurred during the month.'
    ],
    whenToContactAdmin: 'If reconciled bank ending balance still cannot be tied to ledger totals.',
    keywords: ['cash vs accrual', 'bank balance difference', 'net position', 'cash flow', 'timing difference']
  }
];
