/*************************************************
 * GPBC Finance Desk — SmartUploadModal.jsx
 * 5-Step Smart Upload Orchestrator
 * Upload Once • Store Once • Link Everywhere
 * Human confirmation mandatory (no auto-linking)
 * Shared file validation & real Web Crypto SHA-256
 * Single authoritative upload & link (no double-linking)
 * Authoritative backend matching & closed period options
 *************************************************/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Upload, ArrowRight, ArrowLeft, Check, ShieldAlert } from 'lucide-react';
import { UploadSourceStep } from './UploadSourceStep';
import { DocumentDetailsStep } from './DocumentDetailsStep';
import { MatchSuggestionsStep } from './MatchSuggestionsStep';
import { ConfirmLinkStep } from './ConfirmLinkStep';
import { IBoughtSomethingModal } from './IBoughtSomethingModal';
import { smartUploadApi } from '../../api/smartUploadApi';
import { validateSmartUploadFile } from './fileValidation';
import { computeFileSha256 } from './fileHashing';
import './SmartUpload.css';

export const SmartUploadModal = ({
  isOpen,
  onClose,
  onSuccess,
  onGoToExpense,
  capitalProjects = [],
  closedPeriods = []
}) => {
  const [step, setStep] = useState(1); // 1: Source, 2: Details, 3: Matches, 4: Confirm
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileBase64, setFileBase64] = useState('');
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [contentHash, setContentHash] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [duplicateOverride, setDuplicateOverride] = useState(false);

  // Authoritative options retrieved from backend
  const [activeClosedPeriods, setActiveClosedPeriods] = useState(closedPeriods);
  const [activeCapitalProjects, setActiveCapitalProjects] = useState(capitalProjects);

  const [formData, setFormData] = useState({
    documentType: 'Receipt',
    vendor: '',
    documentDate: new Date().toISOString().split('T')[0],
    amount: null,
    description: '',
    financePeriod: '',
    capitalProjectId: '',
    postCloseReason: '',
    notes: ''
  });

  const [suggestions, setSuggestions] = useState([]);
  // STRICT HUMAN SELECTION: undefined indicates no selection has been made yet
  const [selectedMatch, setSelectedMatch] = useState(undefined);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [partialSuccessDocId, setPartialSuccessDocId] = useState(null);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [writesEnabled, setWritesEnabled] = useState(true);

  const modalRef = useRef(null);
  const triggerRef = useRef(null);

  // Focus trap & Accessibility
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
      modalRef.current?.focus();
      const onGlobalKey = (e) => {
        if (e.key === 'Escape') {
          if (!isSubmitting) onClose();
        }
      };
      window.addEventListener('keydown', onGlobalKey);
      return () => window.removeEventListener('keydown', onGlobalKey);
    } else if (triggerRef.current) {
      triggerRef.current?.focus?.();
    }
  }, [isOpen, onClose, isSubmitting]);

  // Fetch authoritative options on open if not populated
  useEffect(() => {
    if (isOpen) {
      smartUploadApi.getSmartUploadOptions().then((opts) => {
        if (opts && opts.success) {
          if (opts.closedPeriods && opts.closedPeriods.length > 0) {
            setActiveClosedPeriods(opts.closedPeriods);
          }
          if (opts.capitalProjects && opts.capitalProjects.length > 0) {
            setActiveCapitalProjects(opts.capitalProjects);
          }
          if (opts.writesEnabled !== undefined) {
            setWritesEnabled(Boolean(opts.writesEnabled));
          }
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  // Check if document date falls in closed period
  const isPeriodClosed = useCallback(() => {
    if (!formData.documentDate) return false;
    const periodKey = formData.documentDate.substring(0, 7);
    return activeClosedPeriods.includes(periodKey);
  }, [formData.documentDate, activeClosedPeriods]);

  // Handle file selection with shared validation and real Web Crypto SHA-256
  const handleFileSelect = async (file) => {
    setSelectedFile(file);
    setDuplicateWarning(null);
    setDuplicateOverride(false);

    if (!file) {
      setFileBase64('');
      setFilePreviewUrl('');
      setContentHash('');
      return;
    }

    const validation = validateSmartUploadFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file.');
      return;
    }
    setError(null);

    // Calculate real client-side SHA-256 hash using Web Crypto API
    let hash = '';
    try {
      hash = await computeFileSha256(file);
      setContentHash(hash);
    } catch {
      setContentHash('');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result || '';
      const b64 = String(res).split(',')[1] || '';
      setFileBase64(b64);

      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(String(res));
      } else {
        setFilePreviewUrl('');
      }
    };
    reader.readAsDataURL(file);

    // Initial pre-check for duplicates based on contentHash, name & size
    smartUploadApi.checkDuplicate({
      contentHash: hash,
      filename: file.name,
      fileSize: file.size
    }).then((dupRes) => {
      if (dupRes.isDuplicate) {
        setDuplicateWarning(dupRes);
      }
    }).catch(() => {});
  };

  const handleFormFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Step 1 -> 2 (Proceed to Details)
  const handleProceedToDetails = () => {
    if (!selectedFile) {
      setError('Please select or capture a file to proceed.');
      return;
    }
    const validation = validateSmartUploadFile(selectedFile);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file.');
      return;
    }
    setError(null);
    setStep(2);
  };

  // Step 2 -> 3 (Proceed to Matches)
  const handleProceedToMatches = async () => {
    if (!formData.documentType) {
      setError('Please select a document type.');
      return;
    }
    if (!formData.documentDate) {
      setError('Please enter a document date.');
      return;
    }
    if (isPeriodClosed() && !formData.postCloseReason?.trim()) {
      setError('Target period is closed. An authorized post-close reason is required.');
      return;
    }

    // Secondary duplicate check with full details (date + vendor + amount + hash)
    if (!duplicateOverride) {
      try {
        const dupCheck = await smartUploadApi.checkDuplicate({
          contentHash,
          filename: selectedFile?.name,
          fileSize: selectedFile?.size,
          documentDate: formData.documentDate,
          vendor: formData.vendor,
          amount: formData.amount
        });
        if (dupCheck?.isDuplicate) {
          setDuplicateWarning(dupCheck);
          setError(`Duplicate Detected: ${dupCheck.reason}. Click "Continue Anyway" if this is intentional.`);
          return;
        }
      } catch {}
    }

    setError(null);
    setStep(3);
    setLoadingMatches(true);

    try {
      const results = await smartUploadApi.findMatches({
        documentType: formData.documentType,
        vendor: formData.vendor,
        date: formData.documentDate,
        amount: formData.amount,
        description: formData.description,
        capitalProjectId: formData.capitalProjectId
      });
      setSuggestions(results || []);
      // STRICT HUMAN CONFIRMATION: DO NOT auto-select highest ranked result
      setSelectedMatch(undefined);
    } catch {
      setSuggestions([]);
      setSelectedMatch(undefined);
    } finally {
      setLoadingMatches(false);
    }
  };

  // Step 3 -> 4 (Proceed to Confirm)
  const handleProceedToConfirm = () => {
    if (selectedMatch === undefined) {
      setError('Please explicitly select a matching record or choose "Save to Document Center Only".');
      return;
    }
    setError(null);
    setStep(4);
  };

  // Step 4: Final Submission (Transactional single upload + single link)
  const handleFinalSubmit = async (saveOnly = false) => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (writesEnabled === false) {
        setError('Smart Upload is ready, but document saving is temporarily disabled during the controlled production release.');
        setIsSubmitting(false);
        return;
      }

      const isDocOnly = saveOnly || selectedMatch?.isDocumentOnly === true || !selectedMatch?.candidate;
      const targetCandidate = isDocOnly ? null : selectedMatch?.candidate;

      // 1. Physical upload & Master Document_Register row creation ONCE as Unlinked
      // Always upload with relatedEntityType: 'NONE' to eliminate double-linking
      const uploadPayload = {
        fileBase64: fileBase64,
        contentHash: contentHash,
        originalFileName: selectedFile.name,
        mimeType: selectedFile.type || 'application/pdf',
        fileSize: selectedFile.size,
        documentType: formData.documentType,
        title: `${formData.vendor ? formData.vendor + ' - ' : ''}${formData.description || formData.documentType}`,
        vendor: formData.vendor,
        amount: formData.amount != null ? Number(formData.amount) : undefined,
        documentDate: formData.documentDate,
        description: formData.description,
        capitalProjectId: formData.capitalProjectId || undefined,
        postCloseReason: formData.postCloseReason || undefined,
        notes: formData.notes || undefined,
        isDocumentOnly: isDocOnly,
        allowDuplicateUpload: duplicateOverride,
        relatedEntityType: 'NONE',
        relatedEntityId: '',
        relatedTransactionId: '',
        relatedReimbursementId: '',
        relatedCapitalProjectId: '',
        relatedCheckId: ''
      };

      const uploadRes = await smartUploadApi.uploadSmartDocument(uploadPayload);

      if (!uploadRes.success) {
        throw new Error(uploadRes.message || uploadRes.error || 'Failed to upload document.');
      }

      const docId = uploadRes.documentId;
      setPartialSuccessDocId(docId);

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
            relatedCheckId: targetCandidate.entityType === 'CHECK' ? targetCandidate.entityId : undefined,
            postCloseReason: formData.postCloseReason
          });
        } catch (linkErr) {
          // Master document was preserved! Allow retrying link without re-uploading file
          setError(`Document saved (${docId}), but linking failed: ${linkErr?.message || linkErr}. You can retry linking.`);
          setIsSubmitting(false);
          return;
        }
      }

      if (onSuccess) onSuccess({ ...uploadRes, linkedEntity: targetCandidate });
      handleClose();
    } catch (err) {
      setError(err?.message || 'Failed to complete Smart Upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryLink = async () => {
    if (!partialSuccessDocId || !selectedMatch?.candidate) return;
    try {
      setIsSubmitting(true);
      setError(null);
      await smartUploadApi.linkDocumentToEntity({
        documentId: partialSuccessDocId,
        relatedEntityType: selectedMatch.candidate.entityType,
        relatedEntityId: selectedMatch.candidate.entityId,
        relatedTransactionId: selectedMatch.candidate.entityType === 'TRANSACTION' ? selectedMatch.candidate.entityId : undefined,
        relatedReimbursementId: selectedMatch.candidate.entityType === 'REIMBURSEMENT' ? selectedMatch.candidate.entityId : undefined,
        relatedCapitalProjectId: selectedMatch.candidate.entityType === 'CAPITAL_PROJECT' ? selectedMatch.candidate.entityId : undefined,
        relatedCheckId: selectedMatch.candidate.entityType === 'CHECK' ? selectedMatch.candidate.entityId : undefined,
        postCloseReason: formData.postCloseReason
      });
      if (onSuccess) onSuccess({ success: true, documentId: partialSuccessDocId });
      handleClose();
    } catch (err) {
      setError(`Link retry failed: ${err?.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedFile(null);
    setFileBase64('');
    setFilePreviewUrl('');
    setContentHash('');
    setDuplicateWarning(null);
    setDuplicateOverride(false);
    setFormData({
      documentType: 'Receipt',
      vendor: '',
      documentDate: new Date().toISOString().split('T')[0],
      amount: null,
      description: '',
      financePeriod: '',
      capitalProjectId: '',
      postCloseReason: '',
      notes: ''
    });
    setSuggestions([]);
    setSelectedMatch(undefined);
    setError(null);
    setPartialSuccessDocId(null);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !isSubmitting && !showShortcutModal) {
      handleClose();
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

  return (
    <>
      <div
        className="smart-upload-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="smartUploadTitle"
        onClick={() => !isSubmitting && handleClose()}
        onKeyDown={handleKeyDown}
      >
        <div
          className="smart-upload-container"
          ref={modalRef}
          tabIndex={-1}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="smart-upload-header">
            <div className="smart-upload-header-title">
              <Upload size={20} color="#34d399" />
              <h3 id="smartUploadTitle">Smart Upload</h3>
            </div>
            <button
              type="button"
              className="smart-upload-close-btn"
              onClick={handleClose}
              aria-label="Close Smart Upload dialog"
              disabled={isSubmitting}
            >
              <X size={20} />
            </button>
          </div>

          {/* Stepper Progress */}
          <div className="smart-upload-stepper">
            <div className={`stepper-step ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="stepper-circle">{step > 1 ? '✓' : '1'}</div>
              <span>Upload</span>
            </div>
            <div className={`stepper-divider ${step > 1 ? 'completed' : ''}`} />

            <div className={`stepper-step ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="stepper-circle">{step > 2 ? '✓' : '2'}</div>
              <span>Details</span>
            </div>
            <div className={`stepper-divider ${step > 2 ? 'completed' : ''}`} />

            <div className={`stepper-step ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="stepper-circle">{step > 3 ? '✓' : '3'}</div>
              <span>Match</span>
            </div>
            <div className={`stepper-divider ${step > 3 ? 'completed' : ''}`} />

            <div className={`stepper-step ${step === 4 ? 'active' : ''}`}>
              <div className="stepper-circle">4</div>
              <span>Confirm</span>
            </div>
          </div>

          {/* Step Body */}
          <div className="smart-upload-body">
            {error && (
              <div className="alert-box alert-error" role="alert" aria-live="polite" style={{ marginBottom: '16px' }}>
                <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>{error}</div>
              </div>
            )}

            {step === 1 && (
              <UploadSourceStep
                selectedFile={selectedFile}
                onFileSelect={handleFileSelect}
                filePreviewUrl={filePreviewUrl}
                duplicateWarning={duplicateWarning}
                onDismissDuplicate={() => {
                  setDuplicateWarning(null);
                  setDuplicateOverride(true);
                  setError(null);
                }}
                onOpenShortcut={() => setShowShortcutModal(true)}
              />
            )}

            {step === 2 && (
              <DocumentDetailsStep
                formData={formData}
                onChange={handleFormFieldChange}
                capitalProjects={activeCapitalProjects}
                isPeriodClosed={isPeriodClosed()}
              />
            )}

            {step === 3 && (
              <MatchSuggestionsStep
                suggestions={suggestions}
                selectedMatch={selectedMatch}
                onSelectMatch={(match) => {
                  setSelectedMatch(match);
                  setError(null);
                }}
                loading={loadingMatches}
                onGoToExpense={() => {
                  handleClose();
                  if (onGoToExpense) onGoToExpense(formData);
                }}
              />
            )}

            {step === 4 && (
              <ConfirmLinkStep
                formData={formData}
                selectedFile={selectedFile}
                filePreviewUrl={filePreviewUrl}
                selectedMatch={selectedMatch}
                isSubmitting={isSubmitting}
                error={error}
                partialSuccessDocId={partialSuccessDocId}
                onRetryLink={handleRetryLink}
                writesEnabled={writesEnabled}
              />
            )}
          </div>

          {/* Footer Controls */}
          <div className="smart-upload-footer">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={isSubmitting}
                  onClick={() => setStep((s) => s - 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleClose}
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="footer-actions-right">
              {step === 1 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!selectedFile}
                  onClick={handleProceedToDetails}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}
                >
                  <span>Continue to Details</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleProceedToMatches}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}
                >
                  <span>Find Matching Records</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={selectedMatch === undefined || loadingMatches}
                  onClick={handleProceedToConfirm}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', minHeight: '44px' }}
                >
                  <span>{selectedMatch === undefined ? 'Select Match to Continue' : 'Review & Confirm'}</span>
                  <ArrowRight size={16} />
                </button>
              )}

              {step === 4 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={isSubmitting || selectedMatch === undefined}
                    onClick={() => handleFinalSubmit(selectedMatch?.isDocumentOnly || false)}
                    style={{
                      background: '#059669',
                      borderColor: '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '44px'
                    }}
                  >
                    <Check size={16} />
                    <span>
                      {isSubmitting
                        ? 'Processing...'
                        : selectedMatch?.isDocumentOnly
                        ? 'Confirm Save Document Only'
                        : `Confirm & Link to ${selectedMatch?.candidate?.entityType || 'Record'}`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* "I Bought Something for Church" Shortcut Modal */}
      {showShortcutModal && (
        <IBoughtSomethingModal
          isOpen={showShortcutModal}
          onClose={() => setShowShortcutModal(false)}
          onSuccess={(res) => {
            setShowShortcutModal(false);
            if (onSuccess) onSuccess(res);
            handleClose();
          }}
          onGoToExpense={onGoToExpense}
        />
      )}
    </>
  );
};

export default SmartUploadModal;
