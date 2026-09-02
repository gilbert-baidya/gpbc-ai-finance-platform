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
        formatDate: () => '20260815'
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

    it('allows all roles to read monthly close status and history', () => {
      expect(authorizeAction('getMonthlyClose', 'Viewer').authorized).toBe(true);
      expect(authorizeAction('getMonthlyClose', 'Presbyter Read-Only').authorized).toBe(true);
      expect(authorizeAction('getMonthlyCloseReadiness', 'Finance Editor').authorized).toBe(true);
      expect(authorizeAction('getMonthlyCloseHistory', 'Viewer').authorized).toBe(true);
    });
  });
});
