import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider } from './context/AuthContext'
import { TenantProvider } from './context/TenantContext'
import { DevRoleSwitcher } from './auth/DevRoleSwitcher'
import {
  Dashboard,
  Members,
  Contributions,
  Expenses,
  Letters,
  AIReports,
  PastoralIntelligence,
  OperationsCommandCenter,
  KingdomIntelligence,
  GrantOpportunities,
  Settings
} from './pages'
import LettersPreview from './pages/LettersPreview'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <TenantProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="members" element={<Members />} />
              <Route path="contributions" element={<Contributions />} />
              <Route path="expenses" element={<Expenses />} />
              <Route path="letters" element={<Letters />} />
              <Route path="ai-reports" element={<AIReports />} />
              <Route path="pastoral-intelligence" element={<PastoralIntelligence />} />
              <Route path="operations-command-center" element={<OperationsCommandCenter />} />
              <Route path="kingdom-intelligence" element={<KingdomIntelligence />} />
              <Route path="grant-opportunities" element={<GrantOpportunities />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            {/* Standalone Preview Page - No Layout */}
            <Route path="/letters/preview" element={<LettersPreview />} />
          </Routes>
          
          {/* Dev Role Switcher - Remove in production */}
          <DevRoleSwitcher />
        </BrowserRouter>
      </TenantProvider>
    </AuthProvider>
  )
}

export default App
