/**
 * GPBC Finance Desk — Typed Committee Governance API Client
 * Centralized API calls for Monthly Committee Expense Approval & Directory.
 */

import { gasFetch } from './gasFetch';

export interface CommitteeMember {
  memberId: string;
  fullName: string;
  roleTitle: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface ExpensePacketSummary {
  churchName: string;
  address: string;
  periodKey: string;
  startDate: string;
  endDate: string;
  totalRecognizedExpenses: number;
  expenseCount: number;
  receiptsCompleteCount: number;
  missingEvidenceCount: number;
  needsClarificationCount: number;
  reimbursementSettlementTotal: number;
  reimbursementSettlementCount: number;
  capitalProjectTotal: number;
  packetHash: string;
}

export interface PacketExpenseItem {
  transactionId: string;
  date: string;
  payeeOrPayer: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  checkNumber?: string;
  personalPurchase?: boolean;
  claimantName?: string;
  capitalProjectId?: string;
  receiptStatus: string;
  receiptId?: string;
  reconciliationStatus: string;
  isUncategorized?: boolean;
  isVaguePurpose?: boolean;
  accountingImpact: string;
}

export interface ReimbursementSettlementItem {
  transactionId: string;
  date: string;
  payeeOrPayer: string;
  amount: number;
  paymentMethod: string;
  checkNumber?: string;
  notes?: string;
}

export interface MonthlyExpensePacketResponse {
  success: boolean;
  periodKey: string;
  summary: ExpensePacketSummary;
  expenses: PacketExpenseItem[];
  reimbursementSettlements: ReimbursementSettlementItem[];
  packetHash: string;
  error?: string;
}

export interface CommitteeDecisionRecord {
  decisionId: string;
  approvalId: string;
  periodKey: string;
  packetVersion: number;
  memberId: string;
  memberNameSnapshot: string;
  memberRoleSnapshot: string;
  decision: 'APPROVED' | 'APPROVED_WITH_COMMENT' | 'ABSTAINED' | 'NOT_PRESENT' | 'RETURNED_FOR_CLARIFICATION';
  decisionDate: string;
  approvalMethod: string;
  comment?: string;
  recordedBy?: string;
  recordedAt?: string;
}

export interface MonthlyCommitteeApprovalRecord {
  approvalId: string;
  periodKey: string;
  packetVersion: number;
  isLatestVersion: boolean;
  status: 'DRAFT' | 'READY_FOR_REVIEW' | 'SUBMITTED' | 'APPROVED' | 'APPROVED_WITH_EXCEPTIONS' | 'RETURNED_FOR_CLARIFICATION';
  totalRecognizedExpenses: number;
  expenseCount: number;
  receiptsCompleteCount: number;
  missingEvidenceCount: number;
  needsClarificationCount: number;
  reimbursementSettlementTotal: number;
  capitalProjectTotal: number;
  packetHash: string;
  expenseSnapshotJson: string;
  approvalRuleSnapshot: string;
  eligibleMemberCount: number;
  requiredApprovalCount: number;
  actualApprovalCount: number;
  meetingDate: string;
  approvalMethod: string;
  meetingMinutesRef?: string;
  generalComments?: string;
  overrideApplied?: boolean;
  overrideReason?: string;
  overrideBy?: string;
  documentId?: string;
  amendmentReason?: string;
  previousApprovalId?: string;
  submittedBy?: string;
  submittedAt?: string;
  finalizedBy?: string;
  finalizedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MonthlyCommitteeApprovalResponse {
  success: boolean;
  periodKey: string;
  approval: MonthlyCommitteeApprovalRecord | null;
  decisions: CommitteeDecisionRecord[];
  history: MonthlyCommitteeApprovalRecord[];
  currentPacketHash?: string;
  hasPacketChanged?: boolean;
  amendmentRequired?: boolean;
  changeMessage?: string;
  isDraft?: boolean;
  error?: string;
}

export const committeeApi = {
  getCommitteeMembers: async (): Promise<{ success: boolean; members: CommitteeMember[]; error?: string }> => {
    return gasFetch<{ success: boolean; members: CommitteeMember[]; error?: string }>('getCommitteeMembers', {});
  },

  addCommitteeMember: async (payload: Partial<CommitteeMember>): Promise<{ success: boolean; member: CommitteeMember; error?: string }> => {
    return gasFetch<{ success: boolean; member: CommitteeMember; error?: string }>('addCommitteeMember', payload);
  },

  updateCommitteeMember: async (payload: Partial<CommitteeMember>): Promise<{ success: boolean; memberId: string; error?: string }> => {
    return gasFetch<{ success: boolean; memberId: string; error?: string }>('updateCommitteeMember', payload);
  },

  deactivateCommitteeMember: async (memberId: string, effectiveTo?: string): Promise<{ success: boolean; memberId: string; error?: string }> => {
    return gasFetch<{ success: boolean; memberId: string; error?: string }>('deactivateCommitteeMember', { memberId, effectiveTo });
  },

  getMonthlyExpensePacket: async (periodKey: string): Promise<MonthlyExpensePacketResponse> => {
    return gasFetch<MonthlyExpensePacketResponse>('getMonthlyExpensePacket', { periodKey });
  },

  getMonthlyCommitteeApproval: async (periodKey: string): Promise<MonthlyCommitteeApprovalResponse> => {
    return gasFetch<MonthlyCommitteeApprovalResponse>('getMonthlyCommitteeApproval', { periodKey });
  },

  recordCommitteeApproval: async (payload: {
    periodKey: string;
    approvalMethod?: string;
    meetingDate?: string;
    meetingMinutesRef?: string;
    generalComments?: string;
    approvalRule?: string;
    decisions: Array<{
      memberId: string;
      decision: string;
      comment?: string;
      approvalMethod?: string;
      decisionDate?: string;
    }>;
    overrideApplied?: boolean;
    overrideReason?: string;
    documentId?: string;
  }): Promise<{ success: boolean; approval: MonthlyCommitteeApprovalRecord; decisions: CommitteeDecisionRecord[]; error?: string }> => {
    return gasFetch('recordCommitteeApproval', payload);
  },

  overrideCommitteeApproval: async (payload: {
    periodKey: string;
    overrideReason: string;
    decisions: Array<{
      memberId: string;
      decision: string;
      comment?: string;
    }>;
  }): Promise<{ success: boolean; approval: MonthlyCommitteeApprovalRecord; error?: string }> => {
    return gasFetch('overrideCommitteeApproval', payload);
  },

  createCommitteeApprovalAmendment: async (payload: {
    periodKey: string;
    amendmentReason: string;
    approvalMethod?: string;
    meetingDate?: string;
    meetingMinutesRef?: string;
    generalComments?: string;
    approvalRule?: string;
    decisions: Array<{
      memberId: string;
      decision: string;
      comment?: string;
    }>;
  }): Promise<{ success: boolean; approval: MonthlyCommitteeApprovalRecord; error?: string }> => {
    return gasFetch('createCommitteeApprovalAmendment', payload);
  }
};
