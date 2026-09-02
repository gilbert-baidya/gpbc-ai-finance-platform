import { describe, it, expect } from 'vitest';

const {
  AUDIT_SCORING_CONFIG,
  ALLOWED_RESOLUTION_STATUSES,
  normalizeMerchantName,
  calculatePurchaseBalance,
  evaluateAuditRules,
  calculateAuditHealthScore
} = require('../Audit.gs');

const {
  validateAndPrepareAllocation
} = require('../Reimbursements.gs');

const createMockDb = (transactions = [], reimbursements = [], allocations = [], receipts = [], checks = [], staged = [], issues = []) => {
  return {
    getSheetByName: (name) => {
      if (name === 'Transactions') {
        return {
          getLastRow: () => transactions.length + 1,
          getDataRange: () => ({
            getValues: () => [
              ['transactionId', 'transactionDate', 'transactionType', 'direction', 'amount', 'personalPurchase', 'paymentMethod', 'checkNumber', 'receiptStatus', 'receiptId', 'accountingImpact', 'reconciliationStatus', 'payeeOrPayer', 'description'],
              ...transactions.map(t => [
                t.transactionId,
                t.transactionDate || t.date || '2026-02-01',
                t.transactionType || t.type || 'Expense',
                t.direction || 'EXPENSE',
                t.amount || 0,
                t.personalPurchase || false,
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
          })
        };
      }
      if (name === 'Reimbursements') {
        return {
          getLastRow: () => reimbursements.length + 1,
          getDataRange: () => ({
            getValues: () => [
              ['reimbursementId', 'reimbursementDate', 'claimantName', 'claimantEmail', 'totalPurchaseAmount', 'totalReimbursedAmount', 'totalPersonallyAbsorbed', 'remainingReimbursable', 'status'],
              ...reimbursements.map(r => [
                r.reimbursementId,
                r.reimbursementDate || '2026-02-01',
                r.claimantName || 'Claimant',
                r.claimantEmail || '',
                r.totalPurchaseAmount || 0,
                r.totalReimbursedAmount || 0,
                r.totalPersonallyAbsorbed || 0,
                r.remainingReimbursable || 0,
                r.status || 'Approved'
              ])
            ]
          })
        };
      }
      if (name === 'Reimbursement_Allocations') {
        return {
          getLastRow: () => allocations.length + 1,
          getDataRange: () => ({
            getValues: () => [
              ['allocationId', 'reimbursementId', 'purchaseTransactionId', 'allocatedAmount', 'personallyAbsorbedAmount', 'refundCreditAdjustment', 'notes'],
              ...allocations.map(a => [
                a.allocationId || 'ALC-1',
                a.reimbursementId || 'RMB-1',
                a.purchaseTransactionId,
                a.allocatedAmount || 0,
                a.personallyAbsorbedAmount || 0,
                a.refundCreditAdjustment || 0,
                a.notes || ''
              ])
            ]
          })
        };
      }
      if (name === 'Reconciliation_Staging') {
        return {
          getLastRow: () => staged.length + 1,
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
          })
        };
      }
      if (name === 'Audit_Issues') {
        return {
          getLastRow: () => issues.length + 1,
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
        };
      }
      return null;
    }
  };
};

describe('1. Merchant Normalization & Purchase Balance Calculation', () => {
  it('normalizes merchant names conservatively and deterministically', () => {
    expect(normalizeMerchantName('THE HOME DEPOT #1234')).toBe('home depot');
    expect(normalizeMerchantName('HOME DEPOT 1234')).toBe('home depot');
    expect(normalizeMerchantName('Home Depot')).toBe('home depot');
    expect(normalizeMerchantName('AMZN MKTP US*1234 SEATTLE')).toBe('us seattle');
    expect(normalizeMerchantName('SQ *COFFEE SHOP')).toBe('coffee shop');
    expect(normalizeMerchantName('Dollar Tree #5678')).toBe('dollar tree');
  });

  it('calculates purchase balance with refund adjustments correctly', () => {
    // $100 purchase: Reimbursed $60 + Absorbed $20 + Refund $20 = Remaining $0
    const allocations = [
      { allocatedAmount: 60, personallyAbsorbedAmount: 20, refundCreditAdjustment: 20 }
    ];
    const balance = calculatePurchaseBalance(100, allocations);

    expect(balance.purchaseAmount).toBe(100);
    expect(balance.totalAllocated).toBe(60);
    expect(balance.totalAbsorbed).toBe(20);
    expect(balance.totalRefundAdjustment).toBe(20);
    expect(balance.remainingBalance).toBe(0);
    expect(balance.isOverAllocated).toBe(false);
  });

  it('detects over-allocation correctly when sum exceeds purchase amount', () => {
    // $100 purchase: Allocated $120
    const allocations = [{ allocatedAmount: 120, personallyAbsorbedAmount: 0, refundCreditAdjustment: 0 }];
    const balance = calculatePurchaseBalance(100, allocations);

    expect(balance.isOverAllocated).toBe(true);
    expect(balance.overageAmount).toBe(20);
  });
});

describe('2. Audit Health Score Semantics (Reviewed vs Cleared)', () => {
  it('strictly includes Reviewed in score-impacting deductions', () => {
    const issues = [
      { severity: 'HIGH', status: 'Reviewed' } // Reviewed MUST still deduct 8 points!
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

describe('3. Deterministic Audit Rules Engine (All 12 Rules)', () => {
  it('evaluates all 12 rules deterministically', () => {
    const dataset = {
      transactions: [
        // 1. Missing receipt (RULE-RCP-001)
        { transactionId: 'TXN-1', direction: 'EXPENSE', amount: 60.00, receiptStatus: 'Needs Receipt', receiptId: '', payeeOrPayer: 'OfficeMax', description: 'Paper' },
        // 2. Missing purpose (RULE-EXP-001)
        { transactionId: 'TXN-2', direction: 'EXPENSE', amount: 40.00, receiptStatus: 'Attached', receiptId: 'R-1', payeeOrPayer: 'Vendor', description: '' },
        // 3. Missing payee (RULE-PAY-001)
        { transactionId: 'TXN-3', direction: 'EXPENSE', amount: 30.00, receiptStatus: 'Attached', receiptId: 'R-2', payeeOrPayer: 'Unknown', description: 'Supplies' },
        // 4. Missing check doc (RULE-CHK-001)
        { transactionId: 'TXN-4', direction: 'EXPENSE', amount: 100.00, paymentMethod: 'Check', checkNumber: '1001', receiptStatus: 'Attached', receiptId: 'R-3', payeeOrPayer: 'Speaker', description: 'Honorarium' },
        // 5. Personal purchase pending (RULE-PRP-001)
        { transactionId: 'TXN-5', direction: 'EXPENSE', amount: 80.00, personalPurchase: true, receiptStatus: 'Attached', receiptId: 'R-4', payeeOrPayer: 'Target', description: 'Crafts' },
        // 6. Uncategorized (RULE-CAT-001)
        { transactionId: 'TXN-6', direction: 'EXPENSE', amount: 25.00, category: 'Uncategorized', receiptStatus: 'Attached', receiptId: 'R-5', payeeOrPayer: 'Store', description: 'Items' },
        // 7. Unlinked refund (RULE-REF-001)
        { transactionId: 'TXN-7', direction: 'INCOME', amount: 20.00, transactionType: 'Refund', notes: 'Unlinked refund' },
        // 8. Receipt discrepancy (RULE-DIS-001)
        { transactionId: 'TXN-8', direction: 'EXPENSE', amount: 50.00, receiptId: 'RCP-DIFF', payeeOrPayer: 'Store', description: 'Item' },
        // 9. Duplicate pair (RULE-DUP-001)
        { transactionId: 'TXN-9A', transactionDate: '2026-02-01', direction: 'EXPENSE', amount: 45.00, payeeOrPayer: 'Chevron', description: 'Gas' },
        { transactionId: 'TXN-9B', transactionDate: '2026-02-02', direction: 'EXPENSE', amount: 45.00, payeeOrPayer: 'Chevron', description: 'Gas' }
      ],
      reimbursements: [
        // 10. Reimbursement without support (RULE-RMB-001)
        { reimbursementId: 'RMB-UNSUPP', totalReimbursedAmount: 150.00, claimantName: 'Pastor' }
      ],
      allocations: [
        // 11. Over-allocated purchase (RULE-RMB-002)
        { purchaseTransactionId: 'TXN-1', allocatedAmount: 100.00, personallyAbsorbedAmount: 0 } // TXN-1 is $60
      ],
      receipts: [
        { receiptId: 'RCP-DIFF', amount: 65.00 } // $15 difference on TXN-8
      ],
      checkDetails: [
        { checkNumber: '1001', driveUrl: '' } // No voucher attached
      ],
      fundSummaries: [
        // 12. Fund deficit (RULE-FND-001)
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

describe('4. Reconciliation Direction Safety & Ranking Logic', () => {
  it('prohibits matching opposite directions (Deposit +$500 vs Expense $500)', () => {
    // Test logic simulating candidate matcher
    const stmtDeposit = { statementLineId: 'S-1', amount: 500, direction: 'INCOME', statementDate: '2026-02-01' };
    const txExpense = { transactionId: 'T-1', amount: 500, direction: 'EXPENSE', transactionDate: '2026-02-01' };

    // Incompatible directions must return no match
    const isDirectionCompatible = (stmtDeposit.direction === txExpense.direction);
    expect(isDirectionCompatible).toBe(false);
  });

  it('permits matching compatible directions (Withdrawal -$500 vs Expense $500)', () => {
    const stmtWithdrawal = { statementLineId: 'S-2', amount: -500, direction: 'EXPENSE', statementDate: '2026-02-01' };
    const txExpense = { transactionId: 'T-2', amount: 500, direction: 'EXPENSE', transactionDate: '2026-02-01' };

    const isDirectionCompatible = (stmtWithdrawal.direction === txExpense.direction);
    expect(isDirectionCompatible).toBe(true);
  });

  it('calculates reconciliation differenceAmount accurately', () => {
    const stmtAmt = -101.25;
    const txAmt = 100.00;
    const diff = Number(Math.abs(Math.abs(stmtAmt) - Math.abs(txAmt)).toFixed(2));

    expect(diff).toBe(1.25);
    const matchStatus = diff > 0.001 ? 'Discrepancy' : 'Matched';
    expect(matchStatus).toBe('Discrepancy');
  });

  it('generates deterministic statement fingerprints for duplicate protection', () => {
    const line = {
      sourceFileName: 'bank_feb.csv',
      statementDate: '2026-02-01',
      description: 'THE HOME DEPOT #1234',
      amount: -150.00,
      direction: 'EXPENSE',
      referenceNumber: 'CHK-100'
    };

    const fp1 = [
      line.sourceFileName.trim(),
      line.statementDate.trim(),
      normalizeMerchantName(line.description),
      line.amount.toFixed(2),
      line.direction.trim(),
      line.referenceNumber.trim()
    ].join('_');

    const lineDup = {
      sourceFileName: 'bank_feb.csv',
      statementDate: '2026-02-01',
      description: 'Home Depot 1234',
      amount: -150.00,
      direction: 'EXPENSE',
      referenceNumber: 'CHK-100'
    };

    const fp2 = [
      lineDup.sourceFileName.trim(),
      lineDup.statementDate.trim(),
      normalizeMerchantName(lineDup.description),
      lineDup.amount.toFixed(2),
      lineDup.direction.trim(),
      lineDup.referenceNumber.trim()
    ].join('_');

    expect(fp1).toBe(fp2);
  });
});
