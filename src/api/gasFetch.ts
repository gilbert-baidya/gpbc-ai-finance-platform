/**
 * gasFetch - Production-Safe Google Apps Script API Wrapper
 * 
 * Centralized fetch wrapper for GPBC Finance Desk backend.
 * Uses text/plain POST simple requests to prevent CORS preflight issues.
 * Passes Google ID token in the JSON body for server-side authorization.
 */

import { GasRequestEnvelope, GasResponseEnvelope } from './types';

// In-memory token storage for current active session
let currentIdToken: string | null = null;

export function setActiveIdToken(token: string | null): void {
  currentIdToken = token;
}

export function getActiveIdToken(): string | null {
  return currentIdToken;
}

export async function gasFetch<T = unknown>(
  action: string,
  payload: Record<string, unknown> = {},
  idTokenOverride?: string
): Promise<GasResponseEnvelope<T>> {
  const GAS_URL = import.meta.env.VITE_GPBC_API_URL as string | undefined;
  const isDev = import.meta.env.DEV;

  if (!GAS_URL) {
    throw new Error('Backend URL is not configured. Please set VITE_GPBC_API_URL in .env.local');
  }

  if (!action || typeof action !== 'string') {
    throw new Error('Action parameter is required and must be a string');
  }

  const token = idTokenOverride || currentIdToken || undefined;

  const requestBody: GasRequestEnvelope = {
    action,
    payload,
    ...(token ? { idToken: token } : {})
  };

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data: GasResponseEnvelope<T>;
    try {
      data = await response.json();
    } catch {
      throw new Error('Invalid response received from Apps Script backend');
    }

    if (!data || data.success === false) {
      const errorMessage = data?.error || data?.message || 'Request failed';
      throw new Error(errorMessage);
    }

    return data;
  } catch (err: unknown) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    
    if (errorObj.name === 'TypeError' && errorObj.message.includes('fetch')) {
      throw new Error('Network error: Unable to reach backend. Please verify your connection.');
    }

    if (isDev) {
      // Safe dev logging with token redacted
      console.warn(`[gasFetch error] Action: ${action} - ${errorObj.message}`);
    }

    throw errorObj;
  }
}

export default gasFetch;
