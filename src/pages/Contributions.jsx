import React, { useCallback, useEffect, useState } from 'react';
import { FileSpreadsheet, RefreshCw } from 'lucide-react';
import PremiumContributionForm from '../components/PremiumContributionForm';
import FinanceDataState from '../components/FinanceDataState';
import { financeApi } from '../api/financeApi';
import { downloadAllContributionsXlsx } from '../utils/downloadAllContributionsXlsx';
import RoleGuard from '../auth/RoleGuard';
import { useAuth } from '../auth/AuthContext';

const Contributions = () => {
    const { user } = useAuth();
    const [incomeEntries, setIncomeEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    const loadIncome = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const response = await financeApi.getIncomeDetail();
            setIncomeEntries(Array.isArray(response.incomeEntries) ? response.incomeEntries : []);
        } catch (error) {
            setLoadError(error.message || 'Failed to load income detail');
            setIncomeEntries([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadIncome();
    }, [loadIncome]);

    const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    return (
        <div className="contributions-page-container" style={{ padding: '12px 0' }}>
            {/* Header with Export Button */}
            <div className="contributions-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '20px',
                paddingLeft: '12px',
                paddingRight: '12px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: 'clamp(1.4rem, 4vw, var(--text-3xl))',
                        fontWeight: '800',
                        color: 'var(--wine)',
                        margin: '0 0 6px 0'
                    }}>
                        Record Income
                    </h1>
                    <p style={{ 
                        fontSize: '0.9rem',
                        color: 'var(--text-muted)',
                        margin: 0
                    }}>
                        Record offerings, donations, designated gifts, and other church income.
                    </p>
                </div>
                <RoleGuard roles={["Treasurer", "Admin"]}>
                    <button
                        className="btn btn-outline"
                        onClick={() => downloadAllContributionsXlsx(user?.name, user?.role)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            minHeight: '40px'
                        }}
                    >
                        <FileSpreadsheet size={18} />
                        <span>Export Contributions (XLSX)</span>
                    </button>
                </RoleGuard>
            </div>

            <PremiumContributionForm />

            <section style={{ margin: '24px 12px 0' }} aria-labelledby="recorded-income-heading">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h2 id="recorded-income-heading" style={{ margin: 0, color: 'var(--slate-blue-dark)', fontSize: '1.15rem' }}>Recorded Income</h2>
                    <button type="button" className="btn btn-outline" onClick={loadIncome} disabled={loading} title="Refresh income records">
                        <RefreshCw size={17} className={loading ? 'animate-spin' : ''} aria-hidden="true" />
                    </button>
                </div>
                {loadError ? (
                    <FinanceDataState title="Income data unavailable" description={loadError} />
                ) : !loading && incomeEntries.length === 0 ? (
                    <FinanceDataState title="No income recorded yet" description="Canonical sandbox income records will appear here." />
                ) : (
                    <>
                        <div className="desktop-table-view" style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                                <thead>
                                    <tr style={{ background: '#FAF6F0', borderBottom: '1px solid var(--mist-blue-dark)', color: 'var(--slate-blue-dark)' }}>
                                        <th style={{ padding: '10px 14px' }}>Date</th>
                                        <th style={{ padding: '10px 14px' }}>Donor</th>
                                        <th style={{ padding: '10px 14px' }}>Type</th>
                                        <th style={{ padding: '10px 14px' }}>Method</th>
                                        <th style={{ padding: '10px 14px' }}>Transaction</th>
                                        <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incomeEntries.map((entry) => (
                                        <tr key={entry.incomeId} style={{ borderBottom: '1px solid var(--border-light)' }}>
                                            <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>{String(entry.date || '').slice(0, 10)}</td>
                                            <td style={{ padding: '10px 14px', fontWeight: 600 }}>{entry.donorName || 'Anonymous'}</td>
                                            <td style={{ padding: '10px 14px' }}>{entry.incomeType || 'Income'}</td>
                                            <td style={{ padding: '10px 14px' }}>{entry.paymentMethod || '—'}</td>
                                            <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '0.8rem' }}>{entry.transactionId}</td>
                                            <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--forest-green)' }}>{currency.format(Number(entry.amount || 0))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mobile-card-view" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {incomeEntries.map((entry) => (
                                <div key={entry.incomeId} style={{
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
                                            <strong style={{ fontSize: '0.92rem', color: 'var(--slate-blue-dark)' }}>{entry.donorName || 'Anonymous'}</strong>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--warm-gray)', marginTop: '2px' }}>
                                                {String(entry.date || '').slice(0, 10)}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--forest-green)', whiteSpace: 'nowrap' }}>
                                            {currency.format(Number(entry.amount || 0))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', paddingTop: '6px', borderTop: '1px solid #f1f5f9', fontSize: '0.75rem' }}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <span style={{ background: 'var(--mist-blue)', color: 'var(--slate-blue)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                                                {entry.incomeType || 'Income'}
                                            </span>
                                            <span style={{ background: '#f8fafc', color: 'var(--warm-gray)', padding: '2px 6px', borderRadius: '4px' }}>
                                                {entry.paymentMethod || '—'}
                                            </span>
                                        </div>
                                        <span style={{ fontFamily: 'monospace', color: 'var(--warm-gray-light)', fontSize: '0.72rem' }}>
                                            {entry.transactionId}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};

export default Contributions;
