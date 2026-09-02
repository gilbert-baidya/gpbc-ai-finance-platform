import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { TenantProvider } from './context/TenantContext';
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
  AuditCenter,
  MonthlyClose,
  PresbyterReports,
  Settings,
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

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <RoleProtectedRoute>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                
                {/* Finance Core Routes */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="income" element={<Income />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="reimbursements" element={<Reimbursements />} />
                <Route path="receipts" element={<ReceiptRegister />} />
                <Route path="checks" element={<CheckDetails />} />
                <Route path="capital-projects" element={<CapitalProjects />} />

                {/* Control & Oversight Routes */}
                <Route path="audit" element={<AuditCenter />} />
                <Route path="monthly-close" element={<MonthlyClose />} />
                <Route path="presbyter-reports" element={<PresbyterReports />} />
                <Route path="settings" element={<Settings />} />

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
      </TenantProvider>
    </AuthProvider>
  );
}

export default App;
