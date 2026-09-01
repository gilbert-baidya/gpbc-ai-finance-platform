import { useState, useCallback } from 'react';
import { addContribution } from '../api/gpbcFinanceApi';

export function useContributionSubmit(onSuccess) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const submitContribution = useCallback(async (data) => {
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            const result = await addContribution(data);
            if (onSuccess) onSuccess(result);
            return { success: true, result };
        } catch (err) {
            setError(err.message || 'Submission failed');
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    }, [loading, onSuccess]);

    return { submitContribution, loading, error };
}
