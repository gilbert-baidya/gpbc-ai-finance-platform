import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
import { PeriodProvider } from './context/PeriodContext';
import { DevRoleSwitcher } from './auth/DevRoleSwitcher';
import { RoleProtectedRoute } from './components/RoleProtectedRoute';
import {
  Dashboard,
  Transactions,
  Contributions as Income,
  Expenses,
  Reimbursements,
  ReceiptRegister,
  CheckDetails,
  CapitalProjects,
  DocumentCenter,
  Reconciliation,
  AuditCenter,
  MonthlyClose,
  PresbyterReports,
  Settings,
  HelpCenter,
  HelpArticleView,
  // Legacy / Ministry pages
  Members,
  Contributions,
  Letters,
  AIReports,
  PastoralIntelligence,
  OperationsCommandCenter,
  KingdomIntelligence,
  GrantOpportunities,
} from './pages';
import LettersPreview from './pages/LettersPreview';
import './App.css';

import { useAuth } from './context/AuthContext';

function IndexRedirect() {
  const { user } = useAuth();
  if (user?.role === 'Presbyter Read-Only') {
    return <Navigate to="/presbyter-reports" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <PeriodProvider>
          <BrowserRouter>
            <RoleProtectedRoute>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<IndexRedirect />} />

                  {/* Finance Core Routes */}
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="income" element={<Income />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="reimbursements" element={<Reimbursements />} />
                  <Route path="documents" element={<DocumentCenter />} />
                  <Route path="receipts" element={<ReceiptRegister />} />
                  <Route path="checks" element={<CheckDetails />} />
                  <Route path="capital-projects" element={<CapitalProjects />} />

                  {/* Control & Oversight Routes */}
                  <Route path="reconciliation" element={<Reconciliation />} />
                  <Route path="audit" element={<AuditCenter />} />
                  <Route path="monthly-close" element={<MonthlyClose />} />
                  <Route path="presbyter-reports" element={<PresbyterReports />} />
                  <Route path="settings" element={<Settings />} />

                  {/* Help & Training Routes */}
                  <Route path="help" element={<HelpCenter />} />
                  <Route path="help/:articleId" element={<HelpArticleView />} />

                {/* Preserved legacy routes */}
                <Route path="members" element={<Members />} />
                <Route path="contributions" element={<Contributions />} />
                <Route path="letters" element={<Letters />} />
                <Route path="ai-reports" element={<AIReports />} />
                <Route path="pastoral-intelligence" element={<PastoralIntelligence />} />
                <Route path="operations-command-center" element={<OperationsCommandCenter />} />
                <Route path="kingdom-intelligence" element={<KingdomIntelligence />} />
                <Route path="grant-opportunities" element={<GrantOpportunities />} />
              </Route>

              {/* Standalone Preview Page - No Layout */}
              <Route path="/letters/preview" element={<LettersPreview />} />
            </Routes>
          </RoleProtectedRoute>

          {/* Dev Role Switcher - Rendered only in development */}
          <DevRoleSwitcher />
        </BrowserRouter>
      </PeriodProvider>
    </TenantProvider>
  </AuthProvider>
);
}

export default App;
