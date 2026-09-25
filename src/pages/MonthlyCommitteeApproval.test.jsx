import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MonthlyCommitteeApproval from './MonthlyCommitteeApproval';
import { committeeApi } from '../api/committeeApi';
import { monthlyCloseApi } from '../api/monthlyCloseApi';
import { generateCommitteePacketPdf } from '../utils/generateCommitteePacketPdf';

let mockUser = {
  role: 'Primary Admin',
  email: 'admin@gpbc.org',
  name: 'Admin User'
};

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser
  })
}));

vi.mock('../api/committeeApi', () => ({
  committeeApi: {
    getMonthlyExpensePacket: vi.fn(),
    getMonthlyCommitteeApproval: vi.fn(),
    getCommitteeMembers: vi.fn(),
    recordCommitteeApproval: vi.fn(),
    createCommitteeApprovalAmendment: vi.fn(),
    addCommitteeMember: vi.fn(),
    updateCommitteeMember: vi.fn(),
    deactivateCommitteeMember: vi.fn()
  }
}));

vi.mock('../utils/generateCommitteePacketPdf', () => ({
  generateCommitteePacketPdf: vi.fn(() => ({
    save: vi.fn()
  }))
}));

vi.mock('../api/monthlyCloseApi', () => ({
  monthlyCloseApi: {
    getMonthlyClose: vi.fn()
  }
}));

const mockPacket = {
  success: true,
  periodKey: '2026-09',
  packetHash: 'test-hash-12345',
  summary: {
    periodKey: '2026-09',
    expenseCount: 3,
    operatingExpenseCount: 3,
    operatingExpenseTotal: 2678.71,
    reimbursementSettlementCount: 1,
    reimbursementSettlementTotal: 250.00,
    totalRecognizedExpenses: 2678.71,
    missingReceiptCount: 0,
    missingEvidenceCount: 0,
    needsClarificationCount: 0,
    openAuditIssueCount: 0,
    pendingBankLinesExcludedCount: 1,
    pendingBankLinesExcludedAmount: 80.00,
    readinessStatus: 'READY'
  },
  expenses: [
    {
      transactionId: 'EXP-1',
      date: '2026-09-05',
      payeeOrPayer: 'Churchwest Insurance',
      category: 'Insurance',
      fund: 'General',
      amount: 2567.50,
      paymentMethod: 'ACH',
      accountingImpact: 'EXPENSE',
      receiptStatus: 'Matched',
      hasReceipt: true,
      hasAuditFinding: false
    },
    {
      transactionId: 'EXP-2',
      date: '2026-09-12',
      payeeOrPayer: 'San Bernardino Alarm',
      category: 'Utilities',
      fund: 'General',
      amount: 31.21,
      paymentMethod: 'Auto Debit',
      accountingImpact: 'EXPENSE',
      receiptStatus: 'Matched',
      hasReceipt: true,
      hasAuditFinding: false
    },
    {
      transactionId: 'EXP-3',
      date: '2026-09-18',
      payeeOrPayer: 'James Trupest',
      category: 'Maintenance',
      fund: 'Building',
      amount: 80.00,
      paymentMethod: 'Zelle',
      accountingImpact: 'EXPENSE',
      receiptStatus: 'Matched',
      hasReceipt: true,
      hasAuditFinding: false
    }
  ]
};

const mockApproval = {
  success: true,
  approval: {
    approvalId: 'MCO-202609-V1',
    periodKey: '2026-09',
    approvalStatus: 'PENDING_REVIEW',
    approvalMethod: 'HYBRID',
    approvalThresholdRule: 'MAJORITY_OF_ELIGIBLE_MEMBERS',
    totalRecognizedExpenses: 2678.71,
    packetHash: 'test-hash-12345',
    versionNumber: 1,
    eligibleMemberCount: 5,
    approvalCount: 0,
    rejectionCount: 0,
    abstainCount: 0
  },
  decisions: [],
  hasPacketChanged: false
};

const mockMembers = [
  { memberId: 'MEM-001', name: 'Gilbert Baidya', role: 'Pastor / President', email: 'pastor@gpbc.org', isEligibleToVote: true, isActive: true, status: 'ACTIVE' },
  { memberId: 'MEM-002', name: 'Ashoke Roy', role: 'Treasurer', email: 'treasurer@gpbc.org', isEligibleToVote: true, isActive: true, status: 'ACTIVE' },
  { memberId: 'MEM-003', name: 'Barnali Roy', role: 'Secretary', email: 'secretary@gpbc.org', isEligibleToVote: true, isActive: true, status: 'ACTIVE' },
  { memberId: 'MEM-004', name: 'Newton Mondol', role: 'Board Member', email: 'newton@gpbc.org', isEligibleToVote: true, isActive: true, status: 'ACTIVE' },
  { memberId: 'MEM-005', name: 'Suprovat Biswas', role: 'Board Member', email: 'suprovat@gpbc.org', isEligibleToVote: true, isActive: true, status: 'ACTIVE' }
];

describe('MonthlyCommitteeApproval Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = {
      role: 'Primary Admin',
      email: 'admin@gpbc.org',
      name: 'Admin User'
    };
    committeeApi.getMonthlyExpensePacket.mockResolvedValue(mockPacket);
    committeeApi.getMonthlyCommitteeApproval.mockResolvedValue(mockApproval);
    committeeApi.getCommitteeMembers.mockResolvedValue({ success: true, members: mockMembers });
    monthlyCloseApi.getMonthlyClose.mockResolvedValue({
      success: true,
      closeRecord: { periodKey: '2026-09', status: 'READY' }
    });
  });

  it('renders the committee approval header and period selector', async () => {
    render(<MonthlyCommitteeApproval />);

    expect(await screen.findByText('Monthly Committee Expense Approval')).toBeInTheDocument();
    expect(screen.getByText(/Formal month-end governance ratification/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('September 2026')).toBeInTheDocument();
  });

  it('displays the compact month-end governance checklist', async () => {
    render(<MonthlyCommitteeApproval />);

    expect(await screen.findByText('Month-End Governance Checklist')).toBeInTheDocument();
    expect(screen.getByText('Expenses reviewed')).toBeInTheDocument();
    expect(screen.getByText('Evidence complete')).toBeInTheDocument();
    expect(screen.getByText('Reimbursements reviewed')).toBeInTheDocument();
    expect(screen.getByText('Exceptions resolved')).toBeInTheDocument();
    expect(screen.getByText('Committee packet generated')).toBeInTheDocument();
    expect(screen.getByText('Committee approval recorded')).toBeInTheDocument();
    expect(screen.getByText('Accounting close status')).toBeInTheDocument();
  });

  it('displays recognized expenses and excludes pending bank lines', async () => {
    render(<MonthlyCommitteeApproval />);

    expect(await screen.findByText('$2,678.71')).toBeInTheDocument();
    expect(screen.getByText(/3 expenses · excludes \$250.00 reimbursement settlements/i)).toBeInTheDocument();
    expect(screen.getByText(/1 pending bank lines excluded/i)).toBeInTheDocument();
  });

  it('displays all recognized expenses in table and cards', async () => {
    render(<MonthlyCommitteeApproval />);

    expect(await screen.findAllByText('Churchwest Insurance')).toHaveLength(2); // desktop table + mobile card
    expect(screen.getAllByText('San Bernardino Alarm')).toHaveLength(2);
    expect(screen.getAllByText('James Trupest')).toHaveLength(2);
  });

  it('triggers PDF packet export on button click', async () => {
    render(<MonthlyCommitteeApproval />);

    const exportBtn = await screen.findByRole('button', { name: /Export PDF Packet/i });
    fireEvent.click(exportBtn);

    expect(generateCommitteePacketPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: expect.any(Object),
        expenses: expect.any(Array)
      })
    );
  });

  it('enables recording approval for Admin and opens modal', async () => {
    render(<MonthlyCommitteeApproval />);

    const recordBtn = await screen.findByRole('button', { name: /Record Committee Approval/i });
    expect(recordBtn).not.toBeDisabled();

    fireEvent.click(recordBtn);
    expect(await screen.findByRole('heading', { name: 'Record Committee Approval' })).toBeInTheDocument();
  });

  it('restricts recording approval for Presbyter Read-Only role', async () => {
    mockUser = {
      role: 'Presbyter Read-Only',
      email: 'presbyter@diocese.org',
      name: 'Presbyter Oversight'
    };

    render(<MonthlyCommitteeApproval />);

    await waitFor(() => expect(screen.getByText('Monthly Committee Expense Approval')).toBeInTheDocument());
    expect(screen.getByText(/Presbyter Oversight View/i)).toBeInTheDocument();

    const recordBtn = screen.getByRole('button', { name: /Record Committee Approval/i });
    expect(recordBtn).toBeDisabled();

    expect(screen.queryByRole('button', { name: /Manage Committee Members/i })).not.toBeInTheDocument();
  });

  it('alerts when underlying expenses have changed post-approval requiring an amendment', async () => {
    committeeApi.getMonthlyCommitteeApproval.mockResolvedValue({
      success: true,
      approval: {
        ...mockApproval.approval,
        approvalStatus: 'APPROVED',
        approvalCount: 4,
        packetHash: 'old-original-hash'
      },
      decisions: [
        { decisionId: 'DEC-1', memberNameSnapshot: 'Gilbert Baidya', memberRoleSnapshot: 'Pastor / President', decision: 'APPROVED', approvalMethod: 'IN_PERSON' },
        { decisionId: 'DEC-2', memberNameSnapshot: 'Ashoke Roy', memberRoleSnapshot: 'Treasurer', decision: 'APPROVED', approvalMethod: 'IN_PERSON' },
        { decisionId: 'DEC-3', memberNameSnapshot: 'Barnali Roy', memberRoleSnapshot: 'Secretary', decision: 'APPROVED', approvalMethod: 'IN_PERSON' },
        { decisionId: 'DEC-4', memberNameSnapshot: 'Newton Mondol', memberRoleSnapshot: 'Board Member', decision: 'APPROVED', approvalMethod: 'IN_PERSON' }
      ],
      hasPacketChanged: true
    });

    render(<MonthlyCommitteeApproval />);

    expect(await screen.findByText(/Amendment Required: Expenses altered after approval/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Ratification Amendment/i })).toBeInTheDocument();
  });

  it('initializes modal with 0 approved, all UNRECORDED, and blocks submission when decisions are unrecorded', async () => {
    render(<MonthlyCommitteeApproval />);

    const recordBtn = await screen.findByRole('button', { name: /Record Committee Approval/i });
    fireEvent.click(recordBtn);

    expect(await screen.findByRole('heading', { name: 'Record Committee Approval' })).toBeInTheDocument();

    // Verify all active members start unrecorded and the decision is pending
    expect(screen.getByText(/Decisions Pending \(5 unrecorded\)/i)).toBeInTheDocument();
    expect(screen.getAllByText('Decision not recorded')).toHaveLength(5);

    // Verify submit button is disabled while unrecorded
    const submitBtn = screen.getByRole('button', { name: 'Record Approval' });
    expect(submitBtn).toBeDisabled();
  });
});
