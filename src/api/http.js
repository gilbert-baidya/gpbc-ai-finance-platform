import { apiBaseUrl, apiKey } from '../config/env';

export async function apiFetch(action, payload = {}) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 10000);

    const options = {
        method: 'POST',
        signal: controller.signal,
        headers: {
            'Content-Type': 'application/json',
            ...(apiKey && { 'X-API-KEY': apiKey })
        },
        body: JSON.stringify({ action, payload }),
        mode: 'cors'
    };

    try {
        const response = await fetch(apiBaseUrl, options);
        clearTimeout(id);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText || 'Server error'}`);
        }

        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.message || 'Logical API error');
        }

        return data;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('Request timed out after 10 seconds');
        }
        throw error;
    }
}
