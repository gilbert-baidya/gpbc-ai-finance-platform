import { useState, useEffect } from 'react';
import { gasFetch } from '../api/gasFetch';

/**
 * PHASE 5: AUTONOMOUS CHURCH OPERATIONS HOOKS
 * Self-Optimizing Ministry System (AI Assists, Humans Approve)
 * 
 * Core Principle: AI RECOMMENDS + PREPARES + PRECONFIGURES
 *                 HUMANS APPROVE FINAL ACTION
 */

/**
 * useFinancialFlowOptimization - Autonomous Cash Flow Optimization
 * Analyzes monthly trends, expenses, reserves, missions
 * 
 * @returns {object} Rebalancing plan, safety projections, risk alerts
 */
export function useFinancialFlowOptimization() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOptimization = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('optimizeChurchCashFlow');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Financial optimization unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOptimization();
    }, []);

    return { data, loading, error, refresh: fetchOptimization };
}

/**
 * useMinistryResourceAllocation - Ministry Investment AI
 * Recommends where to invest ministry resources based on impact
 * 
 * @returns {object} Investment priority list, growth opportunities, review items
 */
export function useMinistryResourceAllocation() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAllocation = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getMinistryResourceOptimization');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Ministry allocation unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllocation();
    }, []);

    return { data, loading, error, refresh: fetchAllocation };
}

/**
 * useServicePlanningEngine - Smart Service Planning
 * Recommends optimal service dates, themes, and ministry focus
 * 
 * @returns {object} Service dates, sermon themes, focus months
 */
export function useServicePlanningEngine() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPlanning = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getServicePlanningSuggestions');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Service planning unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlanning();
    }, []);

    return { data, loading, error, refresh: fetchPlanning };
}

/**
 * useVolunteerDeployment - Volunteer Load Balancing AI
 * Analyzes volunteer activity and recommends redistribution
 * 
 * @returns {object} Redistribution recommendations, recruitment signals, burnout alerts
 */
export function useVolunteerDeployment() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDeployment = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getVolunteerDeploymentIntelligence');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Volunteer intelligence unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDeployment();
    }, []);

    return { data, loading, error, refresh: fetchDeployment };
}

/**
 * useOutreachImpactOptimization - Outreach ROI Intelligence
 * Analyzes event costs, attendance growth, conversion rates
 * 
 * @returns {object} Top 5 highest impact types, low ROI review items
 */
export function useOutreachImpactOptimization() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchImpact = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getOutreachImpactAnalysis');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Outreach analysis unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImpact();
    }, []);

    return { data, loading, error, refresh: fetchImpact };
}

/**
 * useBudgetSelfBalancing - Budget Stabilizer AI
 * Recommends budget adjustments based on forecasts
 * 
 * @returns {object} Adjustment suggestions, safe expansion ranges, hiring capacity
 */
export function useBudgetSelfBalancing() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBalancing = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getBudgetBalancingRecommendations');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Budget balancing unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalancing();
    }, []);

    return { data, loading, error, refresh: fetchBalancing };
}

/**
 * useAutoDraftReports - Autonomous Report Preparation
 * Generates draft reports (IRS, SoCal, Board, Grants)
 * IMPORTANT: Drafts only - human review required before submission
 * 
 * @param {string} reportType - 'board' | 'compliance' | 'grant' | 'socal'
 * @returns {object} Draft report data, generation status
 */
export function useAutoDraftReports(reportType) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateDraft = async () => {
        setLoading(true);
        setError(null);
        try {
            let result;
            if (reportType === 'board') {
                result = await gasFetch('generateAutoBoardReport');
            } else if (reportType === 'compliance') {
                result = await gasFetch('generateAutoComplianceReport');
            } else if (reportType === 'grant') {
                result = await gasFetch('generateAutoGrantReport');
            } else if (reportType === 'socal') {
                result = await gasFetch('generateAutoSocalReport');
            } else {
                throw new Error('Invalid report type');
            }
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Report generation failed');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, generateDraft };
}

/**
 * useOperationsMetrics - Church Operations Command Center Metrics
 * Loads all operational metrics for command center dashboard
 * 
 * @returns {object} Financial stability, ministry growth, volunteer load, risks, opportunities
 */
export function useOperationsMetrics() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMetrics = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load all Phase 5 metrics in parallel
            const [financial, ministry, volunteer, outreach, budget] = await Promise.all([
                gasFetch('optimizeChurchCashFlow').catch(() => null),
                gasFetch('getMinistryResourceOptimization').catch(() => null),
                gasFetch('getVolunteerDeploymentIntelligence').catch(() => null),
                gasFetch('getOutreachImpactAnalysis').catch(() => null),
                gasFetch('getBudgetBalancingRecommendations').catch(() => null)
            ]);

            setData({
                financial: financial?.data || financial,
                ministry: ministry?.data || ministry,
                volunteer: volunteer?.data || volunteer,
                outreach: outreach?.data || outreach,
                budget: budget?.data || budget
            });
        } catch (err) {
            setError(err.message || 'Operations metrics unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    return { data, loading, error, refresh: fetchMetrics };
}

/**
 * useMultiMinistryComparison - Cross-Ministry Performance (Future Multi-Campus Ready)
 * Compares performance across ministries/campuses
 * 
 * @returns {object} Performance comparison, growth heatmap
 */
export function useMultiMinistryComparison() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchComparison = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getMultiMinistryComparison');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Multi-ministry comparison unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComparison();
    }, []);

    return { data, loading, error, refresh: fetchComparison };
}
