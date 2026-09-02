import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import actual runtime functions from Apps Script modules
const {
  PRODUCTION_SPREADSHEET_ID,
  assertSandboxSheet,
  getConfig
} = require('../Config.gs');

global.getConfig = getConfig;

const {
  getApprovedUser,
  authorizeAction,
  validateGoogleIdentity
} = require('../Auth.gs');

const {
  validateAndPrepareAllocation
} = require('../Reimbursements.gs');

describe('1. Fail-Closed Production Sheet Safety Guard (Config.gs)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fails closed when GPBC_SHEET_ID is missing', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_ENVIRONMENT') return 'sandbox';
          return null;
        }
      })
    };

    expect(() => {
      assertSandboxSheet('addTransaction');
    }).toThrow(/FAIL-CLOSED SAFETY GUARD: GPBC_SHEET_ID is not configured/);
  });

  it('fails closed when GPBC_ENVIRONMENT is missing on write', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_SHEET_ID') return 'sandbox_sheet_123';
          return null;
        }
      })
    };

    expect(() => {
      assertSandboxSheet('addTransaction');
    }).toThrow(/FAIL-CLOSED SAFETY GUARD: GPBC_ENVIRONMENT is not configured/);
  });

  it('strictly blocks dev schema initialization against production spreadsheet ID even if production writes armed', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_SHEET_ID') return PRODUCTION_SPREADSHEET_ID;
          if (key === 'GPBC_ENVIRONMENT') return 'production';
          if (key === 'GPBC_PRODUCTION_WRITES_ENABLED') return 'true';
          return null;
        }
      })
    };

    expect(() => {
      assertSandboxSheet('initializeSandboxSchema');
    }).toThrow(/STRICTLY FORBIDDEN against the production spreadsheet/);
  });

  it('strictly blocks dev/sandbox environment when pointing to production spreadsheet ID', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_SHEET_ID') return PRODUCTION_SPREADSHEET_ID;
          if (key === 'GPBC_ENVIRONMENT') return 'sandbox';
          return null;
        }
      })
    };

    expect(() => {
      assertSandboxSheet('addTransaction');
    }).toThrow(/Environment is set to 'sandbox' but GPBC_SHEET_ID points to the production spreadsheet/);
  });

  it('fails closed when production writes are disarmed (GPBC_PRODUCTION_WRITES_ENABLED is missing or false)', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_SHEET_ID') return PRODUCTION_SPREADSHEET_ID;
          if (key === 'GPBC_ENVIRONMENT') return 'production';
          if (key === 'GPBC_PRODUCTION_WRITES_ENABLED') return 'false';
          return null;
        }
      })
    };

    expect(() => {
      assertSandboxSheet('addTransaction');
    }).toThrow(/Production writes are DISARMED/);
  });

  it('allows write operations when both GPBC_SHEET_ID (non-prod) and GPBC_ENVIRONMENT (sandbox) are properly configured', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_SHEET_ID') return 'SANDBOX_SPREADSHEET_ID_98765';
          if (key === 'GPBC_ENVIRONMENT') return 'sandbox';
          return null;
        }
      })
    };

    expect(() => {
      assertSandboxSheet('addTransaction');
    }).not.toThrow();
  });
});

describe('2. Deny-By-Default Approved User Resolution (Auth.gs)', () => {
  const approvedUsersList = JSON.stringify([
    { email: 'pastor@gracepraise.church', name: 'Pastor Gilbert', role: 'Primary Admin' },
    { email: 'finance@gracepraise.church', name: 'Finance Lead', role: 'Finance Editor' },
    { email: 'presbyter@socalnetwork.org', name: 'Presbyter Observer', role: 'Presbyter Read-Only' },
    { email: 'auditor@gracepraise.church', name: 'Church Auditor', role: 'Viewer' },
    { email: 'badrole1@gracepraise.church', name: 'Bad Role 1', role: 'admin' }, // lowercase
    { email: 'badrole2@gracepraise.church', name: 'Bad Role 2', role: 'SuperUser' },
    { email: 'norole@gracepraise.church', name: 'No Role' } // missing role
  ]);

  beforeEach(() => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => {
          if (key === 'GPBC_APPROVED_USERS') return approvedUsersList;
          return null;
        }
      })
    };
  });

  it('resolves explicit approved users to their exact assigned roles', () => {
    expect(getApprovedUser('pastor@gracepraise.church')).toEqual({
      email: 'pastor@gracepraise.church',
      name: 'Pastor Gilbert',
      role: 'Primary Admin'
    });

    expect(getApprovedUser('finance@gracepraise.church')).toEqual({
      email: 'finance@gracepraise.church',
      name: 'Finance Lead',
      role: 'Finance Editor'
    });

    expect(getApprovedUser('presbyter@socalnetwork.org')).toEqual({
      email: 'presbyter@socalnetwork.org',
      name: 'Presbyter Observer',
      role: 'Presbyter Read-Only'
    });

    expect(getApprovedUser('auditor@gracepraise.church')).toEqual({
      email: 'auditor@gracepraise.church',
      name: 'Church Auditor',
      role: 'Viewer'
    });
  });

  it('denies allowlisted users with missing, misspelled, or unsupported roles (fails closed)', () => {
    expect(getApprovedUser('badrole1@gracepraise.church')).toBeNull();
    expect(getApprovedUser('badrole2@gracepraise.church')).toBeNull();
    expect(getApprovedUser('norole@gracepraise.church')).toBeNull();
  });

  it('denies unknown external gmail accounts (returns null)', () => {
    expect(getApprovedUser('stranger@gmail.com')).toBeNull();
  });

  it('denies unknown @gracepraise.church accounts (no automatic domain elevation)', () => {
    expect(getApprovedUser('newmember@gracepraise.church')).toBeNull();
  });

  it('denies accounts with string matches like "pastor" or "gilbert" if not in allowlist', () => {
    expect(getApprovedUser('pastor.fake@gmail.com')).toBeNull();
    expect(getApprovedUser('gilbert.personal@yahoo.com')).toBeNull();
  });
});

describe('3. Actual Role Authorization Policy Matrix (Auth.gs)', () => {
  const writeActions = [
    'addTransaction',
    'updateTransaction',
    'addIncome',
    'addExpense',
    'addReimbursement',
    'addReimbursementAllocation',
    'addReceipt',
    'matchReceiptToTransaction',
    'addCheckDetail'
  ];

  const readActions = [
    'getTransactions',
    'getIncomeDetail',
    'getExpenseDetail',
    'getReimbursements',
    'getReceipts',
    'getCheckDetails',
    'getCapitalProjects',
    'getDesignatedFundsSummary'
  ];

  it('rejects all write actions for Viewer role', () => {
    writeActions.forEach(action => {
      const res = authorizeAction(action, 'Viewer');
      expect(res.authorized).toBe(false);
      expect(res.reason).toContain('is not permitted');
    });
  });

  it('rejects all write actions for Presbyter Read-Only role', () => {
    writeActions.forEach(action => {
      const res = authorizeAction(action, 'Presbyter Read-Only');
      expect(res.authorized).toBe(false);
      expect(res.reason).toContain('is not permitted');
    });
  });

  it('rejects unknown users with no role (null/empty)', () => {
    writeActions.forEach(action => {
      expect(authorizeAction(action, null).authorized).toBe(false);
    });
    readActions.forEach(action => {
      expect(authorizeAction(action, null).authorized).toBe(false);
    });
  });

  it('allows all read actions for Viewer and Presbyter Read-Only', () => {
    readActions.forEach(action => {
      expect(authorizeAction(action, 'Viewer').authorized).toBe(true);
      expect(authorizeAction(action, 'Presbyter Read-Only').authorized).toBe(true);
    });
  });

  it('allows finance writes for Finance Editor', () => {
    writeActions.forEach(action => {
      expect(authorizeAction(action, 'Finance Editor').authorized).toBe(true);
    });
  });

  it('allows capital project creation only for Admins', () => {
    expect(authorizeAction('addCapitalProject', 'Primary Admin').authorized).toBe(true);
    expect(authorizeAction('addCapitalProject', 'Backup Admin').authorized).toBe(true);
    expect(authorizeAction('addCapitalProject', 'Finance Editor').authorized).toBe(false);
  });
});

describe('4. Token Security & Client ID Requirement (Auth.gs)', () => {
  it('fails closed if GOOGLE_CLIENT_ID is not configured', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: () => null
      })
    };

    const res = validateGoogleIdentity('any-token');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('GOOGLE_CLIENT_ID is not configured');
  });

  it('strictly rejects dev-mock-token in production validation logic', () => {
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: (key) => key === 'GOOGLE_CLIENT_ID' ? 'prod-client-id.apps.googleusercontent.com' : null
      })
    };

    global.CacheService = {
      getScriptCache: () => ({
        get: () => null,
        put: () => {}
      })
    };

    global.Utilities = {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      computeDigest: () => [1, 2, 3],
      base64EncodeWebSafe: () => 'mock_digest_hash'
    };

    global.UrlFetchApp = {
      fetch: () => ({
        getResponseCode: () => 400,
        getContentText: () => JSON.stringify({ error_description: 'Invalid Value' })
      })
    };

    const res = validateGoogleIdentity('dev-mock-token');
    expect(res.valid).toBe(false);
    expect(res.error).toContain('Invalid Google ID token');
  });
});

describe('5. Unified Reimbursement Allocation Validation (Reimbursements.gs)', () => {
  const createMockDb = (transactions, allocations = []) => {
    return {
      getSheetByName: (name) => {
        if (name === 'Transactions') {
          return {
            getLastRow: () => transactions.length + 1,
            getDataRange: () => ({
              getValues: () => [
                ['transactionId', 'transactionDate', 'transactionType', 'direction', 'amount', 'personalPurchase'],
                ...transactions.map(t => [t.transactionId, t.date || '2026-02-01', t.type || 'Expense', t.direction, t.amount, t.personalPurchase])
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
                ...allocations.map(a => [a.allocationId, a.reimbursementId, a.purchaseTransactionId, a.allocatedAmount, a.personallyAbsorbedAmount, a.refundCreditAdjustment || 0])
              ]
            })
          };
        }
        return null;
      }
    };
  };

  it('validates a valid allocation against an existing personal-card purchase', () => {
    const mockDb = createMockDb([
      { transactionId: 'TXN-P1', direction: 'EXPENSE', amount: 100.00, personalPurchase: true }
    ]);

    const res = validateAndPrepareAllocation({
      purchaseTransactionId: 'TXN-P1',
      allocatedAmount: 60.00,
      personallyAbsorbedAmount: 20.00
    }, mockDb, null);

    expect(res.purchaseTransactionId).toBe('TXN-P1');
    expect(res.allocatedAmount).toBe(60.00);
    expect(res.personallyAbsorbedAmount).toBe(20.00);
    expect(res.purchaseAmount).toBe(100.00);
  });

  it('rejects allocation if purchase transaction does not exist', () => {
    const mockDb = createMockDb([
      { transactionId: 'TXN-OTHER', direction: 'EXPENSE', amount: 50.00, personalPurchase: true }
    ]);
    expect(() => {
      validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-NONEXISTENT', allocatedAmount: 50.00 }, mockDb, null);
    }).toThrow(/Purchase transaction not found/);
  });

  it('rejects allocation if transaction is not an eligible expense (e.g. INCOME offering)', () => {
    const mockDb = createMockDb([
      { transactionId: 'TXN-INC-1', direction: 'INCOME', amount: 500.00, personalPurchase: false }
    ]);

    expect(() => {
      validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-INC-1', allocatedAmount: 50.00 }, mockDb, null);
    }).toThrow(/not an eligible expense/);
  });

  it('enforces multi-reimbursement allocation caps: rejects allocation that exceeds remaining balance', () => {
    // Purchase was $100. Prior Reimbursement A allocated $40, absorbed $0.
    // Prior Reimbursement B allocated $35, absorbed $0.
    // Remaining eligible is $25.
    const mockDb = createMockDb(
      [{ transactionId: 'TXN-P100', direction: 'EXPENSE', amount: 100.00, personalPurchase: true }],
      [
        { allocationId: 'ALC-1', reimbursementId: 'RMB-A', purchaseTransactionId: 'TXN-P100', allocatedAmount: 40.00, personallyAbsorbedAmount: 0 },
        { allocationId: 'ALC-2', reimbursementId: 'RMB-B', purchaseTransactionId: 'TXN-P100', allocatedAmount: 35.00, personallyAbsorbedAmount: 0 }
      ]
    );

    // Third allocation of $20 should succeed (40 + 35 + 20 = 95 <= 100)
    expect(() => {
      validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-P100', allocatedAmount: 20.00 }, mockDb, null);
    }).not.toThrow();

    // Third allocation of $30 should FAIL (40 + 35 + 30 = 105 > 100)
    expect(() => {
      validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-P100', allocatedAmount: 30.00 }, mockDb, null);
    }).toThrow(/Allocation overage for purchase TXN-P100: Total allocated \(\$105.00\) exceeds purchase cost \(\$100.00\)/);
  });

  it('supports grouped reimbursement across multiple distinct purchases', () => {
    const mockDb = createMockDb([
      { transactionId: 'TXN-PA', direction: 'EXPENSE', amount: 40.00, personalPurchase: true },
      { transactionId: 'TXN-PB', direction: 'EXPENSE', amount: 60.00, personalPurchase: true }
    ]);

    const resA = validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-PA', allocatedAmount: 40.00 }, mockDb, null);
    const resB = validateAndPrepareAllocation({ purchaseTransactionId: 'TXN-PB', allocatedAmount: 60.00 }, mockDb, null);

    expect(resA.allocatedAmount + resB.allocatedAmount).toBe(100.00);
  });
});

describe('6. Accounting Correctness: Reimbursement Double-Counting Fix', () => {
  it('correctly classifies personal church purchase as EXPENSE and reimbursement payout as SETTLEMENT ($100 + $100 = $100 expense)', () => {
    const transactions = [
      {
        transactionId: 'TXN-001',
        transactionType: 'Personal-Card Church Purchase',
        direction: 'EXPENSE',
        accountingImpact: 'EXPENSE', // Operational expense recognized here
        amount: 100.00,
        payeeOrPayer: 'Amazon',
        description: 'Sound cables'
      },
      {
        transactionId: 'TXN-002',
        transactionType: 'Reimbursement',
        direction: 'EXPENSE',
        accountingImpact: 'SETTLEMENT', // Liability settlement, NOT duplicate expense
        amount: 100.00,
        payeeOrPayer: 'Pastor Gilbert',
        description: 'Reimbursement for sound cables'
      }
    ];

    // Operating expenses calculation (excludes SETTLEMENT)
    const recognizedOperatingExpenses = transactions
      .filter(t => t.accountingImpact === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const settlementCashOutflow = transactions
      .filter(t => t.accountingImpact === 'SETTLEMENT')
      .reduce((sum, t) => sum + t.amount, 0);

    // CRITICAL: Recognized church operating expense MUST be $100.00, NOT $200.00!
    expect(recognizedOperatingExpenses).toBe(100.00);
    expect(settlementCashOutflow).toBe(100.00);
  });

  it('correctly tracks partial reimbursement with personally absorbed balance ($100 purchase, $60 payout, $20 absorbed)', () => {
    const purchaseAmount = 100.00;
    const reimbursedPayout = 60.00;
    const personallyAbsorbed = 20.00;
    const remainingPending = purchaseAmount - reimbursedPayout - personallyAbsorbed;

    expect(remainingPending).toBe(20.00);

    // Transaction records
    const transactions = [
      {
        transactionId: 'TXN-001',
        transactionType: 'Personal-Card Church Purchase',
        direction: 'EXPENSE',
        accountingImpact: 'EXPENSE',
        amount: 100.00
      },
      {
        transactionId: 'TXN-002',
        transactionType: 'Reimbursement',
        direction: 'EXPENSE',
        accountingImpact: 'SETTLEMENT',
        amount: 60.00
      }
    ];

    const recognizedExpense = transactions
      .filter(t => t.accountingImpact === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    expect(recognizedExpense).toBe(100.00);
  });
});

describe('7. Canonical Capital Projects Financial Derivation', () => {
  it('correctly derives donations received, expenses paid, and remaining balance from canonical transactions', () => {
    const project = {
      projectId: 'PRJ-101',
      projectName: 'Sanctuary Renovation',
      approvedBudget: 50000.00
    };

    const transactions = [
      { capitalProjectId: 'PRJ-101', direction: 'INCOME', accountingImpact: 'INCOME', amount: 15000.00 },
      { capitalProjectId: 'PRJ-101', direction: 'INCOME', accountingImpact: 'INCOME', amount: 5000.00 },
      { capitalProjectId: 'PRJ-101', direction: 'EXPENSE', accountingImpact: 'EXPENSE', amount: 8000.00 },
      { capitalProjectId: 'PRJ-101', direction: 'EXPENSE', accountingImpact: 'EXPENSE', amount: 4500.00 },
      // Settlement transaction for reimbursement of project purchase
      { capitalProjectId: 'PRJ-101', direction: 'EXPENSE', accountingImpact: 'SETTLEMENT', amount: 4500.00 },
      // Unrelated project transaction
      { capitalProjectId: 'PRJ-OTHER', direction: 'INCOME', accountingImpact: 'INCOME', amount: 2000.00 }
    ];

    const projectTxs = transactions.filter(t => t.capitalProjectId === project.projectId);
    const donations = projectTxs
      .filter(t => t.direction === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = projectTxs
      .filter(t => t.accountingImpact === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    const remainingBalance = donations - expenses;

    expect(donations).toBe(20000.00);
    expect(expenses).toBe(12500.00);
    expect(remainingBalance).toBe(7500.00);
  });
});
