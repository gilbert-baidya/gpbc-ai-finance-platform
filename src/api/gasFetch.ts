/**
 * gasFetch - Production-Safe Google Apps Script API Wrapper
 * 
 * Centralized fetch wrapper for GPBC Finance Desk backend.
 * Uses text/plain POST simple requests to prevent CORS preflight issues.
 * Passes Google ID token in the JSON body for server-side authorization.
 */

import { GasRequestEnvelope, GasResponseEnvelope } from './types';
import { apiBaseUrl } from '../config/env';
import { isMobileTestAllowed } from '../auth/mobileTestGuard';
import { getMockFixture } from './mockFixtures';

const WRITE_ACTIONS = new Set([
  'addTransaction',
  'addIncome',
  'addExpense',
  'addContribution',
  'addMember',
  'addReimbursement',
  'addReimbursementAllocation',
  'addReceipt',
  'addCheckDetail',
  'addCapitalProject',
  'updateCapitalProject',
  'uploadDocument',
  'linkDocumentToEntity',
  'updateDocumentStatus',
  'reconcileTransactionRecord',
  'autoReconcilePeriod',
  'closeMonthlyPeriod',
  'reopenMonthlyPeriod',
  'resolveAuditIssue',
  'reopenAuditIssue',
  'assignAuditIssue',
  'stageBankStatementLines',
  'matchReconciliationLine',
  'initializeSandboxSchema'
]);

export function isWriteAction(action: string): boolean {
  if (WRITE_ACTIONS.has(action)) return true;
  return /^(add|create|record|save|update|delete|reconcile|upload|close|reopen|resolve|assign|stage|match|init)/i.test(action);
}

// In-memory token storage for current active session
let currentIdToken: string | null = null;
let onUnauthorizedCallback: ((errorMsg: string) => void) | null = null;

export function setActiveIdToken(token: string | null): void {
  currentIdToken = token;
}

export function getActiveIdToken(): string | null {
  return currentIdToken;
}

export function setOnUnauthorizedCallback(callback: ((errorMsg: string) => void) | null): void {
  onUnauthorizedCallback = callback;
}

export async function gasFetch<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {},
  idTokenOverride?: string
): Promise<GasResponseEnvelope<T>> {
  if (isMobileTestAllowed()) {
    if (isWriteAction(action)) {
      throw new Error('Local Mobile UI Test Mode — changes are not saved.');
    }
    const mockData = getMockFixture(action, payload);
    return mockData as unknown as GasResponseEnvelope<T>;
  }

  const GAS_URL = apiBaseUrl;
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
      const errorStr = String(data?.error || data?.message || '');
      const lower = errorStr.toLowerCase();

      if (lower.includes('unauthorized') || lower.includes('token expired') || lower.includes('invalid google id token')) {
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback('Your Google session expired. Please sign in again.');
        }
      }

      const diagSuffix = data?.diagnosticCode ? ` (Diagnostic: ${data.diagnosticCode})` : '';
      const errorMessage = (data?.error || data?.message || 'Request failed') + diagSuffix;
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
