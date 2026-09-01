import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboardSummary } from '../api/gpbcApi';
import { errorToast } from '../utils/toast';

/**
 * @typedef {Object} DashboardTotals
 * @property {number} tithe - Total tithe amount
 * @property {number} offering - Total offering amount
 * @property {number} expenses - Total expenses amount
 * @property {number} netBalance - Net balance (income - expenses)
 */

/**
 * @typedef {Object} UseDashboardDataReturn
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message if request failed
 * @property {DashboardTotals} totals - Dashboard totals data
 * @property {() => Promise<void>} refresh - Manual refresh function
 */

const FALLBACK_TOTALS = {
    tithe: 0,
    offering: 0,
    expenses: 0,
    netBalance: 0
};

const REFRESH_INTERVAL_MS = 60000; // 60 seconds

/**
 * Custom hook to fetch and auto-refresh dashboard data
 * 
 * Features:
 * - Automatically loads current month/year
 * - Auto-refreshes every 60 seconds
 * - Safe cleanup on unmount
 * - Fail loudly on errors (no silent fallbacks)
 * - TypeScript friendly with JSDoc types
 * 
 * @returns {UseDashboardDataReturn}
 */
export function useDashboardData() {
    const [totals, setTotals] = useState(FALLBACK_TOTALS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        setError(null);

        try {
            // Get current month and year
            const now = new Date();
            const month = now.getMonth() + 1; // JavaScript months are 0-indexed
            const year = now.getFullYear();

            // Fetch dashboard summary
            const result = await getDashboardSummary(month, year);

            // Extract totals from response (support multiple formats)
            const data = result.data || result;
            setTotals({
                tithe: data.tithe || 0,
                offering: data.offering || 0,
                expenses: data.expenses || 0,
                netBalance: data.netBalance || 0
            });
        } catch (err) {
            // Fail loudly - show error and clear data
            const errorMsg = err.message || 'Failed to load dashboard data';
            setError(errorMsg);
            setTotals(FALLBACK_TOTALS);
            if (!isSilent) {
                errorToast(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Run-once guard to prevent React Strict Mode double calls in dev
    const hasFetched = useRef(false);

    useEffect(() => {
        // Prevent double fetch in React Strict Mode (dev only)
        if (hasFetched.current) return;
        hasFetched.current = true;

        // Initial load
        refresh();

        // Setup auto-refresh interval (silent refresh to avoid loading flicker)
        const intervalId = setInterval(() => refresh(true), REFRESH_INTERVAL_MS);

        // Cleanup on unmount
        return () => clearInterval(intervalId);
    }, [refresh]);

    return { totals, loading, error, refresh };
}
