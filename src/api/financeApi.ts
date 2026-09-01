/**
 * GPBC Finance Desk — Typed Finance API Client
 * Centralized API calls for Master Transactions, Income, Expenses,
 * Reimbursements, Receipts, Checks, and Capital Projects.
 */

import { gasFetch } from './gasFetch';
import {
  BaseTransaction,
  ReimbursementRecord,
  ReceiptRecord,
  CapitalProjectRecord,
  TransactionType,
  TransactionDirection
} from '../types/finance';

export interface TransactionFilters {
  direction?: TransactionDirection;
  transactionType?: TransactionType;
  fundId?: string;
  capitalProjectId?: string;
  personalPurchase?: boolean;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AddTransactionPayload {
  transactionDate: string;
  transactionType: TransactionType;
  direction: TransactionDirection;
  amount: number;
  payeeOrPayer: string;
  description: string;
  category?: string;
  fundId?: string;
  capitalProjectId?: string;
  paymentMethod?: string;
  checkNumber?: string;
  personalPurchase?: boolean;
  claimantName?: string;
  receiptStatus?: string;
  receiptId?: string;
  notes?: string;
}

export interface AddIncomePayload {
  date: string;
  memberOrDonorId?: string;
  donorName: string;
  incomeType: TransactionType;
  serviceType?: string;
  amount: number;
  fundId?: string;
  capitalProjectId?: string;
  paymentMethod?: string;
  checkNumber?: string;
  envelopeNumber?: string;
  notes?: string;
}

export interface AddExpensePayload {
  date: string;
  payee: string;
  amount: number;
  category: string;
  purpose: string;
  paymentMethod?: string;
  checkNumber?: string;
  fundId?: string;
  capitalProjectId?: string;
  personalCardPurchase?: boolean;
  claimantName?: string;
  receiptId?: string;
  notes?: string;
}

export interface AddReimbursementPayload {
  reimbursementDate: string;
  claimantName: string;
  claimantEmail?: string;
  totalPurchaseAmount: number;
  totalReimbursedAmount: number;
  totalPersonallyAbsorbed?: number;
  paymentMethod?: string;
  checkNumber?: string;
  notes?: string;
  allocations?: Array<{
    purchaseTransactionId: string;
    allocatedAmount: number;
    personallyAbsorbedAmount?: number;
    refundCreditAdjustment?: number;
    notes?: string;
  }>;
}

export interface AddReceiptPayload {
  receiptDate: string;
  merchant: string;
  amount: number;
  documentType?: string;
  driveFileId?: string;
  driveUrl?: string;
  matchedTransactionId?: string;
  notes?: string;
}

export interface AddCheckPayload {
  checkNumber: string;
  checkDate: string;
  amount: number;
  payee: string;
  purpose: string;
  transactionId?: string;
  invoiceReceiptId?: string;
  driveFileId?: string;
  driveUrl?: string;
  notes?: string;
}

export interface AddCapitalProjectPayload {
  projectName: string;
  approvedBudget: number;
  designatedDonationsReceived?: number;
  otherFunding?: number;
  pendingCommitments?: number;
  notes?: string;
}

export const financeApi = {
  // Transactions
  getTransactions: async (filters: TransactionFilters = {}) => {
    return gasFetch<{ transactions: BaseTransaction[]; totalCount: number }>('getTransactions', filters as Record<string, unknown>);
  },
  addTransaction: async (payload: AddTransactionPayload) => {
    return gasFetch<{ transactionId: string }>('addTransaction', payload as unknown as Record<string, unknown>);
  },

  // Income & Expenses
  addIncome: async (payload: AddIncomePayload) => {
    return gasFetch<{ incomeId: string; transactionId: string }>('addIncome', payload as unknown as Record<string, unknown>);
  },
  addExpense: async (payload: AddExpensePayload) => {
    return gasFetch<{ expenseId: string; transactionId: string }>('addExpense', payload as unknown as Record<string, unknown>);
  },

  // Reimbursements
  getReimbursements: async () => {
    return gasFetch<{ reimbursements: ReimbursementRecord[]; count: number }>('getReimbursements');
  },
  addReimbursement: async (payload: AddReimbursementPayload) => {
    return gasFetch<{ reimbursementId: string; remainingReimbursable: number }>('addReimbursement', payload as unknown as Record<string, unknown>);
  },
  addReimbursementAllocation: async (payload: { reimbursementId: string; purchaseTransactionId: string; allocatedAmount: number; personallyAbsorbedAmount?: number; notes?: string }) => {
    return gasFetch<{ allocationId: string }>('addReimbursementAllocation', payload as unknown as Record<string, unknown>);
  },

  // Receipts
  getReceipts: async (filters: { matchStatus?: string; search?: string } = {}) => {
    return gasFetch<{ receipts: ReceiptRecord[]; count: number }>('getReceipts', filters as Record<string, unknown>);
  },
  addReceipt: async (payload: AddReceiptPayload) => {
    return gasFetch<{ receiptId: string }>('addReceipt', payload as unknown as Record<string, unknown>);
  },
  matchReceiptToTransaction: async (receiptId: string, transactionId: string) => {
    return gasFetch<{ receiptId: string; matchedTransactionId: string }>('matchReceiptToTransaction', { receiptId, transactionId });
  },

  // Checks
  getCheckDetails: async () => {
    return gasFetch<{ checks: any[]; count: number }>('getCheckDetails');
  },
  addCheckDetail: async (payload: AddCheckPayload) => {
    return gasFetch<{ checkId: string }>('addCheckDetail', payload as unknown as Record<string, unknown>);
  },

  // Capital Projects
  getCapitalProjects: async () => {
    return gasFetch<{ projects: CapitalProjectRecord[] }>('getCapitalProjects');
  },
  addCapitalProject: async (payload: AddCapitalProjectPayload) => {
    return gasFetch<{ projectId: string }>('addCapitalProject', payload as unknown as Record<string, unknown>);
  },
  updateCapitalProject: async (payload: { projectId: string; status?: string; approvedBudget?: number; notes?: string }) => {
    return gasFetch<{ projectId: string }>('updateCapitalProject', payload as unknown as Record<string, unknown>);
  },
  getDesignatedFundsSummary: async () => {
    return gasFetch<{ funds: Array<{ fundId: string; totalIncome: number; totalExpenses: number; netBalance: number }> }>('getDesignatedFundsSummary');
  },

  // Schema Init
  initializeSandboxSchema: async () => {
    return gasFetch<{ spreadsheetId: string; results: any[] }>('initializeSandboxSchema');
  }
};

export default financeApi;
