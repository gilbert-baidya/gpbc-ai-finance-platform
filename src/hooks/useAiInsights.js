import { useState, useEffect } from 'react';
import { gasFetch } from '../api/gasFetch';

export function useAiInsights(month, year) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchInsights = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getAiInsight', { month, year });
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'AI Insight temporarily unavailable');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (month && year) {
            fetchInsights();
        }
    }, [month, year]);

    return { data, loading, error, refresh: fetchInsights };
}
