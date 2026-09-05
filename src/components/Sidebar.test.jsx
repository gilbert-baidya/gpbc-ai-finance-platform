import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import RoleProtectedRoute from './RoleProtectedRoute';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Sidebar Component & Role Security', () => {
  it('A. Presbyter Read-Only Sidebar -> only "Presbyter Reports" rendered', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'gilbert.cgpt@gmail.com', name: 'Presbyter Test', role: 'Presbyter Read-Only' },
      loading: false,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter defaultEntries={['/presbyter-reports']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Executive Oversight')).toBeInTheDocument();
    expect(screen.getByText('Presbyter Reports')).toBeInTheDocument();
  });

  it('B-F. Presbyter Sidebar DOM -> Dashboard, Transactions, Documents, Capital Projects, Settings absent', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'gilbert.cgpt@gmail.com', name: 'Presbyter Test', role: 'Presbyter Read-Only' },
      loading: false,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter defaultEntries={['/presbyter-reports']}>
        <Sidebar />
      </MemoryRouter>
    );

    // B. Dashboard absent
    expect(screen.queryByText('Dashboard')).toBeNull();
    // C. Transactions & financial sub-items absent
    expect(screen.queryByText('Transactions')).toBeNull();
    expect(screen.queryByText('Income')).toBeNull();
    expect(screen.queryByText('Expenses')).toBeNull();
    expect(screen.queryByText('Reimbursements')).toBeNull();
    expect(screen.queryByText('Receipt Register')).toBeNull();
    expect(screen.queryByText('Check Details')).toBeNull();
    // D. Documents absent
    expect(screen.queryByText('Document Center')).toBeNull();
    // E. Capital Projects absent
    expect(screen.queryByText('Capital Projects')).toBeNull();
    // F. Settings absent
    expect(screen.queryByText('Settings')).toBeNull();

    // Group section headers absent
    expect(screen.queryByText('Overview')).toBeNull();
    expect(screen.queryByText('Finance')).toBeNull();
    expect(screen.queryByText('Projects')).toBeNull();
    expect(screen.queryByText('Control & Audit')).toBeNull();
    expect(screen.queryByText('System')).toBeNull();
  });

  it('G. auth loading state -> full menu never flashes', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      loading: true,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter defaultEntries={['/']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByTestId('sidebar-loading')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).toBeNull();
    expect(screen.queryByText('Transactions')).toBeNull();
    expect(screen.queryByText('Presbyter Reports')).toBeNull();
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('H. Primary Admin -> full menu still rendered', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'gilbert.baidya@gmail.com', name: 'Primary Admin', role: 'Primary Admin' },
      loading: false,
      isAuthenticated: true,
    });

    render(
      <MemoryRouter defaultEntries={['/dashboard']}>
        <Sidebar />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('Expenses')).toBeInTheDocument();
    expect(screen.getByText('Reimbursements')).toBeInTheDocument();
    expect(screen.getByText('Document Center')).toBeInTheDocument();
    expect(screen.getByText('Receipt Register')).toBeInTheDocument();
    expect(screen.getByText('Check Details')).toBeInTheDocument();
    expect(screen.getByText('Capital Projects')).toBeInTheDocument();
    expect(screen.getByText('Reconciliation')).toBeInTheDocument();
    expect(screen.getByText('Audit Center')).toBeInTheDocument();
    expect(screen.getByText('Monthly Close')).toBeInTheDocument();
    expect(screen.getByText('Presbyter Reports')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('I. Presbyter direct /dashboard -> redirected to /presbyter-reports', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'gilbert.cgpt@gmail.com', name: 'Presbyter Test', role: 'Presbyter Read-Only' },
      loading: false,
      isAuthenticated: true,
      isAuthorized: () => true,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <RoleProtectedRoute>
          <Routes>
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
            <Route path="/presbyter-reports" element={<div>Presbyter Reports Target Page</div>} />
          </Routes>
        </RoleProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Presbyter Reports Target Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Page')).toBeNull();
  });
});
