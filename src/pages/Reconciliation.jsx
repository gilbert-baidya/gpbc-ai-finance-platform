/*************************************************
 * GPBC Finance Desk — Reconciliation.jsx
 * Authoritative Reconciliation Center
 * Placement: CONTROL & AUDIT
 * Primary Statuses: UNMATCHED, MATCHED, PARTIALLY_MATCHED, NEEDS_REVIEW, RECONCILED
 *************************************************/

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  FileText,
  DollarSign,
  Lock,
  Unlock,
  Eye,
  CheckSquare,
  Zap,
  ArrowRight,
  FileCheck
} from 'lucide-react';
import { reconciliationApi } from '../api/reconciliationApi';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/PeriodContext';
import FinanceDataState from '../components/FinanceDataState';
import { EvidenceDrawerModal } from '../components/EvidenceDrawerModal';

export default function Reconciliation() {
  const { user } = useAuth();
  const { periodKey, setPeriodKey } = usePeriod();
  const isEditor = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Finance Editor' || user?.role === 'Admin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [summary, setSummary] = useState(null);
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Selected Record Modal / Drawer State
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [customReconciledAmt, setCustomReconciledAmt] = useState('');

  const loadData = useCallback(async (period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await reconciliationApi.getReconciliationRecords({
        periodKey: period,
        search: searchQuery
      });
      setSummary(res.summary || null);
      setRecords(res.records || []);
    } catch (err) {
      setError(err?.message || 'Failed to load reconciliation records');
      setSummary(null);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadData(periodKey);
  }, [periodKey, loadData]);

  const handleReconcileSingle = async (rec, targetStatus = 'RECONCILED') => {
    if (!isEditor) return;
    setActionLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const payload = {
        transactionId: rec.transactionId,
        reconciliationStatus: targetStatus,
        reconciledAmount: customReconciledAmt !== '' ? Number(customReconciledAmt) : rec.reconciledAmount,
        notes: reviewNotes.trim() || rec.notes
      };

      await reconciliationApi.reconcileTransactionRecord(payload);
      setSuccessMessage(`Transaction ${rec.transactionId} set to ${targetStatus}.`);
      setReviewModalOpen(false);
      setSelectedRecord(null);
      await loadData(periodKey);
    } catch (err) {
      setError(err?.message || 'Reconciliation update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAutoReconcile = async () => {
    if (!isEditor) return;
    if (!window.confirm(`Run deterministic auto-reconciliation rule engine for period ${periodKey}?`)) return;

    setActionLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const res = await reconciliationApi.autoReconcilePeriod(periodKey);
      setSuccessMessage(`Auto-reconciliation complete: ${res.autoReconciledCount} record(s) reconciled, ${res.skippedCount} skipped.`);
      await loadData(periodKey);
    } catch (err) {
      setError(err?.message || 'Auto-reconciliation failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter records by tab
  const filteredRecords = records.filter(r => {
    if (activeTab === 'ALL') return true;
    return r.reconciliationStatus === activeTab;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RECONCILED':
        return (
          <span className="badge" style={{ background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem' }}>
            <CheckCircle size={13} /> RECONCILED
          </span>
        );
      case 'MATCHED':
        return (
          <span className="badge" style={{ background: '#E8F0FE', color: '#1A73E8', border: '1px solid #D2E3FC', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem' }}>
            <CheckSquare size={13} /> MATCHED
          </span>
        );
      case 'PARTIALLY_MATCHED':
        return (
          <span className="badge" style={{ background: '#FEF7E0', color: '#B06000', border: '1px solid #FEEFC3', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem' }}>
            <AlertTriangle size={13} /> PARTIAL MATCH
          </span>
        );
      case 'NEEDS_REVIEW':
        return (
          <span className="badge" style={{ background: '#FCE8E6', color: '#C5221F', border: '1px solid #FAD2CF', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem' }}>
            <XCircle size={13} /> NEEDS REVIEW
          </span>
        );
      default:
        return (
          <span className="badge" style={{ background: '#F1F3F4', color: '#5F6368', border: '1px solid #DADCE0', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '12px', fontWeight: 600, fontSize: '0.8rem' }}>
            <HelpCircle size={13} /> UNMATCHED
          </span>
        );
    }
  };

  return (
    <div className="page-container" style={{ padding: '2rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--slate-blue-dark)', margin: 0, fontWeight: 700 }}>
              Reconciliation Center
            </h1>
            <span className="badge" style={{ background: '#E8F0FE', color: '#1A73E8', border: '1px solid #D2E3FC', padding: '4px 10px', borderRadius: '16px', fontWeight: 600, fontSize: '0.85rem' }}>
              {periodKey} Period Status
            </span>
          </div>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Deterministic financial record matching across deposits, expenses, checks, and reimbursements.
          </p>
        </div>

        {/* Action Controls & Period Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '8px', padding: '4px 10px' }}>
            <FileText size={16} style={{ color: 'var(--slate-blue)', marginRight: '8px' }} />
            <input
              type="month"
              value={periodKey}
              onChange={(e) => e.target.value && setPeriodKey(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontWeight: 600, color: 'var(--slate-blue-dark)', fontSize: '0.9rem' }}
            />
          </div>

          <button
            onClick={() => loadData(periodKey)}
            className="btn btn-secondary"
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            Refresh
          </button>

          {isEditor && (
            <button
              onClick={handleAutoReconcile}
              className="btn btn-primary"
              disabled={actionLoading || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--forest-green)' }}
            >
              <Zap size={15} />
              Auto-Reconcile Rules
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
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

      {/* Summary KPI Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Total Records</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>{summary.totalRecords}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>In period {periodKey}</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Matched</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-blue)' }}>{summary.matchedCount || 0}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Verified match</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Reconciled</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--forest-green)' }}>{summary.reconciledCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Fully verified</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Unmatched</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#5F6368' }}>{summary.unmatchedCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Pending match</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Needs Review</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#C5221F' }}>{summary.needsReviewCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Exceptions flagged</div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '10px' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--warm-gray)', fontWeight: 600, marginBottom: '4px' }}>Difference</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: summary.differenceAmount > 0 ? '#B06000' : 'var(--forest-green)' }}>
              {summary.differenceFormatted}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray-light)', marginTop: '4px' }}>Unresolved net variance</div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="glass-panel" style={{ padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'ALL', label: 'All Records' },
            { id: 'UNMATCHED', label: 'Unmatched' },
            { id: 'MATCHED', label: 'Matched' },
            { id: 'PARTIALLY_MATCHED', label: 'Partial' },
            { id: 'NEEDS_REVIEW', label: 'Needs Review' },
            { id: 'RECONCILED', label: 'Reconciled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: activeTab === tab.id ? '1px solid var(--slate-blue)' : '1px solid var(--mist-blue-dark)',
                background: activeTab === tab.id ? 'var(--slate-blue)' : '#FFFFFF',
                color: activeTab === tab.id ? '#FFFFFF' : 'var(--slate-blue-dark)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warm-gray)' }} />
          <input
            type="text"
            placeholder="Search payee, ID, desc..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '6px 10px 6px 32px', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>
      </div>

      {/* Main Reconciliation Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '10px' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--warm-gray)' }}>Loading reconciliation records...</div>
        ) : filteredRecords.length === 0 ? (
          <FinanceDataState title="No reconciliation records found" description="Try selecting another period key or clearing filters." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--mist-blue-dark)', textAlign: 'left', color: 'var(--warm-gray)' }}>
                  <th style={{ padding: '10px' }}>Date</th>
                  <th style={{ padding: '10px' }}>Transaction ID</th>
                  <th style={{ padding: '10px' }}>Type</th>
                  <th style={{ padding: '10px' }}>Payee / Payer</th>
                  <th style={{ padding: '10px' }}>Description</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px' }}>Evidence</th>
                  <th style={{ padding: '10px' }}>Reference</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'right' }}>Difference</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--mist-blue)', background: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                    <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>{r.transactionDate}</td>
                    <td style={{ padding: '10px', fontWeight: 600, color: 'var(--slate-blue-dark)' }}>{r.transactionId}</td>
                    <td style={{ padding: '10px' }}>{r.transactionType}</td>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{r.payeeOrPayer || '—'}</td>
                    <td style={{ padding: '10px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: r.direction === 'INCOME' ? 'var(--forest-green)' : 'var(--slate-blue-dark)' }}>
                      ${r.expectedAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span
                        onClick={() => { setSelectedRecord(r); setEvidenceDrawerOpen(true); }}
                        style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--slate-blue)', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        {r.evidenceStatus}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>{r.checkNumber ? `#${r.checkNumber}` : '—'}</td>
                    <td style={{ padding: '10px' }}>{getStatusBadge(r.reconciliationStatus)}</td>
                    <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: r.differenceAmount > 0 ? '#B06000' : 'var(--forest-green)' }}>
                      {r.differenceFormatted}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        <button
                          onClick={() => { setSelectedRecord(r); setReviewNotes(r.notes || ''); setCustomReconciledAmt(r.reconciledAmount); setReviewModalOpen(true); }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} /> Review
                        </button>
                        {isEditor && r.reconciliationStatus === 'UNMATCHED' && (
                          <button
                            onClick={() => handleReconcileSingle(r, 'MATCHED')}
                            className="btn btn-secondary"
                            disabled={actionLoading}
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            Mark Matched
                          </button>
                        )}
                        {isEditor && r.reconciliationStatus === 'MATCHED' && (
                          <button
                            onClick={() => handleReconcileSingle(r, 'RECONCILED')}
                            className="btn btn-primary"
                            disabled={actionLoading || !r.satisfiesRules}
                            title={!r.satisfiesRules ? r.blockingReasons.join('; ') : 'Reconcile record'}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.75rem',
                              background: r.satisfiesRules ? 'var(--forest-green, #137333)' : '#9AA0A6',
                              borderColor: r.satisfiesRules ? 'var(--forest-green, #137333)' : '#9AA0A6',
                              color: '#FFFFFF',
                              cursor: r.satisfiesRules ? 'pointer' : 'not-allowed'
                            }}
                          >
                            Reconcile
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Review Modal */}
      {reviewModalOpen && selectedRecord && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '2rem', maxWidth: '600px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>
              Reconciliation Review — {selectedRecord.transactionId}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', marginBottom: '1.25rem', background: '#FAFAFA', padding: '1rem', borderRadius: '8px' }}>
              <div><strong>Date:</strong> {selectedRecord.transactionDate}</div>
              <div><strong>Type:</strong> {selectedRecord.transactionType}</div>
              <div><strong>Payee/Payer:</strong> {selectedRecord.payeeOrPayer}</div>
              <div><strong>Expected Amount:</strong> ${selectedRecord.expectedAmount.toFixed(2)}</div>
              <div><strong>Evidence Status:</strong> {selectedRecord.evidenceStatus}</div>
              <div><strong>Difference:</strong> {selectedRecord.differenceFormatted}</div>
            </div>

            {/* Status & Rule Conditions */}
            {selectedRecord.reconciliationStatus === 'RECONCILED' ? (
              <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', color: '#137333', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ RECONCILED — Historical & Canonical Record Verified. Record is immutable.
              </div>
            ) : !selectedRecord.satisfiesRules ? (
              <div style={{ background: '#FCE8E6', border: '1px solid #FAD2CF', color: '#C5221F', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Reconciliation Blockers:</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {selectedRecord.blockingReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', color: '#137333', padding: '10px 14px', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                ✓ Deterministic accounting rules satisfied. Record is ready to reconcile.
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Review Notes / Comments</label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter reconciliation verification notes..."
                disabled={selectedRecord.reconciliationStatus === 'RECONCILED'}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--mist-blue-dark)', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="btn btn-secondary"
              >
                Close
              </button>

              {isEditor && selectedRecord.reconciliationStatus !== 'RECONCILED' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleReconcileSingle(selectedRecord, 'NEEDS_REVIEW')}
                    className="btn btn-secondary"
                    style={{ color: '#C5221F', borderColor: '#FAD2CF' }}
                    disabled={actionLoading}
                  >
                    Flag Needs Review
                  </button>
                  {selectedRecord.reconciliationStatus === 'UNMATCHED' && (
                    <button
                      type="button"
                      onClick={() => handleReconcileSingle(selectedRecord, 'MATCHED')}
                      className="btn btn-secondary"
                      disabled={actionLoading}
                    >
                      Mark Matched
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleReconcileSingle(selectedRecord, 'RECONCILED')}
                    className="btn btn-primary"
                    disabled={actionLoading || !selectedRecord.satisfiesRules}
                    title={!selectedRecord.satisfiesRules ? selectedRecord.blockingReasons?.join('; ') || 'Financial rules not satisfied' : 'Reconcile record'}
                    style={{
                      background: selectedRecord.satisfiesRules ? 'var(--forest-green, #137333)' : '#9AA0A6',
                      borderColor: selectedRecord.satisfiesRules ? 'var(--forest-green, #137333)' : '#9AA0A6',
                      color: '#FFFFFF',
                      cursor: selectedRecord.satisfiesRules ? 'pointer' : 'not-allowed',
                      fontWeight: 600
                    }}
                  >
                    Reconcile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Evidence Drawer Modal */}
      {evidenceDrawerOpen && selectedRecord && (
        <EvidenceDrawerModal
          isOpen={evidenceDrawerOpen}
          onClose={() => setEvidenceDrawerOpen(false)}
          entityType="Transaction"
          entityId={selectedRecord.transactionId}
          recordTitle={`Evidence for ${selectedRecord.transactionId} (${selectedRecord.payeeOrPayer})`}
        />
      )}
    </div>
  );
}
