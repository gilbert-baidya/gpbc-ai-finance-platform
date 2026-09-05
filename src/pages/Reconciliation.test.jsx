import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Reconciliation from './Reconciliation';
import { reconciliationApi } from '../api/reconciliationApi';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PeriodProvider } from '../context/PeriodContext';

vi.mock('../api/reconciliationApi', () => ({
  reconciliationApi: {
    getReconciliationRecords: vi.fn(),
    reconcileTransactionRecord: vi.fn(),
    autoReconcilePeriod: vi.fn()
  }
}));

const TestWrapper = ({ children }) => {
  return (
    <AuthProvider>
      <PeriodProvider>
        <AuthInitializer>{children}</AuthInitializer>
      </PeriodProvider>
    </AuthProvider>
  );
};

const AuthInitializer = ({ children }) => {
  const { devSignIn } = useAuth();
  React.useEffect(() => {
    devSignIn('Primary Admin');
  }, [devSignIn]);
  return <>{children}</>;
};

describe('Reconciliation UI Page & Modal Button Rendering Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders visible enabled Reconcile button when status is MATCHED and rules are satisfied', async () => {
    reconciliationApi.getReconciliationRecords.mockResolvedValue({
      success: true,
      summary: { totalRecords: 1, matchedCount: 1, reconciledCount: 0, unmatchedCount: 0, needsReviewCount: 0, differenceAmount: 0, differenceFormatted: '$0.00' },
      records: [
        {
          transactionId: 'TXN-TEST-1',
          transactionDate: '2026-09-02',
          transactionType: 'General Donation',
          payeeOrPayer: 'TEST Donor',
          expectedAmount: 10.00,
          reconciledAmount: 10.00,
          differenceAmount: 0,
          differenceFormatted: '$0.00',
          reconciliationStatus: 'MATCHED',
          satisfiesRules: true,
          blockingReasons: [],
          evidenceStatus: 'Receipt Exempt'
        }
      ]
    });

    render(
      <TestWrapper>
        <Reconciliation />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('TXN-TEST-1')).toBeInTheDocument();
    });

    // Open Review Modal
    const reviewBtn = screen.getAllByRole('button').find(b => b.textContent.trim().includes('Review') && !b.textContent.includes('Needs'));
    fireEvent.click(reviewBtn);

    // Modal opens
    await waitFor(() => {
      expect(screen.getByText(/Deterministic accounting rules satisfied/i)).toBeInTheDocument();
    });

    // Check Reconcile button visibility and enabled state
    const reconcileBtns = screen.getAllByRole('button', { name: /^reconcile$/i });
    expect(reconcileBtns.length).toBeGreaterThan(0);
    const modalReconcileBtn = reconcileBtns[reconcileBtns.length - 1];
    expect(modalReconcileBtn).toBeInTheDocument();
    expect(modalReconcileBtn).not.toBeDisabled();
    expect(modalReconcileBtn).toHaveStyle('color: rgb(255, 255, 255)');
  });

  it('renders visible disabled Reconcile button when status is MATCHED but rules are not satisfied', async () => {
    reconciliationApi.getReconciliationRecords.mockResolvedValue({
      success: true,
      summary: { totalRecords: 1, matchedCount: 1, reconciledCount: 0, unmatchedCount: 0, needsReviewCount: 0, differenceAmount: 0, differenceFormatted: '$0.00' },
      records: [
        {
          transactionId: 'TXN-TEST-BLOCKED',
          transactionDate: '2026-09-02',
          transactionType: 'Expense',
          payeeOrPayer: 'Vendor',
          expectedAmount: 500.00,
          reconciledAmount: 500.00,
          differenceAmount: 0,
          differenceFormatted: '$0.00',
          reconciliationStatus: 'MATCHED',
          satisfiesRules: false,
          blockingReasons: ['Missing required itemized receipt'],
          evidenceStatus: 'No Evidence'
        }
      ]
    });

    render(
      <TestWrapper>
        <Reconciliation />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('TXN-TEST-BLOCKED')).toBeInTheDocument();
    });

    // Open Review Modal
    const reviewBtn = screen.getAllByRole('button').find(b => b.textContent.trim().includes('Review') && !b.textContent.includes('Needs'));
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText(/Missing required itemized receipt/i)).toBeInTheDocument();
    });

    const reconcileBtns = screen.getAllByRole('button', { name: /^reconcile$/i });
    expect(reconcileBtns.length).toBeGreaterThan(0);
    const modalReconcileBtn = reconcileBtns[reconcileBtns.length - 1];
    expect(modalReconcileBtn).toBeInTheDocument();
    expect(modalReconcileBtn).toBeDisabled();
  });

  it('does not render Reconcile mutation button when status is already RECONCILED', async () => {
    reconciliationApi.getReconciliationRecords.mockResolvedValue({
      success: true,
      summary: { totalRecords: 1, matchedCount: 0, reconciledCount: 1, unmatchedCount: 0, needsReviewCount: 0, differenceAmount: 0, differenceFormatted: '$0.00' },
      records: [
        {
          transactionId: 'TXN-TEST-RECONCILED',
          transactionDate: '2026-09-02',
          transactionType: 'General Donation',
          payeeOrPayer: 'TEST Donor',
          expectedAmount: 10.00,
          reconciledAmount: 10.00,
          differenceAmount: 0,
          differenceFormatted: '$0.00',
          reconciliationStatus: 'RECONCILED',
          satisfiesRules: true,
          blockingReasons: [],
          evidenceStatus: 'Receipt Exempt'
        }
      ]
    });

    render(
      <TestWrapper>
        <Reconciliation />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('TXN-TEST-RECONCILED')).toBeInTheDocument();
    });

    const reviewBtn = screen.getAllByRole('button').find(b => b.textContent.trim().includes('Review') && !b.textContent.includes('Needs'));
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText(/RECONCILED — Historical & Canonical Record Verified/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /^reconcile$/i })).not.toBeInTheDocument();
  });

  it('calls reconcileTransactionRecord with RECONCILED target status when Reconcile button is clicked', async () => {
    reconciliationApi.getReconciliationRecords.mockResolvedValue({
      success: true,
      summary: { totalRecords: 1, matchedCount: 1, reconciledCount: 0, unmatchedCount: 0, needsReviewCount: 0, differenceAmount: 0, differenceFormatted: '$0.00' },
      records: [
        {
          transactionId: 'TXN-TEST-CLICK',
          transactionDate: '2026-09-02',
          transactionType: 'General Donation',
          payeeOrPayer: 'TEST Donor',
          expectedAmount: 10.00,
          reconciledAmount: 10.00,
          differenceAmount: 0,
          differenceFormatted: '$0.00',
          reconciliationStatus: 'MATCHED',
          satisfiesRules: true,
          blockingReasons: [],
          evidenceStatus: 'Receipt Exempt'
        }
      ]
    });
    reconciliationApi.reconcileTransactionRecord.mockResolvedValue({
      success: true,
      transactionId: 'TXN-TEST-CLICK',
      reconciliationStatus: 'RECONCILED'
    });

    render(
      <TestWrapper>
        <Reconciliation />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('TXN-TEST-CLICK')).toBeInTheDocument();
    });

    const reviewBtn = screen.getAllByRole('button').find(b => b.textContent.trim().includes('Review') && !b.textContent.includes('Needs'));
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText(/Deterministic accounting rules satisfied/i)).toBeInTheDocument();
    });

    const reconcileBtns = screen.getAllByRole('button', { name: /^reconcile$/i });
    const modalReconcileBtn = reconcileBtns[reconcileBtns.length - 1];
    fireEvent.click(modalReconcileBtn);

    await waitFor(() => {
      expect(reconciliationApi.reconcileTransactionRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'TXN-TEST-CLICK',
          reconciliationStatus: 'RECONCILED'
        })
      );
    });
  });
});
