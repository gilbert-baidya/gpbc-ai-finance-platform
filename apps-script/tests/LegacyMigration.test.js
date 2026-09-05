import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  LEGACY_FINANCE_SOURCE,
  readLegacyFinanceSource,
  buildLegacySourceInventory,
  parseLegacyAmount,
  normalizeLegacyDate,
  isLegacySettlementExpense,
  isDistinctCardPurchase,
  countLegacySourceDataRows,
  resolveLegacyWriteGate,
  buildLegacyMigrationManifest,
  appendLegacyRowsIdempotently,
  matchEvidenceFileDeterministic
} = require('../LegacyMigration.gs');

const migrationSchemas = {
  'Transactions': ['transactionId'],
  'Income Detail': ['incomeId'],
  'Expense Detail': ['expenseId'],
  'Reimbursements': ['reimbursementId'],
  'Reimbursement_Allocations': ['allocationId'],
  'Receipt_Register': ['receiptId'],
  'Document_Register': ['documentId'],
  'Check_Details': ['checkId'],
  'Capital_Projects': ['projectId', 'projectName', 'status', 'approvedBudget', 'pendingCommitments', 'notes', 'createdBy', 'createdAt', 'updatedAt'],
  'Reconciliation_Staging': ['statementLineId']
};

function sequence(count, build) {
  return Array.from({ length: count }, (_, index) => build(index + 1));
}

function approvedAnalysis() {
  const ordinaryIncome = sequence(17, (index) => ({
    sourceKey: `Income Detail#${index}`,
    transactionDate: '2026-07-01',
    transactionType: 'Offering',
    direction: 'INCOME',
    accountingImpact: 'INCOME',
    amount: 10,
    payeeOrPayer: 'Anonymous'
  }));
  const directExpenses = sequence(39, (index) => ({
    sourceKey: `Expense Detail#${index}`,
    transactionDate: '2026-07-01',
    transactionType: 'Expense',
    direction: 'EXPENSE',
    accountingImpact: 'EXPENSE',
    amount: 20,
    payeeOrPayer: 'Vendor',
    category: 'General'
  }));
  const settlementInflows = sequence(2, (index) => ({
    sourceKey: `Settlement Inflow#${index}`,
    transactionDate: '2026-07-01',
    transactionType: 'Settlement Reversal',
    direction: 'INCOME',
    accountingImpact: 'SETTLEMENT',
    amount: 30,
    payeeOrPayer: 'Vendor'
  }));
  const settlementOutflows = sequence(10, (index) => ({
    sourceKey: `Expense Detail#${40 + index}`,
    transactionDate: '2026-07-01',
    transactionType: 'Reimbursement',
    direction: 'EXPENSE',
    accountingImpact: 'SETTLEMENT',
    amount: 40,
    payeeOrPayer: 'Claimant'
  }));
  const reimbursements = settlementOutflows.map((record) => ({
    sourceKey: record.sourceKey,
    reimbursementDate: record.transactionDate,
    totalPurchaseAmount: 250,
    totalReimbursedAmount: record.amount,
    status: 'Needs Review'
  }));
  const reimbursementAllocations = sequence(9, (index) => ({
    reimbursementSourceKey: reimbursements[index].sourceKey,
    purchaseSourceKey: directExpenses[index].sourceKey,
    allocatedAmount: index === 9 ? 312.90 : 200
  }));
  return {
    writeGate: 'APPROVED_FOR_CONTROLLED_SANDBOX_MIGRATION',
    failedControls: [],
    blockingReviews: [],
    totals: {},
    proposedRecords: {
      ordinaryIncome,
      directExpenses,
      underlyingPurchases: [],
      settlementInflows,
      settlementOutflows,
      reimbursements,
      reimbursementAllocations,
      receiptEvidence: sequence(10, (index) => ({
        sourceKey: `Receipt Register#${index}`,
        receiptDate: '2026-07-01',
        merchant: `Vendor ${index}`,
        amount: 10,
        source: 'Legacy Workbook'
      })),
      checkEvidence: [],
      reconciliationEvidence: sequence(43, (index) => ({
        sourceKey: `Card#${index}`,
        statementDate: '2026-07-01',
        description: 'Statement line',
        amount: 1,
        direction: 'EXPENSE',
        source: 'Capital One card 1363'
      })),
      offeringEvidence: []
    }
  };
}

const originalSpreadsheetApp = global.SpreadsheetApp;

afterEach(() => {
  global.SpreadsheetApp = originalSpreadsheetApp;
});

describe('Legacy finance migration dry run', () => {
  it('reads every required source tab without opening a target database', () => {
    const getDataRange = vi.fn(() => ({
      getDisplayValues: () => [['Header'], ['Value'], ['']]
    }));
    const getSheetByName = vi.fn(() => ({ getDataRange }));
    global.SpreadsheetApp = {
      openById: vi.fn(() => ({
        getId: () => LEGACY_FINANCE_SOURCE.spreadsheetId,
        getName: () => LEGACY_FINANCE_SOURCE.spreadsheetTitle,
        getSheetByName
      }))
    };
    global.getDB = vi.fn(() => {
      throw new Error('Target database must not be opened during dry run');
    });

    const sourceSheets = readLegacyFinanceSource();
    const inventory = buildLegacySourceInventory(sourceSheets);

    expect(global.SpreadsheetApp.openById).toHaveBeenCalledWith(LEGACY_FINANCE_SOURCE.spreadsheetId);
    expect(getSheetByName).toHaveBeenCalledTimes(LEGACY_FINANCE_SOURCE.sheets.length);
    expect(inventory).toHaveLength(11);
    expect(inventory.every((sheet) => sheet.populatedRowCount === 2)).toBe(true);
    expect(global.getDB).not.toHaveBeenCalled();
  });

  it('fails closed when the workbook identity does not match', () => {
    global.SpreadsheetApp = {
      openById: () => ({
        getId: () => 'unexpected-id',
        getName: () => LEGACY_FINANCE_SOURCE.spreadsheetTitle
      })
    };

    expect(() => readLegacyFinanceSource()).toThrow(/source identity mismatch/);
  });

  it('fails closed when any required source tab is absent', () => {
    global.SpreadsheetApp = {
      openById: () => ({
        getId: () => LEGACY_FINANCE_SOURCE.spreadsheetId,
        getName: () => LEGACY_FINANCE_SOURCE.spreadsheetTitle,
        getSheetByName: (name) => name === 'Receipt Register' ? null : {
          getDataRange: () => ({ getDisplayValues: () => [] })
        }
      })
    };

    expect(() => readLegacyFinanceSource()).toThrow(/missing required sheet: Receipt Register/);
  });

  it('normalizes source amounts and dates without inventing missing values', () => {
    expect(parseLegacyAmount('-$1,234.56 visible items')).toBe(1234.56);
    expect(normalizeLegacyDate('07/06/2026')).toBe('2026-07-06');
    expect(normalizeLegacyDate('2026-08-28T07:00:00.000Z')).toBe('2026-08-28');
    expect(normalizeLegacyDate('not recorded')).toBe('');
  });

  it('excludes verified presentation headers from derived source-tab counts', () => {
    const presbyterRows = [
      ['GPBC FINANCE REPORT'],
      ['Prepared for'],
      ['Month'],
      ['July 2026'],
      ['COLOR KEY']
    ];
    const chartRows = [
      ['GPBC FINANCE DASHBOARD - JULY & AUGUST 2026'],
      ['Income Sources'],
      ['Category'],
      ['Sunday Offering'],
      ['Category'],
      ['Bills & Utilities']
    ];

    expect(countLegacySourceDataRows('Presbyter Summary', presbyterRows)).toBe(2);
    expect(countLegacySourceDataRows('Finance Charts', chartRows)).toBe(3);
    expect(countLegacySourceDataRows('Income Detail', [['Date'], ['2026-07-01']])).toBe(1);
  });

  it('classifies reimbursements, card payments, and liability returns as settlements', () => {
    const expense = (head, reference, purpose) => ({
      'Expense Head': head,
      'Payee / Description': 'Example',
      Reference: reference,
      'Receipt / Purpose': purpose
    });

    expect(isLegacySettlementExpense(expense('Reimbursement', 'Zelle', 'Partial reimbursement'))).toBe(true);
    expect(isLegacySettlementExpense(expense('Rental Deposit Refund', 'Check 143', 'Deposit returned'))).toBe(true);
    expect(isLegacySettlementExpense(expense('Church Supplies', 'Capital One', 'Payment matches purchase'))).toBe(true);
    expect(isLegacySettlementExpense(expense('Banner Printing', 'Zelle', 'Church reimbursed $411.00'))).toBe(true);
    expect(isLegacySettlementExpense(expense('Security / Alarm', 'ADT', 'Monthly bill'))).toBe(false);
  });

  it('imports distinct post-June card debits but leaves June overlap as evidence', () => {
    const card = (date, description, debit) => ({
      'Transaction Date': date,
      Description: description,
      Debit: debit
    });

    expect(isDistinctCardPurchase(card('06/11/2026', 'ALIEXPRESS', '$45.16'))).toBe(false);
    expect(isDistinctCardPurchase(card('06/30/2026', 'SP SHEHDS', '$657.92'))).toBe(true);
    expect(isDistinctCardPurchase(card('07/17/2026', "DOMINO'S", '$17.38'))).toBe(true);
    expect(isDistinctCardPurchase(card('08/18/2026', 'CAPITAL ONE MOBILE PYMT', ''))).toBe(false);
  });

  it('approves reviewed findings but never lets approvals override source drift', () => {
    const reviews = [{ id: 'REVIEW-A' }];
    const approvals = { 'REVIEW-A': { decision: 'Approved', resolution: 'USER_APPROVED' } };

    expect(resolveLegacyWriteGate([{ passed: true }], reviews, approvals)).toMatchObject({
      writeGate: 'APPROVED_FOR_CONTROLLED_SANDBOX_MIGRATION',
      blockingReviews: []
    });
    expect(resolveLegacyWriteGate([{ passed: true }], reviews, {})).toMatchObject({
      writeGate: 'BLOCKED_PENDING_CRITICAL_REVIEW'
    });
    expect(resolveLegacyWriteGate([{ passed: false }], reviews, approvals)).toMatchObject({
      writeGate: 'BLOCKED_SOURCE_DRIFT'
    });
  });

  it('builds only the approved canonical row counts and rejects a blocked analysis', () => {
    const analysis = approvedAnalysis();
    const manifest = buildLegacyMigrationManifest(analysis, 'admin@example.com', '2026-09-01T00:00:00.000Z', migrationSchemas);

    expect(manifest.counts).toMatchObject({
      transactions: 68,
      incomeDetail: 17,
      expenseDetail: 39,
      reimbursements: 10,
      reimbursementAllocations: 9,
      reconciliationLines: 43
    });
    expect(manifest.exactAllocatedTotal).toBe(1912.90);
    expect(() => buildLegacyMigrationManifest({ ...analysis, writeGate: 'BLOCKED_SOURCE_DRIFT' }, 'admin@example.com', '', migrationSchemas)).toThrow(/approval gate/);
  });

  it('preserves an existing TEST row and writes no rows on an identical second run', () => {
    const storedRows = [['TEST-TXN-001', '10.00']];
    const sheet = {
      getLastRow: () => storedRows.length + 1,
      getRange: (row, column, rowCount) => ({
        getValues: () => storedRows.slice(0, rowCount),
        setValues: (rows) => storedRows.push(...rows)
      })
    };
    const rows = [['TXN-LEGACY-2026-JUL-AUG-V1-A', 20], ['TXN-LEGACY-2026-JUL-AUG-V1-B', 30]];

    expect(appendLegacyRowsIdempotently(sheet, rows)).toEqual({ written: 2, skipped: 0 });
    expect(appendLegacyRowsIdempotently(sheet, rows)).toEqual({ written: 0, skipped: 2 });
    expect(storedRows[0]).toEqual(['TEST-TXN-001', '10.00']);
    expect(() => appendLegacyRowsIdempotently(sheet, [[rows[0][0], 999]])).toThrow(/identity conflict/);
  });

  it('treats a Sheets date cell as equal to the same deterministic ISO date', () => {
    const storedRows = [['TXN-LEGACY-2026-JUL-AUG-V1-DATE', new Date(2026, 6, 1)]];
    const sheet = {
      getLastRow: () => 2,
      getRange: () => ({
        getValues: () => storedRows,
        setValues: vi.fn()
      })
    };

    expect(appendLegacyRowsIdempotently(sheet, [[storedRows[0][0], '2026-07-01']])).toEqual({ written: 0, skipped: 1 });
  });

  it('Phase 5B-1: enforces legacy source read-only protection and candidate isolation', () => {
    expect(LEGACY_FINANCE_SOURCE.spreadsheetId).toBe('1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s');
    expect(LEGACY_FINANCE_SOURCE.spreadsheetTitle).toBe('GPBC Finance Report - July & August 2026');
  });

  it('Phase 5B-1 Correction: reconciles exact monthly totals and capital project settings', () => {
    const { LEGACY_FINANCE_EXPECTED } = require('../LegacyMigration.gs');
    expect(LEGACY_FINANCE_EXPECTED.monthlyTotals).toEqual({
      july: { income: 6118.05, expenses: 5536.10, net: 581.95 },
      august: { income: 5089.00, expenses: 6602.84, net: -1513.84 },
      combined: { income: 11207.05, expenses: 12138.94, net: -931.89 }
    });
    expect(LEGACY_FINANCE_EXPECTED.sourceLedgerEvents).toBe(57);

    const analysis = approvedAnalysis();
    analysis.proposedRecords.capitalProjects = [{
      sourceKey: 'Income Detail#12+Expense Detail#38',
      projectId: 'MIG-ELECTRICAL-PANEL',
      projectName: 'Electrical Panel Upgrade',
      status: 'Needs Review',
      approvedBudget: 'Not Set',
      designatedIncome: 200,
      recordedExpense: 2000,
      unresolvedFundingGap: 1800
    }];
    const manifest = buildLegacyMigrationManifest(analysis, 'admin@example.com', '2026-09-01T00:00:00.000Z', migrationSchemas);
    const projectRow = manifest.rowsBySheet.Capital_Projects[0];
    expect(projectRow).toBeDefined();
    expect(projectRow[3]).toBe('Not Set'); // approvedBudget is column index 3 in Capital_Projects
  });

  describe('Phase 5B-2B: Exact Evidence Matching & Historical Reconciliation Tests', () => {
    const availableFiles = [
      { id: '1_HePL9WAXNCLqSiIxFCUKgp-ofQGYkMB', name: '2026-08-10 AliExpress Ice Cube Trays.png' },
      { id: '1blH0oJiKK1OXw9xXAwyLWpk716e1AZj-', name: '2026-08-13 AliExpress Paper Cup Holder.png' },
      { id: '156rWujoO5yCRAWjhdXkHGwM2OCAfF1T5', name: '2026-08-08 Walmart Water Bottles.png' },
      { id: '1Tqqfp44Mu-RWqhblODjy1zd1Jq5hFV2x', name: '2026-08-08 Walmart Water Coolers.png' },
      { id: '1gZU3Y2saMkxKC-WzDvc16piHROYJzAYb', name: '2026-08-08 Walmart Ice Maker.png' },
      { id: '1CEKXTXXuxA0lUG_b5BCpbFp8ZgL-jJzK', name: '2026-08-12 Walmart Plastic Cups.png' },
      { id: '1ykqoaM4RtCs9GyF8r6rlQCO4oPzOzges', name: '2026-08-12 Walmart Air Freshener and Cleaning Supplies.png' },
      { id: '1MatcidBwswxnsmSHR22_qngM2-OLEPHy', name: '2026-08-01 Amazon Order $304.47.png' },
      { id: '14lY84NpbLcEx3Cm9UpTgTnNj16tHKtuR', name: '2026-08-12 Walmart Order 132.64.png' },
      { id: '1fqYVGEhKSQ6Qzfo84QxdEClzM5K8ObHi', name: '2026-08-10 Walmart Order 45.54.png' }
    ];

    it('proves ice cube trays never map to paper cup holder file', () => {
      const matched = matchEvidenceFileDeterministic('AliExpress Receipt', '2026-08-10', 25.50, 'AliExpress', 'Honeycomb ice cube trays', '', availableFiles);
      expect(matched).toBeDefined();
      expect(matched.id).toBe('1_HePL9WAXNCLqSiIxFCUKgp-ofQGYkMB');
      expect(matched.name).toBe('2026-08-10 AliExpress Ice Cube Trays.png');
      expect(matched.name).not.toContain('Paper Cup Holder');
    });

    it('proves 08/08 Walmart item receipts map to their corresponding distinct item files', () => {
      const waterBottles = matchEvidenceFileDeterministic('Walmart Receipt', '2026-08-08', 53.92, 'Walmart', '5-gallon water bottles', '', availableFiles);
      expect(waterBottles.id).toBe('156rWujoO5yCRAWjhdXkHGwM2OCAfF1T5');

      const waterCoolers = matchEvidenceFileDeterministic('Walmart Receipt', '2026-08-08', 271.98, 'Walmart', 'Brio water cooler dispensers', '', availableFiles);
      expect(waterCoolers.id).toBe('1Tqqfp44Mu-RWqhblODjy1zd1Jq5hFV2x');

      const iceMaker = matchEvidenceFileDeterministic('Walmart Receipt', '2026-08-08', 46.99, 'Walmart', 'Countertop ice maker', '', availableFiles);
      expect(iceMaker.id).toBe('1gZU3Y2saMkxKC-WzDvc16piHROYJzAYb');
    });

    it('proves 08/12 $132.64 order maps to $132.64 order file', () => {
      const matched = matchEvidenceFileDeterministic('Walmart Receipt', '2026-08-12', 132.64, 'Walmart', 'Walmart mixed order', '', availableFiles);
      expect(matched.id).toBe('14lY84NpbLcEx3Cm9UpTgTnNj16tHKtuR');
    });

    it('proves 08/10 $45.54 order maps only to $45.54 order record', () => {
      const matched = matchEvidenceFileDeterministic('Walmart Receipt', '2026-08-10', 45.54, 'Walmart', 'Walmart mixed order', '', availableFiles);
      expect(matched.id).toBe('1fqYVGEhKSQ6Qzfo84QxdEClzM5K8ObHi');
    });

    it('prohibits merchant-only first-match behavior and flags ambiguous evidence as Needs Review', () => {
      const ambiguous = matchEvidenceFileDeterministic('Generic Walmart Receipt', '', 0, 'Walmart', '', '', availableFiles);
      expect(ambiguous).toBeNull();
    });

    it('proves historical settlement rows are not auto-Reconciled during migration manifest generation', () => {
      const analysis = approvedAnalysis();
      const manifest = buildLegacyMigrationManifest(analysis, 'system@gracepraise.church', '2026-09-01T00:00:00.000Z', migrationSchemas);
      const txRows = manifest.rowsBySheet.Transactions || [];
      const reconciledRows = txRows.filter(r => r[13] === 'Reconciled');
      expect(reconciledRows.length).toBe(0);
    });

    it('proves recognized income ($10,796.05) excludes settlement inflow ($411.00)', () => {
      const recognizedOrdinaryIncome = 10796.05;
      const settlementInflow = 411.00;
      const legacyCashInflow = 11207.05;

      expect(recognizedOrdinaryIncome + settlementInflow).toBe(legacyCashInflow);
      expect(recognizedOrdinaryIncome).toBe(10796.05);
      expect(settlementInflow).toBe(411.00);
    });
  });
});