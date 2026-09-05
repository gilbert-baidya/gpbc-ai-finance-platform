import { afterEach, beforeEach, describe, it, expect } from 'vitest';

const {
  AUDIT_SCORING_CONFIG,
  ALLOWED_RESOLUTION_STATUSES,
  logAuditEvent,
  normalizeMerchantName,
  normalizeAuditTimestampValue,
  calculatePurchaseBalance,
  evaluateAuditRules,
  calculateAuditHealthScore,
  getAuditSummary,
  matchReconciliationLine,
  stageBankStatementLines
} = require('../Audit.gs');

const {
  addReimbursement,
  addReimbursementAllocation,
  validateAndPrepareAllocation
} = require('../Reimbursements.gs');

describe('0. Non-Blocking Access Audit Logger', () => {
  let originalGetDB;

  beforeEach(() => {
    originalGetDB = global.getDB;
    global.Logger = { log: vi.fn() };
  });

  afterEach(() => {
    global.getDB = originalGetDB;
  });

  it('does not block requests when persistent audit storage is unavailable', () => {
    global.getDB = vi.fn(() => { throw new Error('storage unavailable'); });

    expect(logAuditEvent({ actor: 'admin@example.com', action: 'getTransactions', status: 'AUTHORIZED' })).toEqual({ success: true });
  });

  it('redacts sensitive details before appending to an existing audit log', () => {
    const appendRow = vi.fn();
    global.getDB = vi.fn(() => ({
      getSheetByName: vi.fn(() => ({ appendRow }))
    }));

    logAuditEvent({
      actor: 'admin@example.com',
      action: 'test',
      status: 'AUTHORIZED',
      details: 'token=private-value password:also-private'
    });

    expect(appendRow).toHaveBeenCalledOnce();
    expect(appendRow.mock.calls[0][0][4]).toBe('token=[REDACTED] password=[REDACTED]');
  });
});

describe('0.1 Audit Score Calculation State', () => {
  it('normalizes Sheets timestamps before audit issue sorting', () => {
    expect(normalizeAuditTimestampValue(new Date('2026-09-02T20:40:55.849Z'))).toBe('2026-09-02T20:40:55.849Z');
  });

  let originalGetDB;

  beforeEach(() => {
    originalGetDB = global.getDB;
  });

  afterEach(() => {
    global.getDB = originalGetDB;
  });

  it('does not fabricate a health score before the audit engine completes', () => {
    global.getDB = () => ({
      getSheetByName: (name) => name === 'AUDIT_LOGS' ? { getLastRow: () => 1 } : null
    });

    expect(getAuditSummary()).toEqual({
      success: true,
      calculated: false,
      calculatedAt: null,
      healthScore: null
    });
  });
});

const createMockDb = (config = {}) => {
  const transactions = config.transactions || [];
  const reimbursements = config.reimbursements || [];
  const allocations = config.allocations || [];
  const staged = config.staged || [];
  const issues = config.issues || [];
  const receipts = config.receipts || [];
  const checks = config.checks || [];

  const sheets = {
    Transactions: {
      getLastRow: () => transactions.length + 1,
      getLastColumn: () => 14,
      getDataRange: () => ({
        getValues: () => [
          ['transactionId', 'transactionDate', 'transactionType', 'direction', 'amount', 'personalPurchase', 'paymentMethod', 'checkNumber', 'receiptStatus', 'receiptId', 'accountingImpact', 'reconciliationStatus', 'payeeOrPayer', 'description'],
          ...transactions.map(t => [
            t.transactionId,
            t.transactionDate || t.date || '2026-02-01',
            t.transactionType || t.type || 'Expense',
            t.direction || 'EXPENSE',
            t.amount || 0,
            t.personalPurchase !== undefined ? t.personalPurchase : false,
            t.paymentMethod || 'Credit Card',
            t.checkNumber || '',
            t.receiptStatus || 'Needs Receipt',
            t.receiptId || '',
            t.accountingImpact || (t.transactionType === 'Reimbursement' ? 'SETTLEMENT' : t.direction),
            t.reconciliationStatus || 'Unreconciled',
            t.payeeOrPayer || '',
            t.description || ''
          ])
        ]
      }),
      appendRow: (row) => transactions.push({
        transactionId: row[0],
        transactionDate: row[1],
        transactionType: row[2],
        direction: row[3],
        amount: row[4],
        payeeOrPayer: row[5],
        description: row[6],
        accountingImpact: row[3]
      }),
      getRange: (r, c) => ({
        setValue: (val) => {
          if (transactions[r - 2]) {
            const headers = ['transactionId', 'transactionDate', 'transactionType', 'direction', 'amount', 'personalPurchase', 'paymentMethod', 'checkNumber', 'receiptStatus', 'receiptId', 'accountingImpact', 'reconciliationStatus', 'payeeOrPayer', 'description'];
            const field = headers[c - 1];
            if (field) transactions[r - 2][field] = val;
          }
        }
      })
    },
    Reimbursements: {
      getLastRow: () => reimbursements.length + 1,
      getLastColumn: () => 16,
      getDataRange: () => ({
        getValues: () => [
          ['reimbursementId', 'reimbursementDate', 'claimantName', 'claimantEmail', 'totalPurchaseAmount', 'totalReimbursedAmount', 'totalPersonallyAbsorbed', 'remainingReimbursable', 'status', 'paymentMethod', 'checkNumber', 'notes', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt'],
          ...reimbursements.map(r => [
            r.reimbursementId,
            r.reimbursementDate || '2026-02-01',
            r.claimantName || 'Claimant',
            r.claimantEmail || '',
            r.totalPurchaseAmount || 0,
            r.totalReimbursedAmount || 0,
            r.totalPersonallyAbsorbed || 0,
            r.remainingReimbursable || 0,
            r.status || 'Approved',
            r.paymentMethod || 'Check',
            r.checkNumber || '',
            r.notes || '',
            'System',
            '2026-02-01T00:00:00Z',
            'System',
            '2026-02-01T00:00:00Z'
          ])
        ]
      }),
      appendRow: (row) => reimbursements.push({
        reimbursementId: row[0],
        reimbursementDate: row[1],
        claimantName: row[2],
        claimantEmail: row[3],
        totalPurchaseAmount: row[4],
        totalReimbursedAmount: row[5],
        totalPersonallyAbsorbed: row[6],
        remainingReimbursable: row[7],
        status: row[8]
      })
    },
    Reimbursement_Allocations: {
      getLastRow: () => allocations.length + 1,
      getLastColumn: () => 10,
      getDataRange: () => ({
        getValues: () => [
          ['allocationId', 'reimbursementId', 'purchaseTransactionId', 'allocatedAmount', 'personallyAbsorbedAmount', 'refundCreditAdjustment', 'refundTransactionId', 'notes', 'createdBy', 'createdAt'],
          ...allocations.map(a => [
            a.allocationId || 'ALC-1',
            a.reimbursementId || 'RMB-1',
            a.purchaseTransactionId,
            a.allocatedAmount || 0,
            a.personallyAbsorbedAmount || 0,
            a.refundCreditAdjustment || 0,
            a.refundTransactionId || '',
            a.notes || '',
            'System',
            '2026-02-01T00:00:00Z'
          ])
        ]
      }),
      appendRow: (row) => allocations.push({
        allocationId: row[0],
        reimbursementId: row[1],
        purchaseTransactionId: row[2],
        allocatedAmount: row[3],
        personallyAbsorbedAmount: row[4],
        refundCreditAdjustment: row[5],
        refundTransactionId: row[6] || '',
        notes: row[7] || ''
      })
    },
    Reconciliation_Staging: {
      getLastRow: () => staged.length + 1,
      getLastColumn: () => 13,
      getDataRange: () => ({
        getValues: () => [
          ['statementLineId', 'statementDate', 'description', 'amount', 'direction', 'statementType', 'referenceNumber', 'matchStatus', 'matchedTransactionId', 'differenceAmount', 'sourceFileName', 'importedAt', 'importedBy'],
          ...staged.map(s => [
            s.statementLineId || 'STMT-1',
            s.statementDate || '2026-02-01',
            s.description || 'Line',
            s.amount || 0,
            s.direction || (s.amount < 0 ? 'EXPENSE' : 'INCOME'),
            s.statementType || 'Bank Checking',
            s.referenceNumber || '',
            s.matchStatus || 'Unmatched',
            s.matchedTransactionId || '',
            s.differenceAmount || 0,
            s.sourceFileName || 'import.csv',
            s.importedAt || '2026-02-01T00:00:00Z',
            s.importedBy || 'System'
          ])
        ]
      }),
      appendRow: (row) => staged.push({
        statementLineId: row[0],
        statementDate: row[1],
        description: row[2],
        amount: row[3],
        direction: row[4],
        statementType: row[5],
        referenceNumber: row[6],
        matchStatus: row[7],
        matchedTransactionId: row[8],
        differenceAmount: row[9],
        sourceFileName: row[10]
      }),
      getRange: (r, c) => ({
        setValue: (val) => {
          if (staged[r - 2]) {
            const headers = ['statementLineId', 'statementDate', 'description', 'amount', 'direction', 'statementType', 'referenceNumber', 'matchStatus', 'matchedTransactionId', 'differenceAmount', 'sourceFileName', 'importedAt', 'importedBy'];
            const field = headers[c - 1];
            if (field) staged[r - 2][field] = val;
          }
        }
      })
    },
    Audit_Issues: {
      getLastRow: () => issues.length + 1,
      getLastColumn: () => 19,
      getDataRange: () => ({
        getValues: () => [
          ['auditIssueId', 'issueFingerprint', 'ruleId', 'severity', 'status', 'entityType', 'entityId', 'title', 'description', 'amount', 'recommendedAction', 'detectedAt', 'lastDetectedAt', 'detectedBy', 'assignedTo', 'resolutionNotes', 'resolvedBy', 'resolvedAt', 'evidenceUrl'],
          ...issues.map(i => [
            i.auditIssueId || 'AUD-1',
            i.issueFingerprint || 'RULE-RCP-001_Transaction_TXN-1',
            i.ruleId || 'RULE-RCP-001',
            i.severity || 'HIGH',
            i.status || 'Needs Receipt',
            i.entityType || 'Transaction',
            i.entityId || 'TXN-1',
            i.title || 'Missing Receipt',
            i.description || '',
            i.amount || 0,
            i.recommendedAction || '',
            i.detectedAt || '2026-02-01T00:00:00Z',
            i.lastDetectedAt || '2026-02-01T00:00:00Z',
            i.detectedBy || 'System Engine',
            i.assignedTo || '',
            i.resolutionNotes || '',
            i.resolvedBy || '',
            i.resolvedAt || '',
            i.evidenceUrl || ''
          ])
        ]
      })
    }
  };

  return {
    getSheetByName: (name) => sheets[name] || null
  };
};

// Mock global getDB for Apps Script tests
global.getDB = (forWrite, actionName) => {
  return global._currentMockDb;
};

global.Utilities = {
  formatDate: (d, tz, fmt) => '20260201'
};

describe('1. Canonical Purchase-Balance Formula & Allocation Parity', () => {
  it('correctly resolves purchase: Purchase 100 = Reimbursed 60 + Absorbed 20 + Refund 20 (Remaining 0)', () => {
    const allocations = [
      { allocatedAmount: 60, personallyAbsorbedAmount: 20, refundCreditAdjustment: 20 }
    ];
    const balance = calculatePurchaseBalance(100, allocations);

    expect(balance.purchaseAmount).toBe(100);
    expect(balance.totalAllocated).toBe(60);
    expect(balance.totalAbsorbed).toBe(20);
    expect(balance.totalRefundAdjustment).toBe(20);
    expect(balance.netCovered).toBe(100);
    expect(balance.remainingBalance).toBe(0);
    expect(balance.isOverAllocated).toBe(false);
    expect(balance.overageAmount).toBe(0);
  });

  it('rejects over-resolution when sum exceeds purchase amount (Purchase 100, Reimbursed 90 + Absorbed 20)', () => {
    const allocations = [
      { allocatedAmount: 90, personallyAbsorbedAmount: 20, refundCreditAdjustment: 0 }
    ];
    const balance = calculatePurchaseBalance(100, allocations);

    expect(balance.netCovered).toBe(110);
    expect(balance.isOverAllocated).toBe(true);
    expect(balance.overageAmount).toBe(10);
  });

  it('normalizes merchant names conservatively and deterministically', () => {
    expect(normalizeMerchantName('THE HOME DEPOT #1234')).toBe('home depot');
    expect(normalizeMerchantName('HOME DEPOT 1234')).toBe('home depot');
    expect(normalizeMerchantName('Home Depot')).toBe('home depot');
    expect(normalizeMerchantName('AMZN MKTP US*1234 SEATTLE')).toBe('us seattle');
    expect(normalizeMerchantName('SQ *COFFEE SHOP')).toBe('coffee shop');
    expect(normalizeMerchantName('Dollar Tree #5678')).toBe('dollar tree');
  });
});

describe('2. Audit Health Score Semantics (Reviewed vs Cleared)', () => {
  it('strictly includes Reviewed in score-impacting deductions', () => {
    const issues = [
      { severity: 'HIGH', status: 'Reviewed' }
    ];

    const res = calculateAuditHealthScore(issues);
    expect(res.deductions.highDeduction).toBe(8);
    expect(res.score).toBe(92);
    expect(res.totalUnresolvedIssues).toBe(1);
  });

  it('excludes Cleared and Reconciled from deductions', () => {
    const issues = [
      { severity: 'CRITICAL', status: 'Cleared' },
      { severity: 'HIGH', status: 'Reconciled' }
    ];

    const res = calculateAuditHealthScore(issues);
    expect(res.deductions.totalDeduction).toBe(0);
    expect(res.score).toBe(100);
    expect(res.totalUnresolvedIssues).toBe(0);
  });

  it('enforces allowed resolution statuses', () => {
    expect(ALLOWED_RESOLUTION_STATUSES).toContain('Reviewed');
    expect(ALLOWED_RESOLUTION_STATUSES).toContain('Cleared');
    expect(ALLOWED_RESOLUTION_STATUSES).toContain('Reconciled');
    expect(ALLOWED_RESOLUTION_STATUSES).not.toContain('ArbitraryStatus');
  });
});

describe('3. Reimbursement Payout Cap & Standalone Allocations', () => {
  it('enforces reimbursement cash payout cap (RMB $100 payout, Allocations $70 + $20, New $25 rejected)', () => {
    const mockDb = createMockDb({
      transactions: [
        { transactionId: 'TXN-P1', amount: 200, personalPurchase: true, direction: 'EXPENSE', paymentMethod: 'Personal Card' }
      ],
      reimbursements: [
        { reimbursementId: 'RMB-100', totalReimbursedAmount: 100 }
      ],
      allocations: [
        { reimbursementId: 'RMB-100', purchaseTransactionId: 'TXN-P1', allocatedAmount: 70 },
        { reimbursementId: 'RMB-100', purchaseTransactionId: 'TXN-P1', allocatedAmount: 20 }
      ]
    });
    global._currentMockDb = mockDb;

    expect(() => {
      addReimbursementAllocation({
        reimbursementId: 'RMB-100',
        purchaseTransactionId: 'TXN-P1',
        allocatedAmount: 25
      }, 'test@church.org');
    }).toThrow(/exceeds reimbursement cash payout/);
  });

  it('personally absorbed amount does not consume reimbursement cash payout', () => {
    const mockDb = createMockDb({
      transactions: [
        { transactionId: 'TXN-P2', amount: 200, personalPurchase: true, direction: 'EXPENSE', paymentMethod: 'Personal Card' }
      ],
      reimbursements: [
        { reimbursementId: 'RMB-200', totalReimbursedAmount: 100 }
      ],
      allocations: [
        { reimbursementId: 'RMB-200', purchaseTransactionId: 'TXN-P2', allocatedAmount: 50, personallyAbsorbedAmount: 30 }
      ]
    });
    global._currentMockDb = mockDb;

    const res = addReimbursementAllocation({
      reimbursementId: 'RMB-200',
      purchaseTransactionId: 'TXN-P2',
      allocatedAmount: 50,
      personallyAbsorbedAmount: 0
    }, 'test@church.org');

    expect(res.success).toBe(true);
  });
});

describe('4. Audit Rules: RULE-RMB-001 Under-Allocation & Over-Allocation Detection', () => {
  it('detects under-supported reimbursement payout ($150 payout, $50 allocated)', () => {
    const findings = evaluateAuditRules({
      reimbursements: [
        { reimbursementId: 'RMB-UNDER', totalReimbursedAmount: 150, claimantName: 'Pastor' }
      ],
      allocations: [
        { reimbursementId: 'RMB-UNDER', allocatedAmount: 50 }
      ]
    });

    const rmbIssue = findings.find(f => f.ruleId === 'RULE-RMB-001');
    expect(rmbIssue).toBeDefined();
    expect(rmbIssue.severity).toBe('HIGH');
    expect(rmbIssue.status).toBe('Pending Match');
    expect(rmbIssue.amount).toBe(100);
    expect(rmbIssue.title).toContain('under-supported');
  });

  it('detects over-allocated reimbursement payout ($100 payout, $150 allocated)', () => {
    const findings = evaluateAuditRules({
      reimbursements: [
        { reimbursementId: 'RMB-OVER', totalReimbursedAmount: 100, claimantName: 'Treasurer' }
      ],
      allocations: [
        { reimbursementId: 'RMB-OVER', allocatedAmount: 150 }
      ]
    });

    const rmbIssue = findings.find(f => f.ruleId === 'RULE-RMB-001');
    expect(rmbIssue).toBeDefined();
    expect(rmbIssue.severity).toBe('CRITICAL');
    expect(rmbIssue.status).toBe('Discrepancy');
    expect(rmbIssue.amount).toBe(50);
    expect(rmbIssue.title).toContain('over-allocated');
  });

  it('evaluates all 12 rules deterministically', () => {
    const dataset = {
      transactions: [
        { transactionId: 'TXN-1', direction: 'EXPENSE', amount: 60.00, receiptStatus: 'Needs Receipt', receiptId: '', payeeOrPayer: 'OfficeMax', description: 'Paper' },
        { transactionId: 'TXN-2', direction: 'EXPENSE', amount: 40.00, receiptStatus: 'Attached', receiptId: 'R-1', payeeOrPayer: 'Vendor', description: '' },
        { transactionId: 'TXN-3', direction: 'EXPENSE', amount: 30.00, receiptStatus: 'Attached', receiptId: 'R-2', payeeOrPayer: 'Unknown', description: 'Supplies' },
        { transactionId: 'TXN-4', direction: 'EXPENSE', amount: 100.00, paymentMethod: 'Check', checkNumber: '1001', receiptStatus: 'Attached', receiptId: 'R-3', payeeOrPayer: 'Speaker', description: 'Honorarium' },
        { transactionId: 'TXN-5', direction: 'EXPENSE', amount: 80.00, personalPurchase: true, receiptStatus: 'Attached', receiptId: 'R-4', payeeOrPayer: 'Target', description: 'Crafts' },
        { transactionId: 'TXN-6', direction: 'EXPENSE', amount: 25.00, category: 'Uncategorized', receiptStatus: 'Attached', receiptId: 'R-5', payeeOrPayer: 'Store', description: 'Items' },
        { transactionId: 'TXN-7', direction: 'INCOME', amount: 20.00, transactionType: 'Refund', notes: 'Unlinked refund' },
        { transactionId: 'TXN-8', direction: 'EXPENSE', amount: 50.00, receiptId: 'RCP-DIFF', payeeOrPayer: 'Store', description: 'Item' },
        { transactionId: 'TXN-9A', transactionDate: '2026-02-01', direction: 'EXPENSE', amount: 45.00, payeeOrPayer: 'Chevron', description: 'Gas' },
        { transactionId: 'TXN-9B', transactionDate: '2026-02-02', direction: 'EXPENSE', amount: 45.00, payeeOrPayer: 'Chevron', description: 'Gas' }
      ],
      reimbursements: [
        { reimbursementId: 'RMB-UNSUPP', totalReimbursedAmount: 150.00, claimantName: 'Pastor' }
      ],
      allocations: [
        { purchaseTransactionId: 'TXN-1', allocatedAmount: 100.00, personallyAbsorbedAmount: 0 }
      ],
      receipts: [
        { receiptId: 'RCP-DIFF', amount: 65.00 }
      ],
      checkDetails: [
        { checkNumber: '1001', driveUrl: '' }
      ],
      fundSummaries: [
        { fundId: 'Missions Deficit', netBalance: -250.00 }
      ]
    };

    const findings = evaluateAuditRules(dataset);
    const ruleIds = new Set(findings.map(f => f.ruleId));

    expect(ruleIds.has('RULE-RCP-001')).toBe(true);
    expect(ruleIds.has('RULE-EXP-001')).toBe(true);
    expect(ruleIds.has('RULE-PAY-001')).toBe(true);
    expect(ruleIds.has('RULE-CHK-001')).toBe(true);
    expect(ruleIds.has('RULE-PRP-001')).toBe(true);
    expect(ruleIds.has('RULE-RMB-001')).toBe(true);
    expect(ruleIds.has('RULE-RMB-002')).toBe(true);
    expect(ruleIds.has('RULE-DUP-001')).toBe(true);
    expect(ruleIds.has('RULE-REF-001')).toBe(true);
    expect(ruleIds.has('RULE-FND-001')).toBe(true);
    expect(ruleIds.has('RULE-CAT-001')).toBe(true);
    expect(ruleIds.has('RULE-DIS-001')).toBe(true);
    expect(ruleIds.size).toBe(12);
  });
});

describe('5. Direct Reconciliation API Hardening & Duplicate Reuse Prevention', () => {
  it('rejects matching a transaction that is already matched to another statement line', () => {
    const mockDb = createMockDb({
      transactions: [
        { transactionId: 'TXN-100', amount: 50.00, direction: 'EXPENSE', reconciliationStatus: 'Unreconciled' }
      ],
      staged: [
        { statementLineId: 'STMT-A', amount: -50.00, direction: 'EXPENSE', matchStatus: 'Matched', matchedTransactionId: 'TXN-100' },
        { statementLineId: 'STMT-B', amount: -50.00, direction: 'EXPENSE', matchStatus: 'Unmatched', matchedTransactionId: '' }
      ]
    });
    global._currentMockDb = mockDb;

    expect(() => {
      matchReconciliationLine({ statementLineId: 'STMT-B', transactionId: 'TXN-100' }, 'test@church.org');
    }).toThrow(/already matched to statement line STMT-A/);
  });

  it('sets transaction status to Discrepancy (NOT Reconciled) when amounts differ', () => {
    const mockDb = createMockDb({
      transactions: [
        { transactionId: 'TXN-200', amount: 100.00, direction: 'EXPENSE', reconciliationStatus: 'Unreconciled' }
      ],
      staged: [
        { statementLineId: 'STMT-DIFF', amount: -105.00, direction: 'EXPENSE', matchStatus: 'Unmatched', matchedTransactionId: '' }
      ]
    });
    global._currentMockDb = mockDb;

    const res = matchReconciliationLine({ statementLineId: 'STMT-DIFF', transactionId: 'TXN-200' }, 'test@church.org');
    expect(res.matchStatus).toBe('Discrepancy');
    expect(res.transactionStatus).toBe('Discrepancy');
    expect(res.differenceAmount).toBe(5.00);
  });
});

describe('6. Server-Side Statement Line Validation (stageBankStatementLines)', () => {
  it('validates dates, amounts, descriptions, and directions server-side', () => {
    const mockDb = createMockDb();
    global._currentMockDb = mockDb;

    const lines = [
      { date: '2026-02-01', description: 'Valid Line', amount: -50.00, direction: 'EXPENSE' },
      { date: 'invalid-date', description: 'Bad Date', amount: -50.00, direction: 'EXPENSE' },
      { date: '2026-02-01', description: '', amount: -50.00, direction: 'EXPENSE' },
      { date: '2026-02-01', description: 'Zero Amount', amount: 0, direction: 'EXPENSE' },
      { date: '2026-02-01', description: 'Bad Direction', amount: 50.00, direction: 'INVALID' }
    ];

    const res = stageBankStatementLines({ statementLines: lines, sourceFileName: 'test.csv' }, 'test@church.org');
    expect(res.insertedCount).toBe(1);
    expect(res.rejectedCount).toBe(4);
    expect(res.totalSubmitted).toBe(5);
  });
});
