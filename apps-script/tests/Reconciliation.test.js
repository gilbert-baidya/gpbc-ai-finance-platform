import { describe, it, expect } from 'vitest';
import {
  calculatePurchaseBalance,
  getPeriodKey,
  getPeriodBounds
} from '../FinanceMath.gs';

import {
  normalizeReconciliationStatus,
  evaluateDeterministicReconciliationRules,
  ensureReconciliationRegisterStore,
  resolveEffectiveReconciliationStatus,
  resolveEvidenceStatus,
  getReconciliationRecords,
  reconcileTransactionRecord,
  autoReconcilePeriod
} from '../Reconciliation.gs';

import {
  getMonthlyCloseReadiness,
  generateMonthEndReportPackage
} from '../MonthlyClose.gs';

import { SCHEMA_DEFINITIONS } from '../Config.gs';

describe('Phase 3 Deterministic Reconciliation & Period Sync Suite', () => {

  describe('Period Boundary & Timezone Integrity Tests', () => {
    it('maps period boundary dates deterministically without timezone shift', () => {
      expect(getPeriodKey('2026-08-31')).toBe('2026-08');
      expect(getPeriodKey('2026-09-01')).toBe('2026-09');
      expect(getPeriodKey('2026-09-30')).toBe('2026-09');
      expect(getPeriodKey('2026-10-01')).toBe('2026-10');

      const boundsAug = getPeriodBounds('2026-08');
      expect(boundsAug.startDate).toBe('2026-08-01');
      expect(boundsAug.endDate).toBe('2026-08-31');

      const boundsSep = getPeriodBounds('2026-09');
      expect(boundsSep.startDate).toBe('2026-09-01');
      expect(boundsSep.endDate).toBe('2026-09-30');
    });

    it('excludes August 31 transaction from September period query', () => {
      const dummySheet = {
        getLastRow: () => 1,
        getLastColumn: () => 24,
        getDataRange: () => ({ getValues: () => [SCHEMA_DEFINITIONS.Reconciliation_Register] })
      };

      global.getDB = () => ({
        getSheetByName: () => dummySheet
      });

      const augustTx = {
        transactionId: 'TXN-LEGACY-2026-JUL-AUG-V1-INCOME-DETAIL-19',
        transactionDate: '2026-08-31',
        transactionType: 'Sunday Offering',
        direction: 'INCOME',
        accountingImpact: 'INCOME',
        amount: 998.00,
        payeeOrPayer: 'Congregation',
        reconciliationStatus: 'Reconciled',
        receiptStatus: 'Exempt'
      };

      // Mock getTransactions for specific period queries
      global.getTransactions = (p) => {
        if (p && p.startDate === '2026-09-01') {
          return { success: true, transactions: [] };
        }
        if (p && p.startDate === '2026-08-01') {
          return { success: true, transactions: [augustTx] };
        }
        return { success: true, transactions: [] };
      };

      global.getDocuments = () => ({ success: true, documents: [] });

      // September query: MUST exclude TXN-LEGACY-2026-JUL-AUG-V1-INCOME-DETAIL-19
      const sepRes = getReconciliationRecords({ periodKey: '2026-09' });
      expect(sepRes.records).toHaveLength(0);
      expect(sepRes.summary.totalRecords).toBe(0);

      // August query: MUST include TXN-LEGACY-2026-JUL-AUG-V1-INCOME-DETAIL-19
      const augRes = getReconciliationRecords({ periodKey: '2026-08' });
      expect(augRes.records).toHaveLength(1);
      expect(augRes.records[0].transactionId).toBe('TXN-LEGACY-2026-JUL-AUG-V1-INCOME-DETAIL-19');
    });
  });

  describe('Status Precedence & Register Sync Invariants', () => {
    it('preserves historical RECONCILED status when Register is missing/empty (Section 14 Rule A)', () => {
      const status = resolveEffectiveReconciliationStatus(undefined, 'Reconciled', false);
      expect(status).toBe('RECONCILED');
    });

    it('prioritizes authoritative newer Register status over legacy Transactions status (Section 14 Rule B)', () => {
      const status = resolveEffectiveReconciliationStatus('NEEDS_REVIEW', 'Reconciled', false);
      expect(status).toBe('NEEDS_REVIEW');
    });

    it('defaults to UNMATCHED when both Register and Transactions status are blank (Section 14 Rule C)', () => {
      const status = resolveEffectiveReconciliationStatus('', '', false);
      expect(status).toBe('UNMATCHED');
    });

    it('defaults to MATCHED when evidence is attached but no explicit status is stored', () => {
      const status = resolveEffectiveReconciliationStatus('', '', true);
      expect(status).toBe('MATCHED');
    });

    it('normalizes legacy status capitalization variations cleanly', () => {
      expect(normalizeReconciliationStatus('reconciled')).toBe('RECONCILED');
      expect(normalizeReconciliationStatus('RECONCILED')).toBe('RECONCILED');
      expect(normalizeReconciliationStatus('Reconciled ')).toBe('RECONCILED');
      expect(normalizeReconciliationStatus('matched')).toBe('MATCHED');
      expect(normalizeReconciliationStatus('Needs Review')).toBe('NEEDS_REVIEW');
    });
  });

  describe('Receipt & Exemption Policy Invariants (Section 8)', () => {
    it('resolves evidenceStatus to Receipt Exempt for exempt records without attached documents', () => {
      const statusText = resolveEvidenceStatus(0, '', 'Exempt');
      expect(statusText).toBe('Receipt Exempt');
    });

    it('does not generate a missing receipt blocker for Exempt expense', () => {
      const record = {
        amount: 500.00,
        expectedAmount: 500.00,
        reconciledAmount: 500.00,
        direction: 'EXPENSE',
        transactionType: 'Expense',
        payeeOrPayer: 'City Utility',
        paymentMethod: 'ACH',
        receiptStatus: 'Exempt'
      };

      const evalRes = evaluateDeterministicReconciliationRules(record, { documents: [] });
      expect(evalRes.satisfiesRules).toBe(true);
      expect(evalRes.blockingReasons).toHaveLength(0);
    });
  });

  describe('Manual Reconciliation Action (reconcileTransactionRecord) Suite (Section 11)', () => {
    it('executes valid UNMATCHED -> MATCHED transition on TXN-20260902-17336 cleanly when date is a JS Date object', () => {
      let appendedRow = null;
      let txStatusSet = null;

      const txHeaders = ['transactionId', 'transactionDate', 'transactionType', 'amount', 'payeeOrPayer', 'reconciliationStatus', 'receiptStatus'];
      const testTxDate = new Date('2026-09-02T00:00:00.000Z');
      const txRows = [
        ['TXN-20260902-17336', testTxDate, 'General Donation', 10.00, 'TEST Sandbox Donor', 'Unmatched', 'Exempt']
      ];

      const regHeaders = [...SCHEMA_DEFINITIONS.Reconciliation_Register];
      const regRows = [regHeaders];

      global.assertPeriodWritable = () => {};
      global.Utilities = {
        formatDate: (d, tz, fmt) => '2026-09-02'
      };

      global.getDB = () => ({
        getSheetByName: (name) => {
          if (name === 'Transactions') {
            return {
              getDataRange: () => ({ getValues: () => [txHeaders, ...txRows] }),
              getRange: (r, c) => ({
                setValue: (val) => { txStatusSet = val; }
              })
            };
          }
          if (name === 'Reconciliation_Register') {
            return {
              getDataRange: () => ({ getValues: () => regRows }),
              appendRow: (row) => { appendedRow = row; regRows.push(row); }
            };
          }
          return null;
        }
      });

      const res = reconcileTransactionRecord({
        transactionId: 'TXN-20260902-17336',
        reconciliationStatus: 'MATCHED',
        reconciledAmount: 10.00,
        notes: 'Manual match test'
      }, 'admin@gracepraise.church');

      expect(res.success).toBe(true);
      expect(res.transactionId).toBe('TXN-20260902-17336');
      expect(res.reconciliationStatus).toBe('MATCHED');

      // Check 24-column Reconciliation_Register append
      expect(appendedRow).not.toBeNull();
      expect(appendedRow).toHaveLength(24);
      expect(appendedRow[0]).toMatch(/^REC-/);
      expect(appendedRow[1]).toBe(2026);
      expect(appendedRow[2]).toBe(9);
      expect(appendedRow[3]).toBe('TXN-20260902-17336');
      expect(appendedRow[7]).toBe(10.00); // expectedAmount
      expect(appendedRow[8]).toBe(10.00); // reconciledAmount
      expect(appendedRow[9]).toBe(0.00);  // differenceAmount
      expect(appendedRow[10]).toBe('MATCHED'); // reconciliationStatus

      // Check Master Transactions status updated
      expect(txStatusSet).toBe('Matched');
    });

    it('rejects attempt to mark RECONCILED when deterministic financial rules fail', () => {
      const txHeaders = ['transactionId', 'transactionDate', 'transactionType', 'direction', 'amount', 'payeeOrPayer', 'reconciliationStatus', 'receiptStatus'];
      const txRows = [
        ['TXN-NON-EXEMPT-EXPENSE', '2026-09-05', 'Expense', 'EXPENSE', 500.00, 'Vendor', 'Unmatched', 'Needs Receipt']
      ];

      global.assertPeriodWritable = () => {};
      global.getDocuments = () => ({ success: true, documents: [] });
      global.getDB = () => ({
        getSheetByName: (name) => {
          if (name === 'Transactions') {
            return { getDataRange: () => ({ getValues: () => [txHeaders, ...txRows] }) };
          }
          return null;
        }
      });

      expect(() => {
        reconcileTransactionRecord({
          transactionId: 'TXN-NON-EXEMPT-EXPENSE',
          reconciliationStatus: 'RECONCILED'
        }, 'admin@gracepraise.church');
      }).toThrow('Cannot mark RECONCILED');
    });
  });

  describe('Summary Counts Distinction Suite (Section 7)', () => {
    it('correctly calculates summary counts for ONE MATCHED record (reconciledCount = 0, matchedCount = 1)', () => {
      const dummySheet = {
        getLastRow: () => 1,
        getLastColumn: () => 24,
        getDataRange: () => ({ getValues: () => [SCHEMA_DEFINITIONS.Reconciliation_Register] })
      };
      global.getDB = () => ({ getSheetByName: () => dummySheet });
      global.getDocuments = () => ({ success: true, documents: [] });

      const matchedTx = {
        transactionId: 'TXN-MATCHED-TEST',
        transactionDate: '2026-09-02',
        transactionType: 'General Donation',
        direction: 'INCOME',
        accountingImpact: 'INCOME',
        amount: 10.00,
        payeeOrPayer: 'Donor',
        reconciliationStatus: 'Matched',
        receiptStatus: 'Exempt'
      };

      global.getTransactions = () => ({ success: true, transactions: [matchedTx] });

      const res = getReconciliationRecords({ periodKey: '2026-09' });
      expect(res.summary.totalRecords).toBe(1);
      expect(res.summary.matchedCount).toBe(1);
      expect(res.summary.reconciledCount).toBe(0);
      expect(res.summary.unmatchedCount).toBe(0);
    });

    it('correctly calculates summary counts for ONE RECONCILED record (reconciledCount = 1, matchedCount = 0)', () => {
      const dummySheet = {
        getLastRow: () => 1,
        getLastColumn: () => 24,
        getDataRange: () => ({ getValues: () => [SCHEMA_DEFINITIONS.Reconciliation_Register] })
      };
      global.getDB = () => ({ getSheetByName: () => dummySheet });
      global.getDocuments = () => ({ success: true, documents: [] });

      const reconciledTx = {
        transactionId: 'TXN-RECONCILED-TEST',
        transactionDate: '2026-09-02',
        transactionType: 'General Donation',
        direction: 'INCOME',
        accountingImpact: 'INCOME',
        amount: 10.00,
        payeeOrPayer: 'Donor',
        reconciliationStatus: 'Reconciled',
        receiptStatus: 'Exempt'
      };

      global.getTransactions = () => ({ success: true, transactions: [reconciledTx] });

      const res = getReconciliationRecords({ periodKey: '2026-09' });
      expect(res.summary.totalRecords).toBe(1);
      expect(res.summary.reconciledCount).toBe(1);
      expect(res.summary.matchedCount).toBe(0);
      expect(res.summary.unmatchedCount).toBe(0);
    });

    it('correctly calculates summary counts for ONE MATCHED + ONE RECONCILED record', () => {
      const dummySheet = {
        getLastRow: () => 1,
        getLastColumn: () => 24,
        getDataRange: () => ({ getValues: () => [SCHEMA_DEFINITIONS.Reconciliation_Register] })
      };
      global.getDB = () => ({ getSheetByName: () => dummySheet });
      global.getDocuments = () => ({ success: true, documents: [] });

      const matchedTx = {
        transactionId: 'TXN-MATCHED-TEST',
        transactionDate: '2026-09-02',
        transactionType: 'General Donation',
        direction: 'INCOME',
        accountingImpact: 'INCOME',
        amount: 10.00,
        payeeOrPayer: 'Donor',
        reconciliationStatus: 'Matched',
        receiptStatus: 'Exempt'
      };

      const reconciledTx = {
        transactionId: 'TXN-RECONCILED-TEST',
        transactionDate: '2026-09-02',
        transactionType: 'General Donation',
        direction: 'INCOME',
        accountingImpact: 'INCOME',
        amount: 10.00,
        payeeOrPayer: 'Donor',
        reconciliationStatus: 'Reconciled',
        receiptStatus: 'Exempt'
      };

      global.getTransactions = () => ({ success: true, transactions: [matchedTx, reconciledTx] });

      const res = getReconciliationRecords({ periodKey: '2026-09' });
      expect(res.summary.totalRecords).toBe(2);
      expect(res.summary.matchedCount).toBe(1);
      expect(res.summary.reconciledCount).toBe(1);
      expect(res.summary.unmatchedCount).toBe(0);
    });
  });

});
