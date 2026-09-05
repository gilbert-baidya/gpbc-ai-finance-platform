/*************************************************
 * GPBC Finance Desk — DocumentCenter.jsx
 * Canonical Financial Evidence Center & Metadata Registry
 *************************************************/

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  Upload,
  Search,
  RefreshCw,
  ExternalLink,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Receipt,
  FileSpreadsheet,
  CheckSquare,
  Landmark,
  CreditCard,
  FolderGit2,
  X,
  Eye,
  Edit2,
  Plus,
  ShieldAlert,
  Archive,
  Inbox
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/PeriodContext';
import { documentApi } from '../api/documentApi';
import FinanceDataState from '../components/FinanceDataState';
import SmartUploadInbox from '../components/smart-upload/SmartUploadInbox';
import SmartUploadModal from '../components/smart-upload/SmartUploadModal';
import './DocumentCenter.css';

const DOCUMENT_CATEGORIES = [
  { id: 'ALL', label: 'All Documents', icon: FileText },
  { id: 'Receipt', label: 'Receipts', icon: Receipt },
  { id: 'Invoice', label: 'Invoices', icon: FileCheck },
  { id: 'Check', label: 'Checks', icon: CheckSquare },
  { id: 'Reimbursement Evidence', label: 'Reimbursements', icon: CreditCard },
  { id: 'Bank Statement', label: 'Bank Statements', icon: Landmark },
  { id: 'Credit Card Statement', label: 'Card Statements', icon: CreditCard },
  { id: 'Capital Project', label: 'Capital Projects', icon: FolderGit2 },
  { id: 'Finance Report', label: 'Reports', icon: FileSpreadsheet },
  { id: 'Other Supporting Document', label: 'Other', icon: FileText }
];

const STATUS_FILTERS = ['ALL', 'Linked', 'Unlinked', 'Needs Review', 'Archived'];

export const DocumentCenter = () => {
  const { user } = useAuth();
  const { year, month, periodLabel } = usePeriod();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataAvailable, setDataAvailable] = useState(false);
  const [activeView, setActiveView] = useState('register'); // 'register' | 'inbox'

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [filterPeriodOnly, setFilterPeriodOnly] = useState(true);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSubmitting, setUploadSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadDuplicate, setUploadDuplicate] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');

  const [uploadForm, setUploadForm] = useState({
    documentType: 'Receipt',
    title: '',
    documentDate: new Date().toISOString().split('T')[0],
    relatedEntityType: 'TRANSACTION',
    relatedEntityId: '',
    postCloseReason: '',
    notes: ''
  });

  // Link Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedDocForLink, setSelectedDocForLink] = useState(null);
  const [linkForm, setLinkForm] = useState({
    relatedEntityType: 'TRANSACTION',
    relatedEntityId: '',
    postCloseReason: ''
  });
  const [linkSubmitting, setLinkSubmitting] = useState(false);

  // View / Detail Modal State
  const [viewingDoc, setViewingDoc] = useState(null);

  const canUpload = user?.role === 'Primary Admin' || user?.role === 'Backup Admin' || user?.role === 'Finance Editor';

  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterPeriodOnly) {
        params.financeYear = year;
        params.financeMonth = month;
      }
      if (selectedCategory !== 'ALL') {
        params.documentType = selectedCategory;
      }
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await documentApi.getDocuments(params);
      if (res.success && Array.isArray(res.documents)) {
        setDocuments(res.documents);
        setDataAvailable(true);
      } else {
        setDocuments([]);
        setDataAvailable(false);
      }
    } catch (err) {
      setError(err?.message || 'Failed to load document register');
      setDocuments([]);
      setDataAvailable(false);
    } finally {
      setLoading(false);
    }
  }, [filterPeriodOnly, year, month, selectedCategory, selectedStatus, search]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Handle File Selection and Base64 conversion
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File exceeds the 15MB size limit.');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setUploadDuplicate(null);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result || '').split(',')[1] || '';
      setFileBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e, overrideDuplicate = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedFile && !overrideDuplicate) {
      setUploadError('Please select a file to upload.');
      return;
    }

    try {
      setUploadSubmitting(true);
      setUploadError(null);

      const payload = {
        fileBase64: fileBase64,
        originalFileName: selectedFile ? selectedFile.name : undefined,
        mimeType: selectedFile ? selectedFile.type : 'application/pdf',
        fileSize: selectedFile ? selectedFile.size : 0,
        documentType: uploadForm.documentType,
        title: uploadForm.title.trim(),
        documentDate: uploadForm.documentDate,
        relatedEntityType: uploadForm.relatedEntityId ? uploadForm.relatedEntityType : 'NONE',
        relatedEntityId: uploadForm.relatedEntityId.trim() || undefined,
        relatedTransactionId: uploadForm.relatedEntityType === 'TRANSACTION' ? uploadForm.relatedEntityId.trim() : undefined,
        postCloseReason: uploadForm.postCloseReason.trim() || undefined,
        notes: uploadForm.notes.trim() || undefined,
        allowDuplicate: overrideDuplicate
      };

      const res = await documentApi.uploadDocument(payload);

      if (res.duplicateDetected && !overrideDuplicate) {
        setUploadDuplicate(res);
        setUploadSubmitting(false);
        return;
      }

      if (res.success) {
        setShowUploadModal(false);
        setSelectedFile(null);
        setFileBase64('');
        setUploadForm({
          documentType: 'Receipt',
          title: '',
          documentDate: new Date().toISOString().split('T')[0],
          relatedEntityType: 'TRANSACTION',
          relatedEntityId: '',
          postCloseReason: '',
          notes: ''
        });
        setUploadDuplicate(null);
        await loadDocuments();
      } else {
        setUploadError(res.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError(err?.message || 'An error occurred during upload');
    } finally {
      setUploadSubmitting(false);
    }
  };

  const handleLinkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDocForLink || !linkForm.relatedEntityId.trim()) return;

    try {
      setLinkSubmitting(true);
      const payload = {
        documentId: selectedDocForLink.documentId,
        relatedEntityType: linkForm.relatedEntityType,
        relatedEntityId: linkForm.relatedEntityId.trim(),
        relatedTransactionId: linkForm.relatedEntityType === 'TRANSACTION' ? linkForm.relatedEntityId.trim() : undefined,
        relatedReimbursementId: linkForm.relatedEntityType === 'REIMBURSEMENT' ? linkForm.relatedEntityId.trim() : undefined,
        relatedCapitalProjectId: linkForm.relatedEntityType === 'CAPITAL_PROJECT' ? linkForm.relatedEntityId.trim() : undefined,
        relatedCheckId: linkForm.relatedEntityType === 'CHECK' ? linkForm.relatedEntityId.trim() : undefined
      };

      await documentApi.linkDocumentToEntity(payload);
      setShowLinkModal(false);
      setSelectedDocForLink(null);
      loadDocuments();
    } catch (err) {
      alert(err?.message || 'Failed to link document');
    } finally {
      setLinkSubmitting(false);
    }
  };

  // Summary Metrics Computation
  const summaryMetrics = useMemo(() => {
    const total = documents.length;
    const receipts = documents.filter(d => d.documentType === 'Receipt').length;
    const invoices = documents.filter(d => d.documentType === 'Invoice').length;
    const checks = documents.filter(d => d.documentType === 'Check').length;
    const statements = documents.filter(d => d.documentType === 'Bank Statement' || d.documentType === 'Credit Card Statement').length;
    const needsReview = documents.filter(d => d.status === 'Needs Review' || d.status === 'Unlinked').length;

    return { total, receipts, invoices, checks, statements, needsReview };
  }, [documents]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="document-center-container animate-fade-in">
      {/* Page Header */}
      <header className="doc-page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 className="doc-page-title">Document Center</h1>
            <span className="doc-period-badge">
              {filterPeriodOnly ? periodLabel : 'All Historical Periods'}
            </span>
          </div>
          <p className="doc-page-subtitle">
            Canonical evidence repository and private Google Drive vault for invoices, receipts, statements, and reports
          </p>
        </div>

        <div className="doc-header-actions">
          <button
            type="button"
            className={`btn ${filterPeriodOnly ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterPeriodOnly(!filterPeriodOnly)}
            title="Toggle period filtering"
          >
            {filterPeriodOnly ? `Filtered to ${periodLabel}` : 'Viewing All Periods'}
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={loadDocuments}
            disabled={loading}
            title="Refresh document register"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {canUpload && (
            <button
              type="button"
              className="btn btn-gold"
              onClick={() => {
                setUploadError(null);
                setUploadDuplicate(null);
                setShowUploadModal(true);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Upload size={16} />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      </header>

      {/* Summary Metrics Cards */}
      <section className="doc-metrics-grid" aria-label="Document Statistics">
        <article className="doc-metric-card">
          <div className="doc-metric-icon" style={{ background: 'var(--mist-blue)', color: 'var(--slate-blue)' }}>
            <FileText size={20} />
          </div>
          <div>
            <span className="doc-metric-label">Total Documents</span>
            <strong className="doc-metric-val">{summaryMetrics.total}</strong>
          </div>
        </article>

        <article className="doc-metric-card">
          <div className="doc-metric-icon" style={{ background: '#ecfdf5', color: 'var(--forest-green)' }}>
            <Receipt size={20} />
          </div>
          <div>
            <span className="doc-metric-label">Receipts</span>
            <strong className="doc-metric-val">{summaryMetrics.receipts}</strong>
          </div>
        </article>

        <article className="doc-metric-card">
          <div className="doc-metric-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <FileCheck size={20} />
          </div>
          <div>
            <span className="doc-metric-label">Invoices</span>
            <strong className="doc-metric-val">{summaryMetrics.invoices}</strong>
          </div>
        </article>

        <article className="doc-metric-card">
          <div className="doc-metric-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
            <CheckSquare size={20} />
          </div>
          <div>
            <span className="doc-metric-label">Checks</span>
            <strong className="doc-metric-val">{summaryMetrics.checks}</strong>
          </div>
        </article>

        <article className="doc-metric-card">
          <div className="doc-metric-icon" style={{ background: '#f0fdfa', color: '#0d9488' }}>
            <Landmark size={20} />
          </div>
          <div>
            <span className="doc-metric-label">Statements</span>
            <strong className="doc-metric-val">{summaryMetrics.statements}</strong>
          </div>
        </article>

        <article className="doc-metric-card">
          <div className="doc-metric-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="doc-metric-label">Needs Review / Unlinked</span>
            <strong className="doc-metric-val" style={{ color: summaryMetrics.needsReview > 0 ? '#d97706' : 'inherit' }}>
              {summaryMetrics.needsReview}
            </strong>
          </div>
        </article>
      </section>

      {/* View Switcher: Document Register vs Smart Upload Inbox */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeView === 'register' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveView('register')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: '6px 14px' }}
        >
          <FileText size={16} />
          <span>Master Document Register ({documents.length})</span>
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeView === 'inbox' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveView('inbox')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: '6px 14px' }}
        >
          <Inbox size={16} />
          <span>Smart Upload Inbox ({summaryMetrics.needsReview})</span>
        </button>
      </div>

      {activeView === 'inbox' ? (
        <SmartUploadInbox
          documents={documents}
          loading={loading}
          onRefresh={loadDocuments}
          onSelectDocumentForLink={(doc) => {
            setSelectedDocForLink(doc);
            setLinkForm({
              relatedEntityType: doc.relatedEntityType || 'TRANSACTION',
              relatedEntityId: doc.relatedEntityId || doc.relatedTransactionId || '',
              postCloseReason: ''
            });
            setShowLinkModal(true);
          }}
          onViewDocument={(doc) => setViewingDoc(doc)}
        />
      ) : (
        <>
          {/* Filter and Category Bar */}
          <section className="doc-filter-panel glass-panel">
            <div className="doc-category-scroll">
              {DOCUMENT_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`doc-category-btn ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <Icon size={15} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="doc-filter-controls">
              <div className="doc-search-wrapper">
                <Search size={16} className="doc-search-icon" />
                <input
                  type="text"
                  className="doc-search-input"
                  placeholder="Search title, filename, merchant, or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button type="button" className="doc-search-clear" onClick={() => setSearch('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="doc-status-pills">
                {STATUS_FILTERS.map(st => (
                  <button
                    key={st}
                    type="button"
                    className={`doc-status-pill ${selectedStatus === st ? 'active' : ''}`}
                    onClick={() => setSelectedStatus(st)}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Main Document Table / List */}
      {activeView === 'register' && (
      <section className="doc-content-section">
        {error && (
          <div className="doc-alert doc-alert--error">
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {!dataAvailable && !loading && !error && (
          <FinanceDataState
            title="No Documents Found"
            message={
              filterPeriodOnly
                ? `No documents registered for ${periodLabel}. Upload evidence or switch periods.`
                : 'No documents match the active search and filter criteria.'
            }
          />
        )}

        {documents.length > 0 && (
          <div className="doc-table-container glass-card">
            <table className="doc-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title & Filename</th>
                  <th>Category</th>
                  <th>File Info</th>
                  <th>Related Record</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => {
                  return (
                    <tr key={doc.documentId} className="doc-row">
                      <td className="doc-date-cell">
                        <strong>{doc.documentDate || '—'}</strong>
                        <small className="doc-id-text">{doc.documentId}</small>
                      </td>
                      <td className="doc-title-cell">
                        <div className="doc-title-main">
                          <strong>{doc.title || doc.storedFileName}</strong>
                          {doc.notes && <span className="doc-notes-preview">{doc.notes}</span>}
                          <span className="doc-stored-name">{doc.storedFileName}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`doc-type-badge doc-type--${(doc.documentType || '').toLowerCase().replace(/[^a-z]/g, '')}`}>
                          {doc.documentType}
                        </span>
                      </td>
                      <td className="doc-fileinfo-cell">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <small>{(doc.mimeType || 'pdf').split('/').pop()?.toUpperCase()}</small>
                      </td>
                      <td className="doc-entity-cell">
                        {doc.relatedEntityId || doc.relatedTransactionId ? (
                          <div className="doc-entity-badge">
                            <LinkIcon size={12} />
                            <span>{doc.relatedEntityType || 'RECORD'}: {doc.relatedEntityId || doc.relatedTransactionId}</span>
                          </div>
                        ) : (
                          <span className="doc-unlinked-tag">Unlinked</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span className={`doc-status-badge status--${(doc.status || 'unlinked').toLowerCase().replace(/\s+/g, '-')}`}>
                            {doc.status || 'Unlinked'}
                          </span>
                          {doc.isPostCloseAddition && (
                            <span
                              className="doc-post-close-badge"
                              title={doc.postCloseReason ? `Post-Close Reason: ${doc.postCloseReason}` : 'Traceable Post-Close Addition'}
                            >
                              Post-Close
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="doc-actions-cell">
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {doc.driveFileUrl ? (
                            <a
                              href={doc.driveFileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="doc-action-btn"
                              title="Open in Google Drive"
                            >
                              <ExternalLink size={15} />
                            </a>
                          ) : null}

                          <button
                            type="button"
                            className="doc-action-btn"
                            onClick={() => setViewingDoc(doc)}
                            title="View Metadata Details"
                          >
                            <Eye size={15} />
                          </button>

                          {canUpload && (
                            <button
                              type="button"
                              className="doc-action-btn"
                              onClick={() => {
                                setSelectedDocForLink(doc);
                                setLinkForm({
                                  relatedEntityType: doc.relatedEntityType || 'TRANSACTION',
                                  relatedEntityId: doc.relatedEntityId || doc.relatedTransactionId || ''
                                });
                                setShowLinkModal(true);
                              }}
                              title="Link to Finance Record"
                            >
                              <LinkIcon size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}

      {/* SMART UPLOAD MODAL */}
      {showUploadModal && (
        <SmartUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false);
            loadDocuments();
          }}
        />
      )}

      {/* LINK TO ENTITY MODAL */}
      {showLinkModal && selectedDocForLink && (
        <div className="doc-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <h2>Link Document to Finance Record</h2>
              <button type="button" className="doc-modal-close" onClick={() => setShowLinkModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="doc-modal-body">
              <div style={{ marginBottom: '16px', background: 'var(--mist-blue)', padding: '12px', borderRadius: '8px' }}>
                <strong style={{ display: 'block', color: 'var(--slate-blue-dark)' }}>{selectedDocForLink.title}</strong>
                <small style={{ color: 'var(--warm-gray)' }}>{selectedDocForLink.documentId} • {selectedDocForLink.documentType}</small>
              </div>

              <div className="doc-form-group">
                <label>Target Entity Type</label>
                <select
                  value={linkForm.relatedEntityType}
                  onChange={(e) => setLinkForm({ ...linkForm, relatedEntityType: e.target.value })}
                >
                  <option value="TRANSACTION">Transaction (Master Ledger)</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="REIMBURSEMENT">Reimbursement</option>
                  <option value="CHECK">Check Disbursement</option>
                  <option value="CAPITAL_PROJECT">Capital Project</option>
                  <option value="REPORT">Presbyter / Financial Report</option>
                </select>
              </div>

              <div className="doc-form-group">
                <label>Target Record ID *</label>
                <input
                  type="text"
                  placeholder="e.g. TXN-101, RMB-12345, CHK-1002"
                  value={linkForm.relatedEntityId}
                  onChange={(e) => setLinkForm({ ...linkForm, relatedEntityId: e.target.value })}
                  required
                />
              </div>

              <div className="doc-form-group">
                <label>Post-Close Evidence Reason (Required if linking to closed period)</label>
                <input
                  type="text"
                  placeholder="e.g. Linking supporting invoice to closed month transaction"
                  value={linkForm.postCloseReason}
                  onChange={(e) => setLinkForm({ ...linkForm, postCloseReason: e.target.value })}
                />
              </div>

              <div className="doc-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowLinkModal(false)}
                  disabled={linkSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={linkSubmitting || !linkForm.relatedEntityId.trim()}
                >
                  {linkSubmitting ? 'Linking...' : 'Confirm Relationship'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* METADATA DETAIL MODAL */}
      {viewingDoc && (
        <div className="doc-modal-overlay" onClick={() => setViewingDoc(null)}>
          <div className="doc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="doc-modal-header">
              <h2>Document Metadata</h2>
              <button type="button" className="doc-modal-close" onClick={() => setViewingDoc(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="doc-modal-body">
              <div className="doc-detail-grid">
                <div>
                  <span className="doc-detail-label">Document ID</span>
                  <strong>{viewingDoc.documentId}</strong>
                </div>
                <div>
                  <span className="doc-detail-label">Document Type</span>
                  <strong>{viewingDoc.documentType}</strong>
                </div>
                <div>
                  <span className="doc-detail-label">Document Date</span>
                  <strong>{viewingDoc.documentDate}</strong>
                </div>
                <div>
                  <span className="doc-detail-label">Period Dimension</span>
                  <strong>{viewingDoc.financeYear}-{String(viewingDoc.financeMonth).padStart(2, '0')}</strong>
                </div>
                <div>
                  <span className="doc-detail-label">Status</span>
                  <strong>{viewingDoc.status}</strong>
                </div>
                <div>
                  <span className="doc-detail-label">File Size</span>
                  <strong>{formatFileSize(viewingDoc.fileSize)}</strong>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span className="doc-detail-label">Stored File Name</span>
                  <code className="doc-detail-code">{viewingDoc.storedFileName}</code>
                </div>
                {viewingDoc.contentHash && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <span className="doc-detail-label">SHA-256 Content Hash</span>
                    <code className="doc-detail-code">{viewingDoc.contentHash}</code>
                  </div>
                )}
                {/* Structured Smart Upload Metadata */}
                {(() => {
                  let v = '';
                  let a = null;
                  if (viewingDoc.notes && viewingDoc.notes.includes('[GPBC_SMART_UPLOAD_META:')) {
                    try {
                      const m = viewingDoc.notes.match(/\[GPBC_SMART_UPLOAD_META:(.*?)\]/);
                      if (m && m[1]) {
                        const parsed = JSON.parse(m[1]);
                        v = parsed.vendor || '';
                        a = parsed.amount != null ? Number(parsed.amount) : null;
                      }
                    } catch {}
                  }
                  if (!v && viewingDoc.title && viewingDoc.title.includes(' - ')) {
                    v = viewingDoc.title.split(' - ')[0].trim();
                  }
                  return (
                    <>
                      {v && (
                        <div>
                          <span className="doc-detail-label">Vendor / Payee</span>
                          <strong>{v}</strong>
                        </div>
                      )}
                      {a != null && (
                        <div>
                          <span className="doc-detail-label">Amount</span>
                          <strong style={{ color: '#059669' }}>${a.toFixed(2)}</strong>
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Related Records Breakdown */}
                <div style={{ gridColumn: 'span 2', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', marginTop: '6px' }}>
                  <span className="doc-detail-label" style={{ fontWeight: 700, color: '#0f172a', marginBottom: '8px', display: 'block' }}>
                    Authoritative Related Records (Master Evidence)
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.82rem' }}>
                    {viewingDoc.relatedTransactionId && (
                      <div><strong>Transaction:</strong> {viewingDoc.relatedTransactionId}</div>
                    )}
                    {viewingDoc.relatedReimbursementId && (
                      <div><strong>Reimbursement:</strong> {viewingDoc.relatedReimbursementId}</div>
                    )}
                    {viewingDoc.relatedCapitalProjectId && (
                      <div><strong>Capital Project:</strong> {viewingDoc.relatedCapitalProjectId}</div>
                    )}
                    {viewingDoc.relatedCheckId && (
                      <div><strong>Check Detail:</strong> {viewingDoc.relatedCheckId}</div>
                    )}
                    {viewingDoc.relatedEntityId && !viewingDoc.relatedTransactionId && !viewingDoc.relatedReimbursementId && !viewingDoc.relatedCapitalProjectId && !viewingDoc.relatedCheckId && (
                      <div><strong>{viewingDoc.relatedEntityType}:</strong> {viewingDoc.relatedEntityId}</div>
                    )}
                    {!viewingDoc.relatedEntityId && !viewingDoc.relatedTransactionId && !viewingDoc.relatedReimbursementId && !viewingDoc.relatedCapitalProjectId && !viewingDoc.relatedCheckId && (
                      <div style={{ color: '#64748b', fontStyle: 'italic' }}>No linked records yet (Document Only master record).</div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '8px' }}>
                    ✓ All references point to this single master document in Google Drive.
                  </div>
                </div>
                {viewingDoc.isPostCloseAddition && (
                  <>
                    <div style={{ gridColumn: 'span 2', background: '#fffbeb', border: '1px solid #fde68a', padding: '10px 12px', borderRadius: '8px' }}>
                      <span className="doc-detail-label" style={{ color: '#b45309' }}>Post-Close Traceable Addition</span>
                      <strong style={{ display: 'block', color: '#92400e', marginBottom: '4px' }}>
                        {viewingDoc.postCloseReason || 'Post-close late evidence addition'}
                      </strong>
                      <small style={{ color: '#78350f' }}>
                        Added after close by {viewingDoc.addedAfterCloseBy || viewingDoc.uploadedBy || 'Authorized Officer'} on {viewingDoc.addedAfterCloseAt || viewingDoc.uploadedAt || '—'}
                      </small>
                    </div>
                  </>
                )}
                <div style={{ gridColumn: 'span 2' }}>
                  <span className="doc-detail-label">Uploaded By / Date</span>
                  <span>{viewingDoc.uploadedBy || 'System'} at {viewingDoc.uploadedAt || '—'}</span>
                </div>
              </div>

              {viewingDoc.driveFileUrl && (
                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                  <a
                    href={viewingDoc.driveFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  >
                    <ExternalLink size={16} />
                    <span>Open in Private Google Drive</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentCenter;
