/**
 * Production-ready API client for Google Apps Script backend
 * 
 * Features:
 * - Google Apps Script CORS-safe (no custom headers)
 * - 10-second timeout protection
 * - Environment variable configuration
 * - JSON body format: { apiKey, action, payload }
 * - Error logging in dev mode only
 */

const API_URL = import.meta.env.VITE_GPBC_API_URL;
const API_KEY = import.meta.env.VITE_GPBC_API_KEY;
const TIMEOUT_MS = 10000;
const isDev = import.meta.env.DEV;

/**
 * Sends a POST request to the Google Apps Script backend
 * 
 * @param {string} action - The action to perform (e.g., 'getDashboard', 'addContribution')
 * @param {Object} payload - The data payload for the action
 * @returns {Promise<Object>} Parsed JSON response
 * @throws {Error} On network errors, timeouts, or API errors
 */
export async function apiPost(action, payload = {}) {
    // Validate configuration
    if (!API_URL) {
        const error = new Error('VITE_GPBC_API_URL is not configured');
        if (isDev) console.error('[API Client]', error);
        throw error;
    }

    if (!API_KEY) {
        const error = new Error('VITE_GPBC_API_KEY is not configured');
        if (isDev) console.error('[API Client]', error);
        throw error;
    }

    // Setup timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        // Send POST request (no custom headers for Google Apps Script CORS)
        const response = await fetch(API_URL, {
            method: 'POST',
            signal: controller.signal,
            body: JSON.stringify({
                apiKey: API_KEY,
                action,
                payload
            })
        });

        clearTimeout(timeoutId);

        // Check HTTP status
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Unknown error');
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        // Parse JSON response
        const data = await response.json();

        // Check for API-level errors
        if (data.status === 'error') {
            throw new Error(data.message || 'API returned error status');
        }

        return data;

    } catch (error) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (error.name === 'AbortError') {
            const timeoutError = new Error(`Request timed out after ${TIMEOUT_MS / 1000} seconds`);
            if (isDev) console.error('[API Client] Timeout:', action, payload);
            throw timeoutError;
        }

        // Log errors in dev mode only
        if (isDev) {
            console.error('[API Client] Error:', {
                action,
                payload,
                error: error.message,
                stack: error.stack
            });
        }

        throw error;
    }
}

/**
 * Fetch wrapper for GPBC Finance API
 * 
 * @param {string} action - The action to perform
 * @param {Object} payload - The data payload for the action
 * @returns {Promise<Object>} Parsed JSON response
 */
export async function apiFetch(action, payload = {}) {
    try {
        const response = await fetch(import.meta.env.VITE_GPBC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: import.meta.env.VITE_GPBC_API_KEY,
                action: action,
                payload: payload
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (!result.success) {
            throw new Error(result.error || 'API request failed');
        }

        return result;

    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
