/*************************************************
 * GPBC Finance Desk — smartUploadApi.ts
 * Smart Upload Client API Service
 * Routes strictly via same-origin /api/gpbc
 * Authoritative backend matching & duplicate detection
 *************************************************/

import { gasFetch } from './gasFetch';
import { DocumentRecord, DocumentStatus } from '../types/document';
import {
  MatchQuery,
  MatchResult,
  SmartUploadPayload,
  DuplicateCheckQuery as DuplicateCheckParams,
  DuplicateCheckResult,
  SmartUploadOptionsResult
} from '../types/smartUpload';

export type { SmartUploadPayload, DuplicateCheckParams, DuplicateCheckResult, SmartUploadOptionsResult };

export const smartUploadApi = {
  /**
   * Uploads physical document to Drive and registers canonical master record in Document_Register.
   * UPLOAD ONCE • STORE ONCE
   * Creates the master row as Unlinked (or Needs Review if post-close).
   * Does NOT perform entity linking during upload to eliminate double-linking.
   */
  uploadSmartDocument: async (payload: SmartUploadPayload) => {
    // Pack vendor & amount cleanly into structured notes
    let structuredNotes = payload.notes || '';
    if (payload.vendor || payload.amount != null || payload.isDocumentOnly) {
      const metaObj = {
        vendor: payload.vendor || '',
        amount: payload.amount != null ? Number(payload.amount) : undefined,
        description: payload.description || '',
        isDocumentOnly: Boolean(payload.isDocumentOnly),
        userNotes: payload.notes || ''
      };
      structuredNotes = `[GPBC_SMART_UPLOAD_META:${JSON.stringify(metaObj)}] ${payload.notes || ''}`.trim();
    }

    // Always create as unlinked in upload step; relationship is established authoritatively via linkDocumentToEntity
    const docPayload = {
      ...payload,
      title: payload.title || `${payload.vendor ? payload.vendor + ' - ' : ''}${payload.description || payload.documentType}`.trim(),
      notes: structuredNotes,
      relatedEntityType: 'NONE',
      relatedEntityId: '',
      relatedTransactionId: '',
      relatedReimbursementId: '',
      relatedCapitalProjectId: '',
      relatedCheckId: ''
    };

    return gasFetch<{
      success: boolean;
      documentId?: string;
      storedFileName?: string;
      driveFileId?: string;
      driveFileUrl?: string;
      folderPath?: string;
      status?: DocumentStatus;
      duplicateDetected?: boolean;
      duplicateDocumentId?: string;
      duplicateTitle?: string;
      duplicateStatus?: DocumentStatus;
      message?: string;
      error?: string;
    }>('uploadDocument', docPayload as unknown as Record<string, unknown>);
  },

  /**
   * Evaluates potential duplicates via authoritative backend checkDocumentDuplicate API.
   * Checks SHA-256 hash, filename + size, and date + amount + vendor.
   */
  checkDuplicate: async (params: DuplicateCheckParams): Promise<DuplicateCheckResult> => {
    try {
      const res = await gasFetch<{
        success: boolean;
        isDuplicate: boolean;
        duplicateDocumentId?: string;
        duplicateTitle?: string;
        reason?: string;
      }>('checkDocumentDuplicate', params as unknown as Record<string, unknown>);

      if (res?.isDuplicate) {
        return {
          isDuplicate: true,
          duplicateDocument: {
            documentId: res.duplicateDocumentId || '',
            title: res.duplicateTitle || ''
          } as DocumentRecord,
          reason: res.reason
        };
      }

      return { isDuplicate: false };
    } catch {
      return { isDuplicate: false };
    }
  },

  /**
   * Authoritative backend deterministic matching.
   * Routes to Apps Script findDocumentMatches to prevent algorithm drift and redundant downloads.
   */
  findMatches: async (query: MatchQuery): Promise<MatchResult[]> => {
    try {
      const res = await gasFetch<{
        success: boolean;
        count: number;
        matches: MatchResult[];
      }>('findDocumentMatches', query as unknown as Record<string, unknown>);

      if (res?.matches && Array.isArray(res.matches)) {
        return res.matches;
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves sanitized authoritative closed periods, capital projects, and options.
   */
  getSmartUploadOptions: async (): Promise<SmartUploadOptionsResult> => {
    try {
      const res = await gasFetch<{
        success: boolean;
        closedPeriods?: string[];
        capitalProjects?: Array<{ id: string; name: string }>;
        documentTypes?: string[];
      }>('getSmartUploadOptions', {});

      return {
        success: res?.success ?? true,
        closedPeriods: res?.closedPeriods || [],
        capitalProjects: res?.capitalProjects || [],
        documentTypes: res?.documentTypes || []
      };
    } catch {
      return {
        success: false,
        closedPeriods: [],
        capitalProjects: [],
        documentTypes: []
      };
    }
  },

  /**
   * Links an existing master document to an authoritative finance entity.
   * Single authoritative relationship operation.
   */
  linkDocumentToEntity: async (payload: {
    documentId: string;
    relatedEntityType: 'TRANSACTION' | 'EXPENSE' | 'INCOME' | 'REIMBURSEMENT' | 'CAPITAL_PROJECT' | 'CHECK';
    relatedEntityId: string;
    relatedTransactionId?: string;
    relatedReimbursementId?: string;
    relatedCapitalProjectId?: string;
    relatedCheckId?: string;
    postCloseReason?: string;
  }) => {
    return gasFetch<{
      success: boolean;
      documentId: string;
      status: DocumentStatus;
      updatedAt: string;
      error?: string;
    }>('linkDocumentToEntity', payload as unknown as Record<string, unknown>);
  }
};

export default smartUploadApi;
