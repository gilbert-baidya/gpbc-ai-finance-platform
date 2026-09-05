export type TransactionType =
  | 'Offering'
  | 'General Donation'
  | 'Special Donation'
  | 'Designated Donation'
  | 'Capital Project Donation'
  | 'Expense'
  | 'Reimbursement Payment'
  | 'Personal Card Purchase'
  | 'Refund'
  | 'Card Credit'
  | 'Transfer'
  | 'Check Payment'
  | 'Other Income';

export type TransactionDirection = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type PaymentMethod =
  | 'Cash'
  | 'Check'
  | 'Zelle'
  | 'Credit Card'
  | 'Debit Card'
  | 'ACH / Bank Transfer'
  | 'Other';

export type ReconciliationStatus =
  | 'Unreconciled'
  | 'Pending Match'
  | 'Reconciled'
  | 'Discrepancy';

export type CanonicalReconciliationStatus =
  | 'UNMATCHED'
  | 'MATCHED'
  | 'PARTIALLY_MATCHED'
  | 'NEEDS_REVIEW'
  | 'RECONCILED';

export interface ReconciliationRecord {
  reconciliationId: string;
  transactionId: string;
  transactionDate: string;
  transactionType: string;
  direction: TransactionDirection;
  payeeOrPayer: string;
  description: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  checkNumber?: string;
  expectedAmount: number;
  reconciledAmount: number;
  differenceAmount: number;
  differenceFormatted: string;
  reconciliationStatus: CanonicalReconciliationStatus;
  satisfiesRules: boolean;
  blockingReasons: string[];
  warnings: string[];
  evidenceCount: number;
  evidenceStatus: string;
  notes?: string;
  reviewReason?: string;
  reconciledBy?: string;
  reconciledAt?: string;
}

export interface ReconciliationSummary {
  totalRecords: number;
  reconciledCount: number;
  matchedCount: number;
  unmatchedCount: number;
  partiallyMatchedCount: number;
  needsReviewCount: number;
  differenceAmount: number;
  differenceFormatted: string;
}

export type ReceiptStatus =
  | 'Attached'
  | 'Needs Receipt'
  | 'Exempt'
  | 'Pending Match';

export interface BaseTransaction {
  transactionId: string;
  date: string;
  type: TransactionType;
  direction: TransactionDirection;
  accountingImpact?: 'INCOME' | 'EXPENSE' | 'SETTLEMENT' | 'TRANSFER';
  amount: number;
  payeeOrPayer: string;
  description: string;
  category?: string;
  fund?: string;
  paymentMethod: PaymentMethod;
  checkNumber?: string;
  personalPurchase?: boolean;
  reconciliationStatus: ReconciliationStatus;
  receiptStatus: ReceiptStatus;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface ReimbursementRecord {
  reimbursementId: string;
  date: string;
  claimantName: string;
  claimantEmail?: string;
  totalPurchaseAmount: number;
  totalReimbursedAmount: number;
  personallyAbsorbedAmount: number;
  status: 'Pending' | 'Approved' | 'Partially Reimbursed' | 'Fully Reimbursed' | 'Rejected';
  paymentMethod?: PaymentMethod;
  checkNumber?: string;
  notes?: string;
}

export interface ReimbursementAllocation {
  allocationId?: string;
  reimbursementId?: string;
  purchaseTransactionId: string;
  purchaseAmount?: number;
  allocatedAmount: number;
  personallyAbsorbedAmount: number;
  refundCreditAdjustment?: number;
  refundTransactionId?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
}

export interface ReceiptRecord {
  receiptId: string;
  date: string;
  merchant: string;
  amount: number;
  documentType: string;
  driveFileId?: string;
  driveUrl?: string;
  source: 'Manual Upload' | 'Gmail Intake' | 'Direct Attachment';
  matchedTransactionId?: string;
  matchStatus: 'Unmatched' | 'Pending Review' | 'Matched';
  notes?: string;
}

export interface CapitalProjectRecord {
  projectId: string;
  name: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  approvedBudget: number;
  designatedDonationsReceived: number;
  otherFunding: number;
  expensesPaid: number;
  pendingCommitments: number;
  remainingDesignatedBalance: number;
  notes?: string;
}
