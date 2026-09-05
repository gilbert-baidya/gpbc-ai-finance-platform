import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RoleProtectedRoute from './RoleProtectedRoute';
import { useAuth } from '../context/AuthContext';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Role Security & Route Protection with Help Module', () => {
  it('1. Presbyter Read-Only CAN access /help without redirection', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'presbyter@gracepraise.church', name: 'Presbyter Test', role: 'Presbyter Read-Only' },
      loading: false,
      isAuthenticated: true,
      isAuthorized: () => true,
    });

    render(
      <MemoryRouter initialEntries={['/help']}>
        <RoleProtectedRoute>
          <Routes>
            <Route path="/help" element={<div>Help Center Page Content</div>} />
            <Route path="/presbyter-reports" element={<div>Presbyter Reports Target</div>} />
          </Routes>
        </RoleProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Help Center Page Content')).toBeInTheDocument();
    expect(screen.queryByText('Presbyter Reports Target')).toBeNull();
  });

  it('2. Presbyter Read-Only CAN access /help/reimbursements without redirection', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'presbyter@gracepraise.church', name: 'Presbyter Test', role: 'Presbyter Read-Only' },
      loading: false,
      isAuthenticated: true,
      isAuthorized: () => true,
    });

    render(
      <MemoryRouter initialEntries={['/help/reimbursements']}>
        <RoleProtectedRoute>
          <Routes>
            <Route path="/help/reimbursements" element={<div>Reimbursements Help Guide Content</div>} />
            <Route path="/presbyter-reports" element={<div>Presbyter Reports Target</div>} />
          </Routes>
        </RoleProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Reimbursements Help Guide Content')).toBeInTheDocument();
    expect(screen.queryByText('Presbyter Reports Target')).toBeNull();
  });

  it('3. Presbyter Read-Only is strictly redirected away from operational /transactions', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'presbyter@gracepraise.church', name: 'Presbyter Test', role: 'Presbyter Read-Only' },
      loading: false,
      isAuthenticated: true,
      isAuthorized: () => true,
    });

    render(
      <MemoryRouter initialEntries={['/transactions']}>
        <RoleProtectedRoute>
          <Routes>
            <Route path="/transactions" element={<div>Transactions Ledger Page</div>} />
            <Route path="/presbyter-reports" element={<div>Presbyter Reports Target</div>} />
          </Routes>
        </RoleProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Presbyter Reports Target')).toBeInTheDocument();
    expect(screen.queryByText('Transactions Ledger Page')).toBeNull();
  });

  it('4. Presbyter Read-Only is strictly redirected away from operational /monthly-close', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { email: 'presbyter@gracepraise.church', name: 'Presbyter Test', role: 'Presbyter Read-Only' },
      loading: false,
      isAuthenticated: true,
      isAuthorized: () => true,
    });

    render(
      <MemoryRouter initialEntries={['/monthly-close']}>
        <RoleProtectedRoute>
          <Routes>
            <Route path="/monthly-close" element={<div>Monthly Close Page</div>} />
            <Route path="/presbyter-reports" element={<div>Presbyter Reports Target</div>} />
          </Routes>
        </RoleProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Presbyter Reports Target')).toBeInTheDocument();
    expect(screen.queryByText('Monthly Close Page')).toBeNull();
  });
});
