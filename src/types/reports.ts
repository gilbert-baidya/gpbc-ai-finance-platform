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

export interface PresbyterReportDTO {
  success: boolean;
  periodKey: string;
  periodLabel: string;
  status: 'Closed' | 'Open' | string;
  isClosed: boolean;
  badgeText: string;
  badgeVariant: 'success' | 'warning' | string;
  churchInfo: ChurchInfo;
  financialSummary: {
    totalIncome: number;
    totalRecognizedExpenses: number;
    netPosition: number;
    auditHealthScore: number;
    auditHealthTier: string;
    reconciliationStatus: string;
    periodStatus: string;
  };
  incomeSummary: {
    totalIncome: number;
    categories: Array<{ category: string; amount: number; percentage: number }>;
    privacyNote?: string;
  };
  expenseSummary: {
    totalRecognizedExpenses: number;
    categories: Array<{ category: string; amount: number; percentage: number }>;
  };
  sundayOfferingSummary: {
    count: number;
    totalSundayOffering: number;
    averageSundayOffering: number;
    offeringDates: string[];
  };
  reimbursementSummary: {
    count: number;
    totalPersonalPurchases: number;
    totalAllocated: number;
    personallyAbsorbed: number;
    refundAdjustments: number;
    remainingLiability: number;
    note: string;
  };
  checkSummary: {
    count: number;
    checksIssued: number;
    totalCheckAmount: number;
    outstandingChecks: number;
    clearedChecks: number;
  };
  capitalProjectSummary: {
    projects: Array<{
      projectId?: string;
      projectName: string;
      status: string;
      approvedBudget: number | string;
      expensesPaid: number;
      budgetRemaining?: number;
      remainingBalance: number;
    }>;
  };
  reconciliationSummary: {
    reconciledCount: number;
    unreconciledCount: number;
    differenceAmount: number;
    status: string;
  };
  auditSummary: {
    healthScore: number;
    criticalIssuesCount: number;
    highPriorityIssuesCount: number;
  };
  closeCertification?: {
    isCertified: boolean;
    periodKey: string;
    status: string;
    closedBy: string;
    closedAt: string;
    closeId: string;
    finalReportArchived: boolean;
  } | null;
  finalReportArtifact?: {
    available: boolean;
    storedFileName: string;
    status: string;
    documentId?: string | null;
    driveFileId?: string | null;
    canViewRawArchive?: boolean;
    note?: string;
  } | null;
  ytdSummary: {
    year: number;
    closedMonthsCount: number;
    ytdIncome: number;
    ytdRecognizedExpenses: number;
    ytdNetPosition: number;
  };
}
