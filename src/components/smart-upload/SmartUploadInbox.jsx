/*************************************************
 * GPBC Finance Desk — SmartUploadInbox.jsx
 * Smart Upload Inbox Component
 * Strict status semantics & mobile 375px responsive card presentation
 *************************************************/

import React, { useState, useMemo } from 'react';
import {
  Inbox,
  Link2,
  ExternalLink,
  Search,
  FileText,
  Eye,
  RefreshCw
} from 'lucide-react';
import { smartUploadApi } from '../../api/smartUploadApi';

export const SmartUploadInbox = ({
  documents = [],
  loading = false,
  onRefresh,
  onSelectDocumentForLink,
  onViewDocument
}) => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Parse structured metadata from document notes
  const enrichedDocs = useMemo(() => {
    return documents.map((doc) => {
      let vendor = '';
      let amount = null;
      let description = '';
      let isDocOnly = false;

      if (doc.notes && doc.notes.includes('[GPBC_SMART_UPLOAD_META:')) {
        try {
          const match = doc.notes.match(/\[GPBC_SMART_UPLOAD_META:(.*?)\]/);
          if (match && match[1]) {
            const meta = JSON.parse(match[1]);
            vendor = meta.vendor || '';
            amount = meta.amount != null ? Number(meta.amount) : null;
            description = meta.description || '';
            isDocOnly = Boolean(meta.isDocumentOnly || meta.saveOnly);
          }
        } catch {}
      }

      // Count distinct linked records
      let linkedCount = 0;
      if (doc.relatedTransactionId) linkedCount++;
      if (doc.relatedReimbursementId) linkedCount++;
      if (doc.relatedCapitalProjectId) linkedCount++;
      if (doc.relatedCheckId) linkedCount++;
      if (linkedCount === 0 && doc.relatedEntityId && doc.relatedEntityId !== 'NONE') {
        linkedCount = 1;
      }

      return {
        ...doc,
        parsedVendor: vendor || (doc.title?.includes(' - ') ? doc.title.split(' - ')[0] : ''),
        parsedAmount: amount,
        parsedDescription: description || doc.title,
        isDocOnly,
        linkedCount
      };
    });
  }, [documents]);

  const filteredDocs = useMemo(() => {
    return enrichedDocs.filter((doc) => {
      // Authoritative status filter semantics
      if (statusFilter === 'Ready to Link') {
        // UI interpretation: unlinked documents awaiting entity link
        if (doc.status !== 'Unlinked' || doc.isDocOnly) return false;
      } else if (statusFilter === 'Needs Review') {
        // Persisted backend status: Needs Review
        if (doc.status !== 'Needs Review') return false;
      } else if (statusFilter === 'Linked') {
        // Persisted backend status: Linked
        if (doc.status !== 'Linked') return false;
      } else if (statusFilter === 'Document Only') {
        // UI interpretation: unlinked documents explicitly saved as standalone evidence
        if (doc.status !== 'Unlinked' || !doc.isDocOnly) return false;
      } else if (statusFilter === 'Archived') {
        // Persisted backend status: Archived
        if (doc.status !== 'Archived') return false;
      } else {
        // 'ALL': active non-archived documents
        if (doc.status === 'Archived') return false;
      }

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = doc.title?.toLowerCase().includes(q);
        const matchesVendor = doc.parsedVendor?.toLowerCase().includes(q);
        const matchesId = doc.documentId?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVendor && !matchesId) return false;
      }

      return true;
    });
  }, [enrichedDocs, statusFilter, search]);

  return (
    <div className="smart-upload-inbox" style={{ marginTop: '16px' }}>
      {/* Inbox Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Inbox size={20} color="#059669" />
          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
            Smart Upload Inbox ({filteredDocs.length})
          </h4>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px', flexWrap: 'wrap' }}>
            {['ALL', 'Ready to Link', 'Needs Review', 'Linked', 'Document Only', 'Archived'].map((st) => (
              <button
                key={st}
                type="button"
                className="btn btn-sm"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  borderRadius: '6px',
                  border: 'none',
                  textDecoration: 'none',
                  background: statusFilter === st ? '#059669' : 'transparent',
                  color: statusFilter === st ? '#ffffff' : '#64748b'
                }}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Filter inbox..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '6px 10px 6px 28px',
                fontSize: '0.8rem',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                width: '160px'
              }}
            />
          </div>

          {onRefresh && (
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={onRefresh}
              title="Refresh inbox"
              aria-label="Refresh inbox"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredDocs.length === 0 ? (
        <div
          style={{
            padding: '32px',
            textAlign: 'center',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1'
          }}
        >
          <Inbox size={32} color="#94a3b8" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontWeight: 600, color: '#334155' }}>No Documents in Inbox</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            Use the <strong>+ Smart Upload</strong> button to ingest receipts, invoices, and statements.
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card Presentation (shown on <= 640px) */}
          <div className="inbox-mobile-cards">
            {filteredDocs.map((doc) => (
              <div
                key={doc.documentId}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} color="#059669" />
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{doc.title}</span>
                  </div>
                  <span
                    className={`badge ${
                      doc.status === 'Linked'
                        ? 'bg-success text-white'
                        : doc.status === 'Needs Review'
                        ? 'bg-warning text-dark'
                        : 'bg-secondary text-white'
                    }`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {doc.status}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', color: '#475569', margin: '8px 0', flexWrap: 'wrap' }}>
                  <span><strong>Type:</strong> {doc.documentType}</span>
                  {doc.parsedAmount != null && (
                    <span><strong>Amount:</strong> ${doc.parsedAmount.toFixed(2)}</span>
                  )}
                  {doc.documentDate && (
                    <span><strong>Date:</strong> {doc.documentDate}</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {doc.linkedCount > 0 ? (
                      <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Link2 size={13} /> {doc.linkedCount} linked
                      </span>
                    ) : (
                      <span>Unlinked</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {doc.status !== 'Linked' && onSelectDocumentForLink && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        style={{ minHeight: '38px', padding: '6px 12px' }}
                        onClick={() => onSelectDocumentForLink(doc)}
                      >
                        Link
                      </button>
                    )}
                    {onViewDocument && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        style={{ minHeight: '38px', padding: '6px 10px' }}
                        onClick={() => onViewDocument(doc)}
                        aria-label="View document details"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {doc.driveFileUrl && (
                      <a
                        href={doc.driveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-secondary"
                        style={{ minHeight: '38px', padding: '6px 10px', display: 'inline-flex', alignItems: 'center' }}
                        aria-label="Open Drive file"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Presentation (hidden on <= 640px) */}
          <div className="inbox-desktop-table table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
            <table className="table table-hover" style={{ margin: 0, fontSize: '0.85rem' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <tr>
                  <th style={{ padding: '10px 14px' }}>Document</th>
                  <th style={{ padding: '10px 14px' }}>Type</th>
                  <th style={{ padding: '10px 14px' }}>Vendor</th>
                  <th style={{ padding: '10px 14px' }}>Amount</th>
                  <th style={{ padding: '10px 14px' }}>Doc Date</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px' }}>Links</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => (
                  <tr key={doc.documentId} style={{ verticalAlign: 'middle' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#0f172a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="#059669" />
                        <div>
                          <div>{doc.title}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{doc.documentId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span className="badge bg-light text-dark" style={{ border: '1px solid #e2e8f0' }}>
                        {doc.documentType}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#334155' }}>
                      {doc.parsedVendor || '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                      {doc.parsedAmount != null ? `$${doc.parsedAmount.toFixed(2)}` : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>
                      {doc.documentDate || '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span
                        className={`badge ${
                          doc.status === 'Linked'
                            ? 'bg-success text-white'
                            : doc.status === 'Needs Review'
                            ? 'bg-warning text-dark'
                            : 'bg-secondary text-white'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#475569' }}>
                      {doc.linkedCount > 0 ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                          <Link2 size={14} />
                          <span>{doc.linkedCount} linked</span>
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                        {doc.status !== 'Linked' && onSelectDocumentForLink && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => onSelectDocumentForLink(doc)}
                            style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          >
                            Link
                          </button>
                        )}
                        {onViewDocument && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => onViewDocument(doc)}
                            title="View details"
                            aria-label="View details"
                            style={{ padding: '3px 8px' }}
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        {doc.driveFileUrl && (
                          <a
                            href={doc.driveFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-secondary"
                            title="Open Drive file"
                            aria-label="Open Drive file"
                            style={{ padding: '3px 8px' }}
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default SmartUploadInbox;
