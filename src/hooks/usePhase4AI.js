import { useState, useEffect } from 'react';
import { gasFetch } from '../api/gasFetch';

/**
 * usePredictiveGiving - Predictive Giving Intelligence Hook
 * Forecasts future giving patterns for individual members
 * 
 * @param {string} memberId - Member ID to predict giving for
 * @param {number} monthsForward - Number of months to predict (default: 3)
 * @returns {object} Prediction data, loading state, error
 */
export function usePredictiveGiving(memberId, monthsForward = 3) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchPrediction = async () => {
        if (!memberId) return;

        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('predictFutureGiving', { 
                memberId, 
                monthsForward 
            });
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Prediction engine unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (memberId) {
            fetchPrediction();
        }
    }, [memberId, monthsForward]);

    return { data, loading, error, refresh: fetchPrediction };
}

/**
 * useDonorJourney - Donor Journey Intelligence Hook
 * Tracks member lifecycle stage and engagement momentum
 * 
 * @param {string} memberId - Member ID to analyze
 * @returns {object} Journey data (stage, trend, momentum), loading state, error
 */
export function useDonorJourney(memberId) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchJourney = async () => {
        if (!memberId) return;

        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getDonorJourneyIntelligence', { memberId });
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Journey intelligence unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (memberId) {
            fetchJourney();
        }
    }, [memberId]);

    return { data, loading, error, refresh: fetchJourney };
}

/**
 * useMinistryForecast - Ministry Health Forecast Hook
 * Global church sustainability and momentum analysis
 * 
 * @returns {object} Forecast data (3-month, 6-month scores), loading state, error
 */
export function useMinistryForecast() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchForecast = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getMinistryForecast');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Ministry forecast unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, []);

    return { data, loading, error, refresh: fetchForecast };
}

/**
 * useOutreachOpportunities - Outreach Opportunity Intelligence Hook
 * Detects optimal timing for special offerings and campaigns
 * 
 * @returns {object} Opportunity calendar data, loading state, error
 */
export function useOutreachOpportunities() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchOpportunities = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getOutreachOpportunities');
            setData(result.data || result.opportunities || []);
        } catch (err) {
            setError(err.message || 'Outreach intelligence unavailable');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOpportunities();
    }, []);

    return { data, loading, error, refresh: fetchOpportunities };
}

/**
 * useMinistryRecommendations - Automated Ministry Recommendation Hook
 * AI-generated ministry strategy suggestions
 * 
 * @returns {object} Recommendation list, loading state, error
 */
export function useMinistryRecommendations() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRecommendations = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('generateMinistryRecommendations');
            setData(result.data || result.recommendations || []);
        } catch (err) {
            setError(err.message || 'Recommendations unavailable');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    return { data, loading, error, refresh: fetchRecommendations };
}

/**
 * useFinancialRiskMonitor - Financial Risk Early Warning Hook
 * Detects rapid giving drops, donor silence, expense spikes
 * 
 * @returns {object} Risk alerts (level, narrative, actions), loading state, error
 */
export function useFinancialRiskMonitor() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRisks = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getFinancialRiskAlerts');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Risk monitor unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRisks();
    }, []);

    return { data, loading, error, refresh: fetchRisks };
}

/**
 * useEngagementIndicators - Spiritual Engagement Indicators Hook
 * ETHICAL: Aggregate signals only, no personal spiritual judgement
 * 
 * @returns {object} Engagement stability index, loading state, error
 */
export function useEngagementIndicators() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchEngagement = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getEngagementIndicators');
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Engagement data unavailable');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEngagement();
    }, []);

    return { data, loading, error, refresh: fetchEngagement };
}
