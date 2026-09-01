import { describe, it, expect, beforeEach } from 'vitest';

/**
 * Apps Script Phase 2 Pure Logic and Invariant Tests
 */

// 1. Authorization & Role Write Rejection Tests
describe('Phase 2 Role Authorization Matrix', () => {
  const ALL_ADMINS = ['Primary Admin', 'Backup Admin'];
  const FINANCE_WRITERS = ['Primary Admin', 'Backup Admin', 'Finance Editor'];
  const READ_ONLY_ROLES = ['Viewer', 'Presbyter Read-Only'];

  const writeActions = [
    'addTransaction',
    'updateTransaction',
    'addIncome',
    'addExpense',
    'addReimbursement',
    'addReimbursementAllocation',
    'addReceipt',
    'matchReceiptToTransaction',
    'addCheckDetail',
    'addCapitalProject'
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

  function authorizeAction(action, role) {
    const PERMISSION_MATRIX = {
      getTransactions: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
      getIncomeDetail: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
      getExpenseDetail: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
      getReimbursements: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
      getReceipts: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
      getCheckDetails: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
      getCapitalProjects: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],
      getDesignatedFundsSummary: ['Primary Admin', 'Backup Admin', 'Finance Editor', 'Viewer', 'Presbyter Read-Only'],

      addTransaction: FINANCE_WRITERS,
      updateTransaction: FINANCE_WRITERS,
      deleteTransaction: ALL_ADMINS,
      addIncome: FINANCE_WRITERS,
      addExpense: FINANCE_WRITERS,
      addReimbursement: FINANCE_WRITERS,
      addReimbursementAllocation: FINANCE_WRITERS,
      addReceipt: FINANCE_WRITERS,
      matchReceiptToTransaction: FINANCE_WRITERS,
      addCheckDetail: FINANCE_WRITERS,
      addCapitalProject: ALL_ADMINS,
      initializeSandboxSchema: ALL_ADMINS
    };

    const allowed = PERMISSION_MATRIX[action];
    if (!allowed) return { authorized: false, reason: 'Unknown action' };
    if (allowed.includes(role)) return { authorized: true };
    return { authorized: false, reason: `Role ${role} denied for ${action}` };
  }

  it('rejects all write actions for Viewer role', () => {
    writeActions.forEach(action => {
      const res = authorizeAction(action, 'Viewer');
      expect(res.authorized).toBe(false);
    });
  });

  it('rejects all write actions for Presbyter Read-Only role', () => {
    writeActions.forEach(action => {
      const res = authorizeAction(action, 'Presbyter Read-Only');
      expect(res.authorized).toBe(false);
    });
  });

  it('allows finance writes for Finance Editor role', () => {
    writeActions.forEach(action => {
      if (action !== 'addCapitalProject') {
        const res = authorizeAction(action, 'Finance Editor');
        expect(res.authorized).toBe(true);
      }
    });
  });

  it('allows all read actions for Viewer and Presbyter Read-Only', () => {
    readActions.forEach(action => {
      expect(authorizeAction(action, 'Viewer').authorized).toBe(true);
      expect(authorizeAction(action, 'Presbyter Read-Only').authorized).toBe(true);
    });
  });
});

// 2. Sandbox Production-ID Safety Guard Test
describe('Sandbox Production Sheet Write Safety Guard', () => {
  const PRODUCTION_SPREADSHEET_ID = '1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s';

  function assertSandboxSheet(sheetId, environment, operationName) {
    if (!sheetId) {
      throw new Error(`SAFETY GUARD: GPBC_SHEET_ID is not configured. Operation '${operationName}' blocked.`);
    }
    if (sheetId === PRODUCTION_SPREADSHEET_ID && environment !== 'production') {
      throw new Error(
        `SAFETY GUARD: Operation '${operationName}' is forbidden against the production spreadsheet (${PRODUCTION_SPREADSHEET_ID}).`
      );
    }
  }

  it('throws safety error when write operation targets production ID in dev/sandbox', () => {
    expect(() => {
      assertSandboxSheet(PRODUCTION_SPREADSHEET_ID, 'sandbox', 'initializeSandboxSchema');
    }).toThrow(/SAFETY GUARD: Operation 'initializeSandboxSchema' is forbidden against the production spreadsheet/);
  });

  it('allows write operation when targeting non-production sandbox ID', () => {
    expect(() => {
      assertSandboxSheet('SANDBOX_SHEET_ID_98765', 'sandbox', 'addTransaction');
    }).not.toThrow();
  });
});

// 3. Reimbursement Invariant & Allocation Engine Tests
describe('Reimbursement Allocation Invariants', () => {
  function validateReimbursement({ totalPurchaseAmount, totalReimbursedAmount, totalPersonallyAbsorbed }) {
    const purchase = Number(totalPurchaseAmount || 0);
    const reimbursed = Number(totalReimbursedAmount || 0);
    const absorbed = Number(totalPersonallyAbsorbed || 0);

    if (purchase <= 0 || reimbursed < 0 || absorbed < 0) {
      throw new Error('Invalid amounts');
    }

    if (reimbursed + absorbed > purchase + 0.01) {
      throw new Error(
        `Reimbursement invariant violation: Total reimbursed ($${reimbursed}) + absorbed ($${absorbed}) exceeds purchase cost ($${purchase})`
      );
    }

    const remaining = Number(Math.max(0, purchase - reimbursed - absorbed).toFixed(2));
    let status = 'Approved';
    if (remaining > 0 && reimbursed > 0) status = 'Partially Reimbursed';
    else if (remaining === 0 && reimbursed > 0) status = 'Fully Reimbursed';

    return {
      purchase,
      reimbursed,
      absorbed,
      remaining,
      status
    };
  }

  it('correctly handles exact reimbursement ($50.00 purchase, $50.00 reimbursed)', () => {
    const res = validateReimbursement({
      totalPurchaseAmount: 50.00,
      totalReimbursedAmount: 50.00,
      totalPersonallyAbsorbed: 0
    });
    expect(res.remaining).toBe(0);
    expect(res.status).toBe('Fully Reimbursed');
  });

  it('correctly handles partial reimbursement with personally absorbed balance ($25.50 purchase, $24.12 reimbursed, $1.38 absorbed)', () => {
    const res = validateReimbursement({
      totalPurchaseAmount: 25.50,
      totalReimbursedAmount: 24.12,
      totalPersonallyAbsorbed: 1.38
    });
    expect(res.remaining).toBe(0);
    expect(res.reimbursed).toBe(24.12);
    expect(res.absorbed).toBe(1.38);
    expect(res.status).toBe('Fully Reimbursed');
  });

  it('correctly calculates remaining pending balance on partial payout ($100.00 purchase, $40.00 reimbursed)', () => {
    const res = validateReimbursement({
      totalPurchaseAmount: 100.00,
      totalReimbursedAmount: 40.00,
      totalPersonallyAbsorbed: 0
    });
    expect(res.remaining).toBe(60.00);
    expect(res.status).toBe('Partially Reimbursed');
  });

  it('rejects reimbursement overage where reimbursed + absorbed exceeds purchase cost', () => {
    expect(() => {
      validateReimbursement({
        totalPurchaseAmount: 50.00,
        totalReimbursedAmount: 60.00,
        totalPersonallyAbsorbed: 0
      });
    }).toThrow(/Reimbursement invariant violation/);
  });
});

// 4. Schema Initializer Idempotency Test
describe('Schema Initializer Idempotency', () => {
  function simulateSchemaInit(existingSheets, schemaDefs) {
    const state = { ...existingSheets };
    const logs = [];

    Object.keys(schemaDefs).forEach(tab => {
      if (!state[tab]) {
        state[tab] = [...schemaDefs[tab]];
        logs.push({ tab, action: 'created' });
      } else {
        const existing = state[tab];
        const missing = schemaDefs[tab].filter(h => !existing.includes(h));
        if (missing.length > 0) {
          state[tab] = [...existing, ...missing];
          logs.push({ tab, action: 'headers_extended', added: missing });
        } else {
          logs.push({ tab, action: 'verified' });
        }
      }
    });

    return { state, logs };
  }

  const defs = {
    Transactions: ['transactionId', 'amount', 'payeeOrPayer'],
    Reimbursements: ['reimbursementId', 'claimantName', 'totalReimbursedAmount']
  };

  it('creates missing tabs on first pass and makes no changes on subsequent passes (idempotent)', () => {
    // Pass 1: Empty state
    const pass1 = simulateSchemaInit({}, defs);
    expect(pass1.logs[0].action).toBe('created');
    expect(pass1.state.Transactions).toEqual(['transactionId', 'amount', 'payeeOrPayer']);

    // Pass 2: Re-running against existing schema
    const pass2 = simulateSchemaInit(pass1.state, defs);
    expect(pass2.logs.every(l => l.action === 'verified')).toBe(true);
    expect(pass2.state.Transactions).toEqual(['transactionId', 'amount', 'payeeOrPayer']);
  });
});
