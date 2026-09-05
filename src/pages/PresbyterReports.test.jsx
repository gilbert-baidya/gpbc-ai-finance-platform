import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PresbyterReports from './PresbyterReports';
import { reportApi } from '../api/reportApi';

const mockUser = {
  email: 'presbyter@gracepraise.church',
  name: 'Presbyter Test',
  role: 'Presbyter Read-Only'
};

vi.mock('../api/reportApi', () => ({
  reportApi: {
    getPresbyterReport: vi.fn()
  }
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
    isAuthorized: (allowedRoles) => !allowedRoles || allowedRoles.includes(mockUser.role),
    loading: false
  }))
}));

vi.mock('../context/PeriodContext', () => ({
  usePeriod: () => ({
    periodKey: '2026-09',
    setPeriodKey: vi.fn()
  })
}));

const mockClosedDTO = {
  success: true,
  periodKey: '2026-09',
  periodLabel: 'September 2026',
  status: 'Closed',
  isClosed: true,
  badgeText: 'FINAL / CLOSED',
  badgeVariant: 'success',
  churchInfo: {
    name: 'Grace and Praise Bangladeshi Church',
    ein: '39-4558295',
    address: '1325 Richardson St., San Bernardino, CA 92408',
    pastor: 'Pastor Gilbert Baidya'
  },
  financialSummary: {
    totalIncome: 10.00,
    totalRecognizedExpenses: 0.00,
    netPosition: 10.00,
    auditHealthScore: 100,
    auditHealthTier: 'Excellent / Audit Ready',
    reconciliationStatus: 'Complete',
    periodStatus: 'Closed'
  },
  incomeSummary: {
    totalIncome: 10.00,
    categories: [{ category: 'Sunday Offering', amount: 10.00, percentage: 100 }],
    privacyNote: 'Aggregate category totals only. Donor personal details protected.'
  },
  expenseSummary: {
    totalRecognizedExpenses: 0.00,
    categories: []
  },
  sundayOfferingSummary: {
    count: 1,
    totalSundayOffering: 10.00,
    averageSundayOffering: 10.00,
    offeringDates: ['2026-09-02']
  },
  reimbursementSummary: {
    count: 0,
    totalPersonalPurchases: 0.00,
    totalAllocated: 0.00,
    personallyAbsorbed: 0.00,
    refundAdjustments: 0.00,
    remainingLiability: 0.00,
    note: 'Reimbursements are liability settlements and excluded from operating expenses.'
  },
  checkSummary: {
    count: 0,
    checksIssued: 0,
    totalCheckAmount: 0.00,
    outstandingChecks: 0,
    clearedChecks: 0
  },
  capitalProjectSummary: {
    projects: []
  },
  reconciliationSummary: {
    reconciledCount: 1,
    unreconciledCount: 0,
    differenceAmount: 0.00,
    status: 'MATCHED'
  },
  auditSummary: {
    healthScore: 100,
    criticalIssuesCount: 0,
    highPriorityIssuesCount: 0
  },
  closeCertification: {
    isCertified: true,
    periodKey: '2026-09',
    status: 'Closed',
    closedBy: 'gilbert.baidya@gmail.com',
    closedAt: '2026-09-04T15:47:24.831Z',
    closeId: 'CLS-202609-907',
    finalReportArchived: true
  },
  finalReportArtifact: {
    available: true,
    storedFileName: 'GPBC_Month_End_Report_Package_2026-09_FINAL.json',
    status: 'VERIFIED',
    canViewRawArchive: false,
    note: 'Raw archive file access is restricted to Finance Desk Administrators.'
  },
  ytdSummary: {
    year: 2026,
    closedMonthsCount: 1,
    ytdIncome: 10.00,
    ytdRecognizedExpenses: 0.00,
    ytdNetPosition: 10.00
  }
};

describe('PresbyterReports Frontend Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders Presbyter Financial Report title, status badge, and executive summary cards', async () => {
    vi.mocked(reportApi.getPresbyterReport).mockResolvedValue(mockClosedDTO);

    render(<PresbyterReports />);

    await waitFor(() => {
      expect(screen.getByText('Presbyter Financial Report')).toBeInTheDocument();
      expect(screen.getByText('FINAL / CLOSED')).toBeInTheDocument();
      expect(screen.getByText('MONTH-END CLOSE CERTIFICATION')).toBeInTheDocument();
      expect(screen.getByText('CLS-202609-907')).toBeInTheDocument();
      expect(screen.getByText('gilbert.baidya@gmail.com')).toBeInTheDocument();
    });
  });

  it('renders Print Report button', async () => {
    vi.mocked(reportApi.getPresbyterReport).mockResolvedValue(mockClosedDTO);

    render(<PresbyterReports />);

    await waitFor(() => {
      expect(screen.getByText('Print Report')).toBeInTheDocument();
    });
  });

  it('includes print CSS controls, no-print header, and break-avoiding section classes', async () => {
    vi.mocked(reportApi.getPresbyterReport).mockResolvedValue(mockClosedDTO);

    const { container } = render(<PresbyterReports />);

    await waitFor(() => {
      // Print control container has no-print class
      const noPrintEl = container.querySelector('.no-print');
      expect(noPrintEl).not.toBeNull();

      // Report sections have print-avoid-break class
      const avoidBreakSections = container.querySelectorAll('.print-avoid-break');
      expect(avoidBreakSections.length).toBeGreaterThanOrEqual(7);

      // Verify style tag contains print CSS page rules
      const styleEl = container.querySelector('style');
      expect(styleEl?.textContent).toContain('@media print');
      expect(styleEl?.textContent).toContain('break-after: avoid');
      expect(styleEl?.textContent).toContain('break-inside: avoid');
      expect(styleEl?.textContent).toContain('size: letter');
    });
  });

  it('redirects Presbyter Read-Only from operational routes (/dashboard, /transactions, /documents, /monthly-close) to /presbyter-reports', async () => {
    const { RoleProtectedRoute } = await import('../components/RoleProtectedRoute');
    const { MemoryRouter, Routes, Route } = await import('react-router-dom');
    const { cleanup } = await import('@testing-library/react');

    const testRoutes = ['/dashboard', '/transactions', '/documents', '/monthly-close'];

    for (const path of testRoutes) {
      cleanup();
      render(
        <MemoryRouter initialEntries={[path]}>
          <RoleProtectedRoute>
            <Routes>
              <Route path="/presbyter-reports" element={<div>Presbyter Reports Target Page</div>} />
              <Route path="*" element={<div>Operational Page {path}</div>} />
            </Routes>
          </RoleProtectedRoute>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Presbyter Reports Target Page')).toBeInTheDocument();
        expect(screen.queryByText(`Operational Page ${path}`)).not.toBeInTheDocument();
      });
    }
  });

  it('allows Primary Admin to open operational routes normally without redirection', async () => {
    const { RoleProtectedRoute } = await import('../components/RoleProtectedRoute');
    const { MemoryRouter, Routes, Route } = await import('react-router-dom');
    const { useAuth } = await import('../context/AuthContext');

    vi.mocked(useAuth).mockImplementation(() => ({
      user: { email: 'gilbert.baidya@gmail.com', name: 'Gilbert Baidya', role: 'Primary Admin' },
      isAuthenticated: true,
      isAuthorized: () => true,
      loading: false
    }));

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <RoleProtectedRoute>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard Target Page</div>} />
          </Routes>
        </RoleProtectedRoute>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Target Page')).toBeInTheDocument();
    });
  });
});
