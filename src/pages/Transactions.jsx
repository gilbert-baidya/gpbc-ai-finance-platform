import React, { useState, useEffect, useCallback } from 'react';
import { financeApi } from '../api/financeApi';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/PeriodContext';
import FinanceDataState from '../components/FinanceDataState';
import { DocumentLinkBadge } from '../components/DocumentLinkBadge';
import { EvidenceDrawerModal } from '../components/EvidenceDrawerModal';
import {
  FileSpreadsheet,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Filter,
  RefreshCw,
  X
} from 'lucide-react';

export const Transactions = () => {
  const { user } = useAuth();
  const { periodLabel, startDate, endDate } = usePeriod();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState('');
  const [fundFilter, setFundFilter] = useState('');
  const [filterPeriodOnly, setFilterPeriodOnly] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const [formData, setFormData] = useState({
    transactionDate: new Date().toISOString().split('T')[0],
    transactionType: 'Sunday Offering',
    direction: 'INCOME',
    amount: '',
    payeeOrPayer: '',
    description: '',
    category: 'Tithes & Offerings',
    fundId: 'General',
    capitalProjectId: '',
    paymentMethod: 'Cash',
    checkNumber: '',
    personalPurchase: false,
    claimantName: '',
    notes: ''
  });

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await financeApi.getTransactions({
        search: search || undefined,
        direction: directionFilter || undefined,
        fundId: fundFilter || undefined,
        startDate: filterPeriodOnly ? startDate : undefined,
        endDate: filterPeriodOnly ? endDate : undefined
      });
      if (res.success && Array.isArray(res.transactions)) {
        setTransactions(res.transactions);
        setDataAvailable(true);
      } else {
        setTransactions([]);
        setDataAvailable(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to load transactions');
      setDataAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [search, directionFilter, fundFilter, filterPeriodOnly, startDate, endDate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await financeApi.addTransaction({
        ...formData,
        amount: Number(formData.amount)
      });
      setShowAddModal(false);
      setFormData({
        transactionDate: new Date().toISOString().split('T')[0],
        transactionType: 'Sunday Offering',
        direction: 'INCOME',
        amount: '',
        payeeOrPayer: '',
        description: '',
        category: 'Tithes & Offerings',
        fundId: 'General',
        capitalProjectId: '',
        paymentMethod: 'Cash',
        checkNumber: '',
        personalPurchase: false,
        claimantName: '',
        notes: ''
      });
      loadTransactions();
    } catch (err) {
      alert(err.message || 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  // Compute live summary stats (accounting-correct: exclude reimbursement payouts from operating expenses)
  const totalIncome = transactions
    .filter(t => t.direction === 'INCOME')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.accountingImpact === 'EXPENSE' || (t.direction === 'EXPENSE' && t.transactionType !== 'Reimbursement'))
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const totalSettlements = transactions
    .filter(t => t.accountingImpact === 'SETTLEMENT' || t.transactionType === 'Reimbursement')
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const personalPurchases = transactions
    .filter(t => t.personalPurchase)
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);

  const canWrite = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Finance Editor';

  return (
    <div className="finance-page-container animate-fade-in" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-blue)', margin: 0 }}>
              Master Transactions
            </h1>
            <span style={{
              fontSize: '0.8rem',
              fontWeight: 700,
              background: 'var(--ivory, #fefce8)',
              border: '1px solid var(--gold, #ca8a04)',
              color: 'var(--gold-dark, #854d0e)',
              padding: '2px 10px',
              borderRadius: '12px'
            }}>
              {filterPeriodOnly ? periodLabel : 'All Periods'}
            </span>
          </div>
          <p style={{ color: 'var(--warm-gray)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
            Unified ledger for church income, operating expenses, reimbursement settlements, and designated funds
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn ${filterPeriodOnly ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterPeriodOnly(!filterPeriodOnly)}
            title="Toggle period filter"
          >
            {filterPeriodOnly ? `Filtered: ${periodLabel}` : 'Viewing All Periods'}
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={loadTransactions}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {canWrite && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={16} />
              Record Transaction
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>TOTAL INFLOW</span>
            <ArrowUpRight size={18} color="#2D8B6E" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#165940', marginTop: '8px' }}>
            {dataAvailable ? `$${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Offerings & donations</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>OPERATING EXPENSES</span>
            <ArrowDownLeft size={18} color="#C05621" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#991B1B', marginTop: '8px' }}>
            {dataAvailable ? `$${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Recognized expenses (settlements: ${totalSettlements.toFixed(2)})</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>NET POSITION</span>
            <FileSpreadsheet size={18} color="var(--slate-blue)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: netBalance >= 0 ? 'var(--slate-blue)' : '#991B1B', marginTop: '8px' }}>
            {dataAvailable ? `$${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Operating balance</span>
        </div>

        <div className="glass-panel" style={{ padding: '20px', background: '#FAF6F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warm-gray)', fontSize: '0.85rem', fontWeight: 600 }}>
            <span>PERSONAL PURCHASES</span>
            <CreditCard size={18} color="var(--gold-dark)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--gold-dark)', marginTop: '8px' }}>
            {dataAvailable ? `$${personalPurchases.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>Personal card tracking</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--warm-gray)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search payee, donor, description, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Filter size={16} color="var(--warm-gray)" />
          <select
            className="form-select"
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="">All Flows</option>
            <option value="INCOME">Income Only</option>
            <option value="EXPENSE">Expense Only</option>
          </select>

          <select
            className="form-select"
            value={fundFilter}
            onChange={(e) => setFundFilter(e.target.value)}
            style={{ width: '140px' }}
          >
            <option value="">All Funds</option>
            <option value="General">General Fund</option>
            <option value="Building">Building Fund</option>
            <option value="Missions">Missions Fund</option>
            <option value="Designated">Designated</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        {error && (
          <div style={{ padding: '16px', background: '#FEE2E2', color: '#991B1B', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
            <span>Loading master transactions...</span>
          </div>
        ) : !dataAvailable ? (
          <FinanceDataState title="Transaction data is currently unavailable" />
        ) : transactions.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--warm-gray)' }}>
            <FileSpreadsheet size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No transactions found</p>
            <span style={{ fontSize: '0.85rem' }}>Try adjusting your filters or record a new transaction.</span>
          </div>
        ) : (
          <>
            <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: '#FAF6F0', borderBottom: '1px solid var(--mist-blue-dark)', color: 'var(--slate-blue-dark)' }}>
                    <th style={{ padding: '12px 16px' }}>Date</th>
                    <th style={{ padding: '12px 16px' }}>ID / Type</th>
                    <th style={{ padding: '12px 16px' }}>Payee / Donor</th>
                    <th style={{ padding: '12px 16px' }}>Description</th>
                    <th style={{ padding: '12px 16px' }}>Fund / Category</th>
                    <th style={{ padding: '12px 16px' }}>Method</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Receipt / Evidence</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.15s' }}>
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontWeight: 500 }}>
                        {t.transactionDate}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--slate-blue)' }}>{t.transactionType}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)' }}>{t.transactionId}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                        {t.payeeOrPayer}
                        {t.personalPurchase && (
                          <span style={{ display: 'inline-block', marginLeft: '6px', fontSize: '0.7rem', padding: '1px 6px', background: '#FEF3C7', color: '#92400E', borderRadius: '4px' }}>
                            Personal Card
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--slate-blue-dark)', maxWidth: '240px' }}>
                        {t.description || '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: '#EBF3F5', color: '#2C3E50', fontSize: '0.75rem', fontWeight: 500 }}>
                          {t.fundId || 'General'}
                        </span>
                        {t.category && <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', marginTop: '2px' }}>{t.category}</div>}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--warm-gray)' }}>
                        {t.paymentMethod} {t.checkNumber ? `#${t.checkNumber}` : ''}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, fontSize: '0.95rem', color: t.direction === 'INCOME' ? '#165940' : '#991B1B' }}>
                        {t.direction === 'INCOME' ? '+' : '-'}${Number(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <DocumentLinkBadge
                          onAttachClick={() => setSelectedTxn(t)}
                          onViewClick={() => setSelectedTxn(t)}
                          attachLabel="Attach Receipt"
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: t.reconciliationStatus === 'Reconciled' ? '#DEF7EC' : '#FEF3C7',
                          color: t.reconciliationStatus === 'Reconciled' ? '#03543F' : '#92400E'
                        }}>
                          {t.reconciliationStatus || 'Unreconciled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-card-view" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {transactions.map((t, idx) => (
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
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--slate-blue-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.payeeOrPayer || '—'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', marginTop: '2px' }}>
                        {t.transactionDate} • {t.transactionType}
                      </div>
                    </div>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      whiteSpace: 'nowrap',
                      color: t.direction === 'INCOME' ? '#165940' : '#991B1B'
                    }}>
                      {t.direction === 'INCOME' ? '+' : '-'}${Number(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {t.description && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--warm-gray-dark)', lineHeight: 1.3 }}>
                      {t.description}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.72rem', background: '#EBF3F5', color: '#2C3E50', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                        {t.fundId || 'General'}
                      </span>
                      {t.category && (
                        <span style={{ fontSize: '0.72rem', background: '#f8fafc', color: 'var(--warm-gray)', padding: '2px 6px', borderRadius: '4px' }}>
                          {t.category}
                        </span>
                      )}
                      {t.personalPurchase && (
                        <span style={{ fontSize: '0.72rem', background: '#FEF3C7', color: '#92400E', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          Personal
                        </span>
                      )}
                    </div>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      background: t.reconciliationStatus === 'Reconciled' ? '#DEF7EC' : '#FEF3C7',
                      color: t.reconciliationStatus === 'Reconciled' ? '#03543F' : '#92400E'
                    }}>
                      {t.reconciliationStatus || 'Unreconciled'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px dashed #f1f5f9' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--warm-gray-light)', fontFamily: 'monospace' }}>
                      {t.transactionId}
                    </span>
                    <DocumentLinkBadge
                      onAttachClick={() => setSelectedTxn(t)}
                      onViewClick={() => setSelectedTxn(t)}
                      attachLabel="Attach Receipt"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="finance-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div className="glass-panel finance-modal-container" style={{ background: '#FFFFFF', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-blue)', margin: 0, fontWeight: 700 }}>Record New Transaction</h2>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--warm-gray)', padding: '8px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Flow Direction</label>
                  <select
                    className="form-select"
                    value={formData.direction}
                    onChange={(e) => {
                      const dir = e.target.value;
                      setFormData({
                        ...formData,
                        direction: dir,
                        transactionType: dir === 'INCOME' ? 'Sunday Offering' : 'Expense',
                        category: dir === 'INCOME' ? 'Tithes & Offerings' : 'Ministry Expense'
                      });
                    }}
                  >
                    <option value="INCOME">Income (Inflow)</option>
                    <option value="EXPENSE">Expense (Outflow)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Date</label>
                  <input
                    type="date"
                    required
                    className="form-input"
                    value={formData.transactionDate}
                    onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Transaction Type</label>
                  <select
                    className="form-select"
                    value={formData.transactionType}
                    onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                  >
                    {formData.direction === 'INCOME' ? (
                      <>
                        <option value="Sunday Offering">Sunday Offering</option>
                        <option value="General Donation">General Donation</option>
                        <option value="Special Donation">Special Donation</option>
                        <option value="Designated Donation">Designated Donation</option>
                        <option value="Capital Project Donation">Capital Project Donation</option>
                        <option value="Other Income">Other Income</option>
                      </>
                    ) : (
                      <>
                        <option value="Expense">Standard Expense</option>
                        <option value="Personal-Card Church Purchase">Personal-Card Purchase</option>
                        <option value="Reimbursement">Reimbursement Payout</option>
                        <option value="Check Payment">Check Payment</option>
                        <option value="Capital Project Expense">Capital Project Expense</option>
                        <option value="Other Expense">Other Expense</option>
                      </>
                    )}
                  </select>
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
                <label className="form-label">{formData.direction === 'INCOME' ? 'Donor / Giver Name' : 'Payee / Vendor Name'}</label>
                <input
                  type="text"
                  required
                  placeholder={formData.direction === 'INCOME' ? 'e.g. John Doe / Family' : 'e.g. Amazon, Utility Co., Home Depot'}
                  className="form-input"
                  value={formData.payeeOrPayer}
                  onChange={(e) => setFormData({ ...formData, payeeOrPayer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Sunday worship flowers, sound equipment replacement"
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Fund</label>
                  <select
                    className="form-select"
                    value={formData.fundId}
                    onChange={(e) => setFormData({ ...formData, fundId: e.target.value })}
                  >
                    <option value="General">General Operating</option>
                    <option value="Building">Building / Facilities</option>
                    <option value="Missions">Missions & Outreach</option>
                    <option value="Youth">Youth Ministry</option>
                    <option value="Benevolence">Benevolence / Charity</option>
                    <option value="Designated">Designated</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="Zelle">Zelle</option>
                    <option value="Credit Card">Church Credit Card</option>
                    <option value="Personal Card">Personal Card</option>
                    <option value="ACH / Bank Transfer">ACH / Bank Transfer</option>
                  </select>
                </div>
              </div>

              {formData.paymentMethod === 'Check' && (
                <div className="form-group">
                  <label className="form-label">Check Number</label>
                  <input
                    type="text"
                    placeholder="Check #"
                    className="form-input"
                    value={formData.checkNumber}
                    onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                  />
                </div>
              )}

              {formData.direction === 'EXPENSE' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: '#FAF6F0', borderRadius: '8px' }}>
                  <input
                    type="checkbox"
                    id="personalPurchase"
                    checked={formData.personalPurchase}
                    onChange={(e) => setFormData({ ...formData, personalPurchase: e.target.checked })}
                  />
                  <label htmlFor="personalPurchase" style={{ fontSize: '0.85rem', color: 'var(--slate-blue-dark)', cursor: 'pointer' }}>
                    Purchased on personal card (pending church reimbursement)
                  </label>
                </div>
              )}

              {formData.personalPurchase && (
                <div className="form-group">
                  <label className="form-label">Purchaser / Claimant Name</label>
                  <input
                    type="text"
                    placeholder="Name of member who paid"
                    className="form-input"
                    value={formData.claimantName}
                    onChange={(e) => setFormData({ ...formData, claimantName: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evidence Drawer Modal */}
      {selectedTxn && (
        <EvidenceDrawerModal
          isOpen={!!selectedTxn}
          onClose={() => setSelectedTxn(null)}
          entityType="Transaction"
          entityId={selectedTxn.transactionId || selectedTxn.id || selectedTxn.txnId || ''}
          transactionId={selectedTxn.transactionId || selectedTxn.id || selectedTxn.txnId || ''}
          recordTitle={`${selectedTxn.transactionType || 'Transaction'} - ${selectedTxn.payeeOrPayer || selectedTxn.description || ''}`}
          defaultDocumentType="Receipt"
          canEdit={canWrite}
        />
      )}
    </div>
  );
};

export default Transactions;
