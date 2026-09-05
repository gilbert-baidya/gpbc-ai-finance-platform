import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ShieldAlert,
  Calendar,
  Clock,
  ChevronRight
} from 'lucide-react';
import { getHelpArticleById, MODULE_GUIDES } from '../help/helpRegistry';
import { useAuth } from '../context/AuthContext';
import './HelpCenter.css';

// Helper to format inline markdown tokens (code, bold, italic)
function formatInlineMarkdown(text) {
  if (!text) return null;
  const codeParts = text.split(/(`[^`]+`)/g);
  return codeParts.map((part, pIdx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) {
      return (
        <code
          key={pIdx}
          style={{
            fontFamily: 'monospace, "Courier New", Courier',
            fontSize: '0.9em',
            background: 'rgba(123, 158, 168, 0.15)',
            color: 'var(--slate-blue-dark, #1F2D38)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 600,
          }}
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length > 3) {
        return (
          <strong key={bIdx} style={{ fontWeight: 700, color: 'var(--slate-blue-dark, #1F2D38)' }}>
            {bPart.slice(2, -2)}
          </strong>
        );
      }

      const italicParts = bPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((iPart, iIdx) => {
        if (iPart.startsWith('*') && iPart.endsWith('*') && iPart.length > 2) {
          return <em key={iIdx} style={{ fontStyle: 'italic' }}>{iPart.slice(1, -1)}</em>;
        }
        return iPart;
      });
    });
  });
}

function renderContentBlock(block, bIdx) {
  const trimmed = block.trim();
  if (
    trimmed.includes('netCovered =') ||
    trimmed.includes('remainingBalance =') ||
    trimmed.includes('Audit Health Score =')
  ) {
    return (
      <div
        key={bIdx}
        style={{
          margin: '14px 0',
          background: '#EFF6FF',
          borderLeft: '4px solid var(--slate-blue, #2C3E50)',
          borderRadius: '0 8px 8px 0',
          padding: '12px 16px',
          fontFamily: 'monospace, "Courier New", Courier',
          fontSize: '0.92rem',
          color: 'var(--slate-blue-dark, #1F2D38)',
          lineHeight: 1.6
        }}
      >
        {trimmed.split('\n').map((line, lIdx) => (
          <div key={lIdx} style={{ fontWeight: line.includes('=') ? 700 : 500 }}>
            {line}
          </div>
        ))}
      </div>
    );
  }

  const lines = trimmed.split('\n');
  return (
    <div key={bIdx} style={{ margin: '0 0 14px 0' }}>
      {lines.map((line, lIdx) => {
        const lineTrimmed = line.trim();
        if (!lineTrimmed) {
          return <div key={lIdx} style={{ height: '6px' }} />;
        }
        if (lineTrimmed.startsWith('### ')) {
          return (
            <h4
              key={lIdx}
              style={{
                fontSize: '1.05rem',
                fontWeight: 750,
                color: 'var(--slate-blue-dark, #1F2D38)',
                margin: '16px 0 8px 0'
              }}
            >
              {formatInlineMarkdown(lineTrimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }
        if (lineTrimmed.startsWith('- ') || lineTrimmed.startsWith('* ')) {
          return (
            <div
              key={lIdx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                margin: '4px 0',
                paddingLeft: '10px',
                lineHeight: 1.6
              }}
            >
              <span style={{ color: 'var(--slate-blue, #2C3E50)', fontWeight: 700, lineHeight: 1.4 }}>•</span>
              <span>{formatInlineMarkdown(lineTrimmed.replace(/^[-*]\s+/, ''))}</span>
            </div>
          );
        }
        if (/^\d+\.\s+/.test(lineTrimmed)) {
          const match = lineTrimmed.match(/^(\d+)\.\s+(.*)$/);
          const num = match ? match[1] : '';
          const rest = match ? match[2] : lineTrimmed;
          return (
            <div
              key={lIdx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                margin: '5px 0',
                paddingLeft: '10px',
                lineHeight: 1.6
              }}
            >
              <span style={{ color: 'var(--slate-blue, #2C3E50)', fontWeight: 700, minWidth: '18px' }}>{num}.</span>
              <span>{formatInlineMarkdown(rest)}</span>
            </div>
          );
        }
        return (
          <p key={lIdx} style={{ margin: '0 0 8px 0', lineHeight: 1.65 }}>
            {formatInlineMarkdown(lineTrimmed)}
          </p>
        );
      })}
    </div>
  );
}

export const HelpArticleView = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthorized } = useAuth();
  const isPresbyter = user?.role === 'Presbyter Read-Only';

  const article = getHelpArticleById(articleId || '');

  if (!article) {
    return (
      <div className="help-center-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <ShieldAlert size={48} style={{ color: '#DC2626', margin: '0 auto 16px auto' }} />
        <h2>Help Article Not Found</h2>
        <p style={{ color: 'var(--warm-gray)', marginBottom: '24px' }}>
          The requested training guide could not be located.
        </p>
        <button
          type="button"
          onClick={() => navigate('/help')}
          className="help-link-button"
        >
          <ArrowLeft size={16} />
          <span>Return to Help Center</span>
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  // Determine if this user role can access the actual live module
  const canAccessLiveRoute = Boolean(
    article.route && (
      isPresbyter ? article.route === '/presbyter-reports' : true
    )
  );

  return (
    <div className="help-center-container">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="help-print-hide" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/help')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            color: 'var(--slate-blue, #2C3E50)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            padding: '6px 0'
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Help & Training</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {canAccessLiveRoute && article.route && (
            <Link
              to={article.route}
              className="help-link-button"
              style={{ background: 'var(--slate-blue, #2C3E50)', color: '#FFFFFF' }}
            >
              <span>Go to {article.title.split('&')[0]} Module</span>
              <ExternalLink size={14} />
            </Link>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="help-link-button"
            title="Print Article"
            aria-label="Print Article"
          >
            <Printer size={15} />
            <span>Print Guide</span>
          </button>
        </div>
      </div>

      {/* Article Header */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid var(--mist-blue-dark, #D9E8EC)',
        borderRadius: '12px',
        padding: '28px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <span className="help-drawer-badge">
            <BookOpen size={12} />
            {article.category.toUpperCase().replace('-', ' ')}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--warm-gray)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            {article.readTimeMinutes} min read
          </span>
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--slate-blue-dark)', margin: '0 0 12px 0' }}>
          {article.title}
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--slate-blue-light)', lineHeight: 1.5, margin: 0 }}>
          {article.summary}
        </p>
      </div>

      {/* Main Content Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '24px' }}>
        {/* Purpose & When to Use */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-blue)', margin: '0 0 12px 0' }}>
            Purpose & Ministry Role
          </h3>
          <p style={{ lineHeight: 1.6, color: 'var(--slate-blue-dark)', margin: '0 0 16px 0' }}>
            {article.purpose}
          </p>
          <div style={{
            background: 'var(--ivory-warm)',
            borderLeft: '4px solid var(--gold)',
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0',
            fontSize: '0.92rem',
            color: 'var(--slate-blue-dark)'
          }}>
            <strong>When to use:</strong> {article.whenToUse}
          </div>
        </div>

        {/* Quick Steps */}
        {article.quickSteps && article.quickSteps.length > 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-blue)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ color: 'var(--forest-green)' }} />
              Recommended Workflow Steps
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {article.quickSteps.map((step, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div className="help-step-num">{idx + 1}</div>
                  <div style={{ fontSize: '0.95rem', lineHeight: 1.5, color: 'var(--slate-blue-dark)' }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* In-Depth Sections */}
        {article.sections && article.sections.map((section, idx) => (
          <div key={idx} style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--slate-blue-dark)', margin: '0 0 14px 0' }}>
              {section.title}
            </h3>
            <div style={{ fontSize: '0.96rem', lineHeight: 1.65, color: 'var(--slate-blue-dark)' }}>
              {section.content.split('\n\n').map((block, bIdx) => renderContentBlock(block, bIdx))}
            </div>
          </div>
        ))}

        {/* Key Fields */}
        {article.keyFields && article.keyFields.length > 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '12px', padding: '24px', overflowX: 'auto' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-blue)', margin: '0 0 16px 0' }}>
              Important Fields & Definitions
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--mist-blue)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--mist-blue-dark)' }}>Field Name</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--mist-blue-dark)' }}>Requirement</th>
                  <th style={{ padding: '10px 14px', borderBottom: '1px solid var(--mist-blue-dark)' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                {article.keyFields.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--mist-blue-dark)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--slate-blue-dark)' }}>{f.fieldName}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: f.required ? '#FEE2E2' : '#F3F4F6',
                        color: f.required ? '#991B1B' : '#4B5563'
                      }}>
                        {f.required ? 'REQUIRED' : 'OPTIONAL'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--slate-blue-light)' }}>{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Common Mistakes */}
        {article.commonMistakes && article.commonMistakes.length > 0 && (
          <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#9A3412', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} style={{ color: '#C2410C' }} />
              Common Accounting Mistakes to Avoid
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {article.commonMistakes.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.92rem', color: '#7C2D12', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700 }}>•</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Status Meanings */}
        {article.statusMeanings && article.statusMeanings.length > 0 && (
          <div style={{ background: '#FFFFFF', border: '1px solid var(--mist-blue-dark)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--slate-blue)', margin: '0 0 16px 0' }}>
              Status Meanings in this Module
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {article.statusMeanings.map((s, i) => (
                <div key={i} style={{
                  padding: '14px',
                  borderRadius: '8px',
                  background: 'var(--ivory-warm)',
                  border: '1px solid var(--mist-blue-dark)'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--slate-blue-dark)', marginBottom: '4px' }}>
                    {s.status}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--slate-blue-light)', lineHeight: 1.4 }}>
                    {s.description}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Articles */}
        {article.relatedArticleIds && article.relatedArticleIds.length > 0 && (
          <div className="help-print-hide" style={{
            background: '#FFFFFF',
            border: '1px solid var(--mist-blue-dark)',
            borderRadius: '12px',
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--slate-blue)', margin: '0 0 14px 0' }}>
              Related Guides & Topics
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {article.relatedArticleIds.map((relId) => {
                const relArticle = getHelpArticleById(relId);
                if (!relArticle) return null;
                return (
                  <Link
                    key={relId}
                    to={`/help/${relArticle.id}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'var(--mist-blue)',
                      color: 'var(--slate-blue-dark)',
                      textDecoration: 'none',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      border: '1px solid var(--mist-blue-dark)'
                    }}
                  >
                    <span>{relArticle.title}</span>
                    <ChevronRight size={14} />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="help-footer">
        <span>GPBC Finance Desk User Guide • Version 1.0</span>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ background: 'transparent', border: 'none', color: 'var(--slate-blue)', cursor: 'pointer', fontWeight: 600 }}
        >
          Back to Top ↑
        </button>
      </footer>
    </div>
  );
};

export default HelpArticleView;
