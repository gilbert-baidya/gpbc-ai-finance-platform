import { GlossaryTerm } from './types';

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: 'Recognized Income',
    category: 'Accounting',
    definition: 'Revenues earned or donations received by the church that are formally acknowledged in the ledger for a specific calendar accounting period.',
    churchContext: 'Sunday tithes, special offerings, missions contributions, and designated gifts deposited for church ministry.',
    formulaOrRule: 'Total Recognized Income = General Tithes + Designated Gifts + Investment/Other Income.'
  },
  {
    term: 'Recognized Expense',
    category: 'Accounting',
    definition: 'An operational cost or financial obligation incurred by the church during a specific period for goods or services.',
    churchContext: 'When a ministry buys curriculum or pays an electric bill, the expense is recognized on the date the purchase occurred, regardless of when reimbursement or payment is issued.',
    formulaOrRule: 'The original purchase is the recognized expense; reimbursement payout checks are liability settlements, not second expenses.'
  },
  {
    term: 'Cash Inflow',
    category: 'Accounting',
    definition: 'Actual physical currency or electronic funds deposited into the church checking or savings bank accounts.',
    churchContext: 'Cash and checks deposited after Sunday worship, or electronic funds deposited via Stripe/Zelle.',
    relatedTerms: ['Recognized Income', 'Reconciliation']
  },
  {
    term: 'Cash Outflow',
    category: 'Accounting',
    definition: 'Actual cash, debit card charges, ACH transfers, or cleared checks exiting the church bank account.',
    churchContext: 'Bank withdrawals, cleared checks to vendors, or electronic debit charges.',
    relatedTerms: ['Recognized Expense', 'Settlement']
  },
  {
    term: 'Settlement',
    category: 'Accounting',
    definition: 'The satisfaction or discharge of an existing financial liability or obligation.',
    churchContext: 'Paying back a church member who purchased fellowship groceries out-of-pocket settles the church\'s liability to that member.',
    formulaOrRule: 'Settlement clears liability; it does not alter total recognized operating expenses.'
  },
  {
    term: 'Reimbursement',
    category: 'Accounting',
    definition: 'Repaying a church member or employee for authorized ministry expenses they incurred using personal funds.',
    churchContext: 'Pastor or ministry lead buys supplies with personal card; church reimburses them.',
    relatedTerms: ['Purchase Recognition', 'Reimbursement Allocation', 'Remaining Balance']
  },
  {
    term: 'Reimbursement Allocation',
    category: 'Accounting',
    definition: 'An individual payment or credit transaction logged against a specific personal purchase to reduce the church\'s liability.',
    churchContext: 'Logging a $50 check disbursement against a $100 purchase reduces the church\'s debt to $50.',
    formulaOrRule: 'Allocated Amount adds to Net Covered.'
  },
  {
    term: 'Purchase Recognition',
    category: 'Accounting',
    definition: 'The principle that an expense must be booked at the time goods or services are purchased on behalf of the church.',
    churchContext: 'Ensures church spending is captured in the correct month even if the reimbursement request is submitted weeks later.'
  },
  {
    term: 'Refund Credit Adjustment',
    category: 'Accounting',
    definition: 'An adjustment applied to a purchase when goods are returned for merchant credit or a card refund is issued.',
    churchContext: 'Returning unused building supplies to Home Depot reduces what the church owes the purchaser.',
    formulaOrRule: 'Net Covered increases by the refund amount, reducing Remaining Balance without creating false income.'
  },
  {
    term: 'Personally Absorbed Amount',
    category: 'Accounting',
    definition: 'The portion of an out-of-pocket church expense that the purchaser voluntarily donates and declines to be reimbursed for.',
    churchContext: 'A member spends $60 on flowers and tells the church, "Reimburse me $40, and I will donate $20."',
    formulaOrRule: 'Net Covered includes Personally Absorbed Amount; Remaining Balance reduces accordingly.'
  },
  {
    term: 'Remaining Balance',
    category: 'Accounting',
    definition: 'The outstanding amount the church still owes to an individual for an out-of-pocket purchase.',
    churchContext: 'Tells the church treasurer exactly how much is owed to clear the reimbursement liability.',
    formulaOrRule: 'remainingBalance = max(0, purchaseAmount - netCovered)'
  },
  {
    term: 'Designated Donation',
    category: 'Accounting',
    definition: 'A gift explicitly given for a stated or designated purpose, capital campaign, or special project.',
    churchContext: 'Gifts designated for "Sanctuary Sound System" or "Youth Mission Trip" cannot be used for general church utility bills.',
    formulaOrRule: 'Must be segregated from General Operating Tithes.'
  },
  {
    term: 'Designated Funding Position',
    category: 'Accounting',
    definition: 'The net cash position of a designated fund, calculated as cumulative designated gifts received minus verified project expenditures.',
    churchContext: 'Shows whether a capital project currently has surplus designated funds on hand or has incurred spending ahead of gifts.',
    formulaOrRule: 'Funding Position = Designated Donations Received - Supported Spending.'
  },
  {
    term: 'Capital Project',
    category: 'Platform',
    definition: 'A tracked church initiative, facility renovation, or major equipment acquisition with designated funds and an optional approved budget.',
    churchContext: 'Electrical Panel Upgrade, Fellowship Hall Roof Replacement, Van Acquisition Campaign.',
    relatedTerms: ['Designated Donation', 'Designated Funding Position']
  },
  {
    term: 'Receipt',
    category: 'Audit',
    definition: 'An itemized proof-of-purchase document issued by a merchant or vendor displaying date, vendor name, item list, and total amount.',
    churchContext: 'Store cash register receipt, digital Amazon invoice, or contractor billing receipt required for every church expense.',
    relatedTerms: ['Supporting Document', 'Document Center']
  },
  {
    term: 'Supporting Document',
    category: 'Audit',
    definition: 'Any formal record that substantiates a financial transaction, including invoices, contracts, bank statements, and count sheets.',
    churchContext: 'Physical paper or digital PDF uploaded to Document Center to prove transaction validity.',
    relatedTerms: ['Receipt', 'Verified']
  },
  {
    term: 'Reconciliation',
    category: 'Accounting',
    definition: 'The formal verification process of matching internal ledger records against third-party bank and credit card statements.',
    churchContext: 'Confirming that every Sunday deposit and every church check cleared on the monthly Chase or Wells Fargo statement.',
    formulaOrRule: 'Historical transactions are NOT automatically reconciled simply because they are old. Explicit verification is mandatory.'
  },
  {
    term: 'Needs Review',
    category: 'Audit',
    definition: 'A transaction, document, or reconciliation pair that contains a date discrepancy, amount mismatch, or missing data requiring human inspection.',
    churchContext: 'Flagged when a bank transaction amount differs by even $0.01 from the ledger entry.'
  },
  {
    term: 'Verified',
    category: 'Audit',
    definition: 'A status indicating that a transaction or document has been inspected and confirmed by an authorized finance administrator.',
    churchContext: 'Signifies that evidence is authentic, legible, and accurately categorized.'
  },
  {
    term: 'Reviewed',
    category: 'Audit',
    definition: 'An audit issue status indicating an editor has acknowledged the issue, though the underlying condition may not yet be cured.',
    churchContext: 'Marking a missing receipt "Reviewed" records that staff are looking for it, but score deductions remain until Cleared.',
    formulaOrRule: 'Reviewed issues remain in unresolvedStatuses and continue to deduct points from the Audit Health Score.'
  },
  {
    term: 'Cleared',
    category: 'Audit',
    definition: 'An audit issue status indicating the underlying error or missing documentation has been fully corrected.',
    churchContext: 'Attaching the missing receipt transforms the issue into "Cleared" and restores deducted points to the Audit Health Score.',
    formulaOrRule: 'Cleared issues restore points to the Audit Health Score.'
  },
  {
    term: 'Audit Issue',
    category: 'Audit',
    definition: 'A specific risk, anomaly, or missing compliance requirement detected by the deterministic audit engine.',
    churchContext: 'Missing receipt, over-allocated reimbursement, unreconciled transaction, or duplicate entry.',
    relatedTerms: ['Audit Health Score', 'Cleared', 'Reviewed']
  },
  {
    term: 'Audit Health Score',
    category: 'Audit',
    definition: 'A deterministic 0-100 score mathematically derived by subtracting capped severity deductions from a 100-point baseline.',
    churchContext: 'Gives church leadership and presbyters an objective, verifiable measure of ledger hygiene and audit readiness.',
    formulaOrRule: 'Audit Health Score = max(0, 100 - sum(Capped Severity Deductions))'
  },
  {
    term: 'Monthly Close',
    category: 'Governance',
    definition: 'The formal month-end procedure where accounting figures are reviewed, confirmed, and locked against future modification.',
    churchContext: 'Prevents retroactive changes to historical books and finalizes monthly reports for church leadership.',
    relatedTerms: ['Closed Period', 'Reopen']
  },
  {
    term: 'Closed Period',
    category: 'Governance',
    definition: 'A calendar accounting month that has been formally locked, rejecting new writes, edits, or deletions.',
    churchContext: 'Ensures that once January 2026 is closed, no one can accidentally change January numbers in May.',
    formulaOrRule: 'System period guard rejects unauthorized financial write attempts.'
  },
  {
    term: 'Reopen',
    category: 'Governance',
    definition: 'An administrative procedure restricted to Primary or Backup Admins to temporarily unlock a closed period for documented corrections.',
    churchContext: 'Requires a mandatory written business reason logged in Monthly_Close_History before edits can occur.',
    formulaOrRule: 'Only authorized Admins may execute; creates permanent audit log.'
  },
  {
    term: 'Presbyter Report',
    category: 'Governance',
    definition: 'A sanitized executive financial report package designed for church presbyters and oversight committees.',
    churchContext: 'Displays aggregate giving, ministry category spending, net position, and audit health without exposing confidential donor names.',
    formulaOrRule: 'Excludes individual donor identities, personal check numbers, and raw payment methods.'
  },
  {
    term: 'Financial Editing Safeguard',
    category: 'Platform',
    definition: 'A protection that may temporarily prevent financial changes during maintenance, controlled release, or other protected periods.',
    churchContext: 'If an action that is normally available becomes disabled, contact the Primary Admin rather than attempting to edit records outside GPBC Finance Desk.'
  }
];
