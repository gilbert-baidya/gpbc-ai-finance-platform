/*************************************************
 * GPBC Finance Desk — IBoughtSomethingModal.jsx
 * Shortcut: "I Bought Something for Church"
 * Personal purchase & reimbursement evidence ingestion
 * Human confirmation mandatory (no auto-linking)
 * Shared 15MB file validation & SHA-256 computation
 * Single authoritative upload & link (no double-linking)
 *************************************************/

import React, { useState, useRef, useEffect } from 'react';
import { X, ShoppingBag, ArrowRight, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { smartUploadApi } from '../../api/smartUploadApi';
import { validateSmartUploadFile } from './fileValidation';
import { computeFileSha256 } from './fileHashing';

export const IBoughtSomethingModal = ({
  isOpen,
  onClose,
  onSuccess,
  onGoToExpense
}) => {
  const [file, setFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(undefined); // undefined = unselected initial state
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateOverride, setDuplicateOverride] = useState(false);
  const [writesEnabled, setWritesEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  // Fetch options to check writesEnabled
  useEffect(() => {
    if (isOpen) {
      smartUploadApi.getSmartUploadOptions().then((opts) => {
        if (opts && opts.writesEnabled !== undefined) {
          setWritesEnabled(Boolean(opts.writesEnabled));
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // Focus trap & Accessibility
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      modalRef.current?.focus();
      const onGlobalKey = (e) => {
        if (e.key === 'Escape') {
          if (!submitting) handleClose();
        }
      };
      window.addEventListener('keydown', onGlobalKey);
      return () => window.removeEventListener('keydown', onGlobalKey);
    } else if (triggerRef.current) {
      triggerRef.current?.focus?.();
    }
  }, [isOpen, submitting]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      if (!submitting) handleClose();
      return;
    }
    if (e.key === 'Tab') {
      const focusable = modalRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const validation = validateSmartUploadFile(f);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file.');
      setFile(null);
      setFileBase64('');
      setContentHash('');
      return;
    }

    setError(null);
    setFile(f);

    try {
      const hash = await computeFileSha256(f);
      setContentHash(hash);
    } catch {
      setContentHash('');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = (reader.result || '').split(',')[1] || '';
      setFileBase64(b64);
    };
    reader.readAsDataURL(f);
  };

  const executeSearch = async (overrideDup = false) => {
    try {
      setSearching(true);
      setError(null);

      // Pre-check duplicates before search if not explicitly overridden
      if (!overrideDup && !duplicateOverride) {
        const dupCheck = await smartUploadApi.checkDuplicate({
          contentHash,
          filename: file.name,
          fileSize: file.size,
          documentDate: date,
          vendor: vendor.trim(),
          amount: parseFloat(amount)
        });
        if (dupCheck?.isDuplicate) {
          // STOP progression immediately
          setDuplicateWarning(dupCheck);
          setSearching(false);
          return;
        }
      }

      const results = await smartUploadApi.findMatches({
        documentType: 'Reimbursement Proof',
        vendor: vendor.trim(),
        date: date,
        amount: parseFloat(amount),
        description: description.trim()
      });

      setMatches(results || []);
      // STRICT HUMAN CONFIRMATION: DO NOT auto-select highest ranked result
      setSelectedMatch(undefined);
    } catch (err) {
      setError(err?.message || 'Error searching for existing records.');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!file) {
      setError('Please select or photograph the purchase receipt.');
      return;
    }
    const validation = validateSmartUploadFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file.');
      return;
    }
    if (!vendor.trim()) {
      setError('Please enter the vendor name.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid purchase amount.');
      return;
    }

    await executeSearch(false);
  };

  const handleSaveAndLink = async (targetCandidate = null, isDocOnly = false) => {
    try {
      setSubmitting(true);
      setError(null);

      if (writesEnabled === false) {
        setError('Smart Upload is ready, but document saving is temporarily disabled during the controlled production release.');
        setSubmitting(false);
        return;
      }

      const parsedAmount = parseFloat(amount) || 0;

      // 1. Physical upload & Master Document_Register creation ONCE as Unlinked
      const uploadRes = await smartUploadApi.uploadSmartDocument({
        fileBase64: fileBase64,
        contentHash: contentHash,
        originalFileName: file.name,
        mimeType: file.type || 'image/jpeg',
        fileSize: file.size,
        documentType: 'Reimbursement Proof',
        title: `${vendor} - ${description || 'Church Purchase'} ($${parsedAmount.toFixed(2)})`,
        vendor: vendor.trim(),
        amount: parsedAmount,
        documentDate: date,
        description: description.trim(),
        notes: notes.trim(),
        isDocumentOnly: isDocOnly || !targetCandidate,
        allowDuplicateUpload: duplicateOverride,
        relatedEntityType: 'NONE',
        relatedEntityId: '',
        relatedTransactionId: '',
        relatedReimbursementId: '',
        relatedCapitalProjectId: '',
        relatedCheckId: ''
      });

      if (!uploadRes.success) {
        throw new Error(uploadRes.message || uploadRes.error || 'Failed to save receipt.');
      }

      const docId = uploadRes.documentId;

      // 2. Authoritative Single Link: if candidate explicitly selected, call linkDocumentToEntity ONCE
      if (targetCandidate && docId) {
        try {
          await smartUploadApi.linkDocumentToEntity({
            documentId: docId,
            relatedEntityType: targetCandidate.entityType,
            relatedEntityId: targetCandidate.entityId,
            relatedTransactionId: targetCandidate.entityType === 'TRANSACTION' ? targetCandidate.entityId : undefined,
            relatedReimbursementId: targetCandidate.entityType === 'REIMBURSEMENT' ? targetCandidate.entityId : undefined,
            relatedCapitalProjectId: targetCandidate.entityType === 'CAPITAL_PROJECT' ? targetCandidate.entityId : undefined,
            relatedCheckId: targetCandidate.entityType === 'CHECK' ? targetCandidate.entityId : undefined
          });
        } catch (linkErr) {
          setError(`Receipt saved (${docId}), but linking failed: ${linkErr?.message || linkErr}`);
          setSubmitting(false);
          return;
        }
      }

      if (onSuccess) onSuccess({ ...uploadRes, linkedEntity: targetCandidate });
      handleClose();
    } catch (err) {
      setError(err?.message || 'Failed to upload document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileBase64('');
    setContentHash('');
    setVendor('');
    setDate(new Date().toISOString().split('T')[0]);
    setAmount('');
    setDescription('');
    setNotes('');
    setMatches(null);
    setSelectedMatch(undefined);
    setDuplicateWarning(null);
    setDuplicateOverride(false);
    setError(null);
    onClose();
  };

  return (
    <div className="smart-upload-overlay" onClick={() => !submitting && handleClose()} onKeyDown={handleKeyDown}>
      <div
        className="smart-upload-container"
        style={{ maxWidth: '560px' }}
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ib-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="smart-upload-header" style={{ background: '#065f46' }}>
          <div className="smart-upload-header-title">
            <ShoppingBag size={20} color="#34d399" />
            <div>
              <h3 id="ib-modal-title" style={{ fontSize: '1.05rem', margin: 0 }}>I Bought Something for Church</h3>
              <div style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                Personal Church Expense & Reimbursement Ingestion
              </div>
            </div>
          </div>
          <button
            type="button"
            className="smart-upload-close-btn"
            onClick={handleClose}
            aria-label="Close shortcut dialog"
            disabled={submitting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="smart-upload-body">
          {error && (
            <div className="alert-box alert-error" role="alert" aria-live="polite">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {duplicateWarning ? (
            <div className="duplicate-blocking-card" role="region" aria-labelledby="dup-title" style={{ padding: '8px 0' }}>
              <div
                className="alert-box alert-warning"
                style={{
                  alignItems: 'flex-start',
                  padding: '16px',
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px'
                }}
              >
                <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
                <div style={{ flex: 1, marginLeft: '10px' }}>
                  <h4 id="dup-title" style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>
                    Possible Duplicate Document Found
                  </h4>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.85rem', color: '#78350f', lineHeight: 1.5 }}>
                    {duplicateWarning.reason || 'An existing document with matching content, filename, or financial details was detected in the Document Register.'}
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {duplicateWarning.duplicateDocument?.driveFileUrl && (
                      <a
                        href={duplicateWarning.duplicateDocument.driveFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-secondary"
                        style={{
                          textDecoration: 'none',
                          padding: '8px 14px',
                          fontSize: '0.85rem',
                          minHeight: '38px',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        View Existing
                      </a>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={handleClose}
                      style={{ padding: '8px 14px', fontSize: '0.85rem', minHeight: '38px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning"
                      onClick={() => {
                        setDuplicateOverride(true);
                        setDuplicateWarning(null);
                        executeSearch(true);
                      }}
                      style={{
                        padding: '8px 14px',
                        fontSize: '0.85rem',
                        minHeight: '38px',
                        fontWeight: 600,
                        background: '#d97706',
                        color: '#ffffff',
                        borderColor: '#d97706'
                      }}
                    >
                      Continue Anyway
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : matches === null ? (
            <form onSubmit={handleSearch}>
              {/* Receipt File */}
              <div className="form-group">
                <label className="form-label" htmlFor="ibReceiptFile">Receipt Photo or Document * (PDF, JPG, PNG, WEBP - Max 4MB)</label>
                <input
                  id="ibReceiptFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  capture="environment"
                  className="form-control"
                  onChange={handleFileChange}
                  required
                />
                {file && (
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px' }}>
                    ✓ Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Vendor & Date */}
              <div className="form-row-2col">
                <div className="form-group">
                  <label className="form-label" htmlFor="ibVendor">Vendor / Store *</label>
                  <input
                    id="ibVendor"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Costco, Home Depot"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="ibDate">Date of Purchase *</label>
                  <input
                    id="ibDate"
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label" htmlFor="ibAmount">Total Amount Paid ($) *</label>
                <input
                  id="ibAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label" htmlFor="ibDesc">What did you buy? *</label>
                <input
                  id="ibDesc"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Fellowship food, communion cups, cables"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                onClick={handleSearch}
                className="btn btn-primary"
                disabled={searching}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px',
                  background: '#059669',
                  borderColor: '#059669',
                  minHeight: '44px'
                }}
              >
                <span>{searching ? 'Searching Matches...' : 'Find Matching Expense'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            /* Results View */
            <div>
              {matches.length > 0 ? (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '8px' }}>
                    Matching Finance Records ({matches.length})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '12px' }}>
                    Choose an existing record to link, or save receipt for later review. Strong Match is a recommendation; your explicit selection is required.
                  </div>

                  <div role="radiogroup" aria-label="Available matches">
                    {matches.map((item) => {
                      const isSelected = selectedMatch?.candidate?.id === item.candidate.id;
                      return (
                        <div
                          key={item.candidate.id}
                          className={`match-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedMatch(item)}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              setSelectedMatch(item);
                            }
                          }}
                          style={{ cursor: 'pointer', marginBottom: '8px' }}
                        >
                          <div className="match-card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '18px',
                                  height: '18px',
                                  borderRadius: '50%',
                                  border: isSelected ? '5px solid #059669' : '2px solid #cbd5e1',
                                  background: '#ffffff',
                                  flexShrink: 0
                                }}
                              />
                              <span style={{ fontWeight: 700 }}>{item.candidate.displayTitle}</span>
                            </div>
                            <span className="match-badge badge-strong">{item.confidenceLabel}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#475569', marginLeft: '26px' }}>
                            {item.reasons.join(' • ')}
                          </div>
                        </div>
                      );
                    })}

                    {/* Explicit Save Document Only Option */}
                    <div
                      className={`match-card ${selectedMatch?.isDocumentOnly ? 'selected' : ''}`}
                      onClick={() => setSelectedMatch({ isDocumentOnly: true, candidate: null })}
                      role="radio"
                      aria-checked={selectedMatch?.isDocumentOnly === true}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setSelectedMatch({ isDocumentOnly: true, candidate: null });
                        }
                      }}
                      style={{ cursor: 'pointer', marginBottom: '8px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: selectedMatch?.isDocumentOnly ? '5px solid #059669' : '2px solid #cbd5e1',
                            background: '#ffffff',
                            flexShrink: 0
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Save Receipt Only (No Record Linked)</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Store receipt in Document Center for treasurer review without linking.</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submitting || selectedMatch === undefined}
                      onClick={() => {
                        if (selectedMatch?.isDocumentOnly) {
                          handleSaveAndLink(null, true);
                        } else {
                          handleSaveAndLink(selectedMatch?.candidate, false);
                        }
                      }}
                      style={{ flex: 1, background: '#059669', borderColor: '#059669', minHeight: '44px' }}
                    >
                      {selectedMatch === undefined
                        ? 'Select an Option Above'
                        : selectedMatch?.isDocumentOnly
                        ? 'Confirm Save Receipt Only'
                        : `Confirm & Link to ${selectedMatch?.candidate?.entityType || 'Record'}`}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={submitting}
                      onClick={() => setMatches(null)}
                      style={{ minHeight: '44px' }}
                    >
                      Back to Edit
                    </button>
                  </div>
                </div>
              ) : (
                /* No match found */
                <div style={{ textAlign: 'center', padding: '16px' }}>
                  <AlertCircle size={32} color="#d97706" style={{ margin: '0 auto 8px auto' }} />
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>No Matching Finance Record Found</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', marginBottom: '20px' }}>
                    No expense or reimbursement matching ${amount} for {vendor} was found in the system yet.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={submitting}
                      onClick={() => handleSaveAndLink(null, true)}
                      style={{ background: '#059669', borderColor: '#059669', minHeight: '44px' }}
                    >
                      <Save size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      Save Document Only (Link Later)
                    </button>

                    {onGoToExpense && (
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        style={{ minHeight: '44px' }}
                        onClick={() => {
                          handleClose();
                          onGoToExpense({ vendor, date, amount, description });
                        }}
                      >
                        Go to Record Expense
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-link"
                      onClick={() => setMatches(null)}
                      style={{ fontSize: '0.8rem', color: '#64748b' }}
                    >
                      Edit Details & Search Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IBoughtSomethingModal;
