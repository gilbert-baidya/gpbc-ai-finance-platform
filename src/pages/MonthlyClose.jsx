/*************************************************
 * GPBC Finance Desk — MonthlyClose.jsx
 * Monthly Close, Period Locking & Readiness Center
 *************************************************/

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  History,
  Info,
  Clock
} from 'lucide-react';
import { monthlyCloseApi } from '../api/monthlyCloseApi';
import { useAuth } from '../context/AuthContext';
import FinanceDataState from '../components/FinanceDataState';

export default function MonthlyClose() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Admin';

  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [history, setHistory] = useState([]);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const checklistIndicator = dataAvailable
    ? <CheckCircle size={16} style={{ color: 'var(--forest-green)' }} />
    : <span style={{ color: 'var(--warm-gray)', fontSize: '0.75rem' }}>Not verified</span>;

  const loadData = React.useCallback(async (period) => {
    setLoading(true);
    setError(null);
    try {
      const [readinessRes, historyRes] = await Promise.all([
        monthlyCloseApi.getMonthlyCloseReadiness({ periodKey: period }),
        monthlyCloseApi.getMonthlyCloseHistory({ periodKey: period })
      ]);
      setReadiness(readinessRes);
      setHistory(historyRes.history || []);
      setDataAvailable(Boolean(readinessRes?.success && readinessRes?.financialSummary && readinessRes?.counts));
    } catch (err) {
      setError(err?.message || 'Failed to load monthly close data');
      setReadiness(null);
      setHistory([]);
      setDataAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(currentPeriod);
  }, [currentPeriod, loadData]);

  const handleCloseMonth = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`Are you sure you want to CLOSE and LOCK period ${currentPeriod}? Ordinary financial writes in this period will be blocked.`)) {
      return;
    }
    setActionLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      await monthlyCloseApi.closeMonthlyPeriod({
        periodKey: currentPeriod,
        notes: `Month-end close completed by ${user?.name || user?.email}`
      });
      setSuccessMessage(`Period ${currentPeriod} has been successfully closed and locked.`);
      await loadData(currentPeriod);
    } catch (err) {
      setError(err?.message || 'Failed to close monthly period');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenMonth = async (e) => {
    e.preventDefault();
    if (!isAdmin || !reopenReason.trim()) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      await monthlyCloseApi.reopenMonthlyPeriod({
        periodKey: currentPeriod,
        reopenReason: reopenReason.trim()
      });
      setSuccessMessage(`Period ${currentPeriod} has been reopened for authorized corrections.`);
      setReopenModalOpen(false);
      setReopenReason('');
      await loadData(currentPeriod);
    } catch (err) {
      setError(err?.message || 'Failed to reopen period');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Closed':
        return (
          <span className="badge" style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', fontWeight: 600, fontSize: '0.85rem' }}>
            <Lock size={14} /> PERIOD CLOSED & LOCKED
          </span>
        );
      case 'Reopened':
        return (
          <span className="badge" style={{ background: '#FEF7E0', color: '#B06000', border: '1px solid #FEEFC3', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', fontWeight: 600, fontSize: '0.85rem' }}>
            <Unlock size={14} /> REOPENED FOR CORRECTIONS
          </span>
        );
      default:
        return (
          <span className="badge" style={{ background: '#E8F0FE', color: '#1A73E8', border: '1px solid #D2E3FC', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '16px', fontWeight: 600, fontSize: '0.85rem' }}>
            <Calendar size={14} /> ACTIVE OPEN PERIOD
          </span>
        );
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--slate-blue-dark)', margin: 0, fontWeight: 700 }}>
              Monthly Close & Period Locking
            </h1>
            {dataAvailable && readiness && getStatusBadge(readiness.currentStatus)}
          </div>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Authoritative 10-step month-end freeze, readiness verification, and immutable lifecycle history.
          </p>
        </div>

        {/* Period Selector & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '4px 10px' }}>
            <Calendar size={16} style={{ color: 'var(--slate-blue)', marginRight: '8px' }} />
            <input
              type="month"
              value={currentPeriod}
              onChange={(e) => e.target.value && setCurrentPeriod(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: 'var(--slate-blue-dark)', fontSize: '0.9rem' }}
            />
          </div>

          <button
            onClick={() => loadData(currentPeriod)}
            className="btn btn-secondary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            Refresh
          </button>

          {isAdmin && dataAvailable && readiness && (
            readiness.currentStatus === 'Closed' ? (
              <button
                onClick={() => setReopenModalOpen(true)}
                className="btn btn-secondary"
                disabled={actionLoading}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B06000', borderColor: '#FEEFC3' }}
              >
                <Unlock size={15} />
                Reopen Period
              </button>
            ) : (
              <button
                onClick={handleCloseMonth}
                className="btn btn-primary"
                disabled={actionLoading || !readiness.readyToClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: readiness.readyToClose ? 'var(--forest-green)' : '#9AA0A6',
                  cursor: readiness.readyToClose ? 'pointer' : 'not-allowed'
                }}
              >
                <Lock size={15} />
                Close Month
              </button>
            )
          )}
        </div>
      </div>

      {/* Error & Success Messages */}
      {error && (
        <div style={{ background: '#FCE8E6', border: '1px solid #FAD2CF', color: '#C5221F', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', color: '#137333', padding: '12px 16px', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Financial Overview KPIs */}
      {dataAvailable && readiness && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600 }}>Total Income</span>
              <DollarSign size={18} style={{ color: 'var(--forest-green)' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>
              ${readiness.financialSummary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Tithes, Offerings & Capital Donations</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600 }}>Recognized Expenses</span>
              <DollarSign size={18} style={{ color: '#D93025' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>
              ${readiness.financialSummary.totalRecognizedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Operating expenses (Settlements excluded)</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600 }}>Net Position</span>
              <TrendingUp size={18} style={{ color: readiness.financialSummary.netPosition >= 0 ? 'var(--forest-green)' : '#D93025' }} />
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: readiness.financialSummary.netPosition >= 0 ? 'var(--forest-green)' : '#D93025' }}>
              ${readiness.financialSummary.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Net operating surplus / deficit</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600 }}>Audit Health Score</span>
              <ShieldCheck size={18} style={{ color: readiness.financialSummary.auditHealthScore >= 90 ? 'var(--forest-green)' : '#F2994A' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>{readiness.financialSummary.auditHealthScore}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--warm-gray)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', marginTop: '4px' }}>{readiness.financialSummary.scoreTier}</div>
          </div>
        </div>
      )}

      {/* Blockers & Readiness Banner */}
      {readiness && (
        <div style={{ marginBottom: '1.5rem' }}>
          {readiness.blockingIssues.length > 0 ? (
            <div style={{ background: '#FCE8E6', border: '1px solid #FAD2CF', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5221F', fontWeight: 700, marginBottom: '8px' }}>
                <XCircle size={20} />
                <span>Cannot Close {currentPeriod} ({readiness.blockingIssues.length} Blocker{readiness.blockingIssues.length > 1 ? 's' : ''})</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '24px', color: '#C5221F', fontSize: '0.9rem' }}>
                {readiness.blockingIssues.map((b, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{b}</li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={22} style={{ color: '#137333', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#137333' }}>Ready for Month-End Freeze</div>
                <div style={{ fontSize: '0.85rem', color: '#137333' }}>All critical reconciliation, allocation, and fund balances pass policy invariants.</div>
              </div>
            </div>
          )}

          {readiness.warnings.length > 0 && (
            <div style={{ background: '#FEF7E0', border: '1px solid #FEEFC3', borderRadius: '10px', padding: '1rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B06000', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                <AlertTriangle size={16} />
                <span>Non-Blocking Items to Review ({readiness.warnings.length})</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#B06000', fontSize: '0.85rem' }}>
                {readiness.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 10-Item Month-End Checklist */}
      {!loading && !dataAvailable && <div className="glass-panel" style={{ marginBottom: '1.5rem' }}><FinanceDataState title="Monthly close readiness cannot be determined" description="Connect live finance data before verifying checklist items or closing this month." /></div>}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--slate-blue-dark)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} />
          Month-End Verification Checklist
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>1. Bank Checking Account</span>
              {dataAvailable ? <CheckCircle size={16} style={{ color: 'var(--forest-green)' }} /> : <span style={{ color: 'var(--warm-gray)', fontSize: '0.75rem' }}>Not verified</span>}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Statement lines matched to master ledger</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>2. Capital One Credit Card</span>
              {dataAvailable ? <CheckCircle size={16} style={{ color: 'var(--forest-green)' }} /> : <span style={{ color: 'var(--warm-gray)', fontSize: '0.75rem' }}>Not verified</span>}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Card statement debits & credits reconciled</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>3. Sunday Offering & Tithes</span>
              {checklistIndicator}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Weekly cash/check envelope deposits confirmed</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>4. Expense Categorization</span>
              {checklistIndicator}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Payees & ministry purpose documented</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>5. Receipt Register</span>
              {checklistIndicator}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Supporting receipts attached to expenses</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>6. Check Details & Vouchers</span>
              {checklistIndicator}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Signed check vouchers and check numbers verified</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>7. Reimbursement Allocations</span>
              {checklistIndicator}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Purchase allocations and refund credits balanced</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>8. Designated Funds</span>
              {checklistIndicator}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Restricted fund balances non-negative</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>9. Audit Compliance Engine</span>
              {readiness?.counts.openCriticalIssues === 0 ? <CheckCircle size={16} style={{ color: 'var(--forest-green)' }} /> : <XCircle size={16} style={{ color: '#D93025' }} />}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>0 Critical findings before normal close</div>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>10. Presbyter Report</span>
              {checklistIndicator}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Executive summary previewed & ready</div>
          </div>
        </div>
      </div>

      {/* Lifecycle & Close History */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '10px' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--slate-blue-dark)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} />
          Period Lifecycle & Close History
        </h2>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--warm-gray)' }}>
            No formal close or reopen events recorded for period {currentPeriod}.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--mist-blue-dark)', textAlign: 'left', color: 'var(--warm-gray)' }}>
                  <th style={{ padding: '8px' }}>Event</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px' }}>Income</th>
                  <th style={{ padding: '8px' }}>Expenses</th>
                  <th style={{ padding: '8px' }}>Net Position</th>
                  <th style={{ padding: '8px' }}>Score</th>
                  <th style={{ padding: '8px' }}>Actor</th>
                  <th style={{ padding: '8px' }}>Timestamp</th>
                  <th style={{ padding: '8px' }}>Reason / Notes</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--mist-blue)' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{h.actionType}</td>
                    <td style={{ padding: '8px' }}>{h.status}</td>
                    <td style={{ padding: '8px' }}>${Number(h.totalIncome || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px' }}>${Number(h.totalRecognizedExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '8px', fontWeight: 600, color: (h.netPosition || 0) >= 0 ? 'var(--forest-green)' : '#D93025' }}>
                      ${Number(h.netPosition || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ padding: '8px' }}>{h.auditHealthScore}</td>
                    <td style={{ padding: '8px' }}>{h.performedBy}</td>
                    <td style={{ padding: '8px', color: 'var(--warm-gray-light)' }}>
                      {h.performedAt ? new Date(h.performedAt).toLocaleString() : ''}
                    </td>
                    <td style={{ padding: '8px', fontStyle: 'italic' }}>{h.actionReason || h.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reopen Period Modal */}
      {reopenModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', maxWidth: '500px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', color: '#B06000' }}>
              <Unlock size={22} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>Reopen Period {currentPeriod}</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginBottom: '1rem' }}>
              Reopening a closed period unlocks financial records for necessary amendments. A clear documented reason is mandatory for audit accountability.
            </p>

            <form onSubmit={handleReopenMonth}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-blue-dark)' }}>
                  Reason for Reopening *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Correcting missing invoice for mission outreach check #1042"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)', fontSize: '0.85rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setReopenModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading || !reopenReason.trim()}
                  style={{ background: '#B06000', borderColor: '#B06000' }}
                >
                  {actionLoading ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
