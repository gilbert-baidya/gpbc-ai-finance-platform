import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Calendar, CreditCard, FileText, Tag, Building2, Paperclip } from 'lucide-react';
import { gasFetch } from '../api/gasFetch';
import { financeApi } from '../api/financeApi';
import { successToast, errorToast } from '../utils/toast';
import { FinanceDocumentUploadModal } from '../components/FinanceDocumentUploadModal';
import { EvidenceDrawerModal } from '../components/EvidenceDrawerModal';
import './Expenses.css';

const EXPENSE_CATEGORIES = {
    'Ministry Operations': ['Utilities', 'Rent', 'Maintenance', 'Office Supplies', 'Insurance'],
    'Worship Ministry': ['Music Equipment', 'Guest Speaker', 'Decorations', 'Media/Tech'],
    'Outreach': ['Food/Hospitality', 'Evangelism Materials', 'Community Events', 'Charity Support'],
    'Staff': ['Salaries', 'Honorariums', 'Training', 'Travel'],
    'Other': ['Miscellaneous', 'Bank Fees']
};

const PAYMENT_METHODS = ['Check', 'Debit Card', 'Bank Transfer', 'Cash', 'Credit Card'];

export default function Expenses() {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        category: 'Ministry Operations',
        subCategory: EXPENSE_CATEGORIES['Ministry Operations'][0],
        amount: '',
        paymentMethod: 'Check',
        vendor: '',
        notes: ''
    });
    const [subCategories, setSubCategories] = useState(EXPENSE_CATEGORIES['Ministry Operations']);
    const [submitting, setSubmitting] = useState(false);
    const [createdExpenseId, setCreatedExpenseId] = useState(null);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showEvidenceDrawer, setShowEvidenceDrawer] = useState(false);
    const [recentExpenses, setRecentExpenses] = useState([]);

    const loadRecentExpenses = useCallback(async () => {
        try {
            const res = await financeApi.getTransactions({ direction: 'EXPENSE' });
            if (res.success && Array.isArray(res.transactions)) {
                setRecentExpenses(res.transactions);
            }
        } catch {
            // Silently swallow in case offline
        }
    }, []);

    useEffect(() => {
        loadRecentExpenses();
    }, [loadRecentExpenses]);

    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        const newSubCategories = EXPENSE_CATEGORIES[newCategory] || [];
        setSubCategories(newSubCategories);
        setFormData(prev => ({
            ...prev,
            category: newCategory,
            subCategory: newSubCategories[0] || ''
        }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Currency masking for amount field
        if (name === 'amount') {
            const numericValue = value.replace(/[^0-9.]/g, '');
            setFormData(prev => ({
                ...prev,
                [name]: numericValue
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate amount
            const amount = parseFloat(formData.amount);
            if (isNaN(amount) || amount <= 0) {
                errorToast('Please enter a valid amount');
                setSubmitting(false);
                return;
            }

            // Validate vendor
            if (!formData.vendor.trim()) {
                errorToast('Vendor / Payee name is required');
                setSubmitting(false);
                return;
            }

            const payload = {
                ...formData,
                amount: amount
            };

            const result = await gasFetch('addExpense', payload);

            if (result.success) {
                successToast(`Expense recorded! ID: ${result.expenseId}`);
                setCreatedExpenseId(result.expenseId || `EXP-${Date.now()}`);
                
                // Reset form but keep category
                setFormData(prev => ({
                    ...prev,
                    amount: '',
                    vendor: '',
                    notes: '',
                    date: new Date().toISOString().split('T')[0]
                }));
            }

        } catch (error) {
            errorToast(error.message || 'Failed to record expense');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="expense-form-container">
            <div className="form-header">
                <DollarSign className="form-icon" />
                <div>
                    <h2 className="form-title">Record Expense</h2>
                    <p className="form-subtitle">Track ministry spending and operational costs</p>
                </div>
            </div>

            {createdExpenseId && (
                <div
                    style={{
                        marginBottom: '20px',
                        padding: '14px 18px',
                        background: '#e0f2fe',
                        border: '1px solid #7dd3fc',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                    }}
                >
                    <div style={{ fontSize: '0.88rem', color: '#0369a1', fontWeight: 600 }}>
                        Expense Recorded: <code>{createdExpenseId}</code>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setShowUploadModal(true)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                        >
                            <Paperclip size={14} />
                            Attach Receipt Now
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => setShowEvidenceDrawer(true)}
                            style={{ fontSize: '0.8rem' }}
                        >
                            View Evidence
                        </button>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="expense-form">
                {/* Expense Classification */}
                <div className="form-section">
                    <h3 className="section-heading">
                        <Tag size={16} />
                        Expense Category
                    </h3>
                    
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label" htmlFor="category">
                                Expense Category *
                            </label>
                            <select
                                id="category"
                                name="category"
                                className="form-select"
                                value={formData.category}
                                onChange={handleCategoryChange}
                                required
                                disabled={submitting}
                            >
                                {Object.keys(EXPENSE_CATEGORIES).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="subCategory">
                                Sub-Category *
                            </label>
                            <select
                                id="subCategory"
                                name="subCategory"
                                className="form-select"
                                value={formData.subCategory}
                                onChange={handleChange}
                                required
                                disabled={submitting}
                            >
                                {subCategories.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Financial Details */}
                <div className="form-section">
                    <h3 className="section-heading">
                        <DollarSign size={16} />
                        Financial Details
                    </h3>
                    
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label" htmlFor="amount">
                                Amount *
                            </label>
                            <div className="input-with-icon">
                                <span className="input-icon">$</span>
                                <input
                                    type="text"
                                    id="amount"
                                    name="amount"
                                    className="form-input input-with-icon-field"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    disabled={submitting}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="vendor">
                                <Building2 size={14} />
                                Vendor / Payee *
                            </label>
                            <input
                                type="text"
                                id="vendor"
                                name="vendor"
                                className="form-input"
                                value={formData.vendor}
                                onChange={handleChange}
                                required
                                disabled={submitting}
                                placeholder="e.g. Office Depot, City Utilities"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="date">
                                <Calendar size={14} />
                                Date *
                            </label>
                            <input
                                type="date"
                                id="date"
                                name="date"
                                className="form-input"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                disabled={submitting}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="paymentMethod">
                                <CreditCard size={14} />
                                Payment Method
                            </label>
                            <select
                                id="paymentMethod"
                                name="paymentMethod"
                                className="form-select"
                                value={formData.paymentMethod}
                                onChange={handleChange}
                                disabled={submitting}
                            >
                                {PAYMENT_METHODS.map(method => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notes */}
                <div className="form-section">
                    <div className="form-group">
                        <label className="form-label" htmlFor="notes">
                            <FileText size={14} />
                            Notes / Memo
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            className="form-textarea"
                            value={formData.notes}
                            onChange={handleChange}
                            disabled={submitting}
                            rows="4"
                            placeholder="Invoice #, approval details..."
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn btn-primary btn-lg"
                        disabled={submitting}
                        style={{ minHeight: '46px', fontSize: '1rem', fontWeight: 700 }}
                    >
                        {submitting ? (
                            <>
                                <span className="spinner"></span>
                                Recording...
                            </>
                        ) : (
                            <>
                                <DollarSign size={18} />
                                Record Expense
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Recent Recorded Expenses */}
            {recentExpenses.length > 0 && (
                <section style={{ marginTop: '32px' }}>
                    <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-blue-dark)' }}>
                        Recent Recorded Expenses
                    </h3>

                    <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', background: '#fff', borderRadius: '8px', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: '#FAF6F0', borderBottom: '1px solid var(--border-light)' }}>
                                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Vendor / Payee</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Category</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Receipt Status</th>
                                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Funding</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentExpenses.slice(0, 8).map((exp) => (
                                    <tr key={exp.transactionId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{exp.transactionDate || '—'}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{exp.payeeOrPayer || '—'}</td>
                                        <td style={{ padding: '10px 14px' }}>{exp.category || 'General Expense'}</td>
                                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#a55f49' }}>
                                            ${Number(exp.amount || 0).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.72rem',
                                                fontWeight: 600,
                                                background: exp.receiptStatus === 'Has Receipt' ? '#DEF7EC' : '#FEF3C7',
                                                color: exp.receiptStatus === 'Has Receipt' ? '#03543F' : '#92400E'
                                            }}>
                                                {exp.receiptStatus || 'Needs Receipt'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--warm-gray)' }}>
                                            {exp.personalPurchase ? 'Personal Card' : 'Church Paid'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mobile-card-view" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recentExpenses.slice(0, 8).map((exp) => (
                            <div key={exp.transactionId} style={{
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
                                        <strong style={{ fontSize: '0.92rem', color: 'var(--slate-blue-dark)' }}>{exp.payeeOrPayer || '—'}</strong>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', marginTop: '2px' }}>
                                            {exp.transactionDate || '—'}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#a55f49', whiteSpace: 'nowrap' }}>
                                        ${Number(exp.amount || 0).toFixed(2)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem' }}>
                                    <span style={{ background: '#f8fafc', color: 'var(--warm-gray-dark)', padding: '2px 8px', borderRadius: '4px', fontWeight: 500 }}>
                                        {exp.category || 'General Expense'}
                                    </span>
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                        {exp.personalPurchase && (
                                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, fontSize: '0.7rem' }}>
                                                Personal Card
                                            </span>
                                        )}
                                        <span style={{
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                            background: exp.receiptStatus === 'Has Receipt' ? '#def7ec' : '#fee2e2',
                                            color: exp.receiptStatus === 'Has Receipt' ? '#03543f' : '#991b1b'
                                        }}>
                                            {exp.receiptStatus || 'Needs Receipt'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Direct Receipt Upload Modal */}
            {createdExpenseId && (
                <FinanceDocumentUploadModal
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)}
                    entityType="Transaction"
                    entityId={createdExpenseId}
                    transactionId={createdExpenseId}
                    defaultDocumentType="Receipt"
                    defaultTitle={`Receipt for ${formData.vendor || createdExpenseId}`}
                    documentDate={formData.date}
                    onSuccess={() => {
                        setShowUploadModal(false);
                        successToast('Receipt attached and registered in Document Center!');
                    }}
                />
            )}

            {/* Evidence Drawer Modal */}
            {createdExpenseId && (
                <EvidenceDrawerModal
                    isOpen={showEvidenceDrawer}
                    onClose={() => setShowEvidenceDrawer(false)}
                    entityType="Transaction"
                    entityId={createdExpenseId}
                    transactionId={createdExpenseId}
                    recordTitle={`Expense Record ${createdExpenseId}`}
                    defaultDocumentType="Receipt"
                />
            )}
        </div>
    );
}
