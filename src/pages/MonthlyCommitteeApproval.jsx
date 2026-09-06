import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, FileText, Download, CheckCircle2, AlertTriangle,
  Clock, Users, RefreshCw, Calendar, AlertCircle, ArrowRight,
  ClipboardList, Check, History, PlusCircle, CloudUpload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { committeeApi } from '../api/committeeApi';
import { monthlyCloseApi } from '../api/monthlyCloseApi';
import { documentApi } from '../api/documentApi';
import { generateCommitteePacketPdf } from '../utils/generateCommitteePacketPdf';
import { buildCommitteePacketDocumentMetadata } from '../utils/committeePacketMetadata';
import RecordApprovalModal from '../components/committee/RecordApprovalModal';
import CommitteeMembersModal from '../components/committee/CommitteeMembersModal';
import { successToast, errorToast } from '../utils/toast';
import './MonthlyCommitteeApproval.css';

export default function MonthlyCommitteeApproval() {
  const { user } = useAuth();
  const userRole = user?.role || 'Viewer';
  const isPresbyter = userRole === 'Presbyter Read-Only';
  const isViewer = userRole === 'Viewer';
  const isAdmin = userRole === 'Primary Admin' || userRole === 'Backup Admin';
  const canRecord = !isPresbyter && !isViewer;

  const [periodKey, setPeriodKey] = useState('2026-09');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingPacket, setUploadingPacket] = useState(false);

  // Data states
  const [packetData, setPacketData] = useState(null);
  const [approvalData, setApprovalData] = useState(null);
  const [members, setMembers] = useState([]);
  const [closeRecord, setCloseRecord] = useState(null);

  // Modals
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [isAmendmentMode, setIsAmendmentMode] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [pktRes, appRes, memRes, closeRes] = await Promise.all([
        committeeApi.getMonthlyExpensePacket(periodKey),
        committeeApi.getMonthlyCommitteeApproval(periodKey),
        committeeApi.getCommitteeMembers(),
        monthlyCloseApi.getMonthlyClose({ periodKey }).catch(() => null)
      ]);

      if (pktRes && pktRes.success) setPacketData(pktRes);
      if (appRes && appRes.success) setApprovalData(appRes);
      if (memRes && memRes.success) setMembers(memRes.members || []);
      if (closeRes && closeRes.closeRecord) {
        setCloseRecord(closeRes.closeRecord);
      } else {
        setCloseRecord(null);
      }
    } catch (err) {
      console.error('Failed to load committee approval data:', err);
      errorToast('Failed to load committee governance data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [periodKey]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleDownloadPdf = () => {
    if (!packetData || !packetData.summary) {
      errorToast('Expense packet data not ready.');
      return;
    }

    try {
      const pdf = generateCommitteePacketPdf({
        summary: packetData.summary,
        expenses: packetData.expenses || [],
        reimbursementSettlements: packetData.reimbursementSettlements || [],
        approval: approvalData?.approval || null,
        decisions: approvalData?.decisions || []
      });
      pdf.save();
      successToast('Committee Approval Packet PDF generated.');
    } catch (err) {
      console.error(err);
      errorToast('Failed to generate PDF packet.');
    }
  };

  const handleRegisterCanonicalPacket = async () => {
    if (!packetData || !packetData.summary) {
      errorToast('Expense packet data not ready.');
      return;
    }
    if (!approval || (approvalStatus !== 'APPROVED' && approvalStatus !== 'APPROVED_WITH_EXCEPTIONS')) {
      errorToast('Committee must ratify the packet before registering canonical evidence.');
      return;
    }

    setUploadingPacket(true);
    try {
      const pdf = generateCommitteePacketPdf({
        summary: packetData.summary,
        expenses: packetData.expenses || [],
        reimbursementSettlements: packetData.reimbursementSettlements || [],
        approval: approval,
        decisions: decisions
      });

      const fileBase64 = pdf.getBase64();
      const fileName = pdf.fileName;
      const documentMetadata = buildCommitteePacketDocumentMetadata(approval);

      const uploadRes = await documentApi.uploadDocument({
        fileBase64,
        originalFileName: fileName,
        mimeType: 'application/pdf',
        ...documentMetadata,
        title: `GPBC Committee Approval Packet - ${periodKey} V${approval.packetVersion || 1}`,
        documentDate: approval.meetingDate || new Date().toISOString().split('T')[0],
        postCloseReason: isAccountingClosed ? 'Monthly Committee Governance Ratification' : undefined,
        notes: `Packet fingerprint: ${summary.packetHash} | Version: ${approval.packetVersion}`,
        isAuthoritative: true
      });

      if (uploadRes && uploadRes.success) {
        successToast(`Canonical packet stored in Drive & registered (${uploadRes.documentId}).`);
        loadData();
      } else {
        errorToast(uploadRes?.message || 'Failed to register document.');
      }
    } catch (err) {
      console.error(err);
      errorToast(err.message || 'Failed to upload canonical packet.');
    } finally {
      setUploadingPacket(false);
    }
  };

  const summary = packetData?.summary || {
    totalRecognizedExpenses: 0,
    expenseCount: 0,
    receiptsCompleteCount: 0,
    missingEvidenceCount: 0,
    needsClarificationCount: 0,
    reimbursementSettlementTotal: 0,
    reimbursementSettlementCount: 0,
    capitalProjectTotal: 0,
    packetHash: ''
  };

  const approval = approvalData?.approval || null;
  const decisions = approvalData?.decisions || [];
  const history = approvalData?.history || [];
  const hasPacketChanged = Boolean(approvalData?.hasPacketChanged);
  const approvalStatus = approval ? (approval.approvalStatus || approval.status || 'DRAFT') : 'DRAFT';

  // Governance Checklist Statuses
  const isExpensesReviewed = (summary.expenseCount || 0) > 0;
  const isEvidenceComplete = (summary.missingEvidenceCount || 0) === 0;
  const isReimbursementsSegregated = true;
  const isExceptionsResolved = (summary.needsClarificationCount || 0) === 0;
  const isPacketGenerated = Boolean(packetData);
  const isApprovalRecorded = Boolean(approval && (approvalStatus === 'APPROVED' || approvalStatus === 'APPROVED_WITH_EXCEPTIONS'));

  // Authoritative Close Status from Backend Monthly_Close
  const closeStatusRaw = String(closeRecord?.status || 'OPEN').toUpperCase();
  const accountingCloseStatus = ['OPEN', 'READY', 'CLOSED'].includes(closeStatusRaw) ? closeStatusRaw : 'OPEN';
  const isAccountingClosed = accountingCloseStatus === 'CLOSED';

  return (
    <div className="committee-page-container">
      {/* Header */}
      <div className="committee-header-section">
        <div className="committee-title-group">
          <h1>
            <ShieldCheck size={28} color="#2563eb" />
            Monthly Committee Expense Approval
          </h1>
          <p className="committee-subtitle">
            Formal month-end governance ratification and immutable expense packet approval.
          </p>
        </div>

        <div className="committee-header-actions">
          {/* Period Selector */}
          <div className="committee-period-picker">
            <Calendar size={16} color="#64748b" />
            <select
              value={periodKey}
              onChange={(e) => setPeriodKey(e.target.value)}
              className="committee-select"
              aria-label="Select Period"
            >
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
            </select>
          </div>

          <button
            type="button"
            className="committee-btn committee-btn-secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Refresh Data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="committee-btn committee-btn-secondary"
            onClick={handleDownloadPdf}
            title="Download PDF Packet"
          >
            <Download size={16} />
            <span>Export PDF Packet</span>
          </button>

          {approval && (approvalStatus === 'APPROVED' || approvalStatus === 'APPROVED_WITH_EXCEPTIONS') && (
            <button
              type="button"
              className="committee-btn committee-btn-secondary"
              onClick={handleRegisterCanonicalPacket}
              disabled={uploadingPacket}
              title="Store canonical approval packet in Google Drive and register in Document_Register"
            >
              <CloudUpload size={16} />
              <span>{uploadingPacket ? 'Registering...' : approval.documentId ? `Registered (${approval.documentId})` : 'Store Canonical Evidence'}</span>
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              className="committee-btn committee-btn-secondary"
              onClick={() => setMembersModalOpen(true)}
              title="Manage Committee Members"
            >
              <Users size={16} />
              <span>Manage Committee Members</span>
            </button>
          )}
        </div>
      </div>

      {/* Role / Mode Notice */}
      {isPresbyter && (
        <div className="committee-role-banner presbyter">
          <ShieldCheck size={18} />
          <div>
            <strong>Presbyter Oversight View:</strong> You have read-only access to view monthly packets, approval records, and ratification history. Committee decision actions are reserved for GPBC Finance Officers and Board Members.
          </div>
        </div>
      )}

      {/* Post-Approval Alteration / Amendment Required Warning */}
      {hasPacketChanged && (
        <div className="committee-amendment-alert">
          <AlertTriangle size={24} color="#dc2626" />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', color: '#991b1b', fontSize: '0.95rem' }}>
              Amendment Required: Expenses altered after approval
            </strong>
            <span style={{ fontSize: '0.85rem', color: '#7f1d1d' }}>
              The underlying expense register hash does not match the ratified snapshot ({approval?.packetHash?.substring(0, 10)}...). An amendment must be recorded for governance integrity.
            </span>
          </div>
          <div>
            {canRecord && (
              <button
                type="button"
                className="committee-btn committee-btn-primary"
                style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                onClick={() => {
                  setIsAmendmentMode(true);
                  setApprovalModalOpen(true);
                }}
              >
                Create Ratification Amendment
              </button>
            )}
          </div>
        </div>
      )}

      {/* Month-End Governance Checklist */}
      <div className="governance-checklist-card">
        <div className="checklist-title">
          <ClipboardList size={18} color="#2563eb" />
          <span>Month-End Governance Checklist</span>
        </div>
        <div className="checklist-items-grid">
          <div className={`checklist-step ${isExpensesReviewed ? 'done' : 'pending'}`}>
            <Check size={14} />
            <span>Expenses reviewed</span>
          </div>
          <div className={`checklist-step ${isEvidenceComplete ? 'done' : 'warning'}`}>
            {isEvidenceComplete ? <Check size={14} /> : <AlertTriangle size={14} />}
            <span>Evidence complete</span>
          </div>
          <div className="checklist-step done">
            <Check size={14} />
            <span>Reimbursements reviewed</span>
          </div>
          <div className={`checklist-step ${isExceptionsResolved ? 'done' : 'warning'}`}>
            {isExceptionsResolved ? <Check size={14} /> : <AlertTriangle size={14} />}
            <span>Exceptions resolved</span>
          </div>
          <div className={`checklist-step ${isPacketGenerated ? 'done' : 'pending'}`}>
            <Check size={14} />
            <span>Committee packet generated</span>
          </div>
          <div className={`checklist-step ${isApprovalRecorded ? 'done' : 'pending'}`}>
            {isApprovalRecorded ? <Check size={14} /> : <Clock size={14} />}
            <span>Committee approval recorded</span>
          </div>
          <div className={`checklist-step ${isAccountingClosed ? 'done' : accountingCloseStatus === 'READY' ? 'ready' : 'pending'}`}>
            {isAccountingClosed ? <Check size={14} /> : <Clock size={14} />}
            <span>Accounting close status</span>
            <span>: {accountingCloseStatus}</span>
          </div>
        </div>
      </div>

      {/* Executive Financial Metrics */}
      <div className="committee-metrics-grid">
        <div className="committee-metric-card">
          <span className="committee-metric-label">Recognized Expenses</span>
          <span className="committee-metric-val">
            ${(summary.totalRecognizedExpenses || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="committee-metric-sub">
            {summary.expenseCount || 0} expenses · excludes ${(summary.reimbursementSettlementTotal || 0).toFixed(2)} reimbursement settlements
          </span>
          {(packetData?.summary?.pendingBankLinesExcludedCount || 0) > 0 && (
            <span className="committee-metric-note" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'block' }}>
              {packetData.summary.pendingBankLinesExcludedCount} pending bank lines excluded
            </span>
          )}
        </div>

        <div className="committee-metric-card">
          <span className="committee-metric-label">Evidence Completeness</span>
          <span className="committee-metric-val" style={{ color: isEvidenceComplete ? '#15803d' : '#b45309' }}>
            {summary.receiptsCompleteCount} / {summary.expenseCount}
          </span>
          <span className="committee-metric-sub">
            {summary.missingEvidenceCount === 0 ? 'All receipts attached' : `${summary.missingEvidenceCount} missing evidence`}
          </span>
        </div>

        <div className="committee-metric-card">
          <span className="committee-metric-label">Reimbursement Payouts</span>
          <span className="committee-metric-val">
            ${summary.reimbursementSettlementTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="committee-metric-sub">
            {summary.reimbursementSettlementCount} liability settlements (not double-counted)
          </span>
        </div>

        <div className="committee-metric-card">
          <span className="committee-metric-label">Packet Fingerprint</span>
          <span className="committee-metric-val" style={{ fontSize: '0.95rem', fontFamily: 'monospace', color: '#475569' }}>
            {summary.packetHash ? summary.packetHash.substring(0, 16) + '...' : 'pending'}
          </span>
          <span className="committee-metric-sub">
            Deterministic SHA-256 expense hash
          </span>
        </div>
      </div>

      {/* Ratification Status Card */}
      <div className="ratification-status-card">
        <div className="ratification-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className={`ratification-status-badge ${approvalStatus}`}>
              {approvalStatus === 'APPROVED' && <CheckCircle2 size={16} />}
              {approvalStatus === 'APPROVED_WITH_EXCEPTIONS' && <AlertTriangle size={16} />}
              {approvalStatus === 'RETURNED_FOR_CLARIFICATION' && <AlertCircle size={16} />}
              {(approvalStatus || 'DRAFT').replace(/_/g, ' ')}
            </span>
            {approval && (
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Packet Version {approval.versionNumber || approval.packetVersion || 1} | Meeting: {approval.meetingDate || 'Recorded electronically'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {!approval || approval.approvalStatus === 'PENDING_REVIEW' ? (
              <button
                type="button"
                className="committee-btn committee-btn-primary"
                onClick={() => {
                  setIsAmendmentMode(false);
                  setApprovalModalOpen(true);
                }}
                disabled={!canRecord}
                title={!canRecord ? 'Read-only access: decision recording restricted' : 'Record committee approval'}
              >
                Record Committee Approval
              </button>
            ) : (
              <button
                type="button"
                className="committee-btn committee-btn-secondary"
                onClick={() => {
                  setIsAmendmentMode(true);
                  setApprovalModalOpen(true);
                }}
                disabled={!canRecord}
                title={!canRecord ? 'Read-only access: amendment creation restricted' : 'Create amendment'}
              >
                Create Amendment
              </button>
            )}
          </div>
        </div>

        {/* Member Voting Results Stack */}
        {approval && decisions.length > 0 ? (
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', marginBottom: '10px' }}>
              Recorded Committee Ratification ({approval.approvalCount ?? approval.actualApprovalCount ?? 0} of {approval.eligibleMemberCount ?? 0} Approved)
            </h4>
            <div className="ratification-members-grid">
              {decisions.map(d => (
                <div key={d.decisionId} className="ratification-member-pill">
                  <div className="member-pill-top">
                    <span className="member-pill-name">{d.memberNameSnapshot}</span>
                    <span className="member-pill-role">{d.memberRoleSnapshot}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span
                      className="member-pill-decision"
                      style={{
                        color: d.decision.includes('APPROVED') ? '#15803d' : d.decision === 'ABSTAINED' ? '#64748b' : '#b91c1c'
                      }}
                    >
                      {d.decision.replace(/_/g, ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{d.approvalMethod}</span>
                  </div>
                  {d.comment && (
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                      "{d.comment}"
                    </span>
                  )}
                </div>
              ))}
            </div>

            {approval.generalComments && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.85rem', color: '#475569' }}>
                <strong>Board Notes:</strong> {approval.generalComments}
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            No committee approval recorded for {periodKey} yet. Review the expenses below and click "Record Committee Approval".
          </div>
        )}
      </div>

      {/* Detailed Expense Schedule */}
      <div className="expense-schedule-card">
        <div className="schedule-header">
          <div>
            <h3 className="schedule-title">Recognized Expense Schedule</h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Canonical ledger expenses for {periodKey} submitted for board ratification.
            </span>
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
            {summary.expenseCount} Records (${summary.totalRecognizedExpenses.toFixed(2)})
          </span>
        </div>

        {/* Desktop Table */}
        <div className="schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Payee / Merchant</th>
                <th>Category</th>
                <th>Purpose / Description</th>
                <th>Payment Method</th>
                <th>Evidence Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(packetData?.expenses || []).map((e, idx) => (
                <tr key={e.transactionId || e.id || `exp-row-${idx}`}>
                  <td>{e.date}</td>
                  <td style={{ fontWeight: 600 }}>{e.payeeOrPayer || e.payee}</td>
                  <td>{e.category}</td>
                  <td>{e.description}</td>
                  <td style={{ fontSize: '0.8rem', color: '#64748b' }}>{e.paymentMethod || '—'}</td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: e.receiptStatus === 'ATTACHED' ? '#ecfdf5' : e.receiptStatus === 'NOT_REQUIRED' ? '#f1f5f9' : '#fef2f2',
                        color: e.receiptStatus === 'ATTACHED' ? '#15803d' : e.receiptStatus === 'NOT_REQUIRED' ? '#64748b' : '#b91c1c'
                      }}
                    >
                      {e.receiptStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>
                    ${(e.amount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {(!packetData?.expenses || packetData.expenses.length === 0) && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                    No recognized expenses found for period {periodKey}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards Stack */}
        <div className="mobile-schedule-cards">
          {(packetData?.expenses || []).map((e, idx) => (
            <div key={e.transactionId || e.id || `exp-card-${idx}`} className="mobile-expense-card">
              <div className="mobile-card-top">
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{e.payeeOrPayer || e.payee}</span>
                <span className="mobile-card-amount">${(e.amount || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#64748b' }}>
                <span>{e.date} • {e.category}</span>
                <span>{e.receiptStatus}</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569' }}>{e.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History Timeline Accordion */}
      {history.length > 1 && (
        <div className="approval-history-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} color="#2563eb" />
            Committee Ratification History ({history.length} versions)
          </h3>
          <div>
            {history.map((h, idx) => (
              <div key={h.approvalId} className="history-item-row">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Version {h.packetVersion} ({h.status})</strong>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.meetingDate}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: '2px' }}>
                  Approved Expenses: ${Number(h.totalRecognizedExpenses).toFixed(2)} ({h.actualApprovalCount} of {h.eligibleMemberCount} approvers)
                </div>
                {h.amendmentReason && (
                  <p style={{ fontSize: '0.8rem', color: '#b91c1c', fontStyle: 'italic', margin: '4px 0 0 0' }}>
                    Amendment Reason: {h.amendmentReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordApprovalModal
        isOpen={approvalModalOpen}
        onClose={() => setApprovalModalOpen(false)}
        periodKey={periodKey}
        members={members}
        isAmendment={isAmendmentMode}
        onSuccess={loadData}
        currentUserRole={userRole}
      />

      <CommitteeMembersModal
        isOpen={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
        members={members}
        onRefresh={loadData}
      />
    </div>
  );
}
