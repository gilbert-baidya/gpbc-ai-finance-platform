import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FinanceDashboard from './FinanceDashboard';
import { financeApi } from '../api/financeApi';
import { auditApi } from '../api/auditApi';

vi.mock('../api/financeApi', () => ({
  financeApi: {
    getTransactions: vi.fn(),
    getReimbursements: vi.fn(),
    getReceipts: vi.fn(),
    getCapitalProjects: vi.fn()
  }
}));

vi.mock('../api/auditApi', () => ({
  auditApi: {
    getAuditIssues: vi.fn(),
    getAuditSummary: vi.fn()
  }
}));

vi.mock('recharts', () => {
  const Container = ({ children }) => <div>{children}</div>;
  return {
    Bar: Container,
    BarChart: Container,
    CartesianGrid: Container,
    Cell: Container,
    Legend: Container,
    Pie: Container,
    PieChart: Container,
    ResponsiveContainer: Container,
    Tooltip: Container,
    XAxis: Container,
    YAxis: Container
  };
});

const renderDashboard = () => render(<MemoryRouter><FinanceDashboard /></MemoryRouter>);

describe('FinanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows neutral unknown states when finance data is unavailable', async () => {
    financeApi.getTransactions.mockRejectedValue(new Error('Sandbox unavailable'));
    financeApi.getReimbursements.mockRejectedValue(new Error('Sandbox unavailable'));
    financeApi.getReceipts.mockRejectedValue(new Error('Sandbox unavailable'));
    financeApi.getCapitalProjects.mockRejectedValue(new Error('Sandbox unavailable'));
    auditApi.getAuditIssues.mockRejectedValue(new Error('Sandbox unavailable'));
    auditApi.getAuditSummary.mockRejectedValue(new Error('Sandbox unavailable'));

    renderDashboard();

    expect(await screen.findByText('Finance data connection unavailable')).toBeInTheDocument();
    expect(screen.getByText('Not calculated yet')).toBeInTheDocument();
    expect(screen.queryByText('Grade N/A')).not.toBeInTheDocument();
    const incomeCard = screen.getByText('Total Income').closest('article');
    expect(within(incomeCard).getByText('—')).toBeInTheDocument();
  });

  it('excludes reimbursement settlements from recognized expenses and preserves a real zero audit score', async () => {
    financeApi.getTransactions.mockResolvedValue({
      transactions: [
        { transactionId: 'TX-1', transactionDate: '2026-09-01', transactionType: 'Sunday Offering', direction: 'INCOME', amount: 1000 },
        { transactionId: 'TX-2', transactionDate: '2026-09-02', transactionType: 'Expense', direction: 'EXPENSE', accountingImpact: 'EXPENSE', amount: 300 },
        { transactionId: 'TX-3', transactionDate: '2026-09-03', transactionType: 'Reimbursement Payment', direction: 'EXPENSE', accountingImpact: 'SETTLEMENT', amount: 200 }
      ]
    });
    financeApi.getReimbursements.mockResolvedValue({ reimbursements: [] });
    financeApi.getReceipts.mockResolvedValue({ receipts: [] });
    financeApi.getCapitalProjects.mockResolvedValue({ projects: [] });
    auditApi.getAuditIssues.mockResolvedValue({ issues: [] });
    auditApi.getAuditSummary.mockResolvedValue({ healthScore: { score: 0, scoreTier: 'Critical' } });

    renderDashboard();

    await waitFor(() => expect(within(screen.getByText('Total Income').closest('article')).getByText('$1,000')).toBeInTheDocument());
    expect(within(screen.getByText('Recognized Expenses').closest('article')).getByText('$300')).toBeInTheDocument();
    expect(within(screen.getByText('Net Position').closest('article')).getByText('$700')).toBeInTheDocument();
    expect(within(screen.getByText('Audit Health Score').closest('article')).getByText('0')).toBeInTheDocument();
    expect(screen.queryByText('Not calculated yet')).not.toBeInTheDocument();
  });
});