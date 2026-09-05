import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { AuditCenter } from './AuditCenter';
import { auditApi } from '../api/auditApi';

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      email: 'gilbert.baidya@gmail.com',
      name: 'Pastor Gilbert Baidya',
      role: 'Primary Admin'
    }
  })
}));

vi.mock('../api/auditApi', () => ({
  auditApi: {
    getAuditIssues: vi.fn(),
    getAuditSummary: vi.fn(),
    runAudit: vi.fn(),
    getReconciliationCandidates: vi.fn(),
    resolveAuditIssue: vi.fn()
  }
}));

describe('AuditCenter - Empty Audit State (Not Yet Evaluated)', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders Not Yet Evaluated state without errors when audit summary has null healthScore', async () => {
    auditApi.getAuditIssues.mockResolvedValue({
      success: true,
      count: 0,
      issues: []
    });

    auditApi.getAuditSummary.mockResolvedValue({
      success: true,
      calculated: false,
      calculatedAt: null,
      healthScore: null
    });

    render(<AuditCenter />);

    // 1. Must render 'Not Yet Evaluated' badge and banner
    await waitFor(() => {
      const elements = screen.getAllByText('Not Yet Evaluated');
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    // 2. Must render 'No completed audit evaluation is available for this period yet.'
    const descriptionElements = screen.getAllByText(/No completed audit evaluation is available for this period yet/i);
    expect(descriptionElements.length).toBeGreaterThanOrEqual(1);

    // 3. Score display in the health score panel should be em-dash '—'
    const scoreHeading = screen.getByText('AUDIT HEALTH SCORE');
    const healthScorePanel = scoreHeading.closest('.glass-panel');
    expect(within(healthScorePanel).getByText('—')).toBeInTheDocument();

    // 4. Must NOT render numeric score 0 or 100 in the health score panel
    expect(within(healthScorePanel).queryByText(/^0$/)).not.toBeInTheDocument();
    expect(within(healthScorePanel).queryByText(/^100$/)).not.toBeInTheDocument();
    expect(within(healthScorePanel).queryByText('/ 100')).not.toBeInTheDocument();

    // 5. Must NOT render misleading score tiers in the health score panel
    expect(within(healthScorePanel).queryByText('Healthy')).not.toBeInTheDocument();
    expect(within(healthScorePanel).queryByText('Cleared')).not.toBeInTheDocument();
    expect(within(healthScorePanel).queryByText('Reconciled')).not.toBeInTheDocument();

    // 6. Must NOT log 'Live audit data unavailable'
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Failed to load audit data'),
      expect.any(Object)
    );
    const hasUnavailableLog = consoleErrorSpy.mock.calls.some(call =>
      call.some(arg => typeof arg === 'string' && arg.includes('Live audit data unavailable'))
    );
    expect(hasUnavailableLog).toBe(false);

    // 7. FinanceDataState "Live audit data unavailable" banner is NOT present
    expect(screen.queryByText('Live audit data unavailable')).not.toBeInTheDocument();
  });
});
