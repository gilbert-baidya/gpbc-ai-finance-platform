/*************************************************
 * GPBC Finance Desk — smartUpload.ts
 * Authoritative shared TypeScript interfaces for Smart Upload
 * Single source of truth for types across client and API
 *************************************************/

export type MatchConfidence = 'Strong Match' | 'Possible Match' | 'Weak Match';

export interface MatchQuery {
  documentType: string;
  vendor?: string;
  date?: string;
  amount?: number | null;
  description?: string;
  capitalProjectId?: string;
  reimbursementId?: string;
  checkNumber?: string;
}

export interface CandidateRecord {
  id: string;
  entityType: 'TRANSACTION' | 'EXPENSE' | 'INCOME' | 'REIMBURSEMENT' | 'CAPITAL_PROJECT' | 'CHECK';
  entityId: string;
  displayTitle: string;
  amount?: number;
  date?: string;
  vendorPayee?: string;
  description?: string;
  capitalProjectId?: string;
  reimbursementId?: string;
  checkNumber?: string;
  personalPurchase?: boolean;
  notes?: string;
}

export interface MatchResult {
  candidate: CandidateRecord;
  score: number;
  confidenceLabel: MatchConfidence;
  reasons: string[];
}

export interface SmartUploadFileValidationResult {
  valid: boolean;
  error?: string;
}

export interface DuplicateCheckQuery {
  contentHash?: string;
  filename?: string;
  fileSize?: number;
  documentDate?: string;
  vendor?: string;
  amount?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateDocumentId?: string;
  duplicateTitle?: string;
  duplicateStatus?: string;
  duplicateDocument?: any;
  reason?: string;
}

export interface SmartUploadOptionsResult {
  success: boolean;
  closedPeriods: string[];
  capitalProjects: Array<{ id: string; name: string; projectId?: string; projectName?: string }>;
  documentTypes: string[];
  writesEnabled?: boolean;
}

export interface SmartUploadPayload {
  fileBase64?: string;
  contentHash?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSize?: number;
  documentType: string;
  title?: string;
  vendor?: string;
  amount?: number;
  documentDate?: string;
  description?: string;
  financePeriod?: string;
  capitalProjectId?: string;
  postCloseReason?: string;
  notes?: string;
  isDocumentOnly?: boolean;
  allowDuplicateUpload?: boolean;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedTransactionId?: string;
  relatedReimbursementId?: string;
  relatedCapitalProjectId?: string;
  relatedCheckId?: string;
}
