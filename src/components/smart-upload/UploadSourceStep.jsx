/*************************************************
 * GPBC Finance Desk — UploadSourceStep.jsx
 * Step A: Source Selection & File Upload with Mobile Camera Support
 *************************************************/

import React, { useRef, useState } from 'react';
import { Camera, Image, FileText, UploadCloud, AlertCircle, Eye, X, ShieldAlert, ShoppingBag } from 'lucide-react';
import { smartUploadApi } from '../../api/smartUploadApi';
import { validateSmartUploadFile } from './fileValidation';

export const UploadSourceStep = ({
  selectedFile,
  onFileSelect,
  filePreviewUrl,
  duplicateWarning,
  onDismissDuplicate,
  onOpenShortcut
}) => {
  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);

  const validateAndProcessFile = (file) => {
    if (!file) return;

    const validation = validateSmartUploadFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file.');
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndProcessFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) validateAndProcessFile(file);
  };

  return (
    <div className="upload-source-step">
      {/* Hidden file inputs for specialized actions */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        aria-label="Take Photo"
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        aria-label="Choose Photo"
      />
      <input
        type="file"
        ref={pdfInputRef}
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        aria-label="Choose PDF"
      />
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        style={{ display: 'none' }}
        onChange={handleInputChange}
        aria-label="Upload File"
      />

      {error && (
        <div className="alert-box alert-error">
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{error}</div>
        </div>
      )}

      {/* Duplicate Warning Prompt */}
      {duplicateWarning && (
        <div className="alert-box alert-warning">
          <ShieldAlert size={20} style={{ flexShrink: 0, marginTop: '2px', color: '#d97706' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: '4px' }}>Possible Duplicate Document Found</div>
            <div style={{ fontSize: '0.8rem', lineHeight: 1.4, marginBottom: '8px' }}>
              {duplicateWarning.reason || 'An existing document with matching content was detected in Document Register.'}
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {duplicateWarning.duplicateDocument?.driveFileUrl && (
                <a
                  href={duplicateWarning.duplicateDocument.driveFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-secondary"
                  style={{ textDecoration: 'none', padding: '4px 8px', fontSize: '0.75rem' }}
                >
                  View Existing
                </a>
              )}
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={onDismissDuplicate}
              >
                Continue Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* If file already selected, show preview */}
      {selectedFile ? (
        <div className="preview-box">
          {filePreviewUrl ? (
            <img
              src={filePreviewUrl}
              alt="Receipt Preview"
              className="preview-thumb"
              onClick={() => setShowLightbox(true)}
              style={{ cursor: 'pointer' }}
              title="Click to zoom preview"
            />
          ) : (
            <div
              className="preview-thumb"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0' }}
            >
              <FileText size={24} color="#64748b" />
            </div>
          )}
          <div className="preview-details">
            <div className="preview-name">{selectedFile.name}</div>
            <div className="preview-size">
              {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {filePreviewUrl && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowLightbox(true)}
                title="View preview"
                aria-label="View preview"
              >
                <Eye size={16} />
              </button>
            )}
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              onClick={() => onFileSelect(null)}
              title="Remove file"
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        /* Source Selection Grid */
        <div
          className={`source-drop-zone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="source-selection-grid">
            <button
              type="button"
              className="source-card"
              onClick={() => cameraInputRef.current?.click()}
            >
              <Camera size={26} color="#059669" />
              <div>
                <div className="source-card-label">Take Photo</div>
                <div className="source-card-subtext">Use camera on mobile</div>
              </div>
            </button>

            <button
              type="button"
              className="source-card"
              onClick={() => photoInputRef.current?.click()}
            >
              <Image size={26} color="#0284c7" />
              <div>
                <div className="source-card-label">Choose Photo</div>
                <div className="source-card-subtext">JPG, PNG, WEBP</div>
              </div>
            </button>

            <button
              type="button"
              className="source-card"
              onClick={() => pdfInputRef.current?.click()}
            >
              <FileText size={26} color="#dc2626" />
              <div>
                <div className="source-card-label">Choose PDF</div>
                <div className="source-card-subtext">Invoices & Statements</div>
              </div>
            </button>

            <button
              type="button"
              className="source-card"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={26} color="#7c3aed" />
              <div>
                <div className="source-card-label">Upload File</div>
                <div className="source-card-subtext">Drag & drop or browse</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Special Quick Action Shortcut */}
      {onOpenShortcut && !selectedFile && (
        <div className="shortcut-banner">
          <div className="shortcut-info">
            <ShoppingBag size={20} color="#059669" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065f46' }}>
                I Bought Something for Church
              </div>
              <div style={{ fontSize: '0.75rem', color: '#047857' }}>
                Quick receipt upload for personal reimbursement
              </div>
            </div>
          </div>
          <button type="button" className="shortcut-btn" onClick={onOpenShortcut}>
            Start Shortcut
          </button>
        </div>
      )}

      {/* Lightbox Modal */}
      {showLightbox && filePreviewUrl && (
        <div
          className="smart-upload-overlay"
          style={{ zIndex: 1300 }}
          onClick={() => setShowLightbox(false)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: '#000000',
              borderRadius: '12px',
              padding: '8px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filePreviewUrl}
              alt="Enlarged Document Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                display: 'block'
              }}
            />
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadSourceStep;
