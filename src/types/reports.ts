/*************************************************
 * GPBC Finance Desk — reports.ts
 * Type definitions for Presbyter Financial Oversight Reports
 *************************************************/

export interface ChurchInfo {
  name: string;
  ein: string;
  address: string;
  email: string;
  website: string;
  phone: string;
  textLine: string;
  pastor: string;
}

export interface PresbyterReportData {
  churchInfo: ChurchInfo;
  periodKey: string;
  startDate: string;
  endDate: string;
  generatedAt: string;
  executiveSummary: {
    totalIncome: number;
    totalRecognizedExpenses: number;
    netPosition: number;
    settlementPayouts: number;
    auditHealthScore: number;
    scoreTier: string;
    closeStatus: string;
  };
  closeInfo?: {
    status: string;
    closedBy?: string;
    closedAt?: string;
    reopenedBy?: string;
    reopenedAt?: string;
    reopenReason?: string;
  } | null;
  incomeBreakdown: Record<string, number>;
  expenseBreakdown: Record<string, number>;
  designatedFunds: Array<{
    fundId: string;
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
  }>;
  capitalProjects: Array<{
    projectId: string;
    projectName: string;
    status: string;
    approvedBudget: number;
    designatedDonationsReceived: number;
    otherFunding: number;
    expensesPaid: number;
    pendingCommitments: number;
    remainingDesignatedBalance: number;
  }>;
  reimbursementsOverview: {
    count: number;
    totalPaid: number;
    totalPending: number;
  };
  auditAppendix?: Array<{
    severity: string;
    ruleId: string;
    title: string;
    description: string;
    amount?: number;
    status: string;
    recommendedAction?: string;
  }>;
}

export interface PresbyterReportRecord {
  reportId: string;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  reportType: 'MONTHLY_SUMMARY' | 'CUSTOM_RANGE' | 'DETAILED';
  detailLevel: 'Summary' | 'Detailed';
  includeAuditAppendix: boolean;
  totalIncome: number;
  totalExpenses: number;
  netPosition: number;
  auditHealthScore: number;
  driveFileId?: string;
  driveUrl?: string;
  generatedBy: string;
  generatedAt: string;
  emailSentAt?: string;
  emailRecipient?: string;
  notes?: string;
}
