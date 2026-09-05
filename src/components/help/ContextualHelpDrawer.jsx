import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ExternalLink, AlertTriangle, Lightbulb, CheckCircle2, BookOpen } from 'lucide-react';
import './ContextualHelpDrawer.css';

export const ContextualHelpDrawer = ({
  isOpen,
  onClose,
  article
}) => {
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !article) return null;

  const handleOpenFullGuide = () => {
    onClose();
    navigate(`/help/${article.id}`);
  };

  return (
    <div
      className="help-drawer-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${article.title} Help Guide`}
    >
      <div
        className="help-drawer"
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="help-drawer-header">
          <div className="help-drawer-title-group">
            <span className="help-drawer-badge">
              <BookOpen size={12} />
              Page Guidance
            </span>
            <h2 className="help-drawer-title">{article.title}</h2>
          </div>
          <button
            type="button"
            className="help-drawer-close"
            onClick={onClose}
            aria-label="Close help drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="help-drawer-body">
          {/* Purpose / Summary */}
          <div className="help-drawer-summary-card">
            <strong>Purpose:</strong> {article.purpose || article.summary}
          </div>

          {/* Quick Steps */}
          {article.quickSteps && article.quickSteps.length > 0 && (
            <div>
              <div className="help-drawer-section-heading">
                <CheckCircle2 size={14} style={{ color: 'var(--forest-green, #137333)' }} />
                Quick Steps
              </div>
              <ul className="help-step-list">
                {article.quickSteps.map((step, idx) => (
                  <li key={idx} className="help-step-item">
                    <span className="help-step-num">{idx + 1}</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Common Mistakes */}
          {article.commonMistakes && article.commonMistakes.length > 0 && (
            <div>
              <div className="help-drawer-section-heading">
                <AlertTriangle size={14} style={{ color: '#DC2626' }} />
                Common Mistakes to Avoid
              </div>
              {article.commonMistakes.map((mistake, idx) => (
                <div key={idx} className="help-mistake-card">
                  <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{mistake}</span>
                </div>
              ))}
            </div>
          )}

          {/* Important Tip Callout */}
          {article.sections && article.sections.length > 0 && (
            <div>
              <div className="help-drawer-section-heading">
                <Lightbulb size={14} style={{ color: '#D97706' }} />
                Key Accounting Principle
              </div>
              <div className="help-tip-card">
                <Lightbulb size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>{article.sections[0].title}:</strong>
                  <div style={{ marginTop: '4px' }}>
                    {article.sections[0].content.split('\n')[0]}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="help-drawer-footer">
          <button
            type="button"
            className="help-link-button"
            onClick={handleOpenFullGuide}
          >
            <span>Open In-Depth User Guide</span>
            <ExternalLink size={14} />
          </button>
          <button
            type="button"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--warm-gray, #6B7280)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              padding: '8px'
            }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextualHelpDrawer;
