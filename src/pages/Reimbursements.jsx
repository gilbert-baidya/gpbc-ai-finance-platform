import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api/financeApi';
import { useAuth } from '../context/AuthContext';
import FinanceDataState from '../components/FinanceDataState';
import { DocumentLinkBadge } from '../components/DocumentLinkBadge';
import { EvidenceDrawerModal } from '../components/EvidenceDrawerModal';
import {
  CreditCard,
  Plus,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  HeartHandshake
} from 'lucide-react';

export const Reimbursements = () => {
  const { user } = useAuth();
  const [reimbursements, setReimbursements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReimbursement, setSelectedReimbursement] = useState(null);

  const [formData, setFormData] = useState({
    reimbursementDate: new Date().toISOString().split('T')[0],
    claimantName: '',
    claimantEmail: '',
    totalPurchaseAmount: '',
    totalReimbursedAmount: '',
    totalPersonallyAbsorbed: '',
    paymentMethod: 'Check',
    checkNumber: '',
    notes: '',
    allocations: [{ purchaseTransactionId: '', allocatedAmount: '', personallyAbsorbedAmount: '', notes: '' }]
  });

  const loadReimbursements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getReimbursements();
      if (res.success && Array.isArray(res.reimbursements)) {
        setReimbursements(res.reimbursements);
        setDataAvailable(true);
      } else {
        setReimbursements([]);
        setDataAvailable(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load reimbursements');
      setDataAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReimbursements();
  }, [loadReimbursements]);

  const handleAddAllocationRow = () => {
    setFormData({
      ...formData,
      allocations: [
        ...formData.allocations,
        { purchaseTransactionId: '', allocatedAmount: '', personallyAbsorbedAmount: '', notes: '' }
      ]
    });
  };

  const handleRemoveAllocationRow = (idx) => {
    const updated = formData.allocations.filter((_, i) => i !== idx);
    setFormData({ ...formData, allocations: updated });
  };

  const handleAllocationChange = (idx, field, val) => {
    const updated = [...formData.allocations];
    updated[idx][field] = val;
    setFormData({ ...formData, allocations: updated });
  };

  const handleCreateReimbursement = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const purchaseAmt = Number(formData.totalPurchaseAmount);
      const reimbursedAmt = Number(formData.totalReimbursedAmount);
      const absorbedAmt = Number(formData.totalPersonallyAbsorbed || 0);

      const validAllocations = formData.allocations
        .filter(a => a.purchaseTransactionId || a.allocatedAmount)
        .map(a => ({
          purchaseTransactionId: a.purchaseTransactionId,
          allocatedAmount: Number(a.allocatedAmount || reimbursedAmt),
          personallyAbsorbedAmount: Number(a.personallyAbsorbedAmount || absorbedAmt),
          notes: a.notes
        }));

      await financeApi.addReimbursement({
        reimbursementDate: formData.reimbursementDate,
        claimantName: formData.claimantName,
        claimantEmail: formData.claimantEmail,
        totalPurchaseAmount: purchaseAmt,
        totalReimbursedAmount: reimbursedAmt,
        totalPersonallyAbsorbed: absorbedAmt,
        paymentMethod: formData.paymentMethod,
        checkNumber: formData.checkNumber,
        notes: formData.notes,
        allocations: validAllocations
      });

      setShowAddModal(false);
      setFormData({
        reimbursementDate: new Date().toISOString().split('T')[0],
        claimantName: '',
        claimantEmail: '',
        totalPurchaseAmount: '',
        totalReimbursedAmount: '',
        totalPersonallyAbsorbed: '',
        paymentMethod: 'Check',
        checkNumber: '',
        notes: '',
        allocations: [{ purchaseTransactionId: '', allocatedAmount: '', personallyAbsorbedAmount: '', notes: '' }]
      });
      loadReimbursements();
    } catch (err) {
      alert(err.message || 'Failed to save reimbursement');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPurchases = reimbursements.reduce((sum, r) => sum + Number(r.totalPurchaseAmount || 0), 0);
  const totalReimbursed = reimbursements.reduce((sum, r) => sum + Number(r.totalReimbursedAmount || 0), 0);
  const totalAbsorbed = reimbursements.reduce((sum, r) => sum + Number(r.totalPersonallyAbsorbed || 0), 0);
  const totalPending = reimbursements.reduce((sum, r) => sum + Number(r.remainingReimbursable || 0), 0);

  const filtered = statusFilter
    ? reimbursements.filter(r => r.status === statusFilter)
    : reimbursements;

  const canWrite = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Finance Editor';

  return (
    <div className="finance-page-container animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-blue)', margin: 0 }}>
            Reimbursements & Personal Card Accounting
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Many-to-many allocation tracking for personal purchases, church reimbursements, and absorbed balances
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" onClick={loadReimbursements} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
          {canWrite && (
            <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              Record Reimbursement
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '16px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>PURCHASES CLAIMED</span>
            <CreditCard size={18} color="var(--slate-blue)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-blue)', marginTop: '6px' }}>
            {dataAvailable ? `$${totalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--warm-gray)' }}>Underlying personal expenses</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>TOTAL REIMBURSED</span>
            <CheckCircle2 size={18} color="#2D8B6E" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#165940', marginTop: '6px' }}>
            {dataAvailable ? `$${totalReimbursed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--warm-gray)' }}>Paid by church check/Zelle</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>PERSONALLY ABSORBED</span>
            <HeartHandshake size={18} color="var(--gold-dark)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold-dark)', marginTop: '6px' }}>
            {dataAvailable ? `$${totalAbsorbed.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--warm-gray)' }}>Absorbed as member gift</span>
        </div>

        <div className="glass-panel" style={{ padding: '16px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>REMAINING PENDING</span>
            <Clock size={18} color="#C05621" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: totalPending > 0 ? '#C05621' : '#165940', marginTop: '6px' }}>
            {dataAvailable ? `$${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--warm-gray)' }}>Pending future payout</span>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-panel" style={{ padding: '14px 16px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-blue-dark)' }}>Filter by Status:</span>
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '200px', minHeight: '38px' }}
        >
          <option value="">All Reimbursements</option>
          <option value="Approved">Approved</option>
          <option value="Fully Reimbursed">Fully Reimbursed</option>
          <option value="Partially Reimbursed">Partially Reimbursed</option>
          <option value="Pending">Pending</option>
        </select>
      </div>

      {/* Table & Mobile Cards */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {error && <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <span>Loading reimbursements...</span>
          </div>
        ) : !dataAvailable ? (
          <FinanceDataState title="Reimbursement data is currently unavailable" />
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <CreditCard size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No reimbursement records</p>
          </div>
        ) : (
          <>
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#FAF6F0', borderBottom: '1px solid var(--mist-blue-dark)', color: 'var(--slate-blue-dark)' }}>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>Reimbursement ID</th>
                    <th style={{ padding: '12px 16px' }}>Claimant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Purchase Total</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Reimbursed</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Absorbed</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Pending</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Method</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Evidence</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{r.reimbursementDate}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--slate-blue)' }}>{r.reimbursementId}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {r.claimantName}
                        {r.allocations && r.allocations.length > 0 && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--warm-gray)', marginTop: '2px' }}>
                            {r.allocations.length} linked purchase allocation{r.allocations.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                        ${Number(r.totalPurchaseAmount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#165940' }}>
                        ${Number(r.totalReimbursedAmount || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--gold-dark)', fontWeight: 600 }}>
                        ${Number(r.totalPersonallyAbsorbed || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: Number(r.remainingReimbursable || 0) > 0 ? '#C05621' : 'var(--warm-gray)' }}>
                        ${Number(r.remainingReimbursable || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--warm-gray)' }}>
                        {r.paymentMethod} {r.checkNumber ? `#${r.checkNumber}` : ''}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <DocumentLinkBadge
                          onAttachClick={() => setSelectedReimbursement(r)}
                          onViewClick={() => setSelectedReimbursement(r)}
                          attachLabel="Attach Evidence"
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: r.status === 'Fully Reimbursed' ? '#DEF7EC' : (r.status === 'Partially Reimbursed' ? '#FEF3C7' : '#EBF3F5'),
                          color: r.status === 'Fully Reimbursed' ? '#03543F' : (r.status === 'Partially Reimbursed' ? '#92400E' : '#2C3E50')
                        }}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-view" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {filtered.map((r, idx) => (
                <div key={idx} style={{
                  background: '#FFFFFF',
                  border: '1px solid var(--mist-blue-dark)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--slate-blue-dark)' }}>{r.claimantName || 'Unknown Claimant'}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', marginTop: '2px' }}>
                        {r.reimbursementDate} • <code style={{ fontSize: '0.72rem' }}>{r.reimbursementId}</code>
                      </div>
                    </div>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: r.status === 'Fully Reimbursed' ? '#DEF7EC' : (r.status === 'Partially Reimbursed' ? '#FEF3C7' : '#EBF3F5'),
                      color: r.status === 'Fully Reimbursed' ? '#03543F' : (r.status === 'Partially Reimbursed' ? '#92400E' : '#2C3E50'),
                      whiteSpace: 'nowrap'
                    }}>
                      {r.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '8px 10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'var(--warm-gray)' }}>Purchase Amount:</span>
                      <div style={{ fontWeight: 700, color: 'var(--slate-blue-dark)' }}>
                        ${Number(r.totalPurchaseAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--warm-gray)' }}>Reimbursed:</span>
                      <div style={{ fontWeight: 700, color: '#165940' }}>
                        ${Number(r.totalReimbursedAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--warm-gray)' }}>Personally Absorbed:</span>
                      <div style={{ fontWeight: 600, color: 'var(--gold-dark)' }}>
                        ${Number(r.totalPersonallyAbsorbed || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--warm-gray)' }}>Remaining Pending:</span>
                      <div style={{ fontWeight: 700, color: Number(r.remainingReimbursable || 0) > 0 ? '#C05621' : 'var(--warm-gray)' }}>
                        ${Number(r.remainingReimbursable || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #f1f5f9' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--warm-gray)' }}>
                      {r.paymentMethod} {r.checkNumber ? `#${r.checkNumber}` : ''}
                    </span>
                    <DocumentLinkBadge
                      onAttachClick={() => setSelectedReimbursement(r)}
                      onViewClick={() => setSelectedReimbursement(r)}
                      attachLabel="Attach Evidence"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Record Reimbursement Modal */}
      {showAddModal && (
        <div className="finance-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel finance-modal-container" style={{ background: '#FFFFFF', maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-blue)', margin: 0, fontWeight: 700 }}>Record Church Reimbursement</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--warm-gray)' }}>Many-to-many allocation matching</span>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', padding: '8px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReimbursement} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Claimant Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pastor Gilbert / Staff Member"
                    className="form-input"
                    value={formData.claimantName}
                    onChange={(e) => setFormData({ ...formData, claimantName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reimbursement Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.reimbursementDate}
                    onChange={(e) => setFormData({ ...formData, reimbursementDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Total Purchase ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="25.50"
                    className="form-input"
                    value={formData.totalPurchaseAmount}
                    onChange={(e) => setFormData({ ...formData, totalPurchaseAmount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reimbursed ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="24.12"
                    className="form-input"
                    value={formData.totalReimbursedAmount}
                    onChange={(e) => setFormData({ ...formData, totalReimbursedAmount: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Absorbed ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1.38"
                    className="form-input"
                    value={formData.totalPersonallyAbsorbed}
                    onChange={(e) => setFormData({ ...formData, totalPersonallyAbsorbed: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="Check">Church Check</option>
                    <option value="Zelle">Church Zelle</option>
                    <option value="ACH / Bank Transfer">ACH / Bank Transfer</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Check Number / Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. Check #1042"
                    className="form-input"
                    value={formData.checkNumber}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                  />
                </div>
              </div>

              {/* Linked Allocations Section */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-blue)' }}>
                    Linked Purchase Allocations (Optional / Multi-Purchase)
                  </span>
                  <button type="button" className="btn btn-outline btn-sm" onClick={handleAddAllocationRow}>
                    + Add Allocation
                  </button>
                </div>

                {formData.allocations.map((alc, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Purchase Txn ID (e.g. TXN-20260201-12345)"
                      className="form-input"
                      value={alc.purchaseTransactionId}
                      onChange={(e) => handleAllocationChange(idx, 'purchaseTransactionId', e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Allocated ($)"
                      className="form-input"
                      value={alc.allocatedAmount}
                      onChange={(e) => handleAllocationChange(idx, 'allocatedAmount', e.target.value)}
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Absorbed ($)"
                      className="form-input"
                      value={alc.personallyAbsorbedAmount}
                      onChange={(e) => handleAllocationChange(idx, 'personallyAbsorbedAmount', e.target.value)}
                    />
                    {formData.allocations.length > 1 && (
                      <button type="button" onClick={() => handleRemoveAllocationRow(idx)} style={{ background: 'none', border: 'none', color: '#991B1B', cursor: 'pointer' }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Notes & Explanation</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  placeholder="e.g. Covering Amazon sound cables and Walmart fellowship cups"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Reimbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Drawer Modal */}
      {selectedReimbursement && (
        <EvidenceDrawerModal
          isOpen={!!selectedReimbursement}
          onClose={() => setSelectedReimbursement(null)}
          entityType="Reimbursement"
          entityId={selectedReimbursement.reimbursementId}
          reimbursementId={selectedReimbursement.reimbursementId}
          recordTitle={`Reimbursement for ${selectedReimbursement.claimantName}`}
          defaultDocumentType="Reimbursement Evidence"
          canEdit={canWrite}
        />
      )}
    </div>
  );
};

export default Reimbursements;
