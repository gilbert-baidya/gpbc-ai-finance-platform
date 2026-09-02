import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api/financeApi';
import { useAuth } from '../context/AuthContext';
import FinanceDataState from '../components/FinanceDataState';
import {
  Receipt,
  Plus,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Link as LinkIcon
} from 'lucide-react';

export const ReceiptRegister = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [matchTxnId, setMatchTxnId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    receiptDate: new Date().toISOString().split('T')[0],
    merchant: '',
    amount: '',
    documentType: 'Receipt',
    driveUrl: '',
    driveFileId: '',
    matchedTransactionId: '',
    notes: ''
  });

  const loadReceipts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getReceipts({
        matchStatus: statusFilter || undefined,
        search: search || undefined
      });
      if (res.success && Array.isArray(res.receipts)) {
        setReceipts(res.receipts);
        setDataAvailable(true);
      } else {
        setReceipts([]);
        setDataAvailable(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load receipts');
      setDataAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const handleCreateReceipt = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await financeApi.addReceipt({
        ...formData,
        amount: Number(formData.amount)
      });
      setShowAddModal(false);
      setFormData({
        receiptDate: new Date().toISOString().split('T')[0],
        merchant: '',
        amount: '',
        documentType: 'Receipt',
        driveUrl: '',
        driveFileId: '',
        matchedTransactionId: '',
        notes: ''
      });
      loadReceipts();
    } catch (err) {
      alert(err.message || 'Failed to add receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMatchReceipt = async (e) => {
    e.preventDefault();
    if (!selectedReceipt || !matchTxnId) return;
    try {
      setSubmitting(true);
      await financeApi.matchReceiptToTransaction(selectedReceipt.receiptId, matchTxnId);
      setShowMatchModal(false);
      setSelectedReceipt(null);
      setMatchTxnId('');
      loadReceipts();
    } catch (err) {
      alert(err.message || 'Failed to link receipt to transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const matchedCount = receipts.filter(r => r.matchStatus === 'Matched').length;
  const unmatchedCount = receipts.filter(r => r.matchStatus === 'Unmatched').length;
  const totalAmount = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const canWrite = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Finance Editor';

  return (
    <div className="finance-page-container animate-fade-in" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-blue)', margin: 0 }}>
            Receipt Register
          </h1>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Central evidence repository linked to private Google Drive storage and ledger transactions
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" className="btn btn-outline" onClick={loadReceipts} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} />
            Refresh
          </button>
          {canWrite && (
            <button type="button" className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} />
              Register Receipt
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>TOTAL REGISTERED</span>
            <Receipt size={18} color="var(--slate-blue)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--slate-blue)', marginTop: '8px' }}>
            {dataAvailable ? receipts.length : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>{dataAvailable ? `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Not available yet'}</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>MATCHED EVIDENCE</span>
            <CheckCircle2 size={18} color="#2D8B6E" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#165940', marginTop: '8px' }}>
            {dataAvailable ? matchedCount : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Linked to ledger transactions</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>UNMATCHED RECEIPTS</span>
            <AlertCircle size={18} color="#C05621" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: unmatchedCount > 0 ? '#C05621' : '#165940', marginTop: '8px' }}>
            {dataAvailable ? unmatchedCount : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Pending transaction link</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warm-gray)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search merchant, receipt ID, notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: '180px' }}
        >
          <option value="">All Match Statuses</option>
          <option value="Matched">Matched Only</option>
          <option value="Unmatched">Unmatched Only</option>
        </select>
      </div>

      {/* Receipts Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {error && <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B' }}>{error}</div>}

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <span>Loading receipt register...</span>
          </div>
        ) : !dataAvailable ? (
          <FinanceDataState title="Receipt register data is currently unavailable" />
        ) : receipts.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <Receipt size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No receipts registered</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#FAF6F0', borderBottom: '1px solid var(--mist-blue-dark)', color: 'var(--slate-blue-dark)' }}>
                  <th style={{ padding: '12px 16px' }}>Date</th>
                  <th style={{ padding: '12px 16px' }}>Receipt ID</th>
                  <th style={{ padding: '12px 16px' }}>Merchant / Vendor</th>
                  <th style={{ padding: '12px 16px' }}>Doc Type</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Drive Evidence</th>
                  <th style={{ padding: '12px 16px' }}>Matched Txn</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  {canWrite && <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>}
                </tr>
              </thead>
              <tbody>
                {receipts.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>{r.receiptDate}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--slate-blue)' }}>{r.receiptId}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{r.merchant}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--warm-gray)' }}>{r.documentType || 'Receipt'}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>
                      ${Number(r.amount || 0).toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {r.driveUrl ? (
                        <a href={r.driveUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--slate-blue)', textDecoration: 'none', fontWeight: 500 }}>
                          <ExternalLink size={14} /> View File
                        </a>
                      ) : (
                        <span style={{ color: 'var(--warm-gray-light)' }}>No file</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--slate-blue)' }}>
                      {r.matchedTransactionId || <span style={{ color: 'var(--warm-gray-light)' }}>—</span>}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: r.matchStatus === 'Matched' ? '#DEF7EC' : '#FEF3C7',
                        color: r.matchStatus === 'Matched' ? '#03543F' : '#92400E'
                      }}>
                        {r.matchStatus || 'Unmatched'}
                      </span>
                    </td>
                    {canWrite && (
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        {r.matchStatus !== 'Matched' && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => {
                              setSelectedReceipt(r);
                              setShowMatchModal(true);
                            }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', fontSize: '0.75rem' }}
                          >
                            <LinkIcon size={12} /> Match
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Receipt Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ background: '#FFFFFF', maxWidth: '580px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-blue)', margin: 0, fontWeight: 700 }}>Register Receipt Evidence</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateReceipt} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Merchant / Store</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amazon, Home Depot, Walmart"
                    className="form-input"
                    value={formData.merchant}
                    onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Receipt Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.receiptDate}
                    onChange={(e) => setFormData({ ...formData, receiptDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
                <div className="form-group">
                  <label className="form-label">Document Type</label>
                  <select
                    className="form-select"
                    value={formData.documentType}
                    onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                  >
                    <option value="Receipt">Receipt</option>
                    <option value="Invoice">Invoice</option>
                    <option value="Statement">Statement</option>
                    <option value="Check Image">Check Image</option>
                    <option value="Screenshot">Screenshot</option>
                    <option value="Order Confirmation">Order Confirmation</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Google Drive View URL</label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/d/..."
                  className="form-input"
                  value={formData.driveUrl}
                  onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Matched Transaction ID (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-20260201-12345"
                  className="form-input"
                  value={formData.matchedTransactionId}
                  onChange={(e) => setFormData({ ...formData, matchedTransactionId: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  type="text"
                  placeholder="Items purchased or discrepancy notes"
                  className="form-input"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Register Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Match Modal */}
      {showMatchModal && selectedReceipt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel" style={{ background: '#FFFFFF', maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.15rem', color: 'var(--slate-blue)', margin: 0, fontWeight: 700 }}>Match Receipt to Transaction</h2>
              <button type="button" onClick={() => setShowMatchModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--slate-blue-dark)', marginBottom: '16px' }}>
              Linking receipt <strong>{selectedReceipt.receiptId}</strong> ({selectedReceipt.merchant} - ${Number(selectedReceipt.amount).toFixed(2)})
            </p>

            <form onSubmit={handleMatchReceipt}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Enter Transaction ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TXN-20260201-12345"
                  className="form-input"
                  value={matchTxnId}
                  onChange={(e) => setMatchTxnId(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowMatchModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Linking...' : 'Confirm Match'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiptRegister;
