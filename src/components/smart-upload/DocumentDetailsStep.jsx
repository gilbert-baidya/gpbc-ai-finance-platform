/*************************************************
 * GPBC Finance Desk — DocumentDetailsStep.jsx
 * Step B & C: Document Type & Details Confirmation
 *************************************************/

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Info, Lock } from 'lucide-react';

const DOCUMENT_TYPES = [
  { value: 'Receipt', label: 'Receipt' },
  { value: 'Invoice', label: 'Invoice' },
  { value: 'Check', label: 'Check' },
  { value: 'Reimbursement Proof', label: 'Reimbursement Proof' },
  { value: 'Capital Project Document', label: 'Capital Project Document' },
  { value: 'Refund / Credit', label: 'Refund / Credit' },
  { value: 'Offering / Income Evidence', label: 'Offering / Income Evidence' },
  { value: 'Bank Statement', label: 'Bank Statement' },
  { value: 'Other', label: 'Other' }
];

export const DocumentDetailsStep = ({
  formData,
  onChange,
  capitalProjects = [],
  isPeriodClosed = false
}) => {
  const [derivedPeriod, setDerivedPeriod] = useState('');

  // Auto-derive finance period from document date (e.g. 2026-08-12 -> 2026-08)
  useEffect(() => {
    if (formData.documentDate && formData.documentDate.length >= 7) {
      const pKey = formData.documentDate.substring(0, 7);
      setDerivedPeriod(pKey);
      if (!formData.financePeriod) {
        onChange('financePeriod', pKey);
      }
    }
  }, [formData.documentDate]);

  const isRefundCredit = formData.documentType === 'Refund / Credit';
  const isBankStatement = formData.documentType === 'Bank Statement';
  const isCapitalProjectDoc = formData.documentType === 'Capital Project Document';

  return (
    <div className="document-details-step">
      {/* Closed Period Alert */}
      {isPeriodClosed && (
        <div className="alert-box alert-warning">
          <Lock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Period is Closed</div>
            <div>
              This period is closed. The document will be stored as supporting evidence without changing closed accounting records. An authorized reason is required.
            </div>
          </div>
        </div>
      )}

      {/* Refund / Credit Special Guard */}
      {isRefundCredit && (
        <div className="alert-box alert-info">
          <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Reimbursement Obligation Notice:</strong> A refund or card credit reduces the purchase obligation. It must NOT be recorded as church donation income.
          </div>
        </div>
      )}

      {/* Bank Statement Notice */}
      {isBankStatement && (
        <div className="alert-box alert-info">
          <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            Bank statements are stored securely in Document Center for audit and reconciliation evidence. Smart Upload will not automatically match line items in Phase 1.
          </div>
        </div>
      )}

      <div className="form-row-2col">
        {/* Document Type */}
        <div className="form-group">
          <label className="form-label" htmlFor="docTypeSelect">Document Type *</label>
          <select
            id="docTypeSelect"
            className="form-control"
            value={formData.documentType}
            onChange={(e) => onChange('documentType', e.target.value)}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor / Payee */}
        <div className="form-group">
          <label className="form-label" htmlFor="vendorInput">
            {formData.documentType === 'Offering / Income Evidence' ? 'Donor / Source' : 'Vendor / Payee'}
          </label>
          <input
            id="vendorInput"
            type="text"
            className="form-control"
            placeholder="e.g. Walmart, Home Depot, Edison"
            value={formData.vendor || ''}
            onChange={(e) => onChange('vendor', e.target.value)}
          />
        </div>
      </div>

      <div className="form-row-2col">
        {/* Document Date */}
        <div className="form-group">
          <label className="form-label" htmlFor="dateInput">Document Date *</label>
          <input
            id="dateInput"
            type="date"
            className="form-control"
            value={formData.documentDate || ''}
            onChange={(e) => onChange('documentDate', e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label" htmlFor="amountInput">
            Amount ($) {isBankStatement ? '(Optional)' : '*'}
          </label>
          <input
            id="amountInput"
            type="number"
            step="0.01"
            min="0"
            className="form-control"
            placeholder="0.00"
            value={formData.amount != null ? formData.amount : ''}
            onChange={(e) => onChange('amount', e.target.value ? parseFloat(e.target.value) : null)}
          />
        </div>
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label" htmlFor="descInput">Description *</label>
        <input
          id="descInput"
          type="text"
          className="form-control"
          placeholder="Brief description of what was purchased or documented"
          value={formData.description || ''}
          onChange={(e) => onChange('description', e.target.value)}
        />
      </div>

      <div className="form-row-2col">
        {/* Finance Period */}
        <div className="form-group">
          <label className="form-label" htmlFor="periodInput">Finance Period</label>
          <input
            id="periodInput"
            type="text"
            className="form-control"
            placeholder="YYYY-MM"
            value={formData.financePeriod || derivedPeriod}
            onChange={(e) => onChange('financePeriod', e.target.value)}
          />
        </div>

        {/* Capital Project (Optional) */}
        <div className="form-group">
          <label className="form-label" htmlFor="projSelect">
            Capital Project {isCapitalProjectDoc ? '*' : '(Optional)'}
          </label>
          <select
            id="projSelect"
            className="form-control"
            value={formData.capitalProjectId || ''}
            onChange={(e) => onChange('capitalProjectId', e.target.value)}
          >
            <option value="">None / General Fund</option>
            {capitalProjects.map((p) => (
              <option key={p.projectId || p.id} value={p.projectId || p.id}>
                {p.projectName || p.name || p.projectId || p.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Post-Close Reason (Required if period closed) */}
      {isPeriodClosed && (
        <div className="form-group">
          <label className="form-label" htmlFor="postCloseReasonInput">
            Post-Close Reason *
          </label>
          <input
            id="postCloseReasonInput"
            type="text"
            className="form-control"
            placeholder="Documented reason for post-close evidence submission"
            value={formData.postCloseReason || ''}
            onChange={(e) => onChange('postCloseReason', e.target.value)}
            required
          />
        </div>
      )}

      {/* Notes */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" htmlFor="notesInput">Notes (Optional)</label>
        <textarea
          id="notesInput"
          className="form-control"
          rows={2}
          placeholder="Additional context or internal notes..."
          value={formData.notes || ''}
          onChange={(e) => onChange('notes', e.target.value)}
        />
      </div>
    </div>
  );
};

export default DocumentDetailsStep;
