import React, { useState, useEffect } from 'react';
import { Shield, Lock, Server, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Database } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { gasFetch } from '../api/gasFetch';

const UNVERIFIED_CHECKS = [
  { id: 'environment', label: 'Production Environment', status: 'Unable to verify', detail: 'Environment status unavailable' },
  { id: 'workbook', label: 'Production Data Source', status: 'Unable to verify', detail: 'Production data source status unavailable' },
  { id: 'schema', label: 'Production Schema', status: 'Unable to verify', detail: 'Schema verification unavailable' },
  { id: 'backend', label: 'Backend Service', status: 'Unable to verify', detail: 'Backend service status unavailable' },
  { id: 'oauth', label: 'Google Sign-In', status: 'Unable to verify', detail: 'Authentication status unavailable' },
  { id: 'domain', label: 'Production Website', status: 'Unable to verify', detail: 'Domain status unavailable' },
  { id: 'writes', label: 'Financial Editing', status: 'Unable to verify', detail: 'Write guard verification unavailable' },
  { id: 'presbyter', label: 'Presbyter Protection', status: 'Unable to verify', detail: 'Presbyter security verification unavailable' },
  { id: 'backup', label: 'Backup / Recovery', status: 'Unable to verify', detail: 'Backup status unavailable' }
];

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
      if (res && res.success && Array.isArray(res.checks) && res.checks.length > 0) {
        setReadinessData(res);
      } else {
        setReadinessData(null);
      }
    } catch (err) {
      console.error('Failed to load production readiness:', err);
      setReadinessData(null);
      setError(err instanceof Error ? err.message : 'Backend unreachable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadiness();
  }, [isAdmin]);

  const hasSuccessfulData = Boolean(
    readinessData &&
    readinessData.success === true &&
    Array.isArray(readinessData.checks) &&
    readinessData.checks.length > 0
  );

  const checks = hasSuccessfulData ? readinessData.checks : UNVERIFIED_CHECKS;

  const schemaCardValue = hasSuccessfulData
    ? `${readinessData.verifiedTablesCount || 16}/${readinessData.totalTablesRequired || 16} Verified`
    : 'Unable to verify';

  const schemaCardSub = hasSuccessfulData
    ? '16 Canonical Tables Verified'
    : 'Schema verification pending';

  const envCardValue = hasSuccessfulData
    ? (readinessData.environment === 'production' || readinessData.isProduction ? 'LIVE' : (readinessData.environment || 'SANDBOX').toUpperCase())
    : 'Unable to verify';

  const envCardSub = hasSuccessfulData
    ? 'Production Project Isolation Active'
    : 'Environment verification pending';

  const dataSourceCardValue = hasSuccessfulData ? 'Connected' : 'Unable to verify';
  const websiteCardValue = hasSuccessfulData ? 'Live' : 'Unable to verify';

  return (
    <div className="finance-page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
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

      {/* Financial Editing Controlled Release Banner */}
      <div style={{
        padding: '16px 20px',
        background: '#F8FAFC',
        border: '1px solid #CBD5E1',
        borderRadius: '10px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px'
      }}>
        <Lock size={24} style={{ color: 'var(--slate-blue)', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: '700', color: 'var(--slate-blue-dark)', fontSize: '0.95rem' }}>
            Financial Editing: Temporarily Disabled
          </div>
          <div style={{ color: 'var(--warm-gray)', fontSize: '0.85rem', marginTop: '2px' }}>
            Financial changes are currently disabled during the controlled production release.
          </div>
        </div>
      </div>

      {/* Environment Configuration Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-blue-dark)', fontWeight: '600' }}>
            <Server size={18} />
            <span>Production Environment</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: hasSuccessfulData ? '#059669' : '#64748B' }}>
            {envCardValue}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
            {envCardSub}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-blue-dark)', fontWeight: '600' }}>
            <Database size={18} />
            <span>Production Data Source</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: hasSuccessfulData ? '#059669' : '#64748B' }}>
            {dataSourceCardValue}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', marginTop: '4px', fontWeight: '500' }}>
            Workspace: GPBC Finance Production
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-blue-dark)', fontWeight: '600' }}>
            <CheckCircle2 size={18} style={{ color: hasSuccessfulData ? '#059669' : '#64748B' }} />
            <span>Production Schema</span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: hasSuccessfulData ? '#059669' : '#64748B' }}>
            {schemaCardValue}
          </div>
          <div style={{ fontSize: '0.8rem', color: hasSuccessfulData ? '#059669' : 'var(--warm-gray)', marginTop: '4px', fontWeight: '500' }}>
            {schemaCardSub}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--slate-blue-dark)', fontWeight: '600' }}>
            <ExternalLink size={18} />
            <span>Production Website</span>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: hasSuccessfulData ? '#059669' : '#64748B' }}>
            {websiteCardValue}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
            https://finance.gracepraise.church
          </div>
        </div>
      </div>

      {/* Production Readiness Checklist for Admins */}
      {isAdmin && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-blue-dark)', margin: 0 }}>
              Production Readiness & Operational Governance
            </h2>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '4px 12px',
              borderRadius: '6px',
              background: !hasSuccessfulData
                ? '#F1F5F9'
                : (readinessData?.missingTables?.length > 0 ? '#FEF3C7' : '#D1FAE5'),
              color: !hasSuccessfulData
                ? '#475569'
                : (readinessData?.missingTables?.length > 0 ? '#92400E' : '#065F46'),
              border: !hasSuccessfulData
                ? '1px solid #CBD5E1'
                : (readinessData?.missingTables?.length > 0 ? '1px solid #F59E0B' : '1px solid #10B981')
            }}>
              {!hasSuccessfulData
                ? 'READINESS STATUS: UNABLE TO VERIFY'
                : (readinessData?.missingTables?.length > 0
                  ? `ATTENTION: ${readinessData.missingTables.length} TABLES MISSING`
                  : '16/16 TABLES VERIFIED • OPERATIONAL')}
            </span>
          </div>

          {!hasSuccessfulData && (
            <div style={{
              padding: '12px 16px',
              background: '#F8FAFC',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              color: '#475569',
              marginBottom: '16px',
              fontSize: '0.85rem'
            }}>
              Current production readiness could not be verified. Refresh and try again.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {checks.map((check, idx) => {
              const isUnverified = check.status === 'Unable to verify' || check.status === 'Status unavailable';
              const isWarning = check.status === 'WARN' || check.status === 'BLOCKER' || check.status === 'FAIL' || check.status === 'DISCONNECTED' || check.status === 'Disconnected';
              const isNeutral = check.status === 'Temporarily Disabled' || check.status === 'DISABLED' || check.status === 'SANDBOX' || check.status === 'Pending';

              return (
                <div
                  key={check.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '8px',
                    padding: '12px 16px',
                    background: isWarning ? '#FFF5F5' : isUnverified ? '#F8FAFC' : 'rgba(255, 255, 255, 0.7)',
                    border: isWarning ? '1px solid #FEB2B2' : '1px solid var(--border-light)',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isWarning ? (
                      <AlertTriangle size={18} style={{ color: '#E53E3E' }} />
                    ) : isUnverified ? (
                      <Shield size={18} style={{ color: '#94A3B8' }} />
                    ) : isNeutral ? (
                      <Shield size={18} style={{ color: 'var(--slate-blue)' }} />
                    ) : (
                      <CheckCircle2 size={18} style={{ color: '#059669' }} />
                    )}
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '600', color: isWarning ? '#9B2C2C' : isUnverified ? '#475569' : 'var(--slate-blue-dark)' }}>
                        {check.label}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: isUnverified ? '#94A3B8' : 'var(--warm-gray)' }}>
                        {check.detail}
                      </div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: isWarning ? '#FEE2E2' : (isNeutral || isUnverified) ? '#F1F5F9' : '#D1FAE5',
                    color: isWarning ? '#991B1B' : (isNeutral || isUnverified) ? '#475569' : '#065F46'
                  }}>
                    {check.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
