import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import HelpCenter from './HelpCenter';
import HelpArticleView from './HelpArticleView';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('HelpCenter Component', () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'bookkeeper@gracepraise.church', name: 'Finance User', role: 'Finance Editor' },
      loading: false,
      isAuthenticated: true,
      isAuthorized: () => true
    });
  });

  it('1. Renders Help & Training Center header, subtitle, and search bar', () => {
    render(
      <MemoryRouter initialEntries={['/help']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Help & Training Center')).toBeInTheDocument();
    expect(
      screen.getByText(/Learn how to use GPBC Finance Desk, understand church finance workflows/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search help topics, workflows, rules, or glossary/i)).toBeInTheDocument();
  });

  it('2. Default tab renders 5-Minute Quick Start with all 5 minutes', () => {
    render(
      <MemoryRouter initialEntries={['/help']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/5-Minute Quick Start for Church Finance/i)).toBeInTheDocument();
    expect(screen.getByText('Minute 1')).toBeInTheDocument();
    expect(screen.getByText('Minute 2')).toBeInTheDocument();
    expect(screen.getByText('Minute 3')).toBeInTheDocument();
    expect(screen.getByText('Minute 4')).toBeInTheDocument();
    expect(screen.getByText('Minute 5')).toBeInTheDocument();
  });

  it('3. Client-side search filters topics and displays real-time matching cards', () => {
    render(
      <MemoryRouter initialEntries={['/help']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/Search help topics/i);
    fireEvent.change(searchInput, { target: { value: 'reimbursement' } });

    expect(screen.getByText(/Search Results for "reimbursement"/i)).toBeInTheDocument();
    expect(screen.getByText(/Reimbursements & Personal Purchases/i)).toBeInTheDocument();
  });

  it('4. Switching to Monthly Finance Workflow renders 10 sequential steps', () => {
    render(
      <MemoryRouter initialEntries={['/help?tab=workflow']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/10-Step Monthly Finance Workflow/i)).toBeInTheDocument();
    expect(screen.getByText('Record Income')).toBeInTheDocument();
    expect(screen.getByText('Record Recognized Expenses')).toBeInTheDocument();
    expect(screen.getByText('Close the Month')).toBeInTheDocument();
    expect(screen.getByText('Review / Generate Presbyter Reports')).toBeInTheDocument();
  });

  it('5. Module Guides tab displays all operational guides', () => {
    render(
      <MemoryRouter initialEntries={['/help?tab=modules']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Module-by-Module User Guides/i)).toBeInTheDocument();
    expect(screen.getByText(/Financial Dashboard & Executive KPIs/i)).toBeInTheDocument();
    expect(screen.getByText(/Transactions Master Ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/Capital Projects & Designated Funds/i)).toBeInTheDocument();
    expect(screen.getByText(/Bank & Card Reconciliation/i)).toBeInTheDocument();
    expect(screen.getByText(/Audit Center & Audit Health Score/i)).toBeInTheDocument();
  });

  it('6. Your Role tab highlights user role and switches roles dynamically', () => {
    render(
      <MemoryRouter initialEntries={['/help?tab=roles']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Role-Based Training & Access Governance/i)).toBeInTheDocument();
    // Finance Editor is current role -> has 'YOU' badge
    expect(screen.getByText('YOU')).toBeInTheDocument();
    expect(screen.getByText(/Day-to-day finance entry and review role/i)).toBeInTheDocument();

    // Click Primary Admin tab
    const adminBtn = screen.getByRole('button', { name: /Primary Admin/i });
    fireEvent.click(adminBtn);

    expect(screen.getByText(/Full GPBC Finance Desk administration/i)).toBeInTheDocument();
  });

  it('7. Presbyter user sees "Not available for your role" for operational buttons without redirect', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'presbyter@gracepraise.church', name: 'Presbyter User', role: 'Presbyter Read-Only' },
      loading: false,
      isAuthenticated: true,
      isAuthorized: () => true
    });

    render(
      <MemoryRouter initialEntries={['/help']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    // Quick Start contains operational links that should show "Not available for your role"
    const notAvailableLabels = screen.getAllByText('Not available for your role');
    expect(notAvailableLabels.length).toBeGreaterThan(0);
  });

  it('8. What Should I Do Next tab displays interactive situation cards', () => {
    render(
      <MemoryRouter initialEntries={['/help?tab=what-next']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/"I received Sunday Offering or Midweek Tithes."/i)).toBeInTheDocument();
    expect(screen.getByText(/"I returned an item or received a merchant credit\/refund."/i)).toBeInTheDocument();
    expect(screen.getByText(/"I found a mistake or omission in a month that is already closed."/i)).toBeInTheDocument();
  });

  it('9. Troubleshooting Center expands diagnosis accordions with safe steps', () => {
    render(
      <MemoryRouter initialEntries={['/help?tab=troubleshooting']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    const questionBtn = screen.getByText('I cannot sign in to GPBC Finance Desk');
    fireEvent.click(questionBtn);

    expect(screen.getByText(/Observed Problem:/i)).toBeInTheDocument();
    expect(screen.getByText(/Safe Action Steps:/i)).toBeInTheDocument();
    expect(screen.getByText(/When to contact Primary Admin:/i)).toBeInTheDocument();
  });

  it('10. Glossary renders A-Z terms and filter by letter', () => {
    render(
      <MemoryRouter initialEntries={['/help?tab=glossary']}>
        <Routes>
          <Route path="/help" element={<HelpCenter />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Accounting & Platform Glossary \(A-Z\)/i)).toBeInTheDocument();
    expect(screen.getByText('Recognized Income')).toBeInTheDocument();
    expect(screen.getByText('Audit Health Score')).toBeInTheDocument();
    expect(screen.getByText('Designated Funding Position')).toBeInTheDocument();

    // Filter by letter 'R'
    const rButtons = screen.getAllByRole('button', { name: 'R' });
    fireEvent.click(rButtons[0]);
    expect(screen.getByText('Recognized Income')).toBeInTheDocument();
  });

  it('11. HelpArticleView renders complete guide with print button', () => {
    render(
      <MemoryRouter initialEntries={['/help/reimbursements']}>
        <Routes>
          <Route path="/help/:articleId" element={<HelpArticleView />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Reimbursements & Personal Purchases')).toBeInTheDocument();
    expect(screen.getByText(/Purchase Recognition vs. Reimbursement Payout/i)).toBeInTheDocument();
    expect(screen.getByText(/The Purchase Balance Formula/i)).toBeInTheDocument();
    expect(screen.getByText('Print Guide')).toBeInTheDocument();
  });
});
