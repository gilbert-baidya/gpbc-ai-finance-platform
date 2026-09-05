/*************************************************
 * GPBC Finance Desk — ConfirmLinkStep.jsx
 * Step E: Final Review & Confirmation Screen
 * Transactional linking with error recovery
 *************************************************/

import React from 'react';
import { CheckCircle2, FileText, Link, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

export const ConfirmLinkStep = ({
  formData,
  selectedFile,
  filePreviewUrl,
  selectedMatch,
  isSubmitting,
  error,
  partialSuccessDocId,
  onRetryLink,
  writesEnabled = true
}) => {
  const targetCandidate = selectedMatch?.candidate;

  return (
    <div className="confirm-link-step">
      {writesEnabled === false && (
        <div className="alert-box alert-warning" role="alert" style={{ marginBottom: '16px' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Controlled Release Mode</div>
            <div>Smart Upload is ready, but document saving is temporarily disabled during the controlled production release.</div>
          </div>
        </div>
      )}
      {error && (
        <div className="alert-box alert-error">
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: '2px' }}>Upload / Link Error</div>
            <div>{error}</div>
            {partialSuccessDocId && onRetryLink && (
              <div style={{ marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={onRetryLink}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} />
                  <span>Retry Linking Document {partialSuccessDocId}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
          Confirm Document & Relationship
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
          Review the details below. Once confirmed, the file will be stored in Google Drive and registered in the Document Center.
        </div>
      </div>

      {/* Summary Box */}
      <div
        style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          {filePreviewUrl ? (
            <img
              src={filePreviewUrl}
              alt="Thumbnail"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '8px',
                objectFit: 'cover',
                border: '1px solid #cbd5e1'
              }}
            />
          ) : (
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '8px',
                background: '#e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={28} color="#64748b" />
            </div>
          )}

          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
              {formData.vendor ? `${formData.vendor} - ` : ''}
              {formData.description || formData.documentType}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
              File: {selectedFile?.name} ({(selectedFile ? selectedFile.size / 1024 : 0).toFixed(1)} KB)
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.8rem', color: '#334155' }}>
              <div>
                <strong>Type:</strong> {formData.documentType}
              </div>
              <div>
                <strong>Date:</strong> {formData.documentDate}
              </div>
              {formData.amount != null && (
                <div>
                  <strong>Amount:</strong> ${Number(formData.amount).toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Relationship Details */}
        <div
          style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '12px',
            marginTop: '8px'
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>
            Authoritative Relationship
          </div>

          {targetCandidate ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link size={16} color="#059669" />
                <div>
                  <div style={{ fontWeight: 600, color: '#065f46', fontSize: '0.85rem' }}>
                    Linked to {targetCandidate.entityType}: {targetCandidate.displayTitle}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                    Entity ID: {targetCandidate.entityId}
                  </div>
                </div>
              </div>
              <span className="match-badge badge-strong">Linked</span>
            </div>
          ) : (
            <div
              style={{
                padding: '10px 12px',
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#475569'
              }}
            >
              <strong>Document Only:</strong> This document will be saved to the Document Center as an unlinked master record. You can link it to a transaction or expense at any time.
            </div>
          )}
        </div>
      </div>

      {/* Principle Callout */}
      <div
        style={{
          fontSize: '0.75rem',
          color: '#64748b',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          justifyContent: 'center',
          padding: '6px 0'
        }}
      >
        <ShieldCheck size={14} color="#059669" />
        <span>Core Principle: Upload Once • Store Once • Link Everywhere</span>
      </div>
    </div>
  );
};

export default ConfirmLinkStep;
