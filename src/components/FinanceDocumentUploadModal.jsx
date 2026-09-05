import React, { useState } from 'react';
import { X, Upload, FileText, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { documentApi } from '../api/documentApi';

export const FinanceDocumentUploadModal = ({
  isOpen,
  onClose,
  entityType = 'Transaction', // 'Transaction' | 'Reimbursement' | 'Capital Project' | 'Check'
  entityId = '',
  transactionId,
  reimbursementId,
  capitalProjectId,
  checkId,
  defaultDocumentType = 'Receipt',
  defaultTitle = '',
  documentDate = new Date().toISOString().split('T')[0],
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [documentType, setDocumentType] = useState(defaultDocumentType);
  const [title, setTitle] = useState(defaultTitle || `${entityType} Evidence ${entityId || transactionId || reimbursementId || ''}`.trim());
  const [dateStr, setDateStr] = useState(documentDate);
  const [postCloseReason, setPostCloseReason] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [postCloseRequired, setPostCloseRequired] = useState(false);

  if (!isOpen) return null;

  const effectiveTxnId = (transactionId ? String(transactionId).trim() : '') || (entityType === 'Transaction' || entityType === 'TRANSACTION' ? String(entityId || '').trim() : undefined);
  const effectiveRmbId = (reimbursementId ? String(reimbursementId).trim() : '') || (entityType === 'Reimbursement' || entityType === 'REIMBURSEMENT' ? String(entityId || '').trim() : undefined);
  const effectiveCapId = (capitalProjectId ? String(capitalProjectId).trim() : '') || (entityType === 'Capital Project' || entityType === 'CAPITAL_PROJECT' ? String(entityId || '').trim() : undefined);
  const effectiveCheckId = (checkId ? String(checkId).trim() : '') || (entityType === 'Check' || entityType === 'CHECK' ? String(entityId || '').trim() : undefined);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15MB maximum allowed limit.');
      return;
    }

    setSelectedFile(file);
    setError(null);
    setDuplicateWarning(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result || '').split(',')[1] || '';
      setFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e, allowDup = false) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedFile && !allowDup) {
      setError('Please select a file to attach.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a document title.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const normEntityType = entityType ? entityType.toUpperCase().replace(/\s+/g, '_') : 'NONE';
      const relTxnId = effectiveTxnId || undefined;
      const relRmbId = effectiveRmbId || undefined;
      const relCapId = effectiveCapId || undefined;
      const relChkId = effectiveCheckId || undefined;
      const relEntId = (entityId ? String(entityId).trim() : '') || relTxnId || relRmbId || relCapId || relChkId || undefined;

      const payload = {
        fileBase64: fileBase64,
        originalFileName: selectedFile ? selectedFile.name : undefined,
        mimeType: selectedFile ? selectedFile.type : 'application/pdf',
        fileSize: selectedFile ? selectedFile.size : 0,
        documentType: documentType,
        title: title.trim(),
        documentDate: dateStr,
        relatedEntityType: normEntityType,
        relatedEntityId: relEntId,
        relatedTransactionId: relTxnId,
        relatedReimbursementId: relRmbId,
        relatedCapitalProjectId: relCapId,
        relatedCheckId: relChkId,
        postCloseReason: postCloseReason.trim() || undefined,
        notes: notes.trim() || undefined,
        allowDuplicate: allowDup
      };

      const res = await documentApi.uploadDocument(payload);

      if (res.duplicateDetected && !allowDup) {
        setDuplicateWarning(res);
        setLoading(false);
        return;
      }

      if (res.success) {
        if (onSuccess) onSuccess(res);
        handleClose();
      } else {
        setError(res.message || res.error || 'Failed to upload document.');
      }
    } catch (err) {
      const msg = err?.message || String(err);
      if (msg.includes('CLOSED') && msg.includes('postCloseReason')) {
        setPostCloseRequired(true);
        setError('Target period is closed. Please provide an authorized post-close reason below.');
      } else {
        setError(msg || 'An unexpected error occurred during upload.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setFileBase64('');
    setError(null);
    setDuplicateWarning(null);
    setPostCloseRequired(false);
    setPostCloseReason('');
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: '16px'
      }}
    >
      <div
        className="modal-container"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            background: 'var(--navy-dark, #0f172a)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} style={{ color: '#38bdf8' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc' }}>
              Attach Evidence for {entityType}
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}
            >
              <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          {duplicateWarning && (
            <div
              style={{
                marginBottom: '16px',
                padding: '14px',
                borderRadius: '8px',
                background: '#fffbebeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                fontSize: '0.85rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, marginBottom: '6px' }}>
                <ShieldAlert size={16} style={{ color: '#d97706' }} />
                <span>Duplicate Document Detected</span>
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', lineHeight: 1.4 }}>
                {duplicateWarning.message || 'A file with matching content already exists in Document Register.'}
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-warning btn-sm"
                  onClick={(e) => handleSubmit(e, true)}
                  disabled={loading}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    background: '#d97706',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Proceed Anyway
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setDuplicateWarning(null)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={(e) => handleSubmit(e, false)}>
            {/* Auto-Linked Record Notice */}
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 12px',
                background: '#f1f5f9',
                borderRadius: '8px',
                fontSize: '0.82rem',
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <CheckCircle size={14} style={{ color: '#0284c7' }} />
              <span>
                Linking automatically to <strong>{entityType}</strong>:{' '}
                <code>{entityId || effectiveTxnId || effectiveRmbId || effectiveCapId || effectiveCheckId || 'Selected Record'}</code>
              </span>
            </div>

            {/* File Selection */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="fileInput" style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Select File <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                id="fileInput"
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                style={{
                  display: 'block',
                  width: '100%',
                  fontSize: '0.85rem',
                  padding: '8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  background: '#fafafa'
                }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Supported: PDF, PNG, JPG, JPEG (Max 15MB)
              </span>
            </div>

            {/* Document Type & Title */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Document Type
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="Receipt">Receipt</option>
                  <option value="Invoice">Invoice</option>
                  <option value="Reimbursement Evidence">Reimbursement Evidence</option>
                  <option value="Check">Check</option>
                  <option value="Bank Statement">Bank Statement</option>
                  <option value="Credit Card Statement">Credit Card Statement</option>
                  <option value="Other Supporting Document">Other Supporting Document</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Document Date
                </label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Document Title */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Home Depot Paint Supplies"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Post-Close Reason (If required or flagged) */}
            {postCloseRequired && (
              <div style={{ marginBottom: '14px', padding: '10px 12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#92400e', marginBottom: '4px' }}>
                  Post-Close Authorization Reason <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <textarea
                  value={postCloseReason}
                  onChange={(e) => setPostCloseReason(e.target.value)}
                  placeholder="State authorized reason for adding evidence to a closed accounting period..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid #f59e0b',
                    fontSize: '0.82rem'
                  }}
                />
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Item breakdown or audit notes..."
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedFile}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: loading || !selectedFile ? '#94a3b8' : 'var(--navy-dark, #0f172a)',
                  color: '#fff',
                  cursor: loading || !selectedFile ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {loading ? 'Uploading...' : 'Save & Register Document'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FinanceDocumentUploadModal;
