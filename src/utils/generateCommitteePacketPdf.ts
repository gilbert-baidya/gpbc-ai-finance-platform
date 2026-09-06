import { jsPDF } from 'jspdf';
import { ExpensePacketSummary, PacketExpenseItem, ReimbursementSettlementItem, MonthlyCommitteeApprovalRecord, CommitteeDecisionRecord } from '../api/committeeApi';

export interface CommitteePacketPdfOptions {
  summary: ExpensePacketSummary;
  expenses: PacketExpenseItem[];
  reimbursementSettlements?: ReimbursementSettlementItem[];
  approval?: MonthlyCommitteeApprovalRecord | null;
  decisions?: CommitteeDecisionRecord[];
}

export function generateCommitteePacketPdf(options: CommitteePacketPdfOptions) {
  const { summary, expenses, reimbursementSettlements = [], approval, decisions = [] } = options;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
      renderHeaderCompact();
    }
  };

  const renderHeader = () => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Grace and Praise Bangladeshi Church', margin, y);
    y += 6;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('1325 Richardson St., San Bernardino, CA 92408 | EIN: 39-4558295', margin, y);
    y += 8;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('MONTHLY EXPENSE APPROVAL PACKET - ' + summary.periodKey, margin, y);
    y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const versionText = approval ? ('Version: ' + approval.packetVersion + ' | Status: ' + approval.status) : 'Version: DRAFT PACKET';
    doc.text(versionText, margin, y);
    doc.text('Packet Fingerprint: ' + (summary.packetHash || 'pending'), pageWidth - margin, y, { align: 'right' });
    y += 9;
  };

  const renderHeaderCompact = () => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('GPBC Monthly Expense Packet - ' + summary.periodKey, margin, y);
    doc.text('Fingerprint: ' + (summary.packetHash || ''), pageWidth - margin, y, { align: 'right' });
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  };

  renderHeader();

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 34, 2, 2, 'FD');

  const colW = (pageWidth - (margin * 2)) / 4;
  let bx = margin + 4;
  let by = y + 7;

  // Box Col 1: Recognized Expenses
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RECOGNIZED EXPENSES', bx, by);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('$' + summary.totalRecognizedExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 }), bx, by + 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(summary.expenseCount + ' total transactions', bx, by + 14);

  // Box Col 2: Receipts / Evidence
  bx += colW;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('RECEIPTS COMPLETE', bx, by);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const isAllReceipts = summary.missingEvidenceCount === 0;
  doc.setTextColor(isAllReceipts ? 22 : 185, isAllReceipts ? 101 : 28, isAllReceipts ? 52 : 28);
  doc.text(summary.receiptsCompleteCount + ' / ' + summary.expenseCount, bx, by + 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(summary.missingEvidenceCount + ' missing evidence', bx, by + 14);

  // Box Col 3: Reimbursement Settlements (Separated)
  bx += colW;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('REIMBURSEMENT PAYOUTS', bx, by);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('$' + summary.reimbursementSettlementTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }), bx, by + 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Settlement only (not double-counted)', bx, by + 14);

  // Box Col 4: Capital Projects / Review
  bx += colW;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('CAPITAL / CLARIFICATION', bx, by);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('$' + summary.capitalProjectTotal.toLocaleString('en-US', { minimumFractionDigits: 2 }), bx, by + 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(summary.needsClarificationCount > 0 ? 194 : 100, summary.needsClarificationCount > 0 ? 65 : 116, summary.needsClarificationCount > 0 ? 12 : 139);
  doc.text(summary.needsClarificationCount + ' items need clarification', bx, by + 14);

  y += 40;

  // Detailed Expense List Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Recognized Expense Schedule', margin, y);
  y += 5;

  const renderTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - (margin * 2), 6, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);

    doc.text('Date', margin + 2, y + 4);
    doc.text('Payee / Merchant', margin + 22, y + 4);
    doc.text('Category', margin + 65, y + 4);
    doc.text('Purpose / Description', margin + 105, y + 4);
    doc.text('Evidence', margin + 148, y + 4);
    doc.text('Amount', pageWidth - margin - 2, y + 4, { align: 'right' });
    y += 8;
  };

  renderTableHeader();

  expenses.forEach((e) => {
    checkPageBreak(8);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    doc.text(e.date || '', margin + 2, y);

    const payee = doc.splitTextToSize(e.payeeOrPayer || 'Unknown', 40)[0];
    doc.text(payee, margin + 22, y);

    const cat = doc.splitTextToSize(e.category || 'Uncategorized', 38)[0];
    doc.text(cat, margin + 65, y);

    const desc = doc.splitTextToSize(e.description || 'General', 40)[0];
    doc.text(desc, margin + 105, y);

    const evidence = e.receiptStatus === 'ATTACHED' ? 'Attached' : (e.receiptStatus === 'NOT_REQUIRED' ? 'Exempt' : 'Missing');
    doc.setTextColor(e.receiptStatus === 'ATTACHED' ? 22 : (e.receiptStatus === 'NOT_REQUIRED' ? 100 : 185), e.receiptStatus === 'ATTACHED' ? 101 : (e.receiptStatus === 'NOT_REQUIRED' ? 116 : 28), e.receiptStatus === 'ATTACHED' ? 52 : (e.receiptStatus === 'NOT_REQUIRED' ? 139 : 28));
    doc.text(evidence, margin + 148, y);

    doc.setTextColor(15, 23, 42);
    doc.text('$' + e.amount.toFixed(2), pageWidth - margin - 2, y, { align: 'right' });

    y += 5;
  });

  if (reimbursementSettlements.length > 0) {
    checkPageBreak(25);
    y += 4;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Reimbursement Settlements (Payout Reference)', margin, y);
    y += 5;

    reimbursementSettlements.forEach((s) => {
      checkPageBreak(6);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(s.date + ' - Payout to ' + s.payeeOrPayer + ' (' + (s.paymentMethod || 'Check/Transfer') + '): $' + s.amount.toFixed(2), margin + 4, y);
      y += 4.5;
    });
  }

  // Committee Governance Section
  checkPageBreak(45);
  y += 7;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Committee Governance & Ratification', margin, y);
  y += 5;

  if (approval) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('Meeting Date: ' + (approval.meetingDate || 'Recorded electronically') + ' | Method: ' + (approval.approvalMethod || 'COMMITTEE_MEETING'), margin, y);
    if (approval.meetingMinutesRef) {
      doc.text('Minutes Reference: ' + approval.meetingMinutesRef, pageWidth - margin, y, { align: 'right' });
    }
    y += 5;

    if (decisions.length > 0) {
      decisions.forEach((d) => {
        checkPageBreak(6);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(d.memberNameSnapshot + ' (' + d.memberRoleSnapshot + '):', margin + 4, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(d.decision.includes('APPROVED') ? 22 : 100, d.decision.includes('APPROVED') ? 101 : 116, d.decision.includes('APPROVED') ? 52 : 139);
        doc.text(d.decision, margin + 65, y);
        if (d.comment) {
          doc.setTextColor(100, 116, 139);
          doc.text('"' + d.comment + '"', margin + 110, y);
        }
        y += 4.5;
      });
    }

    if (approval.generalComments) {
      y += 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 116, 139);
      doc.text('General Comments: ' + approval.generalComments, margin, y);
      y += 5;
    }
  } else {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Pending committee review and formal ratification.', margin, y);
    y += 6;
  }

  // Footer on all pages
  const totalPages = typeof doc.getNumberOfPages === 'function' ? doc.getNumberOfPages() : ((doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1);
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('Grace and Praise Bangladeshi Church - Confidential Financial Records', margin, pageHeight - 10);
    doc.text('Page ' + i + ' of ' + totalPages, pageWidth - margin, pageHeight - 10, { align: 'right' });
  }

  const fileName = 'GPBC_Committee_Packet_' + summary.periodKey + '_V' + (approval?.packetVersion || 1) + '.pdf';

  return {
    doc,
    fileName,
    save: () => doc.save(fileName)
  };
}
