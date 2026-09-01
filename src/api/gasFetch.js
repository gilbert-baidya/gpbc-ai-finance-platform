/**
 * gasFetch - Production-Safe Google Apps Script API Wrapper
 * 
 * Centralized fetch wrapper for GPBC Finance Platform backend
 * Handles authentication, error handling, and environment configuration
 * 
 * CRITICAL RULES FOR GOOGLE APPS SCRIPT:
 * - NEVER send custom headers (causes CORS preflight)
 * - Content-Type MUST be "text/plain" (simple request)
 * - API key MUST be in JSON body
 * - Supports Vite environment variables
 * 
 * @param {string} action - Backend action name (e.g., 'getMembers', 'getDashboardSummary')
 * @param {object} payload - Request payload data (default: {})
 * @returns {Promise<object>} JSON response from backend
 * @throws {Error} Network errors, validation errors, or backend errors
 */
export async function gasFetch(action, payload = {}) {
  // Safe environment loading with fallback
  const GAS_URL = import.meta.env.VITE_GPBC_API_URL || process.env.VITE_GPBC_API_URL;
  const apiKey = import.meta.env.VITE_GPBC_API_KEY || process.env.VITE_GPBC_API_KEY;
  const isDev = import.meta.env.DEV;

  console.log("[GPBC GAS URL ACTIVE]", GAS_URL);

  // Dev mode ENV logging
  if (isDev) {
    console.log('[GPBC ENV]', {
      urlLoaded: !!GAS_URL,
      keyLoaded: !!apiKey,
      url: GAS_URL?.substring(0, 50) + '...'
    });
  }

  // Hard validation - fail fast if missing
  if (!GAS_URL || !apiKey) {
    throw new Error('Missing GPBC ENV CONFIG: Check .env.local for VITE_GPBC_API_URL and VITE_GPBC_API_KEY');
  }

  if (!action || typeof action !== 'string') {
    throw new Error('Action parameter is required and must be a string');
  }

  // Request body
  const requestBody = {
    apiKey,
    action,
    payload
  };

  // Dev mode logging
  if (isDev) {
    console.log('[gasFetch] Request:', {
      action,
      payload,
      url: GAS_URL
    });
  }

  try {
    // Network request
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(requestBody)
    });

    // HTTP error check
    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      throw new Error(
        'Invalid JSON response from backend: ' + parseError.message
      );
    }

    // Dev mode logging
    if (isDev) {
      console.log('[gasFetch] Response:', data);
    }

    // Hardened response validation
    if (!data || data.success === false) {
      const errorMessage = data?.error || data?.message || 'GAS Request Failed';
      throw new Error(errorMessage);
    }

    // Success - return full response
    return data;

  } catch (error) {
    // Network error detection
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error(
        'Network error: Unable to reach backend. Check your internet connection.'
      );
    }

    // Dev mode error logging
    if (isDev) {
      console.error('[gasFetch] Error:', {
        action,
        payload,
        error: error.message,
        stack: error.stack
      });
    }

    // Re-throw error for caller to handle
    throw error;
  }
}

// Attach to window in development for debugging
if (import.meta.env.DEV) {
  window.gasFetch = gasFetch;
  console.log('[gasFetch] Attached to window.gasFetch for debugging');
}
