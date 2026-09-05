export type DocumentType =
  | 'Receipt'
  | 'Invoice'
  | 'Check'
  | 'Reimbursement Evidence'
  | 'Bank Statement'
  | 'Credit Card Statement'
  | 'Capital Project'
  | 'Finance Report'
  | 'Other Supporting Document';

export type DocumentStatus =
  | 'Linked'
  | 'Unlinked'
  | 'Needs Review'
  | 'Archived';

export interface DocumentRecord {
  documentId: string;
  documentType: DocumentType;
  title: string;
  originalFileName: string;
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  driveFileId: string;
  driveFileUrl: string;
  driveFolderId: string;
  documentDate: string;
  financeYear: number;
  financeMonth: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedTransactionId?: string;
  relatedReimbursementId?: string;
  relatedCapitalProjectId?: string;
  relatedCheckId?: string;
  source: string;
  contentHash?: string;
  status: DocumentStatus;
  isPostCloseAddition?: boolean;
  postCloseReason?: string;
  addedAfterCloseAt?: string;
  addedAfterCloseBy?: string;
  closedPeriodReference?: string;
  notes?: string;
  uploadedBy?: string;
  uploadedAt?: string;
  updatedAt?: string;
}

export interface UploadDocumentPayload {
  fileBase64?: string;
  fileName?: string;
  originalFileName?: string;
  mimeType?: string;
  fileSize?: number;
  documentType: DocumentType;
  title: string;
  documentDate?: string;
  financeYear?: number;
  financeMonth?: number;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedTransactionId?: string;
  relatedReimbursementId?: string;
  relatedCapitalProjectId?: string;
  relatedCheckId?: string;
  source?: string;
  contentHash?: string;
  status?: DocumentStatus;
  postCloseReason?: string;
  notes?: string;
  allowDuplicate?: boolean;
  driveFileId?: string;
  driveFileUrl?: string;
}

export interface DocumentFilterParams {
  financeYear?: number;
  financeMonth?: number;
  periodKey?: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  search?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  relatedTransactionId?: string;
}
