import { gasFetch } from './gasFetch';
import {
  DocumentRecord,
  UploadDocumentPayload,
  DocumentFilterParams,
  DocumentStatus,
  DocumentType
} from '../types/document';

export interface UploadDocumentResponse {
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
}

export const documentApi = {
  getDocuments: async (filters: DocumentFilterParams = {}) => {
    return gasFetch<{ documents: DocumentRecord[]; count: number }>(
      'getDocuments',
      filters as Record<string, unknown>
    );
  },

  uploadDocument: async (payload: UploadDocumentPayload): Promise<UploadDocumentResponse> => {
    return gasFetch<UploadDocumentResponse>(
      'uploadDocument',
      payload as unknown as Record<string, unknown>
    );
  },

  linkDocumentToEntity: async (payload: {
    documentId: string;
    relatedEntityType?: string;
    relatedEntityId?: string;
    relatedTransactionId?: string;
    relatedReimbursementId?: string;
    relatedCapitalProjectId?: string;
    relatedCheckId?: string;
  }) => {
    return gasFetch<{ documentId: string; status: DocumentStatus; updatedAt: string }>(
      'linkDocumentToEntity',
      payload as unknown as Record<string, unknown>
    );
  },

  updateDocumentStatus: async (payload: {
    documentId: string;
    status?: DocumentStatus;
    notes?: string;
    title?: string;
    documentType?: DocumentType;
  }) => {
    return gasFetch<{ documentId: string; status: DocumentStatus; updatedAt: string }>(
      'updateDocumentStatus',
      payload as unknown as Record<string, unknown>
    );
  },

  deleteDocument: async (payload: { documentId: string; hardDelete?: boolean }) => {
    return gasFetch<{ documentId: string; status?: DocumentStatus; deleted?: boolean }>(
      'deleteDocument',
      payload as unknown as Record<string, unknown>
    );
  }
};

export default documentApi;
