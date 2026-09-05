import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Settings from './Settings';
import { gasFetch } from '../api/gasFetch';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: {
      email: 'gilbert.baidya@gmail.com',
      name: 'Pastor Gilbert Baidya',
      role: 'Primary Admin'
    }
  })
}));

vi.mock('../api/gasFetch', () => ({
  gasFetch: vi.fn()
}));

describe('Settings Page - Production Readiness & Operational Governance', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const mockSuccessfulReadiness = {
    success: true,
    environment: 'production',
    isProduction: true,
    productionWritesEnabled: false,
    overallStatus: 'OPERATIONAL',
    totalTablesRequired: 16,
    verifiedTablesCount: 16,
    missingTables: [],
    existingSheets: [
      'Transactions',
      'Income Detail',
      'Expense Detail',
      'Reimbursements',
      'Reimbursement_Allocations',
      'Receipt_Register',
      'Document_Register',
      'Check_Details',
      'Capital_Projects',
      'Audit_Issues',
      'Reconciliation_Staging',
      'Reconciliation_Register',
      'Monthly_Close',
      'Monthly_Close_History',
      'Presbyter_Reports',
      'AUDIT_LOGS'
    ],
    workbookTitle: 'GPBC_Finance_Master_PRODUCTION',
    checks: [
      {
        id: 'environment',
        label: 'Production Environment',
        status: 'LIVE',
        detail: 'Production environment active with isolated project runtime'
      },
      {
        id: 'workbook',
        label: 'Production Data Source',
        status: 'Connected',
        detail: 'Workspace: GPBC Finance Production'
      },
      {
        id: 'schema',
        label: 'Production Schema',
        status: '16/16 Verified',
        detail: '16/16 required tables verified'
      },
      {
        id: 'backend',
        label: 'Backend Service',
        status: 'Connected',
        detail: 'Production Apps Script backend service verified'
      },
      {
        id: 'oauth',
        label: 'Google Sign-In',
        status: 'Configured',
        detail: 'Google Sign-In configured'
      },
      {
        id: 'domain',
        label: 'Production Website',
        status: 'Live',
        detail: 'https://finance.gracepraise.church'
      },
      {
        id: 'writes',
        label: 'Financial Editing',
        status: 'Temporarily Disabled',
        detail: 'Financial changes are currently disabled during the controlled production release.'
      },
      {
        id: 'presbyter',
        label: 'Presbyter Protection',
        status: 'Active',
        detail: 'Presbyter Read-Only restricted strictly to Presbyter Reports'
      },
      {
        id: 'backup',
        label: 'Backup / Recovery',
        status: 'Configured',
        detail: 'Automated spreadsheet version history and recovery configured'
      }
    ]
  };

  it('successful readiness response displays approved current statuses and excludes raw IDs', async () => {
    gasFetch.mockResolvedValue(mockSuccessfulReadiness);

    const { container } = render(<Settings />);

    await waitFor(() => {
      expect(gasFetch).toHaveBeenCalledWith('getProductionReadiness', {});
    });

    const bodyText = container.textContent || '';

    // 1. Successful statuses displayed
    expect(bodyText).toContain('LIVE');
    expect(bodyText).toContain('Connected');
    expect(bodyText).toContain('16/16 Verified');
    expect(bodyText).toContain('16/16 required tables verified');
    expect(bodyText).toContain('16/16 TABLES VERIFIED • OPERATIONAL');
    expect(bodyText).toContain('Configured');
    expect(bodyText).toContain('Live');
    expect(bodyText).toContain('Temporarily Disabled');
    expect(bodyText).toContain('Active');

    // 2. Google Sign-In wording present, Google Workspace wording absent
    expect(bodyText).toContain('Google Sign-In configured');
    expect(bodyText).not.toContain('Authorized Google Workspace');
    expect(bodyText).not.toContain('Google Workspace account');

    // 3. Raw IDs and obsolete wording absent
    expect(bodyText).not.toContain('GPBC Finance Report - July & August 2026');
    expect(bodyText).not.toContain('1zLercJPw');
    expect(bodyText).not.toContain('1QW6DA3vBiY08qJXw-XRK71-q21kWMLVnnMaQBPnX8fE');
    expect(bodyText).not.toContain('1OsKbjEorsemb96Gtc2hugr-s6SySCQ9K');
    expect(bodyText).not.toContain('GPBC_PRODUCTION_WRITES_ENABLED');
    expect(bodyText).not.toContain('GPBC_SHEET_ID');
    expect(bodyText).not.toContain('GPBC_ENVIRONMENT');
    expect(bodyText).not.toContain('GPBC_DRIVE_ROOT_FOLDER_ID');
    expect(bodyText).not.toContain('Phase 5A');
    expect(bodyText).not.toContain('Phase 5B');
    expect(bodyText).not.toContain('NOT CREATED');
    expect(bodyText).not.toContain('NOT CONFIGURED');
    expect(bodyText).not.toContain('BLOCKED — PRODUCTION FOUNDATION INCOMPLETE');
  });

  it('failed readiness request fails neutral: displays "Unable to Verify" and DOES NOT fabricate healthy statuses', async () => {
    gasFetch.mockRejectedValue(new Error('Backend unreachable'));

    const { container } = render(<Settings />);

    await waitFor(() => {
      expect(gasFetch).toHaveBeenCalledWith('getProductionReadiness', {});
    });

    const bodyText = container.textContent || '';

    // 1. Must display neutral "Unable to Verify"
    expect(bodyText).toContain('READINESS STATUS: UNABLE TO VERIFY');
    expect(bodyText).toContain('Current production readiness could not be verified. Refresh and try again.');
    expect(bodyText).toContain('Unable to verify');

    // 2. Must NOT fabricate false healthy production statuses
    expect(bodyText).not.toContain('Connected');
    expect(bodyText).not.toContain('Configured');
    expect(bodyText).not.toContain('Live');
    expect(bodyText).not.toContain('16/16 Verified');
    expect(bodyText).not.toContain('16/16 required tables verified');
    expect(bodyText).not.toContain('OPERATIONAL');
    expect(bodyText).not.toContain('PASS');

    // 3. Raw IDs remain strictly absent
    expect(bodyText).not.toContain('1QW6DA3vBiY08qJXw-XRK71-q21kWMLVnnMaQBPnX8fE');
    expect(bodyText).not.toContain('1OsKbjEorsemb96Gtc2hugr-s6SySCQ9K');
    expect(bodyText).not.toContain('GPBC_PRODUCTION_WRITES_ENABLED');
  });

  it('malformed readiness response fails neutral without fabricating healthy state', async () => {
    gasFetch.mockResolvedValue({ success: false });

    const { container } = render(<Settings />);

    await waitFor(() => {
      expect(gasFetch).toHaveBeenCalledWith('getProductionReadiness', {});
    });

    const bodyText = container.textContent || '';

    expect(bodyText).toContain('READINESS STATUS: UNABLE TO VERIFY');
    expect(bodyText).toContain('Current production readiness could not be verified. Refresh and try again.');
    expect(bodyText).not.toContain('16/16 Verified');
    expect(bodyText).not.toContain('OPERATIONAL');
  });

  it('Refresh Readiness Audit triggers read-only getProductionReadiness without write actions and leaves writes false', async () => {
    gasFetch.mockResolvedValue(mockSuccessfulReadiness);

    render(<Settings />);

    await waitFor(() => {
      expect(gasFetch).toHaveBeenCalledTimes(1);
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh Readiness Audit/i });
    expect(refreshButton).toBeDefined();

    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(gasFetch).toHaveBeenCalledTimes(2);
      expect(gasFetch).toHaveBeenLastCalledWith('getProductionReadiness', {});
    });

    // Verify all invocations were strictly getProductionReadiness
    const calls = gasFetch.mock.calls;
    calls.forEach(([action]) => {
      expect(action).toBe('getProductionReadiness');
      expect(action).not.toMatch(/write|add|update|delete|close|reopen|migrate|create/i);
    });
  });
});
