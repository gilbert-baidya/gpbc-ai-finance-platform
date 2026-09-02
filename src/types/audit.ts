/*************************************************
 * GPBC Finance Desk — audit.ts
 * Phase 3 Audit Center & Reconciliation Type Definitions
 *************************************************/

export type AuditSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type AuditResolutionState =
  | 'Needs Receipt'
  | 'Needs Explanation'
  | 'Pending Match'
  | 'Partial Reimbursement'
  | 'Missing Documentation'
  | 'Possible Duplicate'
  | 'Discrepancy'
  | 'Reviewed'
  | 'Cleared'
  | 'Reconciled';

export type AuditEntityType =
  | 'Transaction'
  | 'Expense'
  | 'Income'
  | 'Reimbursement'
  | 'Receipt'
  | 'Check'
  | 'Fund'
  | 'Member'
  | 'BankStatement'
  | 'CardStatement';

export interface AuditRuleDefinition {
  ruleId: string;
  name: string;
  category: 'Receipts' | 'Disbursements' | 'Reimbursements' | 'Reconciliation' | 'Compliance';
  severity: AuditSeverity;
  description: string;
  conditionDescription: string;
  recommendedAction: string;
}

export interface AuditIssue {
  auditIssueId: string;
  issueFingerprint?: string;
  ruleId: string;
  severity: AuditSeverity;
  status: AuditResolutionState;
  entityType: AuditEntityType;
  entityId: string;
  title: string;
  description: string;
  amount?: number;
  recommendedAction?: string;
  detectedAt: string;
  lastDetectedAt?: string;
  detectedBy: string;
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenCount?: number;
  evidenceUrl?: string;
}

export interface AuditHealthScoreBreakdown {
  score: number; // 0 to 100
  scoreTier: string;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalUnresolvedIssues: number;
  deductions: {
    criticalDeduction: number;
    highDeduction: number;
    mediumDeduction: number;
    lowDeduction: number;
    totalDeduction: number;
  };
  topReasons: string[];
  lastCalculatedAt: string;
}

export interface BankStatementLine {
  statementLineId: string;
  statementDate: string;
  description: string;
  amount: number;
  direction?: 'INCOME' | 'EXPENSE';
  statementType: string;
  referenceNumber?: string;
  matchStatus: 'Unmatched' | 'Matched' | 'Discrepancy';
  matchedTransactionId?: string;
  differenceAmount?: number;
  sourceFileName?: string;
  importedAt?: string;
  importedBy?: string;
}

export interface ReconciliationCandidate {
  statementLine: BankStatementLine;
  suggestedTransaction?: {
    transactionId: string;
    transactionDate: string;
    amount: number;
    payeeOrPayer: string;
    description: string;
    direction: string;
    checkNumber?: string;
  } | null;
  matchType: 'Exact Match' | 'Possible Match' | 'Discrepancy' | 'Unmatched';
  score?: number;
  dateDifferenceDays?: number | null;
  amountDifference?: number | null;
  merchantSimilarity?: boolean;
  referenceMatched?: boolean;
  candidateTransactionId?: string | null;
}

export interface StageStatementResult {
  success: boolean;
  count: number;
  insertedCount: number;
  duplicateCount: number;
  totalSubmitted: number;
}
