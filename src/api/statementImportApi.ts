/**
 * GPBC Finance Desk — Statement Import Client API
 */

import { gasFetch, getActiveIdToken } from './gasFetch';
import { StatementImportResult, ProcessedStatementLine, VendorLearningRule } from '../services/statement/types';

export const statementImportApi = {
  processStatementImport: async (payload: {
    rawContent?: string;
    fileName?: string;
    fileType?: string;
    base64Data?: string;
    sourceDocumentId?: string;
  }): Promise<StatementImportResult> => {
    return gasFetch<StatementImportResult>('processStatementImport', payload);
  },

  getStagedStatementLines: async (filters: { status?: string; search?: string } = {}) => {
    return gasFetch<{ lines: ProcessedStatementLine[]; count: number }>('getStagedStatementLines', filters);
  },

  resolveStagedStatementLine: async (payload: {
    lineId: string;
    action: 'CONFIRM' | 'DISMISS' | 'UPDATE_CATEGORY' | 'FORCE_LINK';
    category?: string;
    businessPurpose?: string;
    matchedTransactionId?: string;
    notes?: string;
  }) => {
    return gasFetch<{ success: boolean; lineId: string; status: string }>('resolveStagedStatementLine', payload);
  },

  getVendorLearningRules: async () => {
    return gasFetch<{ rules: VendorLearningRule[]; count: number }>('getVendorLearningRules');
  },

  saveVendorLearningRule: async (rule: VendorLearningRule) => {
    return gasFetch<{ success: boolean; rule: VendorLearningRule }>('saveVendorLearningRule', rule as unknown as Record<string, unknown>);
  },

  extractStatementDocument: async (payload: {
    fileBase64: string;
    mimeType: string;
    fileName: string;
    idToken?: string;
  }): Promise<{
    success: boolean;
    provider: string;
    statementType: string;
    institution: string;
    rawText: string;
    transactions: Array<{
      date: string | null;
      rawDescription: string;
      amount: number;
      direction: 'INCOME' | 'EXPENSE' | 'UNKNOWN';
      referenceNumber?: string;
    }>;
    extractedCount: number;
    error?: string;
  }> => {
    const token = payload.idToken || getActiveIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('/api/statement-extract', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fileBase64: payload.fileBase64,
        mimeType: payload.mimeType,
        fileName: payload.fileName
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `Server extraction failed with HTTP ${res.status}`);
    }
    return res.json();
  }
};

export default statementImportApi;
