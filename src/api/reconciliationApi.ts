/**
 * GPBC Finance Desk — Typed Reconciliation & Month-End Reports API Client
 */

import { gasFetch } from './gasFetch';
import { ReconciliationRecord, ReconciliationSummary, CanonicalReconciliationStatus } from '../types/finance';

export interface ReconciliationFilters {
  periodKey?: string;
  startDate?: string;
  endDate?: string;
  reconciliationStatus?: CanonicalReconciliationStatus;
  search?: string;
}

export interface ReconcilePayload {
  transactionId: string;
  reconciliationStatus?: CanonicalReconciliationStatus;
  reconciledAmount?: number;
  notes?: string;
  reviewReason?: string;
}

export interface MonthEndReportPackage {
  success: boolean;
  periodKey: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  churchInfo: {
    name: string;
    ein: string;
    address: string;
  };
  closeStatus: string;
  closedBy: string;
  closedAt: string;
  financialSummary: {
    totalIncome: number;
    totalRecognizedExpenses: number;
    netPosition: number;
    sundayOfferingTotal: number;
    auditHealthScore: number;
  };
  sundayOfferingSummary: {
    totalSundayOffering: number;
    count: number;
    offerings: Array<{
      date: string;
      payer: string;
      amount: number;
      paymentMethod?: string;
      checkNumber?: string;
    }>;
  };
  reimbursementSummary: {
    count: number;
    reimbursements: any[];
  };
  checkSummary: {
    count: number;
    checks: any[];
  };
  capitalProjectSummary: {
    projects: any[];
  };
  reconciliationSummary: ReconciliationSummary;
  postCloseAdditionsCount: number;
  postCloseDocuments: any[];
  auditFindingsCount: number;
  auditFindings: any[];
}

export const reconciliationApi = {
  getReconciliationRecords: async (filters: ReconciliationFilters = {}) => {
    return gasFetch<{
      success: boolean;
      count: number;
      summary: ReconciliationSummary;
      records: ReconciliationRecord[];
    }>('getReconciliationRecords', filters as Record<string, unknown>);
  },

  reconcileTransactionRecord: async (payload: ReconcilePayload) => {
    return gasFetch<{
      success: boolean;
      reconciliationId: string;
      transactionId: string;
      reconciliationStatus: CanonicalReconciliationStatus;
    }>('reconcileTransactionRecord', payload as unknown as Record<string, unknown>);
  },

  autoReconcilePeriod: async (periodKey: string) => {
    return gasFetch<{
      success: boolean;
      autoReconciledCount: number;
      skippedCount: number;
      errors: string[];
    }>('autoReconcilePeriod', { periodKey });
  },

  getMonthEndReportPackage: async (periodKey: string) => {
    return gasFetch<MonthEndReportPackage>('getMonthEndReportPackage', { periodKey });
  }
};

export default reconciliationApi;
