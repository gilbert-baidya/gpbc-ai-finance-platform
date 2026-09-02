/*************************************************
 * GPBC Finance Desk — auditApi.ts
 * Typed Client API Layer for Phase 3 Audit & Reconciliation Actions
 *************************************************/

import { gasFetch } from './gasFetch';
import type {
  AuditIssue,
  AuditHealthScoreBreakdown,
  ReconciliationCandidate,
  StageStatementResult
} from '../types/audit';

export interface AuditFilterParams extends Record<string, unknown> {
  severity?: string;
  status?: string;
  ruleId?: string;
  search?: string;
}

export interface RunAuditResult {
  success: boolean;
  healthScore: AuditHealthScoreBreakdown;
  issues: AuditIssue[];
  detectedCount: number;
}

export interface AuditIssuesResult {
  success: boolean;
  count: number;
  issues: AuditIssue[];
}

export interface AuditSummaryResult {
  success: boolean;
  healthScore: AuditHealthScoreBreakdown;
}

export async function logAuditEvent(event: Record<string, unknown>): Promise<void> {
  try {
    await gasFetch('logAuditEvent', {
      ...event,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

export const auditApi = {
  /**
   * Triggers server-side evaluation of all 11 audit rules, updates Audit_Issues tab idempotently
   */
  async runAudit(): Promise<RunAuditResult> {
    return gasFetch<RunAuditResult>('runAudit', {});
  },

  /**
   * Fetches persisted audit issues with optional filters
   */
  async getAuditIssues(filters?: AuditFilterParams): Promise<AuditIssuesResult> {
    return gasFetch<AuditIssuesResult>('getAuditIssues', filters || {});
  },

  /**
   * Retrieves live Audit Health Score breakdown
   */
  async getAuditSummary(): Promise<AuditSummaryResult> {
    return gasFetch<AuditSummaryResult>('getAuditSummary', {});
  },

  /**
   * Resolves an audit issue (Reviewed or Cleared) with explanation notes and evidence
   */
  async resolveAuditIssue(params: {
    auditIssueId: string;
    status: string;
    resolutionNotes?: string;
    evidenceUrl?: string;
  }): Promise<{ success: boolean; auditIssueId: string; status: string }> {
    return gasFetch('resolveAuditIssue', params);
  },

  /**
   * Reopens an audit issue back to active status
   */
  async reopenAuditIssue(params: {
    auditIssueId: string;
    targetStatus?: string;
    reopenReason?: string;
  }): Promise<{ success: boolean; auditIssueId: string; status: string }> {
    return gasFetch('reopenAuditIssue', params);
  },

  /**
   * Assigns an audit issue to a team member
   */
  async assignAuditIssue(params: {
    auditIssueId: string;
    assignedTo: string;
  }): Promise<{ success: boolean; auditIssueId: string; assignedTo: string }> {
    return gasFetch('assignAuditIssue', params);
  },

  /**
   * Stages normalized CSV statement lines in Reconciliation_Staging
   */
  async stageBankStatementLines(params: {
    statementLines: Array<{
      date: string;
      description: string;
      amount: number;
      direction?: 'INCOME' | 'EXPENSE';
      statementType?: string;
      referenceNumber?: string;
    }>;
    sourceFileName?: string;
  }): Promise<StageStatementResult> {
    return gasFetch<StageStatementResult>('stageBankStatementLines', params);
  },

  /**
   * Fetches candidate matches between staged statement lines and Transactions
   */
  async getReconciliationCandidates(): Promise<{
    success: boolean;
    count: number;
    candidates: ReconciliationCandidate[];
  }> {
    return gasFetch('getReconciliationCandidates', {});
  },

  /**
   * Confirms a manual reconciliation match between statement line and transaction
   */
  async matchReconciliationLine(params: {
    statementLineId: string;
    transactionId: string;
  }): Promise<{ success: boolean; statementLineId: string; transactionId: string }> {
    return gasFetch('matchReconciliationLine', params);
  },

  logAuditEvent
};

export default auditApi;
