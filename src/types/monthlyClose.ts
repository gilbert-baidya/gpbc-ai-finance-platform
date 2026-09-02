/*************************************************
 * GPBC Finance Desk — monthlyClose.ts
 * Type definitions for Monthly Close & Period Locking
 *************************************************/

export type PeriodCloseStatus = 'Open' | 'Ready' | 'Closed' | 'Reopened';

export interface MonthlyCloseRecord {
  closeId: string;
  periodKey: string; // YYYY-MM
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  status: PeriodCloseStatus;
  checklistVersion?: string;
  incomeReviewed: boolean;
  expensesReviewed: boolean;
  receiptsReviewed: boolean;
  checksReviewed: boolean;
  reimbursementsReviewed: boolean;
  bankReconciled: boolean;
  cardsReconciled: boolean;
  designatedFundsReviewed: boolean;
  auditIssuesReviewed: boolean;
  reportGenerated: boolean;
  openCriticalIssues: number;
  openHighIssues: number;
  auditHealthScore: number;
  totalIncome: number;
  totalRecognizedExpenses: number;
  netPosition: number;
  closedBy?: string;
  closedAt?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  reopenReason?: string;
  lastAmendedBy?: string;
  lastAmendedAt?: string;
  amendmentReason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyCloseReadiness {
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  currentStatus: PeriodCloseStatus;
  readyToClose: boolean;
  blockingIssues: string[];
  warnings: string[];
  financialSummary: {
    totalIncome: number;
    totalRecognizedExpenses: number;
    netPosition: number;
    auditHealthScore: number;
    scoreTier: string;
  };
  counts: {
    transactionsCount: number;
    reimbursementsCount: number;
    receiptsCount: number;
    checksCount: number;
    openCriticalIssues: number;
    openHighIssues: number;
    unreconciledStmtLines: number;
    discrepancyStmtLines: number;
  };
}

export interface MonthlyCloseHistoryEvent {
  historyId: string;
  closeId: string;
  periodKey: string;
  actionType: 'CLOSE' | 'REOPEN' | 'AMEND';
  status: PeriodCloseStatus;
  auditHealthScore: number;
  totalIncome: number;
  totalRecognizedExpenses: number;
  netPosition: number;
  openCriticalIssues: number;
  openHighIssues: number;
  performedBy: string;
  performedAt: string;
  actionReason: string;
  notes?: string;
}
