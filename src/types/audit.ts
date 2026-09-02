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
  ruleId: string;
  severity: AuditSeverity;
  status: AuditResolutionState;
  entityType: AuditEntityType;
  entityId: string;
  title: string;
  description: string;
  amount?: number;
  detectedAt: string;
  detectedBy: string;
  assignedTo?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  evidenceUrl?: string;
}

export interface AuditHealthScoreBreakdown {
  score: number; // 0 to 100
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
  };
  lastCalculatedAt: string;
}

export interface BankStatementLine {
  statementLineId: string;
  statementDate: string;
  description: string;
  amount: number;
  statementType: 'Bank' | 'Capital One' | 'Credit Card';
  referenceNumber?: string;
  matchStatus: 'Unmatched' | 'Matched' | 'Discrepancy';
  matchedTransactionId?: string;
}
