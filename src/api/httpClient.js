import { gasFetch } from './gasFetch';

/**
 * Production-ready API client for Google Apps Script backend
 * Delegates to gasFetch (Google ID Token authentication wrapper).
 */

export async function apiPost(action, payload = {}) {
    const res = await gasFetch(action, payload);
    if (!res.success) {
        throw new Error(res.error || 'API call failed');
    }
    return res;
}

export async function apiFetch(action, payload = {}) {
    const res = await gasFetch(action, payload);
    if (!res.success) {
        throw new Error(res.error || 'API call failed');
    }
    return res;
}
