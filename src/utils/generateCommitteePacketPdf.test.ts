import { describe, expect, it } from 'vitest';
import { generateCommitteePacketPdf } from './generateCommitteePacketPdf';
import { buildCommitteePacketDocumentMetadata } from './committeePacketMetadata';

const summary = {
  churchName: 'Grace and Praise Bangladeshi Church',
  address: '123 Church Street',
  periodKey: '2026-09',
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  totalRecognizedExpenses: 100,
  expenseCount: 1,
  receiptsCompleteCount: 1,
  missingEvidenceCount: 0,
  needsClarificationCount: 0,
  reimbursementSettlementTotal: 40,
  reimbursementSettlementCount: 1,
  capitalProjectTotal: 0,
  packetHash: 'packet-hash-2026-09'
};

const expense = {
  transactionId: 'TXN-EXP-1',
  date: '2026-09-10',
  payeeOrPayer: 'Office Depot',
  category: 'Office Supplies',
  description: 'Printer toner',
  amount: 100,
  paymentMethod: 'Card',
  receiptStatus: 'ATTACHED',
  reconciliationStatus: 'RECONCILED',
  accountingImpact: 'EXPENSE'
};

const approval = {
  approvalId: 'MCO-202609-V1',
  periodKey: '2026-09',
  packetVersion: 1,
  isLatestVersion: true,
  status: 'APPROVED',
  totalRecognizedExpenses: 100,
  expenseCount: 1,
  receiptsCompleteCount: 1,
  missingEvidenceCount: 0,
  needsClarificationCount: 0,
  reimbursementSettlementTotal: 40,
  capitalProjectTotal: 0,
  packetHash: 'packet-hash-2026-09',
  expenseSnapshotJson: '[]',
  approvalRuleSnapshot: 'MAJORITY_OF_ELIGIBLE_MEMBERS',
  eligibleMemberCount: 2,
  requiredApprovalCount: 2,
  actualApprovalCount: 2,
  meetingDate: '2026-10-02',
  approvalMethod: 'IN_PERSON',
  meetingMinutesRef: 'MIN-2026-09-02'
} as const;

const decisions = [
  {
    decisionId: 'DEC-1',
    approvalId: approval.approvalId,
    periodKey: approval.periodKey,
    packetVersion: approval.packetVersion,
    memberId: 'MEM-1',
    memberNameSnapshot: 'Pastor Gilbert',
    memberRoleSnapshot: 'Chair',
    decision: 'APPROVED' as const,
    decisionDate: '2026-10-02',
    approvalMethod: 'IN_PERSON'
  },
  {
    decisionId: 'DEC-2',
    approvalId: approval.approvalId,
    periodKey: approval.periodKey,
    packetVersion: approval.packetVersion,
    memberId: 'MEM-2',
    memberNameSnapshot: 'Sarah Treasurer',
    memberRoleSnapshot: 'Treasurer',
    decision: 'APPROVED_WITH_COMMENT' as const,
    decisionDate: '2026-10-02',
    approvalMethod: 'IN_PERSON',
    comment: 'Receipt evidence reviewed'
  }
];

const settlement = {
  transactionId: 'RMB-1',
  date: '2026-09-20',
  payeeOrPayer: 'Sarah Treasurer',
  amount: 40,
  paymentMethod: 'Check'
};

function pdfText(options: Parameters<typeof generateCommitteePacketPdf>[0]) {
  return generateCommitteePacketPdf(options).doc.output().replace(/\\([()\\])/g, '$1');
}

describe('generateCommitteePacketPdf', () => {
  it('marks an unapproved packet unmistakably as a draft', () => {
    const text = pdfText({ summary, expenses: [expense] });

    expect(text).toContain('DRAFT');
    expect(text).toContain('NOT YET COMMITTEE APPROVED');
  });

  it('includes final governance and expense evidence without income data', () => {
    const text = pdfText({
      summary,
      expenses: [expense],
      reimbursementSettlements: [settlement],
      approval,
      decisions
    });

    expect(text).toContain('Grace and Praise Bangladeshi Church');
    expect(text).toContain('2026-09');
    expect(text).toContain('Recognized Expense Schedule');
    expect(text).toContain('100.00');
    expect(text).toContain('Attached');
    expect(text).toContain('Reimbursement Settlements (Payout Reference)');
    expect(text).toContain('Pastor Gilbert');
    expect(text).toContain('Chair');
    expect(text).toContain('APPROVED');
    expect(text).toContain('2026-10-02');
    expect(text).toContain('IN_PERSON');
    expect(text).toContain('MIN-2026-09-02');
    expect(text).toContain('Version: V1');
    expect(text).toContain('packet-hash-2026-09');
    expect(text).not.toContain('Sunday Offering');
    expect(text).not.toContain('donor');
    expect(text).not.toContain('giving history');
    expect(text).not.toContain('contribution');
  });

  it('keeps reimbursement payouts as settlement references and excludes pending lines', () => {
    const text = pdfText({
      summary,
      expenses: [
        expense,
        {
          ...expense,
          transactionId: 'BANK-PENDING-1',
          payeeOrPayer: 'Pending Bank Import',
          amount: 80,
          status: 'PENDING'
        }
      ],
      reimbursementSettlements: [settlement]
    });

    expect(text).toContain('Office Depot');
    expect(text).toContain('REIMBURSEMENT PAYOUTS');
    expect(text).toContain('Settlement only (not double-counted)');
    expect(text).toContain('Payout to Sarah Treasurer');
    expect(text).not.toContain('Pending Bank Import');
    expect(text).not.toContain('$80.00');
    expect(text).not.toContain('Pending bank line');
    expect(text).not.toContain('PENDING');
  });

  it('builds the local finalized Document_Register metadata contract without Drive access', () => {
    expect(buildCommitteePacketDocumentMetadata(approval)).toEqual({
      documentType: 'Committee Approval Packet',
      relatedEntityType: 'MONTHLY_COMMITTEE_APPROVAL',
      relatedEntityId: 'MCO-202609-V1',
      periodKey: '2026-09',
      packetVersion: 1,
      packetHash: 'packet-hash-2026-09'
    });
  });
});
