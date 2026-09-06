import React, { useState, useRef } from 'react';
import { Camera, Image, FileText, X, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { statementImportApi } from '../../api/statementImportApi';
import { processStatementContent, processStatementDocument } from '../../services/statement/statementPipeline';
import './SmartStatementImportModal.css';

export function SmartStatementImportModal({ isOpen, onClose, onSuccess, onViewReviewQueue }) {
  const [step, setStep] = useState('IDLE'); // 'IDLE' | 'ANALYZING' | 'COMPLETE' | 'ERROR'
  const [analyzingMessage, setAnalyzingMessage] = useState('Reading document...');
  const [summary, setSummary] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const cameraInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep('ANALYZING');
    setAnalyzingMessage('Reading document & validating format...');

    try {
      const isPlainText =
        file.type === 'text/plain' ||
        file.type === 'text/csv' ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.csv');

      if (isPlainText) {
        // Plain text / CSV files
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            setAnalyzingMessage('Extracting transactions...');
            const rawContent = String(event.target?.result || '');
            setTimeout(() => setAnalyzingMessage('Classifying & routing...'), 200);

            const result = processStatementContent(rawContent, {
              sourceFileName: file.name,
              sourceDocumentId: `DOC-STMT-${Date.now()}`
            });

            setSummary(result.summary);
            setStep('COMPLETE');
            if (onSuccess) onSuccess(result);
          } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Text statement parsing failed');
            setStep('ERROR');
          }
        };
        reader.onerror = () => {
          setErrorMessage('Failed to read selected text file');
          setStep('ERROR');
        };
        reader.readAsText(file);
      } else {
        // Binary Image (JPEG/PNG/WEBP) or PDF -> Read as DataURL/Base64 for Vision OCR
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            setAnalyzingMessage('Extracting transactions via Vision OCR...');
            const dataUrl = String(event.target?.result || '');
            const mimeType = file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

            setTimeout(() => setAnalyzingMessage('Normalizing banking descriptions & merchants...'), 300);
            setTimeout(() => setAnalyzingMessage('Classifying categories & checking duplicate protection...'), 600);

            const result = await processStatementDocument({
              fileBase64: dataUrl,
              mimeType,
              fileName: file.name,
              sourceDocumentId: `DOC-STMT-${Date.now()}`
            }, {
              sourceFileName: file.name,
              sourceDocumentId: `DOC-STMT-${Date.now()}`
            });

            setSummary(result.summary);
            setStep('COMPLETE');
            if (onSuccess) onSuccess(result);
          } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Vision statement extraction failed');
            setStep('ERROR');
          }
        };
        reader.onerror = () => {
          setErrorMessage('Failed to read statement binary file');
          setStep('ERROR');
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unexpected error during import');
      setStep('ERROR');
    }
  };

  const handleClose = () => {
    setStep('IDLE');
    setSummary(null);
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="statement-modal-overlay" role="dialog" aria-modal="true">
      <div className="statement-modal-card">
        <div className="statement-modal-header">
          <div className="statement-modal-title">
            <FileText size={20} color="#2C3E50" />
            <span>Smart Statement Import</span>
          </div>
          <button type="button" className="statement-modal-close" onClick={handleClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="statement-modal-body">
          {step === 'IDLE' && (
            <div className="statement-upload-actions">
              <p style={{ color: '#4B5563', fontSize: '0.95rem', margin: '0 0 4px 0', lineHeight: '1.4' }}>
                Upload or photograph a bank statement. The system will automatically extract, classify, and route all transactions with <strong>zero manual typing</strong>.
              </p>

              {/* Take Photo (Mobile Camera) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />
              <button
                type="button"
                className="statement-action-btn camera-btn"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera size={20} />
                <span>Take Photo</span>
              </button>

              {/* Choose Screenshot / Photo */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />
              <button
                type="button"
                className="statement-action-btn photo-btn"
                onClick={() => photoInputRef.current?.click()}
              >
                <Image size={20} />
                <span>Choose Photo / Screenshot</span>
              </button>

              {/* Choose PDF */}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf,.pdf,text/plain,.txt,.csv"
                style={{ display: 'none' }}
                onChange={handleFileSelected}
              />
              <button
                type="button"
                className="statement-action-btn pdf-btn"
                onClick={() => pdfInputRef.current?.click()}
              >
                <FileText size={20} />
                <span>Choose PDF / Statement</span>
              </button>
            </div>
          )}

          {step === 'ANALYZING' && (
            <div className="statement-processing-card">
              <div className="statement-spinner" />
              <div className="statement-processing-text">{analyzingMessage}</div>
              <div className="statement-processing-subtext">
                Extracting dates, amounts, vendors, and categories automatically...
              </div>
            </div>
          )}

          {step === 'COMPLETE' && summary && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="statement-summary-header">
                <div className="statement-summary-icon">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#065F46', fontSize: '1.05rem' }}>Import Complete</div>
                  <div style={{ fontSize: '0.85rem', color: '#047857' }}>
                    {summary.totalExtracted} transaction{summary.totalExtracted === 1 ? '' : 's'} extracted from {summary.sourceFileName || 'statement'}
                  </div>
                </div>
              </div>

              <div className="statement-summary-grid">
                <div className="statement-summary-item">
                  <span className="statement-summary-label">Transactions Found</span>
                  <span className="statement-summary-value">{summary.totalExtracted}</span>
                </div>
                <div className="statement-summary-item">
                  <span className="statement-summary-label">Auto-Classified</span>
                  <span className="statement-summary-value" style={{ color: '#059669' }}>
                    {summary.automaticallyClassified}
                  </span>
                </div>
                <div className="statement-summary-item">
                  <span className="statement-summary-label">Matched to Records</span>
                  <span className="statement-summary-value" style={{ color: '#2563EB' }}>
                    {summary.matchedToExisting}
                  </span>
                </div>
                <div className="statement-summary-item">
                  <span className="statement-summary-label">Needs Review</span>
                  <span className="statement-summary-value" style={{ color: summary.needsReview > 0 ? '#D97706' : '#6B7280' }}>
                    {summary.needsReview}
                  </span>
                </div>
              </div>

              <div className="statement-summary-actions">
                <button type="button" className="statement-primary-btn" onClick={handleClose}>
                  Done
                </button>
                {summary.needsReview > 0 && onViewReviewQueue && (
                  <button
                    type="button"
                    className="statement-secondary-btn"
                    onClick={() => {
                      handleClose();
                      onViewReviewQueue();
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <span>View in Review Queue ({summary.needsReview})</span>
                    <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'ERROR' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '16px 0' }}>
              <div style={{ color: '#DC2626', display: 'flex', justifyContent: 'center' }}>
                <AlertTriangle size={40} />
              </div>
              <div style={{ fontWeight: '700', color: '#1F2937' }}>Import Encountered an Error</div>
              <p style={{ color: '#6B7280', fontSize: '0.9rem', margin: 0 }}>{errorMessage}</p>
              <button
                type="button"
                className="statement-primary-btn"
                onClick={() => setStep('IDLE')}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartStatementImportModal;
