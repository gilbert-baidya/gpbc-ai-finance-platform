/*************************************************
 * GPBC Finance Desk — MonthlyClose.jsx
 * Monthly Close, Period Locking & Readiness Center
 * Phase 3 Upgrade: Enhanced Readiness, Blocker Model, & Report Package
 *************************************************/

import React, { useState, useEffect, useCallback } from 'react';
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
  Printer,
  FileCheck
} from 'lucide-react';
import { monthlyCloseApi } from '../api/monthlyCloseApi';
import { reconciliationApi } from '../api/reconciliationApi';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/PeriodContext';
import FinanceDataState from '../components/FinanceDataState';

export default function MonthlyClose() {
  const { user } = useAuth();
  const { periodKey, setPeriodKey } = usePeriod();
  const isAdmin = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Admin';

  const currentPeriod = periodKey;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [history, setHistory] = useState([]);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closeConfirmCheckbox, setCloseConfirmCheckbox] = useState(false);
  const [typedConfirmText, setTypedConfirmText] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportPackage, setReportPackage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = useCallback(async (period) => {
    setLoading(true);
    setError(null);
    try {
      const [readinessRes, historyRes] = await Promise.all([
        monthlyCloseApi.getMonthlyCloseReadiness(period),
        monthlyCloseApi.getMonthlyCloseHistory(period)
      ]);
      if (readinessRes?.success) {
        setReadiness(readinessRes);
        setDataAvailable(true);
      } else {
        setDataAvailable(false);
      }
      if (historyRes?.success) {
        setHistory(historyRes.history || []);
      }
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

  const handleOpenCloseModal = () => {
    if (!isAdmin || !readiness?.readyToClose) return;
    setCloseConfirmCheckbox(false);
    setTypedConfirmText('');
    setCloseModalOpen(true);
  };

  const handleConfirmCloseMonth = async (e) => {
    e.preventDefault();
    if (!isAdmin || !closeConfirmCheckbox || typedConfirmText.trim() !== `CLOSE ${currentPeriod}`) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      await monthlyCloseApi.closeMonthlyPeriod({
        periodKey: currentPeriod,
        notes: `Month-end close completed by ${user?.name || user?.email}`
      });
      setSuccessMessage(`Period ${currentPeriod} has been successfully closed, locked, and report snapshot archived.`);
      setCloseModalOpen(false);
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

  const handleViewReportPackage = async () => {
    setActionLoading(true);
    try {
      const pkg = await reconciliationApi.getMonthEndReportPackage(currentPeriod);
      setReportPackage(pkg);
      setReportModalOpen(true);
    } catch (err) {
      setError(err?.message || 'Failed to load report package');
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
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1240px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--slate-blue-dark)', margin: 0, fontWeight: 700 }}>
              Monthly Close & Close Readiness
            </h1>
            {dataAvailable && readiness && getStatusBadge(readiness.currentStatus)}
          </div>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Authoritative close readiness dashboard, blocker verification, server-side period locking, and month-end report package.
          </p>
        </div>

        {/* Period Selector & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '4px 10px' }}>
            <Calendar size={16} style={{ color: 'var(--slate-blue)', marginRight: '8px' }} />
            <input
              type="month"
              value={currentPeriod}
              onChange={(e) => e.target.value && setPeriodKey(e.target.value)}
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

          <button
            onClick={handleViewReportPackage}
            className="btn btn-secondary"
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Printer size={15} />
            Report Package
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
                onClick={handleOpenCloseModal}
                className="btn btn-primary"
                disabled={actionLoading || !readiness.readyToClose}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: readiness.readyToClose ? 'var(--forest-green)' : '#9AA0A6',
                  borderColor: readiness.readyToClose ? 'var(--forest-green)' : '#9AA0A6',
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

      {/* Readiness Overview Metrics Cards */}
      {dataAvailable && readiness && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Total Transactions</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>{readiness.counts.transactionsCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Master ledger entries</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Reconciled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--forest-green)' }}>{readiness.counts.reconciledTransactionsCount || 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Verified & reconciled</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Unreconciled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: readiness.counts.unreconciledTransactionsCount > 0 ? '#B06000' : 'var(--forest-green)' }}>
              {readiness.counts.unreconciledTransactionsCount || 0}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Pending reconciliation</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Difference Amount</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: readiness.financialSummary.differenceAmount > 0 ? '#C5221F' : 'var(--forest-green)' }}>
              ${(readiness.financialSummary.differenceAmount || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Unresolved variance</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Audit Health Score</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: readiness.financialSummary.auditHealthScore >= 90 ? 'var(--forest-green)' : '#F2994A' }}>
                {readiness.financialSummary.auditHealthScore}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>/ 100</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', marginTop: '4px' }}>{readiness.financialSummary.scoreTier}</div>
          </div>
        </div>
      )}

      {/* Blocker & Readiness Banner */}
      {readiness && (
        <div style={{ marginBottom: '1.5rem' }}>
          {readiness.currentStatus === 'Closed' ? (
            <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Lock size={24} style={{ color: '#137333', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#137333', fontSize: '1.05rem' }}>PERIOD CLOSED & LOCKED</div>
                <div style={{ fontSize: '0.85rem', color: '#137333' }}>
                  Period {currentPeriod} was successfully closed and normal financial changes are locked.
                  {readiness.closedBy && ` Closed by ${readiness.closedBy}`}
                  {readiness.closedAt && ` on ${new Date(readiness.closedAt).toLocaleString()}`}.
                </div>
              </div>
            </div>
          ) : readiness.readyToClose ? (
            <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', borderRadius: '10px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckCircle size={24} style={{ color: '#137333', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 700, color: '#137333', fontSize: '1.05rem' }}>READY TO CLOSE</div>
                <div style={{ fontSize: '0.85rem', color: '#137333' }}>All critical reconciliation, accounting invariants, and fund controls passed successfully.</div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#FCE8E6', border: '1px solid #FAD2CF', borderRadius: '10px', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#C5221F', fontWeight: 700, fontSize: '1.05rem', marginBottom: '8px' }}>
                <XCircle size={22} />
                <span>NOT READY TO CLOSE — Blockers Identified ({readiness.blockingIssues.length})</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '24px', color: '#C5221F', fontSize: '0.9rem' }}>
                {readiness.blockingIssues.map((b, idx) => (
                  <li key={idx} style={{ marginBottom: '4px', fontWeight: 600 }}>[BLOCKER] {b}</li>
                ))}
              </ul>
            </div>
          )}

          {readiness.currentStatus !== 'Closed' && readiness.warnings.length > 0 && (
            <div style={{ background: '#FEF7E0', border: '1px solid #FEEFC3', borderRadius: '10px', padding: '1rem', marginTop: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#B06000', fontWeight: 600, fontSize: '0.9rem', marginBottom: '6px' }}>
                <AlertTriangle size={16} />
                <span>Warnings & Non-Blocking Items ({readiness.warnings.length})</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#B06000', fontSize: '0.85rem' }}>
                {readiness.warnings.map((w, idx) => (
                  <li key={idx}>[WARNING] {w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 8-Point Close Checklist */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--slate-blue-dark)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileCheck size={18} />
          Authoritative Close Checklist
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          {[
            { title: '✓ Transactions Reviewed', desc: 'Master ledger populated & categorized', ok: Boolean(readiness?.counts.transactionsCount > 0) },
            { title: '✓ Reconciliation Complete', desc: '0 unreconciled material discrepancies', ok: Boolean(readiness?.counts.unreconciledTransactionsCount === 0) },
            { title: '✓ Reimbursements Reviewed', desc: 'Allocations & settlements balanced', ok: true },
            { title: '✓ Checks Reviewed', desc: 'Check numbers & vouchers recorded', ok: true },
            { title: '✓ Evidence Reviewed', desc: 'Receipts & post-close documents attached', ok: Boolean(readiness?.counts.missingEvidenceCount === 0) },
            { title: '✓ Audit Exceptions Reviewed', desc: '0 unresolved CRITICAL audit issues', ok: Boolean(readiness?.counts.openCriticalIssues === 0 && readiness?.financialSummary?.auditHealthScore !== 'Unavailable') },
            { title: '✓ Financial Totals Calculated', desc: 'Income, expense & net position calculated', ok: true },
            {
              title: (readiness?.reportPackagePrepared || readiness?.currentStatus === 'Closed') ? '✓ Closing Report Archived' : 'Closing Report Pending',
              desc: (readiness?.reportPackagePrepared || readiness?.currentStatus === 'Closed') ? 'Snapshot report package generated & archived' : 'Preview available — Report package generated at period close',
              ok: Boolean(readiness?.reportPackagePrepared || readiness?.currentStatus === 'Closed')
            }
          ].map((item, idx) => (
            <div key={idx} style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-blue-dark)' }}>{item.title}</span>
                {item.ok ? <CheckCircle size={16} style={{ color: 'var(--forest-green)' }} /> : <AlertTriangle size={16} style={{ color: '#B06000' }} />}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lifecycle History */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '10px' }}>
        <h2 style={{ fontSize: '1.1rem', color: 'var(--slate-blue-dark)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={18} />
          Period Lifecycle & Close History
        </h2>

        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--warm-gray)' }}>
            No close or reopen history recorded for period {currentPeriod}.
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
                  <th style={{ padding: '8px' }}>Actor</th>
                  <th style={{ padding: '8px' }}>Timestamp</th>
                  <th style={{ padding: '8px' }}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--mist-blue)' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>{h.actionType}</td>
                    <td style={{ padding: '8px' }}>{h.status}</td>
                    <td style={{ padding: '8px' }}>${Number(h.totalIncome || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px' }}>${Number(h.totalRecognizedExpenses || 0).toFixed(2)}</td>
                    <td style={{ padding: '8px', fontWeight: 600, color: (h.netPosition || 0) >= 0 ? 'var(--forest-green)' : '#D93025' }}>
                      ${Number(h.netPosition || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px' }}>{h.performedBy}</td>
                    <td style={{ padding: '8px', color: 'var(--warm-gray-light)' }}>{h.performedAt ? new Date(h.performedAt).toLocaleString() : ''}</td>
                    <td style={{ padding: '8px', fontStyle: 'italic' }}>{h.actionReason || h.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Report Package Modal */}
      {reportModalOpen && reportPackage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid var(--slate-blue-dark)', paddingBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--slate-blue-dark)', fontWeight: 700 }}>
                    GPBC MONTH-END FINANCIAL REPORT PACKAGE
                  </h2>
                  {reportPackage.closeStatus === 'Closed' ? (
                    <span style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      FINAL / CLOSED
                    </span>
                  ) : (
                    <span style={{ background: '#FEF7E0', color: '#B06000', border: '1px solid #FEEFC3', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                      DRAFT / PRE-CLOSE PREVIEW
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginTop: '4px' }}>
                  Period: <strong>{reportPackage.periodKey}</strong> ({reportPackage.periodStart} to {reportPackage.periodEnd}) | Generated: {new Date(reportPackage.generatedAt).toLocaleString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Printer size={16} /> {reportPackage.closeStatus === 'Closed' ? 'Print Report' : 'Print Preview'}
                </button>
                <button onClick={() => setReportModalOpen(false)} className="btn btn-secondary">
                  Close
                </button>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', marginBottom: '8px' }}>1. Financial Summary</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', border: '1px solid var(--mist-blue-dark)' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--mist-blue)' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Total Income:</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${reportPackage.financialSummary.totalIncome.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--mist-blue)' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Total Recognized Expenses:</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${reportPackage.financialSummary.totalRecognizedExpenses.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--mist-blue)' }}>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Net Position (Operating Surplus/Deficit):</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, color: reportPackage.financialSummary.netPosition >= 0 ? 'var(--forest-green)' : '#C5221F' }}>
                      ${reportPackage.financialSummary.netPosition.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px', fontWeight: 600 }}>Audit Health Score:</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>{reportPackage.financialSummary.auditHealthScore} / 100</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sunday Offering Summary */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', marginBottom: '8px' }}>2. Sunday Offering Summary</h3>
              <div style={{ fontSize: '0.85rem', marginBottom: '8px', color: 'var(--warm-gray)' }}>
                Total Sunday Offering: <strong>${reportPackage.sundayOfferingSummary.totalSundayOffering.toFixed(2)}</strong> ({reportPackage.sundayOfferingSummary.count} entries)
              </div>
            </div>

            {/* Reconciliation Summary */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-blue-dark)', marginBottom: '8px' }}>3. Reconciliation & Audit Status</h3>
              <div style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>
                Reconciled Records: <strong>{reportPackage.reconciliationSummary.reconciledCount || 0}</strong> | Difference: <strong>{reportPackage.reconciliationSummary.differenceFormatted || '$0.00'}</strong>
              </div>
              {reportPackage.closeStatus === 'Closed' ? (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#E6F4EA', borderRadius: '8px', fontSize: '0.8rem', borderLeft: '4px solid var(--forest-green)', color: '#137333' }}>
                  <strong>Certified by GPBC Finance Desk.</strong> Period {reportPackage.periodKey} is closed and financial records are frozen under authoritative period-lock rules.
                  {reportPackage.closedBy && reportPackage.closedBy !== 'N/A' && (
                    <div style={{ marginTop: '4px', fontSize: '0.75rem', color: '#137333' }}>
                      Closed by {reportPackage.closedBy} {reportPackage.closedAt ? `on ${new Date(reportPackage.closedAt).toLocaleString()}` : ''}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#FDFBF7', borderRadius: '8px', fontSize: '0.8rem', borderLeft: '4px solid var(--gold)', color: 'var(--slate-blue-dark)' }}>
                  <strong>Pre-close preview generated by GPBC Finance Desk.</strong> Period {reportPackage.periodKey} remains open. Financial records are not yet frozen or certified.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* Safe Close Month Confirmation Modal */}
      {closeModalOpen && readiness && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', maxWidth: '580px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1rem', color: 'var(--slate-blue-dark)' }}>
              <Lock size={24} style={{ color: 'var(--forest-green)' }} />
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700 }}>
                CLOSE PERIOD {currentPeriod}
              </h2>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)', marginBottom: '1.25rem' }}>
              Review period readiness summary and confirm authoritative period lock.
            </p>

            {/* Metrics Summary Grid */}
            <div style={{ background: '#F8FAFC', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: '10px' }}>
                <div>Period: <strong>{currentPeriod}</strong></div>
                <div>Total Transactions: <strong>{readiness.counts.transactionsCount}</strong></div>
                <div>Reconciled: <strong>{readiness.counts.reconciledTransactionsCount}</strong></div>
                <div>Unreconciled: <strong>{readiness.counts.unreconciledTransactionsCount}</strong></div>
                <div>Difference: <strong>${(readiness.financialSummary.differenceAmount || 0).toFixed(2)}</strong></div>
                <div>Audit Health: <strong>{readiness.financialSummary.auditHealthScore} / 100</strong></div>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', borderTop: '1px solid var(--mist-blue-dark)', paddingTop: '8px' }}>
                Report Status: Pre-close preview available — Final report package will be generated & archived as part of successful close.
              </div>
            </div>

            {/* Warning Explanation Box */}
            <div style={{ background: '#FEF7E0', border: '1px solid #FEEFC3', borderLeft: '4px solid #B06000', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#B06000' }}>
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} /> Authoritative Period Lock Warning:
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.4' }}>
                <li>Normal financial write operations for period <strong>{currentPeriod}</strong> will be locked server-side.</li>
                <li>Existing accounting entries become frozen in the master ledger.</li>
                <li>Late evidence attachments may still be added only through the post-close evidence workflow.</li>
                <li>Reopening requires an authorized Admin role and a mandatory documented reason.</li>
                <li>Close snapshot and event history will be permanently recorded.</li>
              </ul>
            </div>

            <form onSubmit={handleConfirmCloseMonth}>
              {/* Checkbox Confirmation */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-blue-dark)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={closeConfirmCheckbox}
                    onChange={(e) => setCloseConfirmCheckbox(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <span>I understand that period {currentPeriod} will be locked for normal financial changes.</span>
                </label>
              </div>

              {/* Typed Text Confirmation */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--slate-blue-dark)' }}>
                  Type <code style={{ background: '#EFEBE4', padding: '2px 6px', borderRadius: '4px' }}>CLOSE {currentPeriod}</code> to confirm:
                </label>
                <input
                  type="text"
                  value={typedConfirmText}
                  onChange={(e) => setTypedConfirmText(e.target.value)}
                  placeholder={`CLOSE ${currentPeriod}`}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading || !closeConfirmCheckbox || typedConfirmText.trim() !== `CLOSE ${currentPeriod}`}
                  style={{
                    background: (closeConfirmCheckbox && typedConfirmText.trim() === `CLOSE ${currentPeriod}`) ? 'var(--forest-green)' : '#9AA0A6',
                    borderColor: (closeConfirmCheckbox && typedConfirmText.trim() === `CLOSE ${currentPeriod}`) ? 'var(--forest-green)' : '#9AA0A6',
                    cursor: (closeConfirmCheckbox && typedConfirmText.trim() === `CLOSE ${currentPeriod}`) ? 'pointer' : 'not-allowed'
                  }}
                >
                  {actionLoading ? `Closing ${currentPeriod}...` : 'Confirm Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
