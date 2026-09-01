import { useState, useEffect } from 'react';
import { gasFetch } from '../api/gasFetch';

export function useFinancialForecast(churchId) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchForecast = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await gasFetch('getFinancialForecast', { churchId });
            setData(result.data || result);
        } catch (err) {
            setError(err.message || 'Forecast engine unavailable');
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForecast();
    }, [churchId]);

    return { data, loading, error, refresh: fetchForecast };
}
