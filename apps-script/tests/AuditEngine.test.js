import { describe, it, expect } from 'vitest';

const {
  evaluateAuditRules,
  calculateAuditHealthScore
} = require('../Audit.gs');

const {
  validateAndPrepareAllocation
} = require('../Reimbursements.gs');

const createMockDb = (transactions = [], reimbursements = [], allocations = [], receipts = [], checks = []) => {
  return {
    getSheetByName: (name) => {
      if (name === 'Transactions') {
        return {
          getLastRow: () => transactions.length + 1,
          getDataRange: () => ({
            getValues: () => [
              ['transactionId', 'transactionDate', 'transactionType', 'direction', 'amount', 'personalPurchase', 'paymentMethod', 'checkNumber', 'receiptStatus', 'receiptId', 'accountingImpact'],
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
                t.accountingImpact || (t.transactionType === 'Reimbursement' ? 'SETTLEMENT' : t.direction)
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
              ['allocationId', 'reimbursementId', 'purchaseTransactionId', 'allocatedAmount', 'personallyAbsorbedAmount', 'refundCreditAdjustment'],
              ...allocations.map(a => [
                a.allocationId || 'ALC-1',
                a.reimbursementId || 'RMB-1',
                a.purchaseTransactionId,
                a.allocatedAmount || 0,
                a.personallyAbsorbedAmount || 0,
                a.refundCreditAdjustment || 0
              ])
            ]
          })
        };
      }
      return null;
    }
  };
};

describe('1. Part A Edge-Case Hardening (Reimbursements.gs)', () => {
  it('strictly rejects ordinary church credit-card expenses from reimbursement eligibility', () => {
    const mockDb = createMockDb([
      {
        transactionId: 'TXN-CARD-1',
        direction: 'EXPENSE',
        amount: 150.00,
        personalPurchase: false,
        paymentMethod: 'Credit Card',
        transactionType: 'Expense'
      }
    ]);

    expect(() => {
      validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-CARD-1', allocatedAmount: 150.00 }, mockDb, null);
    }).toThrow(/church-paid disbursement/);
  });

  it('strictly rejects church check disbursements from reimbursement eligibility', () => {
    const mockDb = createMockDb([
      {
        transactionId: 'TXN-CHK-1',
        direction: 'EXPENSE',
        amount: 500.00,
        personalPurchase: false,
        paymentMethod: 'Check',
        transactionType: 'Expense'
      }
    ]);

    expect(() => {
      validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-CHK-1', allocatedAmount: 500.00 }, mockDb, null);
    }).toThrow(/church-paid disbursement/);
  });

  it('allows personal-card church purchases for reimbursement', () => {
    const mockDb = createMockDb([
      {
        transactionId: 'TXN-PERS-1',
        direction: 'EXPENSE',
        amount: 85.00,
        personalPurchase: true,
        paymentMethod: 'Personal Card',
        transactionType: 'Personal-Card Church Purchase'
      }
    ]);

    const res = validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-PERS-1', allocatedAmount: 85.00 }, mockDb, null);
    expect(res.allocatedAmount).toBe(85.00);
    expect(res.purchaseAmount).toBe(85.00);
  });

  it('rejects invalid or negative refundCreditAdjustment values', () => {
    const mockDb = createMockDb([
      {
        transactionId: 'TXN-PERS-2',
        direction: 'EXPENSE',
        amount: 100.00,
        personalPurchase: true,
        paymentMethod: 'Personal Card'
      }
    ]);

    expect(() => {
      validateAndPrepareAllocation({
        purchaseTransactionId: 'TXN-PERS-2',
        allocatedAmount: 50.00,
        refundCreditAdjustment: -20.00
      }, mockDb, null);
    }).toThrow(/refundCreditAdjustment must be a finite non-negative number/);
  });
});

describe('2. Deterministic Audit Rules Engine (evaluateAuditRules)', () => {
  it('evaluates RULE-RCP-001 (Missing Receipt) with severity tiers', () => {
    const dataset = {
      transactions: [
        {
          transactionId: 'TXN-EXP-SMALL',
          direction: 'EXPENSE',
          accountingImpact: 'EXPENSE',
          amount: 35.00,
          payeeOrPayer: 'Dollar Tree',
          receiptStatus: 'Needs Receipt',
          receiptId: ''
        },
        {
          transactionId: 'TXN-EXP-LARGE',
          direction: 'EXPENSE',
          accountingImpact: 'EXPENSE',
          amount: 250.00,
          payeeOrPayer: 'Guitar Center',
          receiptStatus: 'Needs Receipt',
          receiptId: ''
        },
        {
          transactionId: 'TXN-EXP-EXEMPT',
          direction: 'EXPENSE',
          accountingImpact: 'EXPENSE',
          amount: 500.00,
          payeeOrPayer: 'Bank Fee',
          receiptStatus: 'Exempt',
          receiptId: ''
        }
      ]
    };

    const findings = evaluateAuditRules(dataset);
    const receiptFindings = findings.filter(f => f.ruleId === 'RULE-RCP-001');

    expect(receiptFindings.length).toBe(2);
    expect(receiptFindings.find(f => f.entityId === 'TXN-EXP-SMALL')?.severity).toBe('MEDIUM');
    expect(receiptFindings.find(f => f.entityId === 'TXN-EXP-LARGE')?.severity).toBe('HIGH');
  });

  it('evaluates RULE-EXP-001 & RULE-PAY-001 (Missing Purpose / Payee)', () => {
    const dataset = {
      transactions: [
        {
          transactionId: 'TXN-NO-DESC',
          direction: 'EXPENSE',
          accountingImpact: 'EXPENSE',
          amount: 40.00,
          payeeOrPayer: 'Office Depot',
          description: ''
        },
        {
          transactionId: 'TXN-NO-PAYEE',
          direction: 'EXPENSE',
          accountingImpact: 'EXPENSE',
          amount: 60.00,
          payeeOrPayer: '',
          description: 'Sunday School Supplies'
        }
      ]
    };

    const findings = evaluateAuditRules(dataset);
    expect(findings.some(f => f.ruleId === 'RULE-EXP-001' && f.entityId === 'TXN-NO-DESC')).toBe(true);
    expect(findings.some(f => f.ruleId === 'RULE-PAY-001' && f.entityId === 'TXN-NO-PAYEE')).toBe(true);
  });

  it('evaluates RULE-CHK-001 (Missing Check Documentation / Voucher)', () => {
    const dataset = {
      transactions: [
        {
          transactionId: 'TXN-CHK-MISSING-DOC',
          direction: 'EXPENSE',
          paymentMethod: 'Check',
          checkNumber: '1042',
          amount: 300.00,
          payeeOrPayer: 'Guest Speaker'
        }
      ],
      checkDetails: [
        { checkNumber: '1042', driveUrl: '' } // No voucher attached
      ]
    };

    const findings = evaluateAuditRules(dataset);
    expect(findings.some(f => f.ruleId === 'RULE-CHK-001' && f.entityId === 'TXN-CHK-MISSING-DOC')).toBe(true);
  });

  it('evaluates RULE-PRP-001 (Personal Purchase Pending Reimbursement)', () => {
    const dataset = {
      transactions: [
        {
          transactionId: 'TXN-PRP-100',
          direction: 'EXPENSE',
          personalPurchase: true,
          amount: 100.00,
          claimantName: 'Pastor Gilbert'
        }
      ],
      allocations: [
        { purchaseTransactionId: 'TXN-PRP-100', allocatedAmount: 40.00, personallyAbsorbedAmount: 0 }
      ]
    };

    const findings = evaluateAuditRules(dataset);
    const prpFinding = findings.find(f => f.ruleId === 'RULE-PRP-001');
    expect(prpFinding).toBeDefined();
    expect(prpFinding.amount).toBe(60.00);
    expect(prpFinding.status).toBe('Partial Reimbursement');
  });

  it('evaluates RULE-DUP-001 (Possible Duplicate Transaction Detection)', () => {
    const dataset = {
      transactions: [
        {
          transactionId: 'TXN-DUP-1',
          transactionDate: '2026-02-10',
          direction: 'EXPENSE',
          amount: 75.50,
          payeeOrPayer: 'Costco Wholesale'
        },
        {
          transactionId: 'TXN-DUP-2',
          transactionDate: '2026-02-11', // Within 1 day
          direction: 'EXPENSE',
          amount: 75.50,
          payeeOrPayer: 'Costco Wholesale'
        }
      ]
    };

    const findings = evaluateAuditRules(dataset);
    const dupFinding = findings.find(f => f.ruleId === 'RULE-DUP-001');
    expect(dupFinding).toBeDefined();
    expect(dupFinding.status).toBe('Possible Duplicate');
  });

  it('evaluates RULE-FND-001 (Designated Fund Overdraft / Deficit)', () => {
    const dataset = {
      fundSummaries: [
        { fundId: 'Building Fund', netBalance: 15000.00 },
        { fundId: 'Youth Camp', netBalance: -450.00 } // Deficit!
      ]
    };

    const findings = evaluateAuditRules(dataset);
    const fndFinding = findings.find(f => f.ruleId === 'RULE-FND-001');
    expect(fndFinding).toBeDefined();
    expect(fndFinding.severity).toBe('CRITICAL');
    expect(fndFinding.amount).toBe(450.00);
  });

  it('evaluates RULE-DIS-001 (Receipt vs Transaction Amount Discrepancy)', () => {
    const dataset = {
      transactions: [
        {
          transactionId: 'TXN-DISC-1',
          direction: 'EXPENSE',
          amount: 120.00,
          receiptId: 'RCP-123'
        }
      ],
      receipts: [
        { receiptId: 'RCP-123', amount: 135.50 } // $15.50 difference
      ]
    };

    const findings = evaluateAuditRules(dataset);
    const discFinding = findings.find(f => f.ruleId === 'RULE-DIS-001');
    expect(discFinding).toBeDefined();
    expect(discFinding.severity).toBe('HIGH');
    expect(discFinding.amount).toBeCloseTo(15.50);
  });
});

describe('3. Deterministic Explainable Audit Health Score (calculateAuditHealthScore)', () => {
  it('returns 100 for clean audit with 0 unresolved issues', () => {
    const res = calculateAuditHealthScore([]);
    expect(res.score).toBe(100);
    expect(res.scoreTier).toBe('Excellent / Audit Ready');
    expect(res.totalUnresolvedIssues).toBe(0);
  });

  it('applies documented point deductions and caps correctly', () => {
    const issues = [
      { severity: 'CRITICAL', status: 'Discrepancy' },
      { severity: 'CRITICAL', status: 'Discrepancy' },
      { severity: 'CRITICAL', status: 'Discrepancy' },
      { severity: 'CRITICAL', status: 'Discrepancy' }, // 4 criticals = 60 pts -> capped at 45 pts
      { severity: 'HIGH', status: 'Needs Receipt' },     // 1 high = 8 pts
      { severity: 'MEDIUM', status: 'Needs Explanation' }, // 1 med = 3 pts
      { severity: 'LOW', status: 'Needs Explanation' },    // 1 low = 1 pt
      { severity: 'HIGH', status: 'Cleared' }            // Resolved = 0 pts
    ];

    const res = calculateAuditHealthScore(issues);
    // Deductions: Crit capped at 45 + High 8 + Med 3 + Low 1 = 57 pts
    // Score: 100 - 57 = 43
    expect(res.deductions.criticalDeduction).toBe(45);
    expect(res.deductions.highDeduction).toBe(8);
    expect(res.deductions.mediumDeduction).toBe(3);
    expect(res.deductions.lowDeduction).toBe(1);
    expect(res.deductions.totalDeduction).toBe(57);
    expect(res.score).toBe(43);
    expect(res.scoreTier).toBe('Critical Attention Needed');
  });

  it('does not deduct points for Reviewed or Cleared issues', () => {
    const issues = [
      { severity: 'CRITICAL', status: 'Reviewed' },
      { severity: 'HIGH', status: 'Cleared' },
      { severity: 'MEDIUM', status: 'Reconciled' }
    ];

    const res = calculateAuditHealthScore(issues);
    expect(res.score).toBe(100);
    expect(res.totalUnresolvedIssues).toBe(0);
  });
});
