import React from 'react';
import { FileText, ExternalLink, Link as LinkIcon, AlertCircle, Paperclip } from 'lucide-react';

export const DocumentLinkBadge = ({
  documentId,
  driveUrl,
  documentType = 'Document',
  title,
  status,
  evidenceCount,
  onAttachClick,
  onViewClick,
  compact = false,
  attachLabel = 'Attach Receipt'
}) => {
  if (evidenceCount !== undefined && evidenceCount > 0) {
    return (
      <button
        type="button"
        onClick={onViewClick || onAttachClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: compact ? '2px 8px' : '4px 10px',
          fontSize: compact ? '0.75rem' : '0.8rem',
          borderRadius: '12px',
          background: '#e0f2fe',
          border: '1px solid #7dd3fc',
          color: '#0369a1',
          fontWeight: 600,
          cursor: 'pointer'
        }}
        title="View attached evidence documents"
      >
        <Paperclip size={12} style={{ color: '#0284c7' }} />
        <span>{evidenceCount === 1 ? 'Evidence (1)' : `Evidence (${evidenceCount})`}</span>
      </button>
    );
  }

  if (!driveUrl && !documentId) {
    return (
      <button
        type="button"
        className="btn btn-outline"
        onClick={onAttachClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: compact ? '2px 8px' : '4px 10px',
          fontSize: compact ? '0.75rem' : '0.8rem',
          borderRadius: '12px',
          color: 'var(--slate-blue)',
          borderColor: 'var(--mist-blue-dark)',
          background: '#fff',
          cursor: 'pointer'
        }}
        title="Attach supporting document evidence"
      >
        <LinkIcon size={12} />
        <span>{attachLabel}</span>
      </button>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: compact ? '2px 8px' : '4px 10px',
        borderRadius: '12px',
        background: status === 'Needs Review' ? '#fef3c7' : 'var(--mist-blue, #f1f5f9)',
        border: '1px solid ' + (status === 'Needs Review' ? '#f59e0b' : 'var(--mist-blue-dark, #cbd5e1)'),
        fontSize: compact ? '0.75rem' : '0.82rem',
        color: status === 'Needs Review' ? '#b45309' : 'var(--slate-blue-dark, #1e293b)'
      }}
    >
      <FileText size={13} style={{ color: 'var(--slate-blue)' }} />
      <span
        onClick={onViewClick}
        style={{
          fontWeight: 600,
          maxWidth: compact ? '110px' : '180px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          cursor: onViewClick ? 'pointer' : 'default'
        }}
      >
        {title || documentType || documentId}
      </span>
      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            color: 'var(--slate-blue)',
            padding: '2px',
            borderRadius: '4px',
            textDecoration: 'none'
          }}
          title="Open in Google Drive"
          aria-label="Open in Google Drive"
        >
          <ExternalLink size={12} />
        </a>
      )}
      {status === 'Needs Review' && (
        <AlertCircle size={12} style={{ color: '#d97706' }} title="Flagged: Needs Review" />
      )}
    </div>
  );
};

export default DocumentLinkBadge;
