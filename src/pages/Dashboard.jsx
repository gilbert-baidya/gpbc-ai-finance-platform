import React, { useState, useEffect, useRef } from 'react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useTenant } from '../tenants/TenantContext';
import { StatusBadge } from '../components/ui';
import { AlertCircle } from 'lucide-react';
import { useRoleGuard } from '../hooks/useRoleGuard';
import AntigravityMotion from '../components/AntigravityMotion';
import { FinancialHealthScore } from '../components/FinancialHealthScore';
import { GivingMomentumStory } from '../components/GivingMomentumStory';
import { MinistryOpportunityHighlights } from '../components/MinistryOpportunityHighlights';
import { RiskRadarPanel } from '../components/RiskRadarPanel';
import { AnimatedFinancialChart, IncomeExpenseStackedChart } from '../components/StorytellingCharts';
import { errorToast } from '../utils/toast';
import { gasFetch } from '../api/gasFetch';

const Dashboard = () => {
    const { error } = useDashboardData();
    const { tenant, tenantKey } = useTenant();
    const { isAdmin } = useRoleGuard();

    const [healthScore, setHealthScore] = useState(0);

    const fetchDashboard = async () => {
        try {
            const now = new Date();

            const data = await gasFetch('getDashboardSummary', {
                tenant: tenantKey,
                month: now.getMonth(),
                year: now.getFullYear()
            });

            if (data.success !== false) {
                // Calculate health score from real data
                const totalIncome = (data.totals?.tithe || 0) + (data.totals?.offering || 0);
                const totalExpense = data.totals?.expenses || 0;
                const calculatedScore = Math.min(
                    100,
                    Math.round(((totalIncome - totalExpense) / Math.max(totalIncome, 1)) * 100 + 50)
                );
                setHealthScore(calculatedScore);
            } else {
                throw new Error(data.message || 'API request failed');
            }
        } catch (err) {
            console.error('Dashboard API Error:', err.message || err);
            errorToast(err.message || 'Failed to load dashboard data');
        }
    };

    // Run-once guard to prevent React Strict Mode double calls
    const hasFetchedDashboard = useRef(false);

    useEffect(() => {
        if (hasFetchedDashboard.current) return;
        hasFetchedDashboard.current = true;
        fetchDashboard();
    }, []);

    return (
        <div className="executive-container animate-fade-in">
            {/* Header Section */}
            <section className="section-spacing" style={{ paddingTop: '48px' }}>
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="h1 text-wine" style={{ marginBottom: '8px' }}>{tenant.name}</h1>
                        <p className="body-text text-muted">Financial Storytelling Intelligence • ID: {tenant.churchId}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {isAdmin && (
                            <button className="btn" style={{ 
                                background: 'rgba(255,255,255,0.8)',
                                color: 'var(--text)',
                                fontSize: '14px',
                                padding: '10px 20px'
                            }}>
                                Global Settings
                            </button>
                        )}
                        <StatusBadge status="System Online" type="success" />
                    </div>
                </header>
            </section>

            {/* Error Alert */}
            {error && (
                <section className="section-spacing">
                    <div className="glass-panel" style={{ 
                        padding: '24px',
                        background: 'rgba(254, 242, 242, 0.7)',
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        <AlertCircle size={24} color="#DC2626" />
                        <p className="body-text" style={{ color: '#DC2626', fontWeight: 500 }}>
                            Finance server connection interrupted. Showing cached results.
                        </p>
                    </div>
                </section>
            )}

            {/* Financial Health Score Section */}
            <section className="section-spacing">
                <AntigravityMotion variant="fade-up" delay={50}>
                    <FinancialHealthScore score={healthScore} />
                </AntigravityMotion>
            </section>

            {/* Giving Momentum Story Section */}
            <section className="section-spacing">
                <AntigravityMotion variant="fade-up" delay={100}>
                    <GivingMomentumStory />
                </AntigravityMotion>
            </section>

            {/* Financial Charts Section */}
            <section className="section-spacing">
                <h2 className="section-title text-wine" style={{ marginBottom: '24px' }}>Financial Timeline & Trends</h2>
                <div className="grid grid-cols-1 gap-24">
                    <AntigravityMotion variant="fade-up" delay={150}>
                        <AnimatedFinancialChart />
                    </AntigravityMotion>
                    <AntigravityMotion variant="fade-up" delay={200}>
                        <IncomeExpenseStackedChart />
                    </AntigravityMotion>
                </div>
            </section>

            {/* Ministry Opportunity Highlights Section */}
            <section className="section-spacing">
                <AntigravityMotion variant="fade-up" delay={250}>
                    <MinistryOpportunityHighlights />
                </AntigravityMotion>
            </section>

            {/* Risk Radar Panel Section */}
            <section className="section-spacing">
                <AntigravityMotion variant="fade-up" delay={300}>
                    <RiskRadarPanel />
                </AntigravityMotion>
            </section>

            {/* Bottom Spacing */}
            <div style={{ height: '48px' }}></div>
        </div>
    );
};

export default Dashboard;
