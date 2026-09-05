import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  aggregatePresbyterReportData,
  generatePresbyterReport,
  getPresbyterReports,
  sendPresbyterReport,
  getPresbyterReport
} = require('../PresbyterReports.gs');

const {
  authorizeAction
} = require('../Auth.gs');

describe('Phase 4: Presbyter Financial Oversight Reports Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Presbyter Report Data Aggregation & Privacy Invariants', () => {
    it('accurately aggregates income, expenses, and excludes settlement payouts from operating expenses', () => {
      // Mock global dataset helpers
      global.getTransactions = vi.fn(() => ({
        transactions: [
          { transactionId: 'TXN-1', transactionDate: '2026-08-05', direction: 'INCOME', amount: 5000, transactionType: 'Sunday Offering', category: 'Tithes & Offerings', accountingImpact: 'INCOME' },
          { transactionId: 'TXN-2', transactionDate: '2026-08-10', direction: 'EXPENSE', amount: 1200, transactionType: 'Expense', category: 'Ministry Operations', accountingImpact: 'EXPENSE' },
          { transactionId: 'TXN-3', transactionDate: '2026-08-15', direction: 'EXPENSE', amount: 300, transactionType: 'Reimbursement', category: 'Reimbursement', accountingImpact: 'SETTLEMENT' }
        ]
      }));

      global.getDesignatedFundsSummary = vi.fn(() => ({
        funds: [
          { fundId: 'Building Fund', totalIncome: 1000, totalExpenses: 200, netBalance: 800 }
        ]
      }));

      global.getCapitalProjects = vi.fn(() => ({
        projects: [
          { projectId: 'PRJ-1', projectName: 'Sanctuary Renovation', status: 'Active', approvedBudget: 25000, designatedDonationsReceived: 10000, otherFunding: 0, expensesPaid: 4000, pendingCommitments: 0, remainingDesignatedBalance: 6000 }
        ]
      }));

      global.getReimbursements = vi.fn(() => ({
        reimbursements: [
          { reimbursementId: 'RMB-1', reimbursementDate: '2026-08-15', claimantName: 'Gilbert Baidya', totalReimbursedAmount: 300, remainingReimbursable: 0 }
        ]
      }));

      global.getAuditSummary = vi.fn(() => ({
        healthScore: { score: 95, scoreTier: 'Excellent / Audit Ready' }
      }));

      global.getMonthlyClose = vi.fn(() => ({
        closeRecord: { status: 'Closed', closedBy: 'admin@gracepraise.church', closedAt: '2026-09-01T00:00:00Z' }
      }));

      const report = aggregatePresbyterReportData({ periodKey: '2026-08' });

      // Income = 5000
      expect(report.executiveSummary.totalIncome).toBe(5000);
      // Recognized Expenses = 1200 (Settlement of 300 is EXCLUDED from operating expenses!)
      expect(report.executiveSummary.totalRecognizedExpenses).toBe(1200);
      // Settlement payouts captured distinctly = 300
      expect(report.executiveSummary.settlementPayouts).toBe(300);
      // Net Position = 5000 - 1200 = 3800
      expect(report.executiveSummary.netPosition).toBe(3800);
      // Audit Health Score
      expect(report.executiveSummary.auditHealthScore).toBe(95);
      // Close Status
      expect(report.executiveSummary.closeStatus).toBe('Closed');

      // Designated Fund Summary
      expect(report.designatedFunds).toHaveLength(1);
      expect(report.designatedFunds[0].netBalance).toBe(800);

      // Capital Projects Summary
      expect(report.capitalProjects).toHaveLength(1);
      expect(report.capitalProjects[0].remainingDesignatedBalance).toBe(6000);

      // Privacy: Ensure no token, secret, or raw payment details are exposed
      const jsonStr = JSON.stringify(report);
      expect(jsonStr).not.toContain('idToken');
      expect(jsonStr).not.toContain('accountNumber');
      expect(jsonStr).not.toContain('routingNumber');
    });

    it('handles audit appendix inclusion when requested', () => {
      global.getTransactions = vi.fn(() => ({ transactions: [] }));
      global.getDesignatedFundsSummary = vi.fn(() => ({ funds: [] }));
      global.getCapitalProjects = vi.fn(() => ({ projects: [] }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getAuditSummary = vi.fn(() => ({ healthScore: { score: 90, scoreTier: 'Excellent' } }));
      global.getMonthlyClose = vi.fn(() => ({ closeRecord: null }));
      global.getAuditIssues = vi.fn(() => ({
        issues: [
          { severity: 'HIGH', ruleId: 'RULE-RCP-001', title: 'Missing receipt', description: 'No receipt', amount: 50, status: 'Needs Receipt', recommendedAction: 'Upload receipt' }
        ]
      }));

      const reportWithAppendix = aggregatePresbyterReportData({ periodKey: '2026-08', includeAuditAppendix: true });
      expect(reportWithAppendix.auditAppendix).toHaveLength(1);
      expect(reportWithAppendix.auditAppendix[0].ruleId).toBe('RULE-RCP-001');

      const reportWithoutAppendix = aggregatePresbyterReportData({ periodKey: '2026-08', includeAuditAppendix: false });
      expect(reportWithoutAppendix.auditAppendix).toHaveLength(0);
    });
  });

  describe('2. Presbyter Role Access & Report Persistence Contract', () => {
    it('allows Presbyter Read-Only to view reports and denies persistent generation', () => {
      expect(authorizeAction('getPresbyterReports', 'Presbyter Read-Only').authorized).toBe(true);
      expect(authorizeAction('generatePresbyterReport', 'Presbyter Read-Only').authorized).toBe(false);
    });

    it('blocks Presbyter Read-Only from direct financial writes or period closures', () => {
      expect(authorizeAction('closeMonthlyPeriod', 'Presbyter Read-Only').authorized).toBe(false);
      expect(authorizeAction('addTransaction', 'Presbyter Read-Only').authorized).toBe(false);
      expect(authorizeAction('addReimbursement', 'Presbyter Read-Only').authorized).toBe(false);
    });

    it('persists report metadata record into Presbyter_Reports tab', () => {
      const appendedRows = [];
      const mockDB = {
        getId: () => 'sandbox_sheet_id',
        getSheetByName: vi.fn((tabName) => {
          if (tabName === 'Presbyter_Reports') {
            return {
              getLastRow: () => 1,
              appendRow: (row) => appendedRows.push(row)
            };
          }
          return { getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) };
        })
      };
      global.getDB = vi.fn(() => mockDB);

      global.getTransactions = vi.fn(() => ({ transactions: [] }));
      global.getDesignatedFundsSummary = vi.fn(() => ({ funds: [] }));
      global.getCapitalProjects = vi.fn(() => ({ projects: [] }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getAuditSummary = vi.fn(() => ({ healthScore: { score: 100, scoreTier: 'Excellent' } }));
      global.getMonthlyClose = vi.fn(() => ({ closeRecord: null }));

      const res = generatePresbyterReport({
        periodKey: '2026-08',
        detailLevel: 'Summary',
        includeAuditAppendix: false
      }, 'admin@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.reportId).toBeDefined();
      expect(appendedRows).toHaveLength(1);
      expect(appendedRows[0][1]).toBe('2026-08');
    });
  });

  describe('3. getPresbyterReport DTO & Authoritative Snapshot Contract', () => {
    it('returns frozen month-close snapshot values for closed period September 2026', () => {
      global.getMonthlyClose = vi.fn(() => ({
        closeRecord: {
          closeId: 'CLS-202609-907',
          periodKey: '2026-09',
          status: 'Closed',
          totalIncome: 10.00,
          totalRecognizedExpenses: 0.00,
          netPosition: 10.00,
          auditHealthScore: 100,
          closedBy: 'gilbert.baidya@gmail.com',
          closedAt: '2026-09-04T15:47:24.831Z'
        }
      }));

      global.getDocuments = vi.fn(() => ({
        documents: [
          {
            documentId: 'DOC-202609-498560',
            driveFileId: '1KuqwKTzQ2nFKEFCttO4mHz6N_PG5ua0U',
            documentType: 'Finance Report',
            relatedEntityType: 'MONTHLY_CLOSE',
            relatedEntityId: 'CLS-202609-907',
            storedFileName: 'GPBC_Month_End_Report_Package_2026-09_FINAL.json',
            status: 'VERIFIED'
          }
        ]
      }));

      global.getTransactions = vi.fn(() => ({
        transactions: [
          { transactionId: 'TXN-20260902-17336', transactionDate: '2026-09-02', direction: 'INCOME', amount: 10.00, transactionType: 'Sunday Offering', payeeOrPayer: 'John Doe', accountingImpact: 'INCOME' }
        ]
      }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getCheckDetails = vi.fn(() => ({ checks: [] }));
      global.getCapitalProjects = vi.fn(() => ({ projects: [] }));
      global.getReconciliationRecords = vi.fn(() => ({ records: [{ reconciliationId: 'REC-1', reconciliationStatus: 'MATCHED' }] }));

      const dto = getPresbyterReport({ periodKey: '2026-09' }, 'presbyter@gracepraise.church');

      expect(dto.success).toBe(true);
      expect(dto.periodKey).toBe('2026-09');
      expect(dto.status).toBe('Closed');
      expect(dto.isClosed).toBe(true);
      expect(dto.badgeText).toBe('FINAL / CLOSED');
      expect(dto.financialSummary.totalIncome).toBe(10.00);
      expect(dto.financialSummary.totalRecognizedExpenses).toBe(0.00);
      expect(dto.financialSummary.netPosition).toBe(10.00);
      expect(dto.financialSummary.auditHealthScore).toBe(100);
      expect(dto.reconciliationSummary.reconciledCount).toBe(1);
      expect(dto.reconciliationSummary.differenceAmount).toBe(0);

      // Close certification
      expect(dto.closeCertification).toBeDefined();
      expect(dto.closeCertification.closeId).toBe('CLS-202609-907');
      expect(dto.closeCertification.closedBy).toBe('gilbert.baidya@gmail.com');
      expect(dto.closeCertification.finalReportArchived).toBe(true);

      // Final report artifact: for Presbyter Read-Only, driveFileId is stripped & canViewRawArchive is false
      expect(dto.finalReportArtifact).toBeDefined();
      expect(dto.finalReportArtifact.canViewRawArchive).toBe(false);
      expect(dto.finalReportArtifact.driveFileId).toBeNull();
      expect(dto.finalReportArtifact.status).toBe('VERIFIED');

      // Privacy protection: ensure no donor personal names in income summary or Sunday Offering
      expect(dto.incomeSummary.privacyNote).toBeDefined();
      const dtoStr = JSON.stringify(dto);
      expect(dtoStr).not.toContain('John Doe');
      expect(dtoStr).not.toContain('TEST Sandbox Donor');
      expect(dtoStr).not.toContain('auditFindings');
    });

    it('sanitizes audit summary to use Monthly_Close values (100 score, 0 critical, 0 high) and excludes auditFindings array', () => {
      global.getMonthlyClose = vi.fn(() => ({
        closeRecord: {
          closeId: 'CLS-202609-907',
          periodKey: '2026-09',
          status: 'Closed',
          totalIncome: 10.00,
          totalRecognizedExpenses: 0.00,
          netPosition: 10.00,
          auditHealthScore: 100,
          openCriticalIssues: 0,
          openHighIssues: 0,
          closedBy: 'gilbert.baidya@gmail.com',
          closedAt: '2026-09-04T15:47:24.831Z'
        }
      }));

      global.getDocuments = vi.fn(() => ({ documents: [] }));
      global.getTransactions = vi.fn(() => ({ transactions: [] }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getCheckDetails = vi.fn(() => ({ checks: [] }));
      global.getCapitalProjects = vi.fn(() => ({ projects: [] }));

      const dto = getPresbyterReport({ periodKey: '2026-09' }, 'presbyter@gracepraise.church');

      expect(dto.auditSummary.healthScore).toBe(100);
      expect(dto.auditSummary.criticalIssuesCount).toBe(0);
      expect(dto.auditSummary.highPriorityIssuesCount).toBe(0);
      expect(dto.auditFindings).toBeUndefined();
      expect(dto.auditFindingsCount).toBeUndefined();
    });

    it('grants canViewRawArchive to Primary Admin while restricting Presbyter Read-Only', () => {
      global.getMonthlyClose = vi.fn(() => ({
        closeRecord: { closeId: 'CLS-202609-907', periodKey: '2026-09', status: 'Closed', totalIncome: 10, totalRecognizedExpenses: 0, netPosition: 10, auditHealthScore: 100 }
      }));

      global.getApprovedUser = vi.fn((email) => {
        if (email === 'pastor.gilbert@gracepraise.church') return { email, role: 'Primary Admin' };
        return { email, role: 'Presbyter Read-Only' };
      });

      global.getDocuments = vi.fn(() => ({
        documents: [{ documentId: 'DOC-1', driveFileId: '1Kuqw', documentType: 'Finance Report', relatedEntityId: 'CLS-202609-907', status: 'VERIFIED' }]
      }));

      global.getTransactions = vi.fn(() => ({ transactions: [] }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getCheckDetails = vi.fn(() => ({ checks: [] }));
      global.getCapitalProjects = vi.fn(() => ({ projects: [] }));

      const adminDto = getPresbyterReport({ periodKey: '2026-09' }, 'pastor.gilbert@gracepraise.church');
      expect(adminDto.finalReportArtifact.canViewRawArchive).toBe(true);
      expect(adminDto.finalReportArtifact.driveFileId).toBe('1Kuqw');

      const presbyterDto = getPresbyterReport({ periodKey: '2026-09' }, 'presbyter@gracepraise.church');
      expect(presbyterDto.finalReportArtifact.canViewRawArchive).toBe(false);
      expect(presbyterDto.finalReportArtifact.driveFileId).toBeNull();
    });

    it('strips internal migration metadata from capital projects', () => {
      global.getMonthlyClose = vi.fn(() => ({ closeRecord: { status: 'Closed', totalIncome: 10, totalRecognizedExpenses: 0, netPosition: 10, auditHealthScore: 100 } }));
      global.getDocuments = vi.fn(() => ({ documents: [] }));
      global.getTransactions = vi.fn(() => ({ transactions: [] }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getCheckDetails = vi.fn(() => ({ checks: [] }));
      global.getCapitalProjects = vi.fn(() => ({
        projects: [
          {
            projectId: 'PRJ-LEGACY',
            projectName: 'Electrical Panel Upgrade',
            status: 'Active',
            approvedBudget: 5000,
            expensesPaid: 1000,
            remainingDesignatedBalance: 4000,
            sourceWorkbookId: 'INTERNAL_SHEET_123',
            migrationRunId: 'MIG-20260901',
            notes: 'Legacy migration note'
          }
        ]
      }));

      const dto = getPresbyterReport({ periodKey: '2026-09' }, 'presbyter@gracepraise.church');
      expect(dto.capitalProjectSummary.projects).toHaveLength(1);
      const prj = dto.capitalProjectSummary.projects[0];
      expect(prj.projectName).toBe('Electrical Panel Upgrade');
      expect(prj.approvedBudget).toBe(5000);
      expect(prj.expensesPaid).toBe(1000);
      expect(prj.budgetRemaining).toBe(4000);
      expect(prj.remainingBalance).toBe(4000);

      const prjJson = JSON.stringify(prj);
      expect(prjJson).not.toContain('sourceWorkbookId');
      expect(prjJson).not.toContain('migrationRunId');
    });

    it('calculates capital project budget remaining cleanly as approvedBudget minus expensesPaid', () => {
      global.getMonthlyClose = vi.fn(() => ({ closeRecord: null }));
      global.getDocuments = vi.fn(() => ({ documents: [] }));
      global.getTransactions = vi.fn(() => ({ transactions: [] }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getCheckDetails = vi.fn(() => ({ checks: [] }));
      global.getCapitalProjects = vi.fn(() => ({
        projects: [
          {
            projectId: 'PRJ-ELEC',
            projectName: 'Electrical Panel Upgrade',
            status: 'Active',
            approvedBudget: 5200,
            expensesPaid: 2000,
            remainingDesignatedBalance: -1800
          }
        ]
      }));

      const dto = getPresbyterReport({ periodKey: '2026-09' }, 'presbyter@gracepraise.church');
      expect(dto.capitalProjectSummary.projects[0].approvedBudget).toBe(5200);
      expect(dto.capitalProjectSummary.projects[0].expensesPaid).toBe(2000);
      expect(dto.capitalProjectSummary.projects[0].budgetRemaining).toBe(3200);
    });

    it('correctly normalizes native Date objects in Monthly_Close for YTD summary calculation', () => {
      global.getMonthlyClose = vi.fn(() => ({ closeRecord: null }));
      global.getDocuments = vi.fn(() => ({ documents: [] }));
      global.getTransactions = vi.fn(() => ({ transactions: [] }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getCheckDetails = vi.fn(() => ({ checks: [] }));
      global.getCapitalProjects = vi.fn(() => ({ projects: [] }));
      global.getPeriodKey = vi.fn((val) => {
        if (val instanceof Date || (typeof val === 'string' && val.includes('2026'))) return '2026-09';
        return String(val || '');
      });

      const mockCloseSheet = {
        getLastRow: () => 2,
        getDataRange: () => ({
          getValues: () => [
            ['periodKey', 'status', 'totalIncome', 'totalRecognizedExpenses', 'netPosition'],
            [new Date('2026-09-01T00:00:00Z'), 'Closed', 10.00, 0.00, 10.00]
          ]
        })
      };

      global.getDB = vi.fn(() => ({
        getSheetByName: (name) => (name === 'Monthly_Close' ? mockCloseSheet : null)
      }));

      const dto = getPresbyterReport({ periodKey: '2026-09' }, 'presbyter@gracepraise.church');
      expect(dto.ytdSummary.closedMonthsCount).toBe(1);
      expect(dto.ytdSummary.ytdIncome).toBe(10.00);
      expect(dto.ytdSummary.ytdRecognizedExpenses).toBe(0.00);
      expect(dto.ytdSummary.ytdNetPosition).toBe(10.00);
    });

    it('returns preliminary preview state for open periods', () => {
      global.getMonthlyClose = vi.fn(() => ({ closeRecord: null }));
      global.getDocuments = vi.fn(() => ({ documents: [] }));
      global.getTransactions = vi.fn(() => ({ transactions: [] }));
      global.getReimbursements = vi.fn(() => ({ reimbursements: [] }));
      global.getCheckDetails = vi.fn(() => ({ checks: [] }));
      global.getCapitalProjects = vi.fn(() => ({ projects: [] }));
      global.getReconciliationRecords = vi.fn(() => ({ records: [] }));
      global.getAuditSummary = vi.fn(() => ({ healthScore: { score: 90 } }));

      const openReport = getPresbyterReport({ periodKey: '2026-10' }, 'presbyter@gracepraise.church');

      expect(openReport.status).toBe('Open');
      expect(openReport.isClosed).toBe(false);
      expect(openReport.badgeText).toBe('PRELIMINARY / NOT CLOSED');
      expect(openReport.closeCertification).toBeNull();
    });

    it('strictly enforces role authorization for getPresbyterReport and prohibits mutations', () => {
      expect(authorizeAction('getPresbyterReport', 'Presbyter Read-Only').authorized).toBe(true);
      expect(authorizeAction('getPresbyterReport', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('getPresbyterReport', 'Viewer').authorized).toBe(true);

      // Mutation prohibitions for Presbyter Read-Only
      expect(authorizeAction('addTransaction', 'Presbyter Read-Only').authorized).toBe(false);
      expect(authorizeAction('updateTransaction', 'Presbyter Read-Only').authorized).toBe(false);
      expect(authorizeAction('reconcileTransactionRecord', 'Presbyter Read-Only').authorized).toBe(false);
      expect(authorizeAction('closeMonthlyPeriod', 'Presbyter Read-Only').authorized).toBe(false);
      expect(authorizeAction('reopenMonthlyPeriod', 'Presbyter Read-Only').authorized).toBe(false);
    });
  });
});
