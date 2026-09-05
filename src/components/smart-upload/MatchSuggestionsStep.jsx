/*************************************************
 * GPBC Finance Desk — MatchSuggestionsStep.jsx
 * Step D: Deterministic Match Suggestions & Selection
 * Human confirmation is strictly required (no auto-link)
 *************************************************/

import React from 'react';
import { CheckCircle2, Search, AlertCircle, FileCheck2, ArrowRight } from 'lucide-react';

export const MatchSuggestionsStep = ({
  suggestions = [],
  selectedMatch,
  onSelectMatch,
  loading = false,
  onGoToExpense
}) => {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
        <Search size={32} className="animate-spin" style={{ margin: '0 auto 12px auto', color: '#059669' }} />
        <div style={{ fontWeight: 600 }}>Searching for matching finance records...</div>
        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
          Comparing amount, date proximity, and normalized vendor names
        </div>
      </div>
    );
  }

  return (
    <div className="match-suggestions-step">
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>
          Possible Matches ({suggestions.length})
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
          Select the existing finance record this document supports, or choose to save without linking.
        </div>
      </div>

      {suggestions.length === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '12px',
            marginBottom: '16px'
          }}
        >
          <AlertCircle size={28} color="#64748b" style={{ margin: '0 auto 8px auto' }} />
          <div style={{ fontWeight: 600, color: '#1e293b' }}>No Matching Finance Record Found</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', maxWidth: '380px', margin: '4px auto 16px auto' }}>
            No existing transaction, expense, or reimbursement matches these details. You can save the document to Document Center now and link it later.
          </div>
          {onGoToExpense && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={onGoToExpense}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Go to Record Expense</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="suggestions-list" role="radiogroup" aria-label="Candidate matches">
          {suggestions.map((item) => {
            const { candidate, score, confidenceLabel, reasons } = item;
            const isSelected = selectedMatch?.candidate?.id === candidate.id;

            let badgeClass = 'badge-weak';
            if (confidenceLabel === 'Strong Match') badgeClass = 'badge-strong';
            else if (confidenceLabel === 'Possible Match') badgeClass = 'badge-possible';

            return (
              <div
                key={candidate.id}
                className={`match-card ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectMatch(item)}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === ' ' || e.key === 'Enter') onSelectMatch(item);
                }}
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
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>
                      {candidate.displayTitle}
                    </span>
                  </div>
                  <span className={`match-badge ${badgeClass}`}>{confidenceLabel}</span>
                </div>

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#475569', marginLeft: '26px' }}>
                  {candidate.amount != null && (
                    <div>
                      <strong>Amount:</strong> ${candidate.amount.toFixed(2)}
                    </div>
                  )}
                  {candidate.date && (
                    <div>
                      <strong>Date:</strong> {candidate.date}
                    </div>
                  )}
                  <div>
                    <strong>Type:</strong> {candidate.entityType} ({candidate.entityId})
                  </div>
                </div>

                {reasons && reasons.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: '#059669', marginLeft: '26px' }}>
                    ✓ {reasons.join(' • ')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Option to Save Document Only (Unlinked) */}
      {(() => {
        const isDocOnlySelected = selectedMatch === 'DOCUMENT_ONLY' || selectedMatch?.isDocumentOnly === true;
        return (
          <div
            className={`match-card ${isDocOnlySelected ? 'selected' : ''}`}
            onClick={() => onSelectMatch({ isDocumentOnly: true, candidate: null })}
            role="radio"
            aria-checked={isDocOnlySelected}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onSelectMatch({ isDocumentOnly: true, candidate: null });
              }
            }}
            style={{ marginTop: '12px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: isDocOnlySelected ? '5px solid #059669' : '2px solid #cbd5e1',
                  background: '#ffffff',
                  flexShrink: 0
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                  Save to Document Center Only
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Upload and store master document record without linking to a finance record right now.
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default MatchSuggestionsStep;
