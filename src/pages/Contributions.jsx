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
        <div style={{ padding: '24px 0' }}>
            {/* Header with Export Button */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px',
                paddingLeft: '24px',
                paddingRight: '24px'
            }}>
                <div>
                    <h1 style={{ 
                        fontSize: 'var(--text-3xl)', 
                        fontWeight: '800',
                        color: 'var(--wine)',
                        marginBottom: '8px'
                    }}>
                        Record Income
                    </h1>
                    <p style={{ 
                        fontSize: 'var(--text-base)',
                        color: 'var(--text-muted)'
                    }}>
                        Record offerings, donations, designated gifts, and other church income.
                    </p>
                </div>
                <RoleGuard roles={["Treasurer", "Admin"]}>
                    <button
                        className="btn btn-outline"
                        onClick={() => downloadAllContributionsXlsx(user?.name, user?.role)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <FileSpreadsheet size={20} />
                        Export Contributions (XLSX)
                    </button>
                </RoleGuard>
            </div>

            <PremiumContributionForm />

            <section style={{ margin: '32px 24px 0' }} aria-labelledby="recorded-income-heading">
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
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                            <thead><tr><th>Date</th><th>Donor</th><th>Type</th><th>Method</th><th>Transaction</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
                            <tbody>
                                {incomeEntries.map((entry) => (
                                    <tr key={entry.incomeId}>
                                        <td>{String(entry.date || '').slice(0, 10)}</td>
                                        <td>{entry.donorName || 'Anonymous'}</td>
                                        <td>{entry.incomeType || 'Income'}</td>
                                        <td>{entry.paymentMethod || '—'}</td>
                                        <td>{entry.transactionId}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 700 }}>{currency.format(Number(entry.amount || 0))}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default Contributions;
