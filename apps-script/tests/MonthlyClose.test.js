import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  calculatePurchaseBalance,
  getPeriodKey,
  getPeriodBounds,
  isDateInClosedPeriod,
  assertPeriodWritable
} = require('../FinanceMath.gs');

const {
  getMonthlyClose,
  getMonthlyCloseReadiness,
  closeMonthlyPeriod,
  reopenMonthlyPeriod,
  getMonthlyCloseHistory
} = require('../MonthlyClose.gs');

const {
  authorizeAction
} = require('../Auth.gs');

const {
  addTransaction,
  updateTransaction,
  addExpense
} = require('../Transactions.gs');

const {
  addReimbursement,
  addReimbursementAllocation
} = require('../Reimbursements.gs');

const {
  matchReconciliationLine
} = require('../Audit.gs');

describe('Phase 4: Comprehensive Monthly Close & Period Locking Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Canonical Pure Formulas & Period Boundaries', () => {
    it('canonical calculatePurchaseBalance is pure and handles settlements/refunds correctly', () => {
      const balance = calculatePurchaseBalance(100, [
        { allocatedAmount: 60, personallyAbsorbedAmount: 20, refundCreditAdjustment: 20 }
      ]);
      expect(balance.purchaseAmount).toBe(100);
      expect(balance.netCovered).toBe(100);
      expect(balance.remainingBalance).toBe(0);
      expect(balance.isOverAllocated).toBe(false);
    });

    it('formats date strings to canonical YYYY-MM period keys', () => {
      expect(getPeriodKey('2026-08-15')).toBe('2026-08');
      expect(getPeriodKey('2026-08-01T12:00:00Z')).toBe('2026-08');
      expect(getPeriodKey('2026-08')).toBe('2026-08');
    });

    it('rejects invalid period keys', () => {
      expect(() => getPeriodBounds('invalid-period')).toThrow(/Invalid period key format/);
      expect(() => getPeriodBounds('2026-13')).toThrow(/Invalid month in period key/);
    });

    it('calculates exact start and end dates for period keys', () => {
      const augBounds = getPeriodBounds('2026-08');
      expect(augBounds.startDate).toBe('2026-08-01');
      expect(augBounds.endDate).toBe('2026-08-31');

      const febBounds = getPeriodBounds('2026-02');
      expect(febBounds.startDate).toBe('2026-02-01');
      expect(febBounds.endDate).toBe('2026-02-28');
    });
  });

  describe('2. Server-Side Period Locking across Financial Write Paths', () => {
    const createMockClosedDB = () => ({
      getId: () => 'sandbox_sheet_id',
      getSheetByName: vi.fn((tabName) => {
        if (tabName === 'Monthly_Close') {
          return {
            getLastRow: () => 2,
            getDataRange: () => ({
              getValues: () => [
                ['closeId', 'periodKey', 'status'],
                ['CLS-202608', '2026-08', 'Closed']
              ]
            })
          };
        }
        if (tabName === 'Transactions') {
          return {
            getLastRow: () => 2,
            getDataRange: () => ({
              getValues: () => [
                ['transactionId', 'transactionDate', 'amount', 'direction', 'reconciliationStatus'],
                ['TXN-101', '2026-08-10', 150, 'EXPENSE', 'Unreconciled']
              ]
            })
          };
        }
        if (tabName === 'Reimbursements') {
          return {
            getLastRow: () => 2,
            getDataRange: () => ({
              getValues: () => [
                ['reimbursementId', 'reimbursementDate', 'claimantName', 'totalReimbursedAmount'],
                ['RMB-202608-1', '2026-08-12', 'Gilbert', 150]
              ]
            })
          };
        }
        if (tabName === 'Reconciliation_Staging') {
          return {
            getLastRow: () => 2,
            getDataRange: () => ({
              getValues: () => [
                ['statementLineId', 'statementDate', 'description', 'amount', 'direction', 'matchStatus', 'matchedTransactionId'],
                ['STMT-202608-1', '2026-08-10', 'Office Depot', 150, 'EXPENSE', 'Unmatched', '']
              ]
            })
          };
        }
        return {
          getLastRow: () => 1,
          getDataRange: () => ({ getValues: () => [[]] })
        };
      })
    });

    it('closed period blocks addTransaction write', () => {
      const mockDB = createMockClosedDB();
      global.getDB = vi.fn(() => mockDB);

      expect(() => {
        addTransaction({
          transactionDate: '2026-08-15',
          amount: 100,
          direction: 'EXPENSE',
          payeeOrPayer: 'Vendor'
        }, 'editor@gracepraise.church');
      }).toThrow(/Period 2026-08 is CLOSED. Financial write \(addTransaction\) is locked/);
    });

    it('closed period blocks addExpense write', () => {
      const mockDB = createMockClosedDB();
      global.getDB = vi.fn(() => mockDB);

      expect(() => {
        addExpense({
          date: '2026-08-15',
          amount: 75,
          payee: 'Office Depot',
          category: 'Office'
        }, 'editor@gracepraise.church');
      }).toThrow(/Period 2026-08 is CLOSED. Financial write \(addExpense\) is locked/);
    });

    it('closed period blocks updateTransaction write', () => {
      const mockDB = createMockClosedDB();
      global.getDB = vi.fn(() => mockDB);

      expect(() => {
        updateTransaction({
          transactionId: 'TXN-101',
          amount: 200
        }, 'editor@gracepraise.church');
      }).toThrow(/Period 2026-08 is CLOSED/);
    });

    it('closed period blocks addReimbursement write', () => {
      const mockDB = createMockClosedDB();
      global.getDB = vi.fn(() => mockDB);

      expect(() => {
        addReimbursement({
          reimbursementDate: '2026-08-15',
          claimantName: 'Gilbert Baidya',
          totalReimbursedAmount: 150
        }, 'editor@gracepraise.church');
      }).toThrow(/Period 2026-08 is CLOSED. Financial write \(addReimbursement\) is locked/);
    });

    it('closed period blocks addReimbursementAllocation write', () => {
      const mockDB = createMockClosedDB();
      global.getDB = vi.fn(() => mockDB);

      expect(() => {
        addReimbursementAllocation({
          reimbursementId: 'RMB-202608-1',
          purchaseTransactionId: 'TXN-101',
          allocatedAmount: 150
        }, 'editor@gracepraise.church');
      }).toThrow(/Period 2026-08 is CLOSED. Financial write \(addReimbursementAllocation\) is locked/);
    });

    it('closed period blocks matchReconciliationLine write', () => {
      const mockDB = createMockClosedDB();
      global.getDB = vi.fn(() => mockDB);

      expect(() => {
        matchReconciliationLine({
          statementLineId: 'STMT-202608-1',
          transactionId: 'TXN-101'
        }, 'editor@gracepraise.church');
      }).toThrow(/Period 2026-08 is CLOSED/);
    });

    it('open period allows authorized financial writes', () => {
      const mockOpenDB = {
        getId: () => 'sandbox_sheet_id',
        getSheetByName: vi.fn((tabName) => {
          if (tabName === 'Monthly_Close') {
            return {
              getLastRow: () => 1,
              getDataRange: () => ({ getValues: () => [['periodKey', 'status']] })
            };
          }
          return {
            getLastRow: () => 1,
            appendRow: vi.fn(),
            getDataRange: () => ({ getValues: () => [[]] })
          };
        })
      };
      global.getDB = vi.fn(() => mockOpenDB);
      global.Utilities = {
        formatDate: (d, tz, fmt) => {
          if (fmt === 'yyyy-MM') {
            const dateObj = new Date(d);
            const y = dateObj.getUTCFullYear();
            const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
          }
          return '20260815';
        }
      };

      const res = addTransaction({
        transactionDate: '2026-08-15',
        amount: 50,
        direction: 'INCOME',
        payeeOrPayer: 'Member'
      }, 'editor@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.transactionId).toBeDefined();
    });
  });

  describe('3. Role Permissions for Monthly Close', () => {
    it('allows Primary Admin and Backup Admin to close and reopen periods', () => {
      expect(authorizeAction('closeMonthlyPeriod', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('closeMonthlyPeriod', 'Backup Admin').authorized).toBe(true);
      expect(authorizeAction('reopenMonthlyPeriod', 'Primary Admin').authorized).toBe(true);
      expect(authorizeAction('reopenMonthlyPeriod', 'Backup Admin').authorized).toBe(true);
    });

    it('blocks Finance Editor, Viewer, and Presbyter from closing or reopening periods', () => {
      expect(authorizeAction('closeMonthlyPeriod', 'Finance Editor').authorized).toBe(false);
      expect(authorizeAction('closeMonthlyPeriod', 'Viewer').authorized).toBe(false);
      expect(authorizeAction('closeMonthlyPeriod', 'Presbyter Read-Only').authorized).toBe(false);

      expect(authorizeAction('reopenMonthlyPeriod', 'Finance Editor').authorized).toBe(false);
      expect(authorizeAction('reopenMonthlyPeriod', 'Viewer').authorized).toBe(false);
    });

    it('allows operational roles to read monthly close status and denies Presbyter Read-Only', () => {
      expect(authorizeAction('getMonthlyClose', 'Viewer').authorized).toBe(true);
      expect(authorizeAction('getMonthlyClose', 'Presbyter Read-Only').authorized).toBe(false);
      expect(authorizeAction('getMonthlyCloseReadiness', 'Finance Editor').authorized).toBe(true);
      expect(authorizeAction('getMonthlyCloseHistory', 'Viewer').authorized).toBe(true);
    });
  });

  describe('4. MATCHED vs RECONCILED Close Readiness Invariant (Section 4 & 7)', () => {
    it('blocks month close when transactions are MATCHED but NOT fully RECONCILED', () => {
      global.getTransactions = () => ({
        success: true,
        transactions: [
          { transactionId: 'TXN-1', transactionDate: '2026-09-02', amount: 10, direction: 'INCOME', reconciliationStatus: 'Matched' }
        ]
      });

      global.getReconciliationRecords = () => ({
        success: true,
        summary: { totalRecords: 1, matchedCount: 1, reconciledCount: 0, unmatchedCount: 0 },
        records: [
          { transactionId: 'TXN-1', reconciliationStatus: 'MATCHED', differenceAmount: 0, evidenceStatus: 'Receipt Exempt' }
        ]
      });

      global.getDocuments = () => ({ success: true, documents: [] });
      global.getDesignatedFundsSummary = () => ({ funds: [] });
      global.getAuditIssues = () => ({ issues: [] });
      global.getMonthlyClose = () => ({ close: null });

      const mockDb = {
        getSheetByName: () => ({
          getLastRow: () => 1,
          getDataRange: () => ({ getValues: () => [[]] })
        })
      };
      global.getDB = () => mockDb;

      const readiness = getMonthlyCloseReadiness({ periodKey: '2026-09' });
      expect(readiness.readyToClose).toBe(false);
      expect(readiness.blockingIssues).toContain('1 of 1 transaction(s) remain unreconciled in period 2026-09');
    });

    it('permits month close when transactions are fully RECONCILED and all other rules pass', () => {
      global.getTransactions = () => ({
        success: true,
        transactions: [
          { transactionId: 'TXN-1', transactionDate: '2026-09-02', amount: 10, direction: 'INCOME', reconciliationStatus: 'Reconciled' }
        ]
      });

      global.getReconciliationRecords = () => ({
        success: true,
        summary: { totalRecords: 1, matchedCount: 0, reconciledCount: 1, unmatchedCount: 0 },
        records: [
          { transactionId: 'TXN-1', reconciliationStatus: 'RECONCILED', differenceAmount: 0, evidenceStatus: 'Receipt Exempt' }
        ]
      });

      global.getDocuments = () => ({ success: true, documents: [] });
      global.getDesignatedFundsSummary = () => ({ funds: [] });
      global.getAuditIssues = () => ({ issues: [] });
      global.getMonthlyClose = () => ({ close: null });

      const mockDb = {
        getSheetByName: () => ({
          getLastRow: () => 1,
          getDataRange: () => ({ getValues: () => [[]] })
        })
      };
      global.getDB = () => mockDb;

      const readiness = getMonthlyCloseReadiness({ periodKey: '2026-09' });
      expect(readiness.readyToClose).toBe(true);
      expect(readiness.blockingIssues).toHaveLength(0);
    });
  });

  describe('5. Period-Scoped Audit Issues & Truthful Report Preparation Suite (Section 12)', () => {
    it('excludes August transaction audit issues detected on Sept 2 from September Close Readiness (A, C)', () => {
      global.getTransactions = () => ({
        success: true,
        transactions: [
          { transactionId: 'TXN-LEGACY-2026-JUL-AUG-V1-1', transactionDate: '2026-08-15' },
          { transactionId: 'TXN-20260902-17336', transactionDate: '2026-09-02', amount: 10, direction: 'INCOME', reconciliationStatus: 'Reconciled' }
        ]
      });

      global.getDB = () => ({
        getSheetByName: (name) => {
          if (name === 'Audit_Issues') {
            const headers = ['auditIssueId', 'entityType', 'entityId', 'severity', 'status', 'detectedAt', 'amount'];
            const rows = [['AUD-LEGACY-1', 'Transaction', 'TXN-LEGACY-2026-JUL-AUG-V1-1', 'HIGH', 'Needs Receipt', '2026-09-02T10:00:00.000Z', 400]];
            return { getLastRow: () => 2, getDataRange: () => ({ getValues: () => [headers, ...rows] }) };
          }
          return { getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) };
        }
      });

      const audit = require('../Audit.gs');
      const filtered = audit.getAuditIssues({ periodKey: '2026-09' });
      expect(filtered.issues.map(i => i.auditIssueId)).not.toContain('AUD-LEGACY-1');
    });

    it('includes September transaction audit issue in September readiness (B)', () => {
      global.getTransactions = () => ({
        success: true,
        transactions: [
          { transactionId: 'TXN-20260902-17336', transactionDate: '2026-09-02', amount: 10, direction: 'INCOME', reconciliationStatus: 'Reconciled' }
        ]
      });

      global.getDB = () => ({
        getSheetByName: (name) => {
          if (name === 'Audit_Issues') {
            const headers = ['auditIssueId', 'entityType', 'entityId', 'severity', 'status', 'detectedAt', 'amount'];
            const rows = [['AUD-SEPT-1', 'Transaction', 'TXN-20260902-17336', 'CRITICAL', 'Needs Receipt', '2026-09-02T10:00:00.000Z', 10]];
            return { getLastRow: () => 2, getDataRange: () => ({ getValues: () => [headers, ...rows] }) };
          }
          return { getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) };
        }
      });

      const audit = require('../Audit.gs');
      const res = audit.getAuditIssues({ periodKey: '2026-09' });
      expect(res.issues.map(i => i.auditIssueId)).toContain('AUD-SEPT-1');
    });

    it('blocks close conservatively when period audit data retrieval fails (D)', () => {
      global.getTransactions = () => ({ success: true, transactions: [] });
      global.getReconciliationRecords = () => ({ success: true, records: [], summary: {} });
      global.getAuditIssues = () => ({ success: false, error: 'Storage error' });
      global.getDB = () => ({ getSheetByName: () => ({ getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) }) });

      const readiness = getMonthlyCloseReadiness({ periodKey: '2026-09' });
      expect(readiness.readyToClose).toBe(false);
      expect(readiness.blockingIssues).toContain('Audit issue store/data is unavailable for period 2026-09');
    });

    it('returns reportPackagePrepared = false when no report snapshot exists for period (E, G)', () => {
      global.getTransactions = () => ({ success: true, transactions: [] });
      global.getReconciliationRecords = () => ({ success: true, records: [], summary: {} });
      global.getAuditIssues = () => ({ success: true, issues: [] });
      global.getDB = () => ({ getSheetByName: () => ({ getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) }) });

      const readiness = getMonthlyCloseReadiness({ periodKey: '2026-09' });
      expect(readiness.reportPackagePrepared).toBe(false);
    });

    it('returns reportPackagePrepared = true when real report snapshot exists (F)', () => {
      global.getTransactions = () => ({ success: true, transactions: [] });
      global.getReconciliationRecords = () => ({ success: true, records: [], summary: {} });
      global.getAuditIssues = () => ({ success: true, issues: [] });
      global.getDB = () => ({
        getSheetByName: (name) => {
          if (name === 'Monthly_Close') {
            const headers = ['periodKey', 'status', 'reportGenerated', 'reportArtifactId'];
            const rows = [['2026-09', 'Closed', true, 'DOC-REP-2026-09']];
            return { getLastRow: () => 2, getDataRange: () => ({ getValues: () => [headers, ...rows] }) };
          }
          return { getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) };
        }
      });

      const readiness = getMonthlyCloseReadiness({ periodKey: '2026-09' });
      expect(readiness.reportPackagePrepared).toBe(true);
    });

    it('handles Google Sheets Date object in periodKey column during getMonthlyClose and getMonthlyCloseHistory', () => {
      const mockDatePeriodKey = new Date('2026-09-01T00:00:00.000Z');
      const mockDB = {
        getSheetByName: (name) => {
          if (name === 'Monthly_Close') {
            return {
              getLastRow: () => 2,
              getDataRange: () => ({
                getValues: () => [
                  ['closeId', 'periodKey', 'status', 'closedBy', 'closedAt'],
                  ['CLS-202609-907', mockDatePeriodKey, 'Closed', 'gilbert.baidya@gmail.com', '2026-09-04T15:47:24.831Z']
                ]
              })
            };
          }
          if (name === 'Monthly_Close_History') {
            return {
              getLastRow: () => 2,
              getDataRange: () => ({
                getValues: () => [
                  ['historyId', 'closeId', 'periodKey', 'actionType', 'status', 'performedBy', 'performedAt'],
                  ['HIST-101', 'CLS-202609-907', mockDatePeriodKey, 'CLOSE', 'Closed', 'gilbert.baidya@gmail.com', '2026-09-04T15:47:24.831Z']
                ]
              })
            };
          }
          return { getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) };
        }
      };
      global.getDB = vi.fn(() => mockDB);

      const closeRes = getMonthlyClose({ periodKey: '2026-09' });
      expect(closeRes.success).toBe(true);
      expect(closeRes.closeRecord).not.toBeNull();
      expect(closeRes.closeRecord.status).toBe('Closed');
      expect(closeRes.closeRecord.closedBy).toBe('gilbert.baidya@gmail.com');

      const histRes = getMonthlyCloseHistory({ periodKey: '2026-09' });
      expect(histRes.success).toBe(true);
      expect(histRes.history.length).toBe(1);
      expect(histRes.history[0].actionType).toBe('CLOSE');
    });

    it('archiveMonthEndReportPackage creates report artifact and sets reportGenerated = true without creating extra close/history rows', () => {
      const mockCloseRow = ['CLS-202609-907', '2026-09', '2026-09-01', '2026-09-30', 'Closed', '1.0', true, true, true, true, true, true, true, true, true, false, 0, 0, 100, 10, 0, 10, 'gilbert.baidya@gmail.com', '2026-09-04T15:47:24.831Z'];
      const headers = ['closeId', 'periodKey', 'periodStart', 'periodEnd', 'status', 'checklistVersion', 'incomeReviewed', 'expensesReviewed', 'receiptsReviewed', 'checksReviewed', 'reimbursementsReviewed', 'bankReconciled', 'cardsReconciled', 'designatedFundsReviewed', 'auditIssuesReviewed', 'reportGenerated', 'openCriticalIssues', 'openHighIssues', 'auditHealthScore', 'totalIncome', 'totalRecognizedExpenses', 'netPosition', 'closedBy', 'closedAt'];
      const appendCloseSpy = vi.fn();
      const appendHistorySpy = vi.fn();
      const setValueSpy = vi.fn();

      const mockDB = {
        getSheetByName: (name) => {
          if (name === 'Monthly_Close') {
            return {
              getLastRow: () => 2,
              appendRow: appendCloseSpy,
              getRange: () => ({ setValue: setValueSpy }),
              getDataRange: () => ({ getValues: () => [headers, mockCloseRow] })
            };
          }
          if (name === 'Monthly_Close_History') {
            return {
              getLastRow: () => 2,
              appendRow: appendHistorySpy,
              getDataRange: () => ({ getValues: () => [headers, []] })
            };
          }
          return { getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) };
        }
      };
      global.getDB = vi.fn(() => mockDB);
      global.uploadDocument = vi.fn(() => ({
        success: true,
        document: { documentId: 'DOC-REP-101', driveFileId: 'DRV-101', driveFileUrl: 'https://drive.google.com/file/101', driveFolderId: 'FLD-101' }
      }));

      const { archiveMonthEndReportPackage } = require('../MonthlyClose.gs');
      const result = archiveMonthEndReportPackage({ periodKey: '2026-09' }, 'gilbert.baidya@gmail.com');

      expect(result.success).toBe(true);
      expect(result.reportGenerated).toBe(true);
      expect(result.driveFileId).toBe('DRV-101');
      expect(appendCloseSpy).not.toHaveBeenCalled();
      expect(appendHistorySpy).not.toHaveBeenCalled();
      expect(setValueSpy).toHaveBeenCalledWith(true);
    });

    it('archiveMonthEndReportPackage returns existing artifact without calling uploadDocument if document already exists', () => {
      const mockCloseRow = ['CLS-202609-907', '2026-09', '2026-09-01', '2026-09-30', 'Closed', '1.0', true, true, true, true, true, true, true, true, true, true, 0, 0, 100, 10, 0, 10, 'gilbert.baidya@gmail.com', '2026-09-04T15:47:24.831Z'];
      const headers = ['closeId', 'periodKey', 'periodStart', 'periodEnd', 'status', 'checklistVersion', 'incomeReviewed', 'expensesReviewed', 'receiptsReviewed', 'checksReviewed', 'reimbursementsReviewed', 'bankReconciled', 'cardsReconciled', 'designatedFundsReviewed', 'auditIssuesReviewed', 'reportGenerated', 'openCriticalIssues', 'openHighIssues', 'auditHealthScore', 'totalIncome', 'totalRecognizedExpenses', 'netPosition', 'closedBy', 'closedAt'];

      global.getDocuments = vi.fn(() => ({
        success: true,
        documents: [{
          documentId: 'DOC-202609-498560',
          documentType: 'Finance Report',
          title: 'Month-End Financial Report Package — 2026-09',
          relatedEntityId: 'CLS-202609-907',
          closedPeriodReference: '2026-09',
          status: 'VERIFIED',
          driveFileId: '1KuqwKTzQ2nFKEFCttO4mHz6N_PG5ua0U'
        }]
      }));

      const mockDB = {
        getSheetByName: (name) => {
          if (name === 'Monthly_Close') {
            return {
              getLastRow: () => 2,
              getDataRange: () => ({ getValues: () => [headers, mockCloseRow] }),
              getRange: () => ({ setValue: vi.fn() })
            };
          }
          return { getLastRow: () => 1, getDataRange: () => ({ getValues: () => [[]] }) };
        }
      };
      global.getDB = vi.fn(() => mockDB);
      global.uploadDocument = vi.fn();

      const { archiveMonthEndReportPackage } = require('../MonthlyClose.gs');
      const result = archiveMonthEndReportPackage({ periodKey: '2026-09' }, 'gilbert.baidya@gmail.com');

      expect(result.success).toBe(true);
      expect(result.alreadyArchived).toBe(true);
      expect(result.documentId).toBe('DOC-202609-498560');
      expect(result.driveFileId).toBe('1KuqwKTzQ2nFKEFCttO4mHz6N_PG5ua0U');
      expect(global.uploadDocument).not.toHaveBeenCalled();
    });
  });
});
