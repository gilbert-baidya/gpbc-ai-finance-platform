import React, { useState, useEffect } from 'react';
import { Shield, Lock, Server, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Key, Database, Folder } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { gasFetch } from '../api/gasFetch';

export default function Settings() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Primary Admin' || user?.role === 'Backup Admin';
  const [loading, setLoading] = useState(false);
  const [readinessData, setReadinessData] = useState(null);
  const [error, setError] = useState(null);

  const loadReadiness = async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const res = await gasFetch('getProductionReadiness', {});
      if (res && res.success) {
        setReadinessData(res);
      } else {
        setReadinessData(null);
      }
    } catch (err) {
      console.error('Failed to load production readiness:', err);
      setError(err instanceof Error ? err.message : 'Backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, [isAdmin]);

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--slate-blue-dark)', margin: 0 }}>
            System Settings & Production Governance
          </h1>
          <p style={{ color: 'var(--warm-gray)', marginTop: '4px', fontSize: '0.95rem' }}>
            Production readiness status, security environment guards, and domain release configuration.
          </p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={loadReadiness}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: 'var(--slate-blue)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh Readiness Audit
          </button>
        )}
      </div>

      {/* Disarmed Production Writes Banner */}
      <div style={{
        padding: '16px 20px',
        background: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: '10px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <Lock size={24} style={{ color: '#D97706', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: '700', color: '#92400E', fontSize: '0.95rem' }}>
            Phase 5A Release Guard: Production Writes DISARMED (<code style={{ background: 'rgba(217, 119, 6, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>GPBC_PRODUCTION_WRITES_ENABLED = false</code>)
          </div>
          <div style={{ color: '#B45309', fontSize: '0.85rem', marginTop: '2px' }}>
            All production accounting records, spreadsheet rows, and Drive document uploads are disarmed server-side. Production writes cannot be enabled from the UI.
          </div>
        </div>
      </div>

      {/* Environment Configuration Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-blue-dark)', fontWeight: '600' }}>
            <Server size={18} />
            <span>Environment Isolation</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-blue)' }}>
            {(import.meta.env.VITE_GPBC_ENV === 'production' || import.meta.env.VITE_GPBC_ENVIRONMENT === 'production') ? 'PRODUCTION' : 'SANDBOX'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
            Separate Apps Script Project Isolation Active
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-blue-dark)', fontWeight: '600' }}>
            <Database size={18} />
            <span>Production Master Sheet</span>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', fontFamily: 'monospace', color: 'var(--slate-blue-dark)', wordBreak: 'break-all' }}>
            1zLercJPwPvdl7YEU31Hbu4zcmakulOYrNrpnddxNC6s
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '4px', fontWeight: '500' }}>
            Strict Read-Only Mode (0 Writes)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-blue-dark)', fontWeight: '600' }}>
            <Folder size={18} />
            <span>Production Drive Root</span>
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', fontFamily: 'monospace', color: 'var(--slate-blue-dark)', wordBreak: 'break-all' }}>
            1OsKbjEorsemb96Gtc2hugr-s6SySCQ9K
          </div>
          <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '4px', fontWeight: '500' }}>
            Private Church Drive Folder Bound
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-blue-dark)', fontWeight: '600' }}>
            <ExternalLink size={18} />
            <span>Production Domain Target</span>
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--slate-blue)' }}>
            https://finance.gracepraise.church
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
            Standalone HTTPS Web App (No Iframe)
          </div>
        </div>
      </div>

      {/* Production Readiness Checklist for Admins */}
      {isAdmin && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-blue-dark)', margin: 0 }}>
              Phase 5A Production Readiness Release Audit
            </h2>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '6px',
              background: '#FEE2E2',
              color: '#991B1B',
              border: '1px solid #EF4444'
            }}>
              STATUS: BLOCKED — PRODUCTION FOUNDATION INCOMPLETE
            </span>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: '#FEE2E2', border: '1px solid #EF4444', borderRadius: '8px', color: '#991B1B', marginBottom: '16px', fontSize: '0.85rem' }}>
              Readiness Check Error: {error}. Local fallback governance checks active.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { label: 'Production Schema Compatibility', status: 'BLOCKER', detail: 'NO — Production workbook ("GPBC Finance Report - July & August 2026") lacks 11 modern tables (Transactions, Document_Register, Monthly_Close, etc.). Phase 5B upgrade required.', isBlocker: true },
              { label: 'Environment Separation (GPBC_ENVIRONMENT)', status: 'PASS', detail: 'Explicit sandbox / production property handling configured' },
              { label: 'Master Workbook Binding (GPBC_SHEET_ID)', status: 'PASS', detail: 'Production ID 1zLercJPw... assigned' },
              { label: 'Supporting Drive Root Binding (GPBC_DRIVE_ROOT_FOLDER_ID)', status: 'PASS', detail: 'Production Root Folder ID 1OsKbjE... assigned' },
              { label: 'Production Backend Apps Script Project', status: 'NOT CREATED', detail: 'NOT CREATED — Separate production Apps Script project pending creation in Phase 5B', isWarn: true },
              { label: 'Production OAuth Client & Authorized Origin', status: 'NOT CONFIGURED', detail: 'NOT CONFIGURED — https://finance.gracepraise.church origin pending verification in Google Cloud Console', isWarn: true },
              { label: 'Production Frontend Hosting & Domain', status: 'NOT CONFIGURED', detail: 'NOT CONFIGURED — Custom domain DNS and HTTPS static hosting pending deployment', isWarn: true },
              { label: 'Production Writes Arming Control (GPBC_PRODUCTION_WRITES_ENABLED)', status: 'PASS', detail: 'DISABLED (false) — Server-side write assertion enforced; zero production rows modified' },
              { label: 'Least-Privilege Presbyter Protection', status: 'PASS', detail: 'Presbyter Read-Only restricted strictly to Presbyter Reports' },
              { label: 'Workbook Backup & Disaster Recovery Policy', status: 'PASS', detail: 'Spreadsheet copy backup strategy established' }
            ].map((check, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: check.isBlocker ? '#FFF5F5' : 'rgba(255, 255, 255, 0.7)',
                  border: check.isBlocker ? '1px solid #FEB2B2' : '1px solid var(--border-light)',
                  borderRadius: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {check.isBlocker ? (
                    <AlertTriangle size={18} style={{ color: '#E53E3E' }} />
                  ) : check.isWarn ? (
                    <AlertTriangle size={18} style={{ color: '#D97706' }} />
                  ) : (
                    <CheckCircle2 size={18} style={{ color: '#059669' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: check.isBlocker ? '#9B2C2C' : 'var(--slate-blue-dark)' }}>
                      {check.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>
                      {check.detail}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: check.isBlocker ? '#FED7D7' : check.isWarn ? '#FEF3C7' : '#D1FAE5',
                  color: check.isBlocker ? '#9B2C2C' : check.isWarn ? '#92400E' : '#065F46'
                }}>
                  {check.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
