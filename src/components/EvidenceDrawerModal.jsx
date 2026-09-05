import React, { useState, useEffect, useCallback } from 'react';
import { X, FileText, ExternalLink, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import { documentApi } from '../api/documentApi';
import { FinanceDocumentUploadModal } from './FinanceDocumentUploadModal';

export const EvidenceDrawerModal = ({
  isOpen,
  onClose,
  entityType = 'Transaction',
  entityId = '',
  recordTitle = '',
  transactionId,
  reimbursementId,
  capitalProjectId,
  checkId,
  defaultDocumentType = 'Receipt',
  canEdit = true,
  onDocumentsChange
}) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const effectiveTxnId = transactionId || (entityType === 'Transaction' ? entityId : undefined);
  const effectiveRmbId = reimbursementId || (entityType === 'Reimbursement' ? entityId : undefined);

  const loadEvidence = useCallback(async () => {
    if (!entityId && !effectiveTxnId && !effectiveRmbId) return;

    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (effectiveTxnId) {
        params.relatedTransactionId = effectiveTxnId;
      } else if (effectiveRmbId) {
        params.relatedEntityType = 'REIMBURSEMENT';
        params.relatedEntityId = effectiveRmbId;
      } else {
        params.relatedEntityType = entityType ? entityType.toUpperCase().replace(/\s+/g, '_') : undefined;
        params.relatedEntityId = entityId;
      }

      const res = await documentApi.getDocuments(params);
      if (res.success && Array.isArray(res.documents)) {
        setDocuments(res.documents);
        if (onDocumentsChange) onDocumentsChange(res.documents);
      } else {
        setDocuments([]);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load evidence documents');
    } finally {
      setLoading(false);
    }
  }, [entityId, effectiveTxnId, effectiveRmbId, entityType, onDocumentsChange]);

  useEffect(() => {
    if (isOpen) {
      loadEvidence();
    }
  }, [isOpen, loadEvidence]);

  if (!isOpen) return null;

  return (
    <>
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
          zIndex: 1050,
          padding: '16px'
        }}
      >
        <div
          className="modal-container"
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '560px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '85vh'
          }}
        >
          {/* Header */}
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
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc' }}>
                Evidence for {entityType}: <code>{entityId || effectiveTxnId || effectiveRmbId}</code>
              </h3>
              {recordTitle && (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
                  {recordTitle}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
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

          {/* Body */}
          <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
            {error && (
              <div
                style={{
                  marginBottom: '14px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#991b1b',
                  fontSize: '0.82rem'
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Attached Documents ({documents.length})
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={loadEvidence}
                  disabled={loading}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '0.78rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={12} className={loading ? 'spin' : ''} />
                  <span>Refresh</span>
                </button>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      background: 'var(--navy-dark, #0f172a)',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={13} />
                    <span>Attach Evidence</span>
                  </button>
                )}
              </div>
            </div>

            {/* Document List */}
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                Loading attached evidence...
              </div>
            ) : documents.length === 0 ? (
              <div
                style={{
                  padding: '28px 16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px dashed #cbd5e1'
                }}
              >
                <FileText size={28} style={{ color: '#94a3b8', marginBottom: '8px' }} />
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  No evidence attached yet
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: '14px' }}>
                  Attach a receipt, invoice, or supporting document for audit trail compliance.
                </div>
                {canEdit && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowUploadModal(true)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '0.8rem',
                      borderRadius: '6px'
                    }}
                  >
                    Attach First Receipt
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.documentId}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1, minWidth: 0 }}>
                      <FileText size={18} style={{ color: '#0284c7', marginTop: '2px', flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                          <span>{doc.documentType}</span> • <span>{doc.documentDate}</span> • <code>{doc.documentId}</code>
                        </div>
                        {doc.isPostCloseAddition && (
                          <div style={{ fontSize: '0.72rem', color: '#b45309', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={11} />
                            <span>Post-Close: {doc.postCloseReason || 'Audit addition'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '10px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: doc.status === 'Needs Review' ? '#fef3c7' : '#e0f2fe',
                          color: doc.status === 'Needs Review' ? '#b45309' : '#0369a1'
                        }}
                      >
                        {doc.status}
                      </span>
                      {doc.driveFileUrl && (
                        <a
                          href={doc.driveFileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 8px',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#0f172a',
                            textDecoration: 'none',
                            fontWeight: 500
                          }}
                          title="Open document in Google Drive"
                        >
                          <span>Drive</span>
                          <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <FinanceDocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        entityType={entityType}
        entityId={effectiveTxnId || effectiveRmbId || entityId}
        transactionId={effectiveTxnId}
        reimbursementId={effectiveRmbId}
        capitalProjectId={capitalProjectId}
        checkId={checkId}
        defaultDocumentType={defaultDocumentType}
        defaultTitle={recordTitle ? `${recordTitle} Receipt` : ''}
        onSuccess={() => {
          setShowUploadModal(false);
          loadEvidence();
        }}
      />
    </>
  );
};

export default EvidenceDrawerModal;
