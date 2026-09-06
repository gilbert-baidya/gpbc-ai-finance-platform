import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { committeeApi } from '../../api/committeeApi';
import { successToast, errorToast } from '../../utils/toast';
import './RecordApprovalModal.css';

export default function RecordApprovalModal({
  isOpen,
  onClose,
  periodKey,
  members,
  isAmendment = false,
  onSuccess,
  currentUserRole
}) {
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [approvalMethod, setApprovalMethod] = useState('COMMITTEE_MEETING');
  const [meetingMinutesRef, setMeetingMinutesRef] = useState('');
  const [generalComments, setGeneralComments] = useState('');
  const [amendmentReason, setAmendmentReason] = useState('');
  const [approvalRule, setApprovalRule] = useState('MAJORITY_OF_ELIGIBLE_MEMBERS');

  // Member decisions state: { memberId: { decision, comment } }
  const [decisions, setDecisions] = useState({});
  const [overrideApplied, setOverrideApplied] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filter active members eligible for the period
  // Filter active members eligible for the period
  const eligibleMembers = (members || []).filter(m => m.status === 'ACTIVE' || m.isActive === true || m.isActive === 'TRUE');

  useEffect(() => {
    if (isOpen) {
      const init = {};
      eligibleMembers.forEach(m => {
        init[m.memberId] = { decision: 'UNRECORDED', comment: '' };
      });
      setDecisions(init);
      setOverrideApplied(false);
      setOverrideReason('');
      setMeetingMinutesRef('');
      setGeneralComments('');
      setAmendmentReason('');
    }
  }, [isOpen, members]);

  if (!isOpen) return null;

  const handleDecisionChange = (memberId, decision) => {
    setDecisions(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], decision }
    }));
  };

  const handleCommentChange = (memberId, comment) => {
    setDecisions(prev => ({
      ...prev,
      [memberId]: { ...prev[memberId], comment }
    }));
  };

  // Calculate live threshold result
  let approvedCount = 0;
  let exceptionCount = 0;
  let abstainedCount = 0;
  let notPresentCount = 0;
  let returnedCount = 0;
  let unrecordedCount = 0;

  eligibleMembers.forEach(m => {
    const d = decisions[m.memberId]?.decision;
    if (!d || d === 'UNRECORDED') {
      unrecordedCount++;
    } else if (d === 'APPROVED') {
      approvedCount++;
    } else if (d === 'APPROVED_WITH_COMMENT') {
      approvedCount++;
      exceptionCount++;
    } else if (d === 'ABSTAINED') {
      abstainedCount++;
    } else if (d === 'NOT_PRESENT') {
      notPresentCount++;
    } else if (d === 'RETURNED_FOR_CLARIFICATION') {
      returnedCount++;
    } else {
      unrecordedCount++;
    }
  });

  const totalEligible = eligibleMembers.length;
  let requiredCount = Math.floor(totalEligible / 2) + 1;
  let isMet = false;

  if (unrecordedCount === 0) {
    if (approvalRule === 'MAJORITY_OF_ELIGIBLE_MEMBERS') {
      requiredCount = Math.floor(totalEligible / 2) + 1;
      isMet = approvedCount >= requiredCount && returnedCount === 0;
    } else if (approvalRule === 'UNANIMOUS_OF_PRESENT_MEMBERS') {
      const present = totalEligible - notPresentCount;
      requiredCount = present;
      isMet = present > 0 && approvedCount === present && returnedCount === 0;
    } else if (approvalRule === 'MINIMUM_APPROVAL_COUNT') {
      requiredCount = 3;
      isMet = approvedCount >= requiredCount && returnedCount === 0;
    } else {
      requiredCount = Math.floor(totalEligible / 2) + 1;
      isMet = approvedCount >= requiredCount && returnedCount === 0;
    }
  }

  const isPrimaryAdmin = currentUserRole === 'Primary Admin';

  const handleSubmit = async () => {
    const unrecordedMembers = eligibleMembers.filter(m => {
      const d = decisions[m.memberId]?.decision;
      return !d || d === 'UNRECORDED';
    });
    if (unrecordedMembers.length > 0) {
      errorToast(`Please record an explicit decision for all members (${unrecordedMembers.length} unrecorded).`);
      return;
    }

    if (isAmendment && !amendmentReason.trim()) {
      errorToast('Amendment reason is required.');
      return;
    }

    if (!isMet && !overrideApplied) {
      errorToast('Approval rule threshold is not satisfied.');
      return;
    }

    if (overrideApplied && !overrideReason.trim()) {
      errorToast('Override requires an explanation.');
      return;
    }

    setSubmitting(true);
    try {
      const decisionList = eligibleMembers.map(m => {
        const d = decisions[m.memberId]?.decision;
        if (!d || d === 'UNRECORDED') {
          throw new Error(`Decision not recorded for ${m.fullName}`);
        }
        return {
          memberId: m.memberId,
          decision: d,
          comment: decisions[m.memberId]?.comment || '',
          approvalMethod: approvalMethod,
          decisionDate: meetingDate
        };
      });

      if (isAmendment) {
        await committeeApi.createCommitteeApprovalAmendment({
          periodKey,
          amendmentReason,
          approvalMethod,
          meetingDate,
          meetingMinutesRef,
          generalComments,
          approvalRule,
          decisions: decisionList
        });
        successToast('Committee amendment recorded successfully.');
      } else {
        await committeeApi.recordCommitteeApproval({
          periodKey,
          approvalMethod,
          meetingDate,
          meetingMinutesRef,
          generalComments,
          approvalRule,
          decisions: decisionList,
          overrideApplied,
          overrideReason
        });
        successToast('Committee approval recorded successfully.');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      errorToast(err.message || 'Failed to record approval.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="committee-modal-overlay" onClick={onClose}>
      <div className="committee-modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="committee-modal-header">
          <div>
            <h2>{isAmendment ? 'Record Committee Amendment' : 'Record Committee Approval'}</h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Period: {periodKey}</span>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="committee-modal-body">
          {/* Top Form Grid */}
          <div className="committee-form-grid">
            <div className="committee-form-group">
              <label>Meeting / Decision Date *</label>
              <input
                type="date"
                value={meetingDate}
                onChange={e => setMeetingDate(e.target.value)}
              />
            </div>

            <div className="committee-form-group">
              <label>Approval Method *</label>
              <select value={approvalMethod} onChange={e => setApprovalMethod(e.target.value)}>
                <option value="COMMITTEE_MEETING">Committee Meeting</option>
                <option value="EMAIL">Email Ratification</option>
                <option value="SIGNED_PAPER">Signed Paper Resolution</option>
                <option value="DIGITAL_APPROVAL">Digital Approval</option>
                <option value="OTHER">Other Governance Action</option>
              </select>
            </div>

            <div className="committee-form-group">
              <label>Approval Rule *</label>
              <select value={approvalRule} onChange={e => setApprovalRule(e.target.value)}>
                <option value="MAJORITY_OF_ELIGIBLE_MEMBERS">Majority of Eligible Members (50% + 1)</option>
                <option value="UNANIMOUS_OF_PRESENT_MEMBERS">Unanimous of Present Members</option>
                <option value="MINIMUM_APPROVAL_COUNT">Minimum 3 Approvals</option>
                <option value="MANUAL_COMMITTEE_DECISION">Manual Committee Motion</option>
              </select>
            </div>

            <div className="committee-form-group">
              <label>Meeting Minutes Reference</label>
              <input
                type="text"
                placeholder="e.g. Minutes #2026-09-30"
                value={meetingMinutesRef}
                onChange={e => setMeetingMinutesRef(e.target.value)}
              />
            </div>
          </div>

          {isAmendment && (
            <div className="committee-form-group">
              <label style={{ color: '#b91c1c' }}>Amendment Reason *</label>
              <input
                type="text"
                placeholder="Explain what changed and why this amendment is required"
                value={amendmentReason}
                onChange={e => setAmendmentReason(e.target.value)}
                required
              />
            </div>
          )}

          {/* Committee Member Voting Section */}
          <div>
            <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'block' }}>
              Committee Member Ratification ({eligibleMembers.length} active members)
            </label>
            <div className="committee-members-voting-list">
              {eligibleMembers.map(m => {
                const currentDec = decisions[m.memberId]?.decision || 'UNRECORDED';
                const isUnrecorded = currentDec === 'UNRECORDED';
                const currentComment = decisions[m.memberId]?.comment || '';

                return (
                  <div
                    key={m.memberId}
                    className={`committee-member-vote-row ${
                      isUnrecorded
                        ? 'unrecorded'
                        : currentDec === 'APPROVED' || currentDec === 'APPROVED_WITH_COMMENT'
                        ? 'approved'
                        : currentDec === 'ABSTAINED'
                        ? 'abstained'
                        : currentDec === 'RETURNED_FOR_CLARIFICATION'
                        ? 'returned'
                        : ''
                    }`}
                  >
                    <div className="vote-member-header">
                      <div>
                        <span className="vote-member-name">{m.fullName}</span>
                        <span className="vote-member-role" style={{ marginLeft: '8px' }}>{m.roleTitle}</span>
                      </div>
                      {isUnrecorded && (
                        <span className="vote-unrecorded-badge">Decision not recorded</span>
                      )}
                    </div>

                    <div className="vote-options-group">
                      <label className={`vote-pill ${currentDec === 'APPROVED' ? 'selected-approved' : ''}`}>
                        <input
                          type="radio"
                          name={`vote-${m.memberId}`}
                          checked={currentDec === 'APPROVED'}
                          onChange={() => handleDecisionChange(m.memberId, 'APPROVED')}
                          style={{ display: 'none' }}
                        />
                        Approved
                      </label>

                      <label className={`vote-pill ${currentDec === 'APPROVED_WITH_COMMENT' ? 'selected-comment' : ''}`}>
                        <input
                          type="radio"
                          name={`vote-${m.memberId}`}
                          checked={currentDec === 'APPROVED_WITH_COMMENT'}
                          onChange={() => handleDecisionChange(m.memberId, 'APPROVED_WITH_COMMENT')}
                          style={{ display: 'none' }}
                        />
                        Approve w/ Note
                      </label>

                      <label className={`vote-pill ${currentDec === 'ABSTAINED' ? 'selected-abstained' : ''}`}>
                        <input
                          type="radio"
                          name={`vote-${m.memberId}`}
                          checked={currentDec === 'ABSTAINED'}
                          onChange={() => handleDecisionChange(m.memberId, 'ABSTAINED')}
                          style={{ display: 'none' }}
                        />
                        Abstained
                      </label>

                      <label className={`vote-pill ${currentDec === 'NOT_PRESENT' ? 'selected-not-present' : ''}`}>
                        <input
                          type="radio"
                          name={`vote-${m.memberId}`}
                          checked={currentDec === 'NOT_PRESENT'}
                          onChange={() => handleDecisionChange(m.memberId, 'NOT_PRESENT')}
                          style={{ display: 'none' }}
                        />
                        Not Present
                      </label>

                      <label className={`vote-pill ${currentDec === 'RETURNED_FOR_CLARIFICATION' ? 'selected-returned' : ''}`}>
                        <input
                          type="radio"
                          name={`vote-${m.memberId}`}
                          checked={currentDec === 'RETURNED_FOR_CLARIFICATION'}
                          onChange={() => handleDecisionChange(m.memberId, 'RETURNED_FOR_CLARIFICATION')}
                          style={{ display: 'none' }}
                        />
                        Return
                      </label>
                    </div>

                    {(currentDec === 'APPROVED_WITH_COMMENT' || currentDec === 'RETURNED_FOR_CLARIFICATION') && (
                      <input
                        type="text"
                        placeholder={currentDec === 'APPROVED_WITH_COMMENT' ? 'Note / exception details...' : 'Reason for return...'}
                        value={currentComment}
                        onChange={e => handleCommentChange(m.memberId, e.target.value)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem'
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Threshold Status Banner */}
          <div className={`committee-threshold-banner ${unrecordedCount > 0 ? 'unrecorded' : returnedCount > 0 ? 'returned' : isMet ? 'met' : 'not-met'}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {unrecordedCount > 0 ? <AlertCircle size={18} /> : returnedCount > 0 ? <AlertCircle size={18} /> : isMet ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <div>
                <strong>
                  {unrecordedCount > 0
                    ? `Decisions Pending (${unrecordedCount} unrecorded)`
                    : returnedCount > 0
                    ? 'Returned for Clarification'
                    : isMet
                    ? (exceptionCount > 0 ? 'Rule Satisfied — Approved with Exceptions' : 'Rule Satisfied — Approved')
                    : 'Rule Threshold Not Met'}
                </strong>
                <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                  {unrecordedCount > 0
                    ? `${unrecordedCount} member(s) have no decision recorded. Please explicitly choose each member's decision.`
                    : `${approvedCount} of ${totalEligible} members approving (Required: ${requiredCount}).${returnedCount > 0 ? ` ${returnedCount} member(s) requested clarification.` : ''}`}
                </div>
              </div>
            </div>
          </div>

          {/* Primary Admin Override Option */}
          {!isMet && isPrimaryAdmin && (
            <div className="committee-override-box">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: '#9a3412', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={overrideApplied}
                  onChange={e => setOverrideApplied(e.target.checked)}
                />
                Primary Admin Override (Record approval with administrative exception)
              </label>
              {overrideApplied && (
                <input
                  type="text"
                  placeholder="Mandatory reason for administrative override *"
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '4px',
                    border: '1px solid #f97316',
                    fontSize: '0.85rem'
                  }}
                  required
                />
              )}
            </div>
          )}

          {/* General Comments */}
          <div className="committee-form-group">
            <label>General Committee Comments / Board Action Notes</label>
            <textarea
              rows={2}
              placeholder="Optional summary of committee discussion, conditions, or follow-ups..."
              value={generalComments}
              onChange={e => setGeneralComments(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="committee-modal-footer">
          <button type="button" className="committee-btn committee-btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className="committee-btn committee-btn-primary"
            onClick={handleSubmit}
            disabled={submitting || unrecordedCount > 0 || (!isMet && !overrideApplied)}
          >
            {submitting ? 'Saving...' : isAmendment ? 'Ratify Amendment' : 'Record Approval'}
          </button>
        </div>
      </div>
    </div>
  );
}
