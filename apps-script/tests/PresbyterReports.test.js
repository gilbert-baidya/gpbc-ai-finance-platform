import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  aggregatePresbyterReportData,
  generatePresbyterReport,
  getPresbyterReports,
  sendPresbyterReport
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
    it('allows Presbyter Read-Only to view reports and generate presbyter summaries', () => {
      expect(authorizeAction('getPresbyterReports', 'Presbyter Read-Only').authorized).toBe(true);
      expect(authorizeAction('generatePresbyterReport', 'Presbyter Read-Only').authorized).toBe(true);
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
});
