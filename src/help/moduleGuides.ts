import { HelpArticle } from './types';

export const MODULE_GUIDES: HelpArticle[] = [
  // 1. Dashboard
  {
    id: 'dashboard',
    slug: 'dashboard',
    title: 'Financial Dashboard & Executive KPIs',
    category: 'overview',
    route: '/dashboard',
    readTimeMinutes: 4,
    keywords: ['dashboard', 'kpi', 'metrics', 'income', 'expenses', 'net position', 'cash flow', 'trends', 'audit health'],
    summary: 'Central overview displaying church financial records, net operating position, monthly giving trends, and audit readiness indicators.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Provides leadership and finance staff with a consolidated overview of church financial recordkeeping for the selected month and fiscal year.',
    whenToUse: 'Open the dashboard at the start of your workflow, before leadership meetings, and at month-end to review key metrics.',
    quickSteps: [
      'Confirm the active month/year in the top header Period Selector.',
      'Review Total Income, Total Recognized Expenses, and Net Operating Position.',
      'Check the Audit Health Score card to see if open audit conditions exist.',
      'Examine the giving vs. spending trajectory charts to observe trends.'
    ],
    keyFields: [
      { fieldName: 'Total Income', description: 'All recognized tithes, offerings, designated gifts, and interest received in the period.', required: true },
      { fieldName: 'Total Recognized Expenses', description: 'True church purchases and operational obligations incurred in the period (excluding reimbursement payout double-counts).', required: true },
      { fieldName: 'Net Position', description: 'Total Income minus Total Recognized Expenses. Positive represents net surplus; negative represents net deficit.', required: true },
      { fieldName: 'Audit Health Score', description: 'Deterministic 0-100 metric reflecting unresolved audit conditions, missing receipts, and allocation anomalies.', required: true }
    ],
    recommendedWorkflow: [
      'Select the target month using the Period Selector.',
      'Review whether Net Position aligns with expected church operational activity.',
      'If the Audit Health Score shows open conditions, review the Audit Center for details.',
      'Verify that all summary cards have loaded without connection warnings.'
    ],
    whatToReviewBeforeSaving: [
      'The dashboard is an analytical reporting view; no direct edits are made here. Verify that displayed period dates match your intended review month.'
    ],
    commonMistakes: [
      'Confusing Cash Inflow/Outflow with Recognized Income/Expenses. Cash movement includes liability settlements (e.g. paying back a member), whereas recognized expense occurred when the item was purchased.',
      'Forgetting to check the Period Selector, leading to confusion between current month and prior closed months.'
    ],
    statusMeanings: [
      { status: 'Surplus', badgeType: 'success', description: 'Monthly income exceeds recognized operating expenses.' },
      { status: 'Deficit', badgeType: 'warning', description: 'Recognized operating expenses exceed income for the period.' },
      { status: 'Audit Health Indicator', badgeType: 'info', description: 'A higher score indicates fewer unresolved issues under configured audit rules.' }
    ],
    sections: [
      {
        id: 'executive-summary',
        title: 'Understanding Your Church Financial Position',
        content: 'The GPBC Finance Desk Dashboard displays your church\'s financial posture using accrual-based principles supporting consistent church financial recordkeeping. Rather than simply tracking bank cash balances, it clearly shows **Recognized Income** (funds given to God\'s work) versus **Recognized Expenses** (commitments made for church ministries).\n\nThe **Net Position** indicator displays whether ministry operations operated with a surplus or deficit for the selected calendar period.'
      },
      {
        id: 'audit-score-gauge',
        title: 'The Deterministic Audit Health Gauge',
        content: 'The Audit Health Score on your dashboard is calculated dynamically and deterministically based on live records in the database. Deductions occur for missing receipts, over-allocated reimbursements, and unreconciled discrepancies. A higher score indicates fewer unresolved issues under GPBC Finance Desk\'s configured audit rules.'
      }
    ],
    relatedArticleIds: ['transactions', 'monthly-close', 'audit-center']
  },

  // 2. Transactions
  {
    id: 'transactions',
    slug: 'transactions',
    title: 'Transactions Master Ledger',
    category: 'finance',
    route: '/transactions',
    readTimeMinutes: 5,
    keywords: ['transactions', 'ledger', 'journal', 'entries', 'search', 'filter', 'export', 'edit', 'delete', 'receipt attach'],
    summary: 'The master accounting ledger displaying all recognized income, expenses, and transfers with search, filtering, and document attachment.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Serves as the primary ledger for every financial transaction recorded across church operations.',
    whenToUse: 'Use this page to search for specific payments, verify ledger coding, inspect linked evidence documents, and perform row-level audits.',
    quickSteps: [
      'Filter transactions by Month, Transaction Type (Income, Expense, Transfer), or Category.',
      'Use the search bar to locate specific payees, descriptions, or transaction IDs.',
      'Click the paperclip icon on any row to view or upload supporting receipts directly.',
      'Verify that transaction dates match the physical receipt or deposit documentation.'
    ],
    keyFields: [
      { fieldName: 'Transaction ID', description: 'Unique identifier (e.g. TXN-2026-0042) generated by the system.', required: true },
      { fieldName: 'Date', description: 'The exact date the purchase was made or the donation was collected.', required: true },
      { fieldName: 'Type', description: 'Income, Expense, or Transfer.', required: true },
      { fieldName: 'Category', description: 'The church budget classification line (e.g., Worship, Facilities, Missions).', required: true },
      { fieldName: 'Amount', description: 'The exact monetary transaction amount in USD ($).', required: true },
      { fieldName: 'Payee / Description', description: 'Vendor, store, person, or brief explanation of the ministry purpose.', required: true },
      { fieldName: 'Reconciliation Status', description: 'Indicates whether this record has been formally matched against bank statements.', required: true }
    ],
    recommendedWorkflow: [
      'Select the period you are auditing or reviewing.',
      'Scan rows for missing document indicators.',
      'Click the document drawer button to attach missing store receipts or invoices.',
      'Ensure payment methods are accurately marked.'
    ],
    whatToReviewBeforeSaving: [
      'Confirm the transaction date falls within an open accounting period.',
      'Double check that the amount matches the receipt total.',
      'Confirm the category correctly represents the ministry fund.'
    ],
    commonMistakes: [
      'Entering a personal out-of-pocket purchase under a person\'s name as an income deduction instead of an expense.',
      'Recording the check payout to reimburse someone as a new expense (this causes duplicate expense recognition!).'
    ],
    statusMeanings: [
      { status: 'Reconciled', badgeType: 'success', description: 'Formally matched against official bank statements.' },
      { status: 'Matched', badgeType: 'info', description: 'Matched against imported bank statement rows.' },
      { status: 'Needs Review', badgeType: 'warning', description: 'Discrepancy in date, amount, or payee requires attention.' },
      { status: 'Unmatched', badgeType: 'neutral', description: 'Recorded in ledger but not yet matched against bank statement.' }
    ],
    sections: [
      {
        id: 'filtering-and-search',
        title: 'Filtering and Record Lookup',
        content: 'You can filter the master ledger by transaction type (Income vs. Expense), category, payment method, or reconciliation status. For quick lookups, use the search bar to query by check number, vendor name, or transaction code.'
      },
      {
        id: 'direct-receipt-linking',
        title: 'Inline Document Attachment',
        content: 'Every transaction row contains a document link indicator. Clicking the badge opens the Evidence Drawer where you can view attached files, download PDFs, or upload new receipts without leaving the ledger.'
      }
    ],
    relatedArticleIds: ['expenses', 'income', 'documents', 'reconciliation']
  },

  // 3. Income
  {
    id: 'income',
    slug: 'income',
    title: 'Income & Tithes Management',
    category: 'finance',
    route: '/income',
    readTimeMinutes: 4,
    keywords: ['income', 'tithes', 'offerings', 'donations', 'contributions', 'designated gifts', 'count sheet', 'sunday giving'],
    summary: 'Record, categorize, and track all church income including Sunday offerings, tithes, designated gifts, and electronic giving batches.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Captures church revenues accurately, supporting proper stewardship and distinguishing general operating tithes from designated project gifts.',
    whenToUse: 'Use this module following worship services to log offering collections, and when processing electronic donation deposits.',
    quickSteps: [
      'Open the Income page and click "Record Contribution" or "New Income Entry".',
      'Select the Service Date corresponding to the collection.',
      'Enter the offering amount and designate the collection type (Tithes & General Offerings, Missions, Building Fund, etc.).',
      'Upload the signed Offering Count Sheet or deposit receipt.',
      'Save the record and verify it reflects in your monthly totals.'
    ],
    keyFields: [
      { fieldName: 'Collection Date', description: 'Date the funds were received during worship or deposit.', required: true },
      { fieldName: 'Fund / Category', description: 'General Fund, Missions, Youth Ministry, or Designated Capital Project.', required: true },
      { fieldName: 'Payment Method', description: 'Cash, Check, Electronic/Online Transfer.', required: true },
      { fieldName: 'Batch Total', description: 'Sum of all offerings in the deposit batch.', required: true }
    ],
    recommendedWorkflow: [
      'Verify cash and check totals according to church offering count procedures.',
      'Finance Editor enters the verified aggregate into GPBC Finance Desk.',
      'Attach a scan or photo of the count verification sheet.',
      'Confirm the bank deposit receipt matches the recorded income entry.'
    ],
    whatToReviewBeforeSaving: [
      'Ensure designated gifts (e.g. Electrical Panel) are explicitly tagged to the designated project.',
      'Verify cash currency matches the deposit slip count.'
    ],
    commonMistakes: [
      'Lumping designated project gifts into the General Tithe line.',
      'Changing the transaction date to the day of data entry rather than the actual service/collection date.'
    ],
    statusMeanings: [
      { status: 'Recorded', badgeType: 'info', description: 'Logged in the ledger and awaiting bank clearing.' },
      { status: 'Reconciled', badgeType: 'success', description: 'Confirmed deposited on the official church bank statement.' }
    ],
    sections: [
      {
        id: 'designated-vs-general',
        title: 'General Offerings vs. Designated Donations',
        content: 'General tithes and offerings support regular church operations (pastoral support, utilities, worship resources). Funds given for a stated or designated purpose (such as a Capital Project or Building Repair) should remain separately identifiable and should be used consistently with the church\'s approved purpose and applicable requirements. Always categorize designated gifts accurately so the system tracks the church\'s true **Designated Funding Position**.'
      }
    ],
    relatedArticleIds: ['capital-projects', 'transactions', 'reconciliation']
  },

  // 4. Expenses
  {
    id: 'expenses',
    slug: 'expenses',
    title: 'Operating Expenses & Disbursements',
    category: 'finance',
    route: '/expenses',
    readTimeMinutes: 5,
    keywords: ['expenses', 'bills', 'utilities', 'purchases', 'operating costs', 'disbursements', 'invoices', 'vendors'],
    summary: 'Track and categorize church expenditures, utility bills, ministry supplies, and approved operational disbursements.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Documents the outflow of church funds and records recognized expenses in the period the purchase or obligation was incurred.',
    whenToUse: 'Record an expense whenever a bill arrives, a church card purchase is made, or an authorized church purchase occurs.',
    quickSteps: [
      'Click "Record Expense" in the Expenses view.',
      'Enter the Purchase Date and Vendor / Payee Name.',
      'Select the appropriate Ministry Category (e.g. Facilities, Fellowship, Music, Administration).',
      'Input the total amount and select the Payment Method.',
      'Attach the invoice or store receipt.',
      'Save the expense entry.'
    ],
    keyFields: [
      { fieldName: 'Purchase Date', description: 'Date goods or services were procured.', required: true },
      { fieldName: 'Vendor', description: 'Name of the business, contractor, or service provider.', required: true },
      { fieldName: 'Category', description: 'Ministry budget classification.', required: true },
      { fieldName: 'Amount', description: 'Total charge as shown on the receipt or invoice.', required: true },
      { fieldName: 'Invoice / Check Number', description: 'Identifier on the billing statement or printed check.', required: false }
    ],
    recommendedWorkflow: [
      'Verify that the purchase has approval according to church finance procedures.',
      'Obtain an itemized receipt showing the breakdown of items purchased.',
      'Enter the expense promptly so period budget views remain current.',
      'Scan and attach the receipt to prevent missing documentation alerts.'
    ],
    whatToReviewBeforeSaving: [
      'Review whether sales-tax exempt documentation was utilized where applicable.',
      'Check that the expense is not duplicated in another entry.'
    ],
    commonMistakes: [
      'Waiting until the monthly bank statement arrives to record purchases. Record them when they occur.',
      'Recording refunds as income rather than reducing the related expense category.'
    ],
    statusMeanings: [
      { status: 'Documented', badgeType: 'success', description: 'Receipt or invoice is attached and verified.' },
      { status: 'Missing Receipt', badgeType: 'warning', description: 'Expense recorded but supporting receipt has not been uploaded.' }
    ],
    sections: [
      {
        id: 'expense-recognition-rule',
        title: 'The Expense Recognition Rule',
        content: 'In GPBC Finance Desk, the **purchase itself** is the recognized church expense. When a church worker buys Sunday School materials, the church expense occurs on that date. Whether paid directly with a church card or purchased by a member for later reimbursement, the recognized expense date is the date of purchase.'
      }
    ],
    relatedArticleIds: ['reimbursements', 'documents', 'transactions']
  },

  // 5. Reimbursements
  {
    id: 'reimbursements',
    slug: 'reimbursements',
    title: 'Reimbursements & Personal Purchases',
    category: 'finance',
    route: '/reimbursements',
    readTimeMinutes: 6,
    keywords: ['reimbursements', 'allocations', 'personal purchases', 'out of pocket', 'net covered', 'remaining balance', 'absorbed', 'refunds', 'card credit'],
    summary: 'Manage member out-of-pocket church purchases, partial settlements, personal gift absorptions, and refund adjustments without duplicate expense recognition.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Maintains accurate liability settlement records for individuals who purchase church items out-of-pocket, ensuring fair reimbursement without distorting the church expense ledger.',
    whenToUse: 'When a member or worker submits receipts for items they paid for using personal funds on behalf of the church.',
    quickSteps: [
      'First: Record the original purchase in Expenses under the purchaser\'s name with the receipt attached.',
      'Open the Reimbursements module to view the purchase record.',
      'To reimburse the person: Log a Reimbursement Allocation with the payout amount.',
      'If the purchaser chooses to donate part of the expense: Enter that amount under Personally Absorbed.',
      'If an item was returned for a store/card refund: Record that under Refund Credit Adjustment.',
      'Verify that Remaining Balance updates accurately to $0.00 when fully settled.'
    ],
    keyFields: [
      { fieldName: 'Purchase Amount', description: 'The total itemized cost of the church purchase.', required: true },
      { fieldName: 'Allocated Amount', description: 'Payment amount issued by the church to the member.', required: true },
      { fieldName: 'Personally Absorbed Amount', description: 'Portion the member voluntarily donates and declines reimbursement for.', required: false },
      { fieldName: 'Refund / Credit Adjustment', description: 'Store returns or merchant credits reducing what the church owes.', required: false },
      { fieldName: 'Net Covered', description: 'Allocated + Absorbed + Refund Adjustments.', required: true },
      { fieldName: 'Remaining Balance', description: 'Purchase Amount minus Net Covered (minimum $0.00).', required: true }
    ],
    recommendedWorkflow: [
      'Purchaser submits itemized receipt and reimbursement form to the church office.',
      'Editor records the purchase in Expenses (this books the church expense).',
      'Editor opens Reimbursements and verifies the remaining balance.',
      'When the reimbursement payment is issued, record the allocation.',
      'Confirm Remaining Balance is zero.'
    ],
    whatToReviewBeforeSaving: [
      'Ensure the allocation payout amount does not exceed the remaining balance.',
      'Confirm that the reimbursement check was NOT entered as a second expense in the Expenses tab.'
    ],
    commonMistakes: [
      'CRITICAL: Counting the reimbursement payout check as a new expense. The purchase was ALREADY recognized as an expense. The payout check is simply settling a liability.',
      'Treating a merchant refund as additional money the church can pay out. A refund REDUCES what is owed!'
    ],
    statusMeanings: [
      { status: 'Settled ($0 Balance)', badgeType: 'success', description: 'The church has completely settled its liability to the purchaser.' },
      { status: 'Partially Covered', badgeType: 'warning', description: 'Partial payout or absorption logged; church still owes remaining balance.' },
      { status: 'Unpaid / Open', badgeType: 'error', description: 'Purchase recorded but no reimbursement allocations have been disbursed yet.' },
      { status: 'Over-Allocated', badgeType: 'error', description: 'Net covered exceeds purchase amount. Must be corrected.' }
    ],
    sections: [
      {
        id: 'the-golden-rule',
        title: 'Purchase Recognition vs. Reimbursement Payout',
        content: '### Core Principle\n\n1. **The Purchase is the Expense**: When a worker buys church fellowship supplies for $50 using personal funds on October 3, the church incurred a $50 expense on October 3.\n2. **The Payout is a Settlement**: When the church issues a $50 reimbursement payment on October 18, that payment is NOT a second expense. It simply settles the $50 amount the church owed.\n\nIf both were entered as expenses, the ledger would falsely record $100 in expenses for a $50 purchase.'
      },
      {
        id: 'canonical-formula',
        title: 'The Purchase Balance Formula',
        content: 'GPBC Finance Desk uses an established calculation across all reimbursement records:\n\nNet Covered Calculation:\nnetCovered = allocatedAmount + personallyAbsorbedAmount + refundCreditAdjustment\n\nRemaining Balance Calculation:\nremainingBalance = max(0, purchaseAmount - netCovered)\n\n- **Allocated Amount**: Cash/check payment issued by the church to the individual.\n- **Personally Absorbed Amount**: If the person says, *"I will donate $10 of this myself,"* that $10 is entered here.\n- **Refund Credit Adjustment**: If $15 of goods were returned, the store credit reduces what the church owes by $15.\n- **Over-allocation Protection**: If `netCovered > purchaseAmount`, the system flags an audit alert.'
      }
    ],
    relatedArticleIds: ['refunds-credits', 'expenses', 'audit-center']
  },

  // 6. Refunds & Credits
  {
    id: 'refunds-credits',
    slug: 'refunds-credits',
    title: 'Refunds, Merchant Credits & Over-Allocations',
    category: 'finance',
    route: '/reimbursements',
    readTimeMinutes: 4,
    keywords: ['refunds', 'credits', 'returns', 'merchant credit', 'store credit', 'over-allocation', 'adjustment'],
    summary: 'How to handle store returns, credit card refunds, and vendor adjustments without creating duplicate expense or income recognition.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Guides finance staff through proper treatment of purchase returns and merchant credits.',
    whenToUse: 'Whenever church materials are returned to a supplier, or a credit refund is received on a church purchase.',
    quickSteps: [
      'Locate the original purchase record in Reimbursements or Transactions.',
      'Check the return receipt showing the refunded amount.',
      'Apply the returned amount as a Refund Credit Adjustment on the purchase record.',
      'Verify that the remaining balance decreases by the refund amount.',
      'Do NOT record the refund as new Church Income.'
    ],
    keyFields: [
      { fieldName: 'Refund Credit Adjustment', description: 'The exact amount refunded by the store or vendor.', required: true }
    ],
    recommendedWorkflow: [
      'Receive store return receipt from purchaser.',
      'Open the purchase in Reimbursements.',
      'Add the refund amount to the purchase allocation record.',
      'The system automatically recalculates Net Covered and lowers Remaining Balance.'
    ],
    whatToReviewBeforeSaving: [
      'Confirm the refund amount does not make total coverage exceed the original purchase cost.'
    ],
    commonMistakes: [
      'Recording a store return as "Church Income / Donations". A refund is NOT a donation; it is a reversal of a prior purchase.',
      'Increasing the reimbursement payout because a refund occurred. A refund reduces what the church owes!'
    ],
    sections: [
      {
        id: 'fictional-training-example',
        title: 'Fictional Training Scenario',
        content: '### Example: Church Work Day Supplies\n\n- **Original Purchase**: A church worker purchases $145.00 in supplies at Hardware Depot using personal funds.\n- **Store Return**: An unused item is returned for a **$15.00 store refund**.\n- **Personal Absorption**: The worker tells the church, *"I want to absorb $20.00 as a personal gift to the church."*\n- **Church Payout**: The church issues the worker a payment for **$110.00**.\n\n**The Breakdown:**\n- `Purchase Amount`: $145.00\n- `Allocated Payout`: $110.00\n- `Personally Absorbed`: $20.00\n- `Refund Credit Adjustment`: $15.00\n- `Net Covered`: $110 + $20 + $15 = **$145.00**\n- `Remaining Balance`: $145.00 - $145.00 = **$0.00 (Fully Settled)**\n\nThe original purchase record is $145.00. The $15.00 merchant refund is captured as a Refund Credit Adjustment, reducing the remaining amount the church must cover. The $110 payout and $20 personally absorbed amount complete the settlement. No duplicate expense or donation income should be created.'
      }
    ],
    relatedArticleIds: ['reimbursements', 'expenses', 'audit-center']
  },

  // 7. Document Center
  {
    id: 'documents',
    slug: 'documents',
    title: 'Document Center & Evidence Storage',
    category: 'finance',
    route: '/documents',
    readTimeMinutes: 5,
    keywords: ['documents', 'upload', 'receipts', 'invoices', 'statements', 'evidence', 'post-close', 'unlinked', 'verified'],
    summary: 'The digital evidence archive storing scans and PDFs of receipts, invoices, checks, and bank statements linked to transactions.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Helps maintain supporting documentation for church financial records and internal review.',
    whenToUse: 'Use to upload documents, locate past invoices, attach statements, and review unlinked evidence files.',
    quickSteps: [
      'Click "Upload Document" in Document Center.',
      'Select Document Type (Receipt, Invoice, Check, Bank Statement, Credit Card Statement, Capital Project).',
      'Choose the File (PDF, PNG, JPG, under 10MB recommended).',
      'Select Document Date and related Finance Period (Year/Month).',
      'Optionally link directly to an existing Transaction ID.',
      'Submit upload and verify it appears in the register.'
    ],
    keyFields: [
      { fieldName: 'Document Type', description: 'Receipt, Invoice, Check, Bank Statement, Credit Card Statement, Finance Report.', required: true },
      { fieldName: 'Title / Description', description: 'Human-readable name (e.g. "Hardware Depot - Supplies").', required: true },
      { fieldName: 'Document Date', description: 'Date printed on the physical document.', required: true },
      { fieldName: 'Related Transaction ID', description: 'The ledger record this document substantiates.', required: false }
    ],
    recommendedWorkflow: [
      'Collect receipts regularly from ministry leads.',
      'Scan or photograph clearly in good lighting.',
      'Upload and link to the corresponding transaction.',
      'Periodically filter for "Unlinked" documents to connect any pending files.'
    ],
    whatToReviewBeforeSaving: [
      'Ensure the image or PDF is legible and key figures are visible.',
      'Confirm the document date aligns with the transaction date.'
    ],
    commonMistakes: [
      'Uploading very large uncompressed image files (keeping files under 10MB ensures faster access).',
      'Bypassing the application to organize files manually outside GPBC Finance Desk.'
    ],
    statusMeanings: [
      { status: 'Linked', badgeType: 'success', description: 'Attached to a specific ledger transaction or project.' },
      { status: 'Unlinked', badgeType: 'warning', description: 'Uploaded into archive but not yet connected to a ledger record.' },
      { status: 'Verified', badgeType: 'success', description: 'Reviewed and confirmed as complete supporting evidence.' }
    ],
    sections: [
      {
        id: 'post-close-additions',
        title: 'Post-Close Late Evidence Registration',
        content: 'Occasionally, a missing paper receipt for a closed month is discovered later. In GPBC Finance Desk, authorized users can register **Post-Close Evidence**.\n\nWhen attaching evidence to a closed period, the system records the document as a post-close addition and asks for an explanation note. This allows supporting documentation to remain complete and traceable without silently rewriting closed accounting figures.'
      }
    ],
    relatedArticleIds: ['receipts', 'checks', 'transactions']
  },

  // 8. Receipt Register
  {
    id: 'receipts',
    slug: 'receipts',
    title: 'Receipt Register & Itemized Receipts',
    category: 'finance',
    route: '/receipts',
    readTimeMinutes: 4,
    keywords: ['receipts', 'register', 'store receipts', 'itemized', 'merchant'],
    summary: 'Dedicated view of store receipts and purchase vouchers with merchant breakdown and document links.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Allows detailed tracking and verification of itemized retail and store receipts.',
    whenToUse: 'When verifying individual store item breakdowns and reviewing purchase receipts.',
    quickSteps: [
      'Filter by month or search for a specific merchant name.',
      'Click on any receipt row to open the preview.',
      'Confirm the receipt shows date, vendor, item list, and total amount.'
    ],
    commonMistakes: [
      'Accepting a credit card charge slip showing only the final total without an itemized store receipt.'
    ],
    sections: [
      {
        id: 'receipt-requirements',
        title: 'Receipt Best Practices (Recommended Practice)',
        content: 'To support clear financial recordkeeping, an itemized receipt typically shows: (1) Vendor name, (2) Date of transaction, (3) Itemized list of products or services, (4) Subtotal and final amount paid, and (5) Form of payment.'
      }
    ],
    relatedArticleIds: ['documents', 'expenses', 'reimbursements']
  },

  // 9. Check Details
  {
    id: 'checks',
    slug: 'checks',
    title: 'Check Details Register',
    category: 'finance',
    route: '/checks',
    readTimeMinutes: 4,
    keywords: ['checks', 'register', 'check number', 'cleared checks', 'outstanding checks', 'void checks'],
    summary: 'Log and monitor paper checks issued by the church, tracking check numbers, payees, clearance dates, and voided statuses.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Prevents duplicate check issuance, tracks outstanding uncashed checks, and aids bank reconciliation.',
    whenToUse: 'Record check details whenever the church writes a paper check for a vendor, ministry provider, utility, or reimbursement.',
    quickSteps: [
      'Log the Check Number, Check Date, and Payee Name.',
      'Enter the Check Amount and associated Transaction ID.',
      'Upload a scan or copy of the check voucher into Document Center.',
      'Update clearance status when the check clears on the bank statement.'
    ],
    keyFields: [
      { fieldName: 'Check Number', description: 'Consecutive check number.', required: true },
      { fieldName: 'Issue Date', description: 'Date the check was written.', required: true },
      { fieldName: 'Payee', description: 'Person or entity the check is payable to.', required: true },
      { fieldName: 'Status', description: 'Issued, Cleared, Void, or Outstanding.', required: true }
    ],
    commonMistakes: [
      'Reissuing a lost check without formally marking the original check VOID in the register.',
      'Skipping check numbers in the sequence without recording a VOID entry.'
    ],
    statusMeanings: [
      { status: 'Issued / Outstanding', badgeType: 'warning', description: 'Written and handed to payee, but not yet cleared at the bank.' },
      { status: 'Cleared', badgeType: 'success', description: 'Cleared on the church bank statement.' },
      { status: 'Void', badgeType: 'neutral', description: 'Canceled check; not negotiable.' }
    ],
    sections: [
      {
        id: 'stale-check-management',
        title: 'Managing Outstanding Checks',
        content: 'Review checks that remain outstanding for an extended period according to the church\'s banking and finance procedures. If an uncashed check needs replacement, coordinate with the payee to void and reissue properly.'
      }
    ],
    relatedArticleIds: ['reconciliation', 'transactions', 'documents']
  },

  // 10. Capital Projects
  {
    id: 'capital-projects',
    slug: 'capital-projects',
    title: 'Capital Projects & Designated Funds',
    category: 'projects',
    route: '/capital-projects',
    readTimeMinutes: 6,
    keywords: ['capital projects', 'designated funds', 'approved budget', 'funding position', 'campaign'],
    summary: 'Track special designated projects distinguishing designated contributions from general operating income.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Maintains transparency for special capital projects and helps track designated funds, supported expenditures, and funding position.',
    whenToUse: 'When the church conducts a designated fund campaign or incurs expenditures for an authorized capital project.',
    quickSteps: [
      'Admins can create a project (e.g. "Main Facility Maintenance Upgrade").',
      'Set the Approved Budget if voted or established; if unapproved, leave as "Not Set".',
      'Record designated contributions in Income, selecting the project name.',
      'Record project contractor bills in Expenses, linking them to the project.',
      'Monitor the Designated Funding Position on the project card.'
    ],
    keyFields: [
      { fieldName: 'Project Name', description: 'Clear descriptive title of the campaign or capital project.', required: true },
      { fieldName: 'Approved Budget', description: 'Formally approved expenditure ceiling, or "Not Set" if unestablished.', required: false },
      { fieldName: 'Designated Donations Received', description: 'Cumulative contributions received specifically for this project.', required: true },
      { fieldName: 'Supported Spending', description: 'Verified expenses paid out for project contractor work and materials.', required: true },
      { fieldName: 'Designated Funding Position', description: 'Donations Received minus Supported Spending.', required: true }
    ],
    recommendedWorkflow: [
      'Leadership establishes project scope and budget (if voted).',
      'Gifts labeled for the project are recorded under this designated fund.',
      'Contractor invoices and purchase receipts are linked to the project in Document Center.',
      'Leadership regularly reviews Designated Funding Position.'
    ],
    whatToReviewBeforeSaving: [
      'Do not mislabel Designated Funding Position as "Budget Remaining". Funding Position measures cash received vs. spent; Budget Remaining measures spending against an approved ceiling.'
    ],
    commonMistakes: [
      'Treating designated gifts as regular operating income. Designated funds should remain separate.',
      'Assuming an approved budget exists when none was formally established. Always show "Not Set" if unestablished.'
    ],
    statusMeanings: [
      { status: 'Active', badgeType: 'info', description: 'Project is actively receiving gifts or incurring expenses.' },
      { status: 'Completed', badgeType: 'success', description: 'Project finished and final figures accounted for.' },
      { status: 'On Hold', badgeType: 'warning', description: 'Temporarily paused pending leadership review.' }
    ],
    sections: [
      {
        id: 'funding-position-vs-budget',
        title: 'Funding Position vs. Approved Budget',
        content: '### Key Distinctions:\n\n1. **Approved Budget**: The expenditure ceiling formally established by church leadership. If no budget was established, it is documented as **"Not Set"**.\n2. **Designated Funding Position**: The net position of the project: `Designated Gifts Received - Supported Spending`. If the church received $18,000 and spent $10,000, your Designated Funding Position is **+$8,000**.\n3. **Funding Gap**: The difference between the Approved Budget and Total Designated Gifts Received (applicable only when an Approved Budget is set).\n\n*Do not label the Designated Funding Position as Budget Remaining.*'
      }
    ],
    relatedArticleIds: ['income', 'expenses', 'documents']
  },

  // 11. Reconciliation
  {
    id: 'reconciliation',
    slug: 'reconciliation',
    title: 'Bank & Card Reconciliation',
    category: 'control-audit',
    route: '/reconciliation',
    readTimeMinutes: 5,
    keywords: ['reconciliation', 'bank statement', 'matching', 'unmatched', 'matched', 'needs review', 'reconciled', 'historical'],
    summary: 'Compare internal accounting entries with official bank and card statements to verify that every dollar is accounted for.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Validates that GPBC Finance Desk records accurately reflect real-world bank account movements.',
    whenToUse: 'Perform monthly reconciliation as soon as the monthly bank statements and card statements become available.',
    quickSteps: [
      'Upload the monthly bank statement into Document Center.',
      'Open Reconciliation and review the staged bank transactions.',
      'Inspect auto-matched pairings for Date, Payee, and Amount.',
      'Investigate any items flagged as "Needs Review" or "Unmatched".',
      'When satisfied that matching criteria are met, confirm reconciliation.'
    ],
    keyFields: [
      { fieldName: 'Bank Statement Date', description: 'Date the bank processed the transaction.', required: true },
      { fieldName: 'Ledger Date', description: 'Date recorded in GPBC Finance Desk.', required: true },
      { fieldName: 'Difference', description: 'Discrepancy between ledger and bank amount (must be $0.00 to match).', required: true }
    ],
    recommendedWorkflow: [
      'Reconcile deposits first (matching offering batches against bank credits).',
      'Reconcile checks second (matching cleared checks against Check Details).',
      'Reconcile card and electronic disbursements third.',
      'Verify that starting bank balance + deposits - withdrawals = ending bank balance.'
    ],
    whatToReviewBeforeSaving: [
      'Never reconcile an item with an unexplained discrepancy.',
      'Ensure bank service fees or interest credits are recorded in the ledger first.'
    ],
    commonMistakes: [
      'CRITICAL: Assuming historical transactions are automatically reconciled because they are old. Historical transactions are NOT automatically reconciled simply because they are old!',
      'Ignoring small differences. Every entry should reconcile to preserve record integrity.'
    ],
    statusMeanings: [
      { status: 'Reconciled', badgeType: 'success', description: 'Formally verified against official bank statement.' },
      { status: 'Matched', badgeType: 'info', description: 'Candidate match found with equal date, amount, and payee.' },
      { status: 'Partially Matched', badgeType: 'warning', description: 'Amount matches but date or description differs slightly.' },
      { status: 'Needs Review', badgeType: 'error', description: 'Discrepancy detected that requires investigation.' },
      { status: 'Unmatched', badgeType: 'neutral', description: 'No matching bank statement row found.' }
    ],
    sections: [
      {
        id: 'reconciliation-definition',
        title: 'What Does "Reconciled" Truly Mean?',
        content: '**Reconciled** means a human accountant or authorized system has formally compared and validated the ledger entry against supporting financial evidence, such as official monthly bank statements and approved records, and verified that the transaction cleared for the exact specified amount.\n\nHistorical transactions are NOT automatically reconciled simply because they are old. Reconciled means the transaction has been formally compared/validated against supporting financial evidence such as bank records and approved records.'
      }
    ],
    relatedArticleIds: ['audit-center', 'monthly-close', 'documents']
  },

  // 12. Audit Center
  {
    id: 'audit-center',
    slug: 'audit-center',
    title: 'Audit Center & Audit Health Score',
    category: 'control-audit',
    route: '/audit',
    readTimeMinutes: 6,
    keywords: ['audit center', 'audit health score', 'rules', 'reviewed', 'cleared', 'deductions', 'checks'],
    summary: 'Deterministic engine evaluating missing receipts, over-allocations, and date anomalies with an explainable 0-100 score.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Helps identify missing receipts, over-allocations, or unlinked records before closing the month.',
    whenToUse: 'Run prior to month-end close and whenever reviewing data entry quality.',
    quickSteps: [
      'Open the Audit Center to view your current Audit Health Score.',
      'Inspect the Open Issues list sorted by Severity (Critical, High, Medium, Low).',
      'Click on any issue to view the problem details and suggested remedy.',
      'Attach missing receipts or adjust allocation amounts to resolve issues.',
      'Click "Run Audit Engine" to refresh and recalculate the score.'
    ],
    keyFields: [
      { fieldName: 'Audit Health Score', description: 'Deterministic metric: 100 minus capped severity deductions.', required: true },
      { fieldName: 'Severity', description: 'Critical (15 pts), High (8 pts), Medium (3 pts), Low (1 pt), Info (0 pts).', required: true },
      { fieldName: 'Status', description: 'Needs Receipt, Needs Explanation, Reviewed, Cleared, Reconciled.', required: true }
    ],
    recommendedWorkflow: [
      'Resolve Critical issues first (over-allocated purchases, missing critical receipts).',
      'Resolve High severity items (unmatched disbursements).',
      'Understand that marking an issue "Reviewed" acknowledges it, but does NOT restore points until the underlying condition is Cleared or Reconciled.'
    ],
    commonMistakes: [
      'Thinking marking an issue "Reviewed" makes the score deduction disappear. "Reviewed" means an editor looked at it, but until the receipt is attached or error fixed, the deduction remains active.',
      'Assuming the score is an arbitrary estimate. It is 100% mathematically deterministic.'
    ],
    statusMeanings: [
      { status: 'Cleared', badgeType: 'success', description: 'Condition resolved; points restored to Audit Health Score.' },
      { status: 'Reconciled', badgeType: 'success', description: 'Verified against external bank evidence; no point deduction.' },
      { status: 'Reviewed', badgeType: 'warning', description: 'Acknowledged by user, but deduction remains active until cured.' },
      { status: 'Needs Receipt', badgeType: 'error', description: 'Purchase lacks required receipt scan; active deduction.' },
      { status: 'Discrepancy', badgeType: 'error', description: 'Mathematical or categorization mismatch.' }
    ],
    sections: [
      {
        id: 'scoring-algorithm',
        title: 'The Deterministic Audit Scoring Algorithm',
        content: 'GPBC Finance Desk uses an explainable scoring model with published deductions and severity caps:\n\nAudit Health Score Calculation:\nAudit Health Score = max(0, 100 - sum(Capped Severity Deductions))\n\n- **Baseline**: 100 Points\n- **Critical Deductions**: 15 points per issue (Capped at 45 points max)\n- **High Deductions**: 8 points per issue (Capped at 32 points max)\n- **Medium Deductions**: 3 points per issue (Capped at 15 points max)\n- **Low Deductions**: 1 point per issue (Capped at 8 points max)\n- **Info**: 0 points\n\n**Important**: `Reviewed` issues remain in `unresolvedStatuses`. Points are restored when an issue status becomes `Cleared` or `Reconciled`.'
      }
    ],
    relatedArticleIds: ['monthly-close', 'reconciliation', 'reimbursements']
  },

  // 13. Monthly Close
  {
    id: 'monthly-close',
    slug: 'monthly-close',
    title: 'Monthly Close & Period Locking',
    category: 'control-audit',
    route: '/monthly-close',
    readTimeMinutes: 6,
    keywords: ['monthly close', 'period lock', 'close checklist', 'close summary', 'reopen', 'closed period', 'pre-close'],
    summary: 'The formal month-end procedure that locks financial records against accidental modification and establishes reporting snapshots.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Locks closed accounting periods to prevent accidental historical changes and creates a permanent snapshot for church leadership review.',
    whenToUse: 'Executed by the Primary Admin or Backup Admin after all income, expenses, reconciliations, and audit reviews for the month are complete.',
    quickSteps: [
      'Open Monthly Close and review the Automated Pre-Close Checklist.',
      'Verify: Income reviewed, Expenses reviewed, Evidence attached, Reimbursements checked, Reconciliation verified, Audit Score reviewed.',
      'Check the Monthly Summary totals (Total Income, Total Expenses, Net Position).',
      'Enter administrator confirmation initials or name.',
      'Click "Execute Official Month-End Close".',
      'The period status switches to CLOSED and financial records lock.'
    ],
    keyFields: [
      { fieldName: 'Period Key', description: 'The YYYY-MM period being closed (e.g. 2026-08).', required: true },
      { fieldName: 'Net Operating Position', description: 'Calculated operating surplus or deficit locked at month-end close.', required: true },
      { fieldName: 'Audit Health Score at Close', description: 'Snapshot of governance score at the moment of locking.', required: true },
      { fieldName: 'Closed By', description: 'Administrator email and name executing the close lock.', required: true }
    ],
    recommendedWorkflow: [
      'Complete workflow steps 1 through 8.',
      'Review pre-close checklist for any blocking warnings.',
      'Ensure unresolved critical audit issues are reviewed or resolved.',
      'Perform the close lock and generate the summary report package.'
    ],
    whatToReviewBeforeSaving: [
      'Confirm all contributions and card statements for the month have cleared.',
      'Once closed, regular editing is locked.'
    ],
    commonMistakes: [
      'Attempting to edit a closed transaction without an authorized reopening procedure.',
      'Leaving a month open indefinitely. Complete month-end review and close in a timely manner according to GPBC\'s approved finance process.'
    ],
    statusMeanings: [
      { status: 'Closed', badgeType: 'success', description: 'Accounting period locked; financial records cannot be modified.' },
      { status: 'Open', badgeType: 'info', description: 'Active accounting period; additions and edits permitted.' },
      { status: 'Reopened', badgeType: 'warning', description: 'Temporarily unlocked by Admin for documented corrections.' }
    ],
    sections: [
      {
        id: 'what-happens-when-closed',
        title: 'What Happens When a Month is Closed?',
        content: '1. **Period Lock**: The system will prevent new write, update, or delete operations with dates inside the closed period.\n2. **Historical Records Protected**: Reports reflect the locked accounting snapshot.\n3. **Reopening Procedure**: Only a Primary Admin or Backup Admin can reopen a period, and they must provide a documented business reason.\n4. **Late Evidence**: Late receipts can still be attached as traceable post-close additions without modifying the financial figures.'
      }
    ],
    relatedArticleIds: ['presbyter-reports', 'audit-center', 'dashboard']
  },

  // 14. Presbyter Reports
  {
    id: 'presbyter-reports',
    slug: 'presbyter-reports',
    title: 'Presbyter Reports & Executive Oversight',
    category: 'control-audit',
    route: '/presbyter-reports',
    readTimeMinutes: 5,
    keywords: ['presbyter reports', 'executive oversight', 'sanitized', 'privacy', 'donor protection', 'governance'],
    summary: 'Sanitized, high-level financial packages for the Church Presbyter, Pastor, and leadership that protect member privacy.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
    purpose: 'Delivers transparent financial oversight to church leadership while strictly guarding member giving confidentiality.',
    whenToUse: 'Used by the Presbyter during oversight reviews, and by church administrators to generate leadership reports.',
    quickSteps: [
      'Select the reporting period from the header or report dropdown.',
      'Review Executive KPI cards: Total Income, Total Expenses, Net Operating Position.',
      'Inspect the Sunday Offering aggregates and ministry expense distributions.',
      'Verify Audit Health and Month-End close information.',
      'Click "Print Report" or "Export PDF" to generate the report package.'
    ],
    keyFields: [
      { fieldName: 'Offering Aggregates', description: 'Total service giving without individual donor names.', required: true },
      { fieldName: 'Operating Expenses', description: 'Category-level expense totals without detailed vendor card specifics.', required: true },
      { fieldName: 'Net Operating Position', description: 'Period surplus or deficit.', required: true }
    ],
    recommendedWorkflow: [
      'Primary Admin closes the month.',
      'Presbyter opens /presbyter-reports to inspect the summary package.',
      'Presbyter reviews trends with the Pastor and church leadership.'
    ],
    whatToReviewBeforeSaving: [
      'This is an executive read-only view; no transactional edits are made here.'
    ],
    commonMistakes: [
      'Expecting to see individual church member names or envelope numbers. Donor records are restricted to protect member privacy.'
    ],
    statusMeanings: [
      { status: 'Closed (Period Locked)', badgeType: 'success', description: 'Period reviewed and locked by Primary or Backup Admin; internal close confirmation recorded.' },
      { status: 'In Progress (Open)', badgeType: 'warning', description: 'Preliminary figures; period has not yet been formally closed.' }
    ],
    sections: [
      {
        id: 'donor-privacy-protection',
        title: 'Sanitized Reporting & Member Privacy',
        content: 'Presbyter Read-Only provides sanitized financial oversight. GPBC Finance Desk aggregates giving into service totals and fund categories. **Individual donor identities, bank account details, personal reimbursement claims, and payment method specifics are restricted** from executive reporting to protect member privacy.'
      }
    ],
    relatedArticleIds: ['monthly-close', 'dashboard']
  },

  // 15. Settings & Governance
  {
    id: 'settings',
    slug: 'settings',
    title: 'System Settings & Governance',
    category: 'system',
    route: '/settings',
    readTimeMinutes: 4,
    keywords: ['settings', 'governance', 'environment', 'sandbox', 'production', 'readiness'],
    summary: 'View workspace environment mode, readiness audit status, and write guard safeguards.',
    allowedRoles: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer'],
    purpose: 'Provides administrators and finance users with transparency over system environment mode and data safeguards.',
    whenToUse: 'Check when verifying whether you are working in live church operations or a testing environment.',
    quickSteps: [
      'View current workspace indicator: SANDBOX or PRODUCTION.',
      'Confirm whether financial editing safeguards are active.',
      'Inspect readiness status indicators for connected workspace tabs.'
    ],
    keyFields: [
      { fieldName: 'Environment Mode', description: 'PRODUCTION (live church operations) or SANDBOX (testing/training).', required: true },
      { fieldName: 'Financial Editing Status', description: 'Indicates whether write operations are active or guarded.', required: true }
    ],
    commonMistakes: [
      'Attempting to edit underlying records directly outside the application. Always use the application interface.'
    ],
    sections: [
      {
        id: 'environment-and-guards',
        title: 'Environment Modes & Financial Safeguards',
        content: '**PRODUCTION** means you are viewing the church\'s live finance workspace. Enter information carefully and confirm the selected period.\n\n**SANDBOX** is a separate testing workspace for training and evaluation.\n\nFinancial editing may be disabled during a controlled maintenance or release period. If a normally available action is disabled, contact the Primary Admin.'
      }
    ],
    relatedArticleIds: ['dashboard', 'monthly-close']
  },

  // 16. User Roles & Access
  {
    id: 'user-roles',
    slug: 'user-roles',
    title: 'User Roles & Permission Boundaries',
    category: 'system',
    readTimeMinutes: 5,
    keywords: ['roles', 'permissions', 'access control', 'primary admin', 'backup admin', 'finance editor', 'viewer', 'presbyter'],
    summary: 'Comprehensive overview of role-based access, viewing levels, and functional boundaries across the application.',
    allowedRoles: 'All',
    purpose: 'Explains who has permission to view, edit, upload, or close each module within GPBC Finance Desk.',
    whenToUse: 'Reference when onboarding new church volunteers, reviewing access permissions, or checking page access.',
    quickSteps: [
      'Check your current role displayed in the top header user card.',
      'Review the permitted modules for your role in the Role Training section.',
      'Contact the Primary Admin if your ministry responsibilities require updated access.'
    ],
    commonMistakes: [
      'Sharing accounts between volunteers. Each user should sign in with their own authorized account.'
    ],
    sections: [
      {
        id: 'role-hierarchy',
        title: 'Church Access Structure',
        content: '- **Primary Admin**: Full operations, period close/reopen, settings, user governance.\n- **Backup Admin**: Full operations, period close/reopen support, continuity.\n- **Finance Editor**: Day-to-day data entry (income, expenses, receipts, reconciliations, audit checks); cannot close or reopen months.\n- **Viewer**: Read-only operational visibility across modules.\n- **Presbyter Read-Only**: Sanitized executive oversight reports; isolated from operational entry.'
      }
    ],
    relatedArticleIds: ['settings', 'dashboard']
  }
];
