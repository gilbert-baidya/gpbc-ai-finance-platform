import { describe, it, expect, vi, beforeEach } from 'vitest';
import { financeApi } from './financeApi';
import * as gasFetchModule from './gasFetch';

describe('financeApi Client Module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls getTransactions with filters', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValueOnce({
      success: true,
      totalCount: 1,
      transactions: [{
        transactionId: 'TXN-1',
        transactionDate: '2026-02-01',
        transactionType: 'Sunday Offering',
        direction: 'INCOME',
        amount: 250.00,
        payeeOrPayer: 'John Doe',
        description: 'Sunday Tithe'
      }]
    } as any);

    const result = await financeApi.getTransactions({ direction: 'INCOME' });
    expect(spy).toHaveBeenCalledWith('getTransactions', { direction: 'INCOME' });
    expect(result.transactions?.length).toBe(1);
    expect(result.transactions?.[0]?.amount).toBe(250.00);
  });

  it('calls addTransaction with valid payload', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValueOnce({
      success: true,
      transactionId: 'TXN-20260201-12345'
    } as any);

    const result = await financeApi.addTransaction({
      transactionDate: '2026-02-01',
      transactionType: 'Expense',
      direction: 'EXPENSE',
      amount: 45.00,
      payeeOrPayer: 'Amazon',
      description: 'Sound cables'
    });

    expect(spy).toHaveBeenCalledWith('addTransaction', expect.objectContaining({
      amount: 45.00,
      payeeOrPayer: 'Amazon'
    }));
    expect(result.transactionId).toBe('TXN-20260201-12345');
  });

  it('calls addReimbursement with many-to-many allocations', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValueOnce({
      success: true,
      reimbursementId: 'RMB-20260201-9999',
      remainingReimbursable: 0
    } as any);

    const result = await financeApi.addReimbursement({
      reimbursementDate: '2026-02-01',
      claimantName: 'Pastor Gilbert',
      totalPurchaseAmount: 25.50,
      totalReimbursedAmount: 24.12,
      totalPersonallyAbsorbed: 1.38,
      allocations: [{
        purchaseTransactionId: 'TXN-001',
        allocatedAmount: 24.12,
        personallyAbsorbedAmount: 1.38
      }]
    });

    expect(spy).toHaveBeenCalledWith('addReimbursement', expect.objectContaining({
      totalReimbursedAmount: 24.12,
      totalPersonallyAbsorbed: 1.38
    }));
    expect(result.reimbursementId).toBe('RMB-20260201-9999');
  });

  it('calls matchReceiptToTransaction', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValueOnce({
      success: true,
      receiptId: 'RCP-101',
      matchedTransactionId: 'TXN-202'
    } as any);

    const result = await financeApi.matchReceiptToTransaction('RCP-101', 'TXN-202');
    expect(spy).toHaveBeenCalledWith('matchReceiptToTransaction', {
      receiptId: 'RCP-101',
      transactionId: 'TXN-202'
    });
    expect(result.receiptId).toBe('RCP-101');
  });

  it('calls getCapitalProjects and returns summary', async () => {
    const spy = vi.spyOn(gasFetchModule, 'gasFetch').mockResolvedValueOnce({
      success: true,
      projects: [{
        projectId: 'PRJ-01',
        projectName: 'Sound System Overhaul',
        status: 'Active',
        approvedBudget: 15000,
        designatedDonationsReceived: 10000,
        otherFunding: 0,
        expensesPaid: 4500,
        pendingCommitments: 0,
        remainingDesignatedBalance: 5500
      }]
    } as any);

    const result = await financeApi.getCapitalProjects();
    expect(spy).toHaveBeenCalledWith('getCapitalProjects');
    expect(result.projects?.[0]?.remainingDesignatedBalance).toBe(5500);
  });
});
