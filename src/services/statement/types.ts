/**
 * GPBC Finance Desk — Zero-Input Smart Statement Import Types
 */

export type Direction = 'INCOME' | 'EXPENSE' | 'UNKNOWN';

export type PaymentChannel =
  | 'ZELLE'
  | 'ACH'
  | 'CHECK'
  | 'WIRE'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'TRANSFER'
  | 'CASH'
  | 'BANK_FEE'
  | 'UNKNOWN';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type ClassificationStatus = 'AUTOMATIC' | 'NEEDS_REVIEW' | 'CONFIRMED';

export type RoutingDestination =
  | 'RECONCILIATION_STAGING'
  | 'AUTO_MATCHED_TRANSACTION'
  | 'POST_CLOSE_REVIEW'
  | 'DUPLICATE_REVIEW'
  | 'REFUND_REVIEW';

export interface ConfidenceBreakdown {
  merchantConfidence: ConfidenceLevel;
  amountConfidence: ConfidenceLevel;
  dateConfidence: ConfidenceLevel;
  categoryConfidence: ConfidenceLevel;
  purposeConfidence: ConfidenceLevel;
  overallConfidence: ConfidenceLevel;
}

export interface ExtractedStatementLine {
  tempId: string;
  transactionDate: string | null; // YYYY-MM-DD or null if missing in source
  postedDate?: string | null;
  amount: number; // positive number
  direction: Direction;
  rawDescription: string;
  cleanDescription: string;
  merchantOrPayee: string;
  referenceNumber?: string;
  checkNumber?: string;
  paymentChannel: PaymentChannel;
  bankAccountHint?: string;
  sourceDocumentId?: string;
  sourcePage?: number;
  sourceRegion?: string;
}

export interface ClassificationResult {
  category: string;
  classificationSource: 'VENDOR_LEARNING' | 'HISTORICAL_MATCH' | 'RULE_MAPPING' | 'AI_CLASSIFICATION' | 'FALLBACK';
  classificationRuleId?: string;
  classificationStatus: ClassificationStatus;
  confidence: ConfidenceLevel;
}

export interface PurposeResult {
  purpose: string;
  purposeConfidence: ConfidenceLevel;
  isInferred: boolean;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType?: 'EXACT' | 'PROBABLE' | 'NONE';
  duplicateReason?: string;
  matchedEntityId?: string;
}

export interface RefundCheckResult {
  isRefundOrReversal: boolean;
  refundType?: 'REFUND' | 'CREDIT' | 'REVERSAL' | 'CHARGEBACK' | 'NONE';
  suggestedOriginalDirection: Direction;
}

export interface ProcessedStatementLine extends ExtractedStatementLine {
  // Classification
  category: string;
  classificationSource: string;
  classificationRuleId?: string;
  classificationStatus: ClassificationStatus;
  // Purpose
  businessPurpose: string;
  purposeConfidence: ConfidenceLevel;
  // Confidence
  confidence: ConfidenceBreakdown;
  // Routing
  routingDestination: RoutingDestination;
  routingReason?: string;
  matchedTransactionId?: string;
  autoReconciled: boolean;
  // Flags
  isRefund: boolean;
  isDuplicate: boolean;
  duplicateType?: 'EXACT' | 'PROBABLE' | 'NONE';
  isClosedPeriod: boolean;
  postCloseReason?: string;
  // Metadata & Audit
  auditMetadata: {
    processedAt: string;
    modelOrEngine: string;
    ruleIdApplied?: string;
    rawText: string;
  };
}

export interface VendorLearningRule {
  merchantPattern: string;
  canonicalMerchant: string;
  defaultCategory: string;
  defaultPurpose: string;
  confidence: ConfidenceLevel;
  source: 'MANUAL_APPROVAL' | 'HISTORICAL_IMPORT' | 'SYSTEM_DEFAULT';
  lastUsedAt: string;
}

export interface StatementImportSummary {
  totalExtracted: number;
  automaticallyClassified: number;
  matchedToExisting: number;
  needsReview: number;
  duplicatesSkipped: number;
  totalIncomeAmount: number;
  totalExpenseAmount: number;
  sourceDocumentId?: string;
  sourceFileName?: string;
  processedAt: string;
}

export interface StatementImportResult {
  success: boolean;
  summary: StatementImportSummary;
  lines: ProcessedStatementLine[];
  documentId?: string;
  warnings?: string[];
  error?: string;
}
