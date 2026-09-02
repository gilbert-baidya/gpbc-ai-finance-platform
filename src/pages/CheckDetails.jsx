import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api/financeApi';
import { useAuth } from '../context/AuthContext';
import FinanceDataState from '../components/FinanceDataState';
import {
  CheckSquare,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  X
} from 'lucide-react';

export const CheckDetails = () => {
  const { user } = useAuth();
  const [checks, setChecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    checkNumber: '',
    checkDate: new Date().toISOString().split('T')[0],
    amount: '',
    payee: '',
    purpose: '',
    transactionId: '',
    invoiceReceiptId: '',
    driveUrl: '',
    notes: ''
  });

  const loadChecks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getCheckDetails();
      if (res.success && Array.isArray(res.checks)) {
        setChecks(res.checks);
        setDataAvailable(true);
      } else {
        setChecks([]);
        setDataAvailable(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load checks');
      setDataAvailable(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChecks();
  }, [loadChecks]);

  const handleCreateCheck = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await financeApi.addCheckDetail({
        ...formData,
        amount: Number(formData.amount)
      });
      setShowAddModal(false);
      setFormData({
        checkNumber: '',
        checkDate: new Date().toISOString().split('T')[0],
        amount: '',
        payee: '',
        purpose: '',
        transactionId: '',
        invoiceReceiptId: '',
        driveUrl: '',
        notes: ''
      });
      loadChecks();
    } catch (err) {
      alert(err.message || 'Failed to record check');
    } finally {
      setSubmitting(false);
    }
  };

  const totalDisbursed = checks.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const filtered = checks.filter(c => {
    const q = search.toLowerCase();
    return !search ||
      (c.checkNumber && c.checkNumber.toLowerCase().includes(q)) ||
      (c.payee && c.payee.toLowerCase().includes(q)) ||
      (c.purpose && c.purpose.toLowerCase().includes(q));
  });

  const canWrite = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Finance Editor';

  return (
    <div className="finance-page-container animate-fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-blue)', margin: 0 }}>
            Check Disbursements & Register
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Complete church check registry, payee tracking, voucher attachments, and reconciliation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-outline" onClick={loadChecks} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
          {canWrite && (
            <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              Record Check
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>TOTAL CHECKS ISSUED</span>
            <CheckSquare size={18} color="var(--slate-blue)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-blue)', marginTop: '8px' }}>
            {dataAvailable ? checks.length : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Disbursements recorded</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>TOTAL AMOUNT DISBURSED</span>
            <CheckSquare size={18} color="#991B1B" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991B1B', marginTop: '8px' }}>
            {dataAvailable ? `$${totalDisbursed.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Total check payments</span>
        </div>
      </div>

      {/* Filter */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warm-gray)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search check #, payee, or purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {error && <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <span>Loading check register...</span>
          </div>
        ) : !dataAvailable ? (
          <FinanceDataState title="Check register data is currently unavailable" />
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <CheckSquare size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No check records</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#FAF6F0', borderBottom: '1px solid var(--mist-blue-dark)', color: 'var(--slate-blue-dark)' }}>
                  <th style={{ padding: '12px 16px' }}>Check #</th>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Payee</th>
                  <th style={{ padding: '12px 16px' }}>Purpose</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Voucher / Drive</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--slate-blue)' }}>#{c.checkNumber}</td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{c.checkDate}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.payee}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--slate-blue-dark)' }}>{c.purpose || '—'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#991B1B' }}>
                      ${Number(c.amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {c.driveUrl ? (
                        <a href={c.driveUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--slate-blue)', textDecoration: 'none', fontWeight: 500 }}>
                          <ExternalLink size={14} /> Voucher
                        </a>
                      ) : (
                        <span style={{ color: 'var(--warm-gray-light)' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: c.reconciliationStatus === 'Cleared' ? '#DEF7EC' : '#FEF3C7',
                        color: c.reconciliationStatus === 'Cleared' ? '#03543F' : '#92400E'
                      }}>
                        {c.reconciliationStatus || 'Unreconciled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Check Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ background: '#FFFFFF', maxWidth: '580px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-blue)', margin: 0, fontWeight: 700 }}>Record Check Disbursement</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateCheck} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Check Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1045"
                    className="form-input"
                    value={formData.checkNumber}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Check Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.checkDate}
                    onChange={(e) => setFormData({ ...formData, checkDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Payee</label>
                  <input
                    type="text"
                    required
                    placeholder="Person or Company name"
                    className="form-input"
                    value={formData.payee}
                    onChange={(e) => setFormData({ ...formData, payee: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    className="form-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Purpose / Church Justification</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Honorarium guest speaker, fellowship hall electrical repair"
                  className="form-input"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Check Image / Voucher Drive Link</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  className="form-input"
                  value={formData.driveUrl}
                  onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Record Check'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckDetails;
