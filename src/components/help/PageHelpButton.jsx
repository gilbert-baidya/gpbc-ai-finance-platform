import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import { getHelpArticleByRoute, getHelpArticleById } from '../../help/helpRegistry';
import { ContextualHelpDrawer } from './ContextualHelpDrawer';

export const PageHelpButton = ({
  pageKey,
  label = 'Page Guide',
  variant = 'pill',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Resolve the article either by explicit pageKey or current route
  const article = pageKey 
    ? getHelpArticleById(pageKey) 
    : getHelpArticleByRoute(location.pathname);

  // If no article matches (e.g. on /help itself), do not show contextual help button
  if (!article) return null;

  return (
    <>
      {variant === 'header' ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`page-help-header-btn ${className}`}
          title={`How to use ${article.title}`}
          aria-label={`Open help guide for ${article.title}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            background: 'rgba(44, 62, 80, 0.06)',
            border: '1px solid rgba(44, 62, 80, 0.15)',
            borderRadius: '8px',
            color: 'var(--slate-blue, #2C3E50)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <CircleHelp size={16} />
          <span className="page-help-btn-text">{label}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`page-help-btn ${className}`}
          title={`How to use this page (${article.title})`}
          aria-label={`Open help guide for ${article.title}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            background: 'var(--mist-blue, #EBF3F5)',
            border: '1px solid var(--mist-blue-dark, #D9E8EC)',
            borderRadius: '16px',
            color: 'var(--slate-blue, #2C3E50)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <CircleHelp size={15} />
          <span>{label}</span>
        </button>
      )}

      <ContextualHelpDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        article={article}
      />
    </>
  );
};

export default PageHelpButton;
