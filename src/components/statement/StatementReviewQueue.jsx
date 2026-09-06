import React, { useState, useEffect } from 'react';
import { Clock, Check, Trash2, AlertCircle, FileText } from 'lucide-react';
import { statementImportApi } from '../../api/statementImportApi';
import { vendorLearningStore } from '../../services/statement/vendorLearningStore';
import './StatementReviewQueue.css';

export function StatementReviewQueue({ onQueueUpdated }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState({});

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await statementImportApi.getStagedStatementLines({ status: 'NEEDS_REVIEW' });
      if (res && res.lines) {
        setItems(res.lines);
      }
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleConfirm = async (item) => {
    const chosenCategory = selectedCategories[item.tempId] || item.category || 'General Operations';

    // Update vendor learning memory
    if (item.merchantOrPayee && chosenCategory !== 'Needs Classification') {
      vendorLearningStore.learnMapping(
        item.merchantOrPayee,
        item.merchantOrPayee,
        chosenCategory,
        item.businessPurpose || `${chosenCategory} for ${item.merchantOrPayee}`,
        'HIGH',
        'MANUAL_APPROVAL'
      );
    }

    try {
      await statementImportApi.resolveStagedStatementLine({
        lineId: item.tempId,
        action: 'CONFIRM',
        category: chosenCategory
      });
    } catch {
      // Offline/sandbox handled
    }

    setItems(prev => prev.filter(i => i.tempId !== item.tempId));
    if (onQueueUpdated) onQueueUpdated();
  };

  const handleDismiss = async (item) => {
    try {
      await statementImportApi.resolveStagedStatementLine({
        lineId: item.tempId,
        action: 'DISMISS'
      });
    } catch {
      // Offline/sandbox handled
    }
    setItems(prev => prev.filter(i => i.tempId !== item.tempId));
    if (onQueueUpdated) onQueueUpdated();
  };

  if (loading) {
    return (
      <div className="review-queue-container" style={{ textAlign: 'center', color: '#6B7280', padding: '32px' }}>
        Loading statement review queue...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="review-queue-container" style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{ color: '#059669', marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
          <Check size={32} />
        </div>
        <div style={{ fontWeight: '700', color: '#111827', fontSize: '1.05rem' }}>Review Queue Clear</div>
        <p style={{ color: '#6B7280', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
          All imported statement records have been classified and processed.
        </p>
      </div>
    );
  }

  return (
    <div className="review-queue-container">
      <div className="review-queue-header">
        <div className="review-queue-title">
          <Clock size={20} color="#D97706" />
          <span>Statement Review Queue</span>
          <span className="review-queue-badge">{items.length} Pending</span>
        </div>
        <div style={{ fontSize: '0.85rem', color: '#6B7280' }}>
          Review ambiguous or post-close statement items at your convenience.
        </div>
      </div>

      <div className="review-queue-list">
        {items.map((item) => (
          <div key={item.tempId} className="review-queue-card">
            <div className="review-card-top">
              <span className="review-card-vendor">{item.merchantOrPayee || 'Unidentified Merchant'}</span>
              <span className={`review-card-amount ${item.direction === 'EXPENSE' ? 'expense' : 'income'}`}>
                {item.direction === 'EXPENSE' ? '-' : '+'}${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="review-card-meta">
              <span>Date: <strong>{item.transactionDate}</strong></span>
              <span>Channel: <strong>{item.paymentChannel}</strong></span>
              {item.isClosedPeriod && (
                <span className="review-card-tag warning">
                  <AlertCircle size={12} style={{ marginRight: '4px' }} />
                  Post-Close Period
                </span>
              )}
              {item.isRefund && (
                <span className="review-card-tag info">Refund/Reversal</span>
              )}
              {item.isDuplicate && (
                <span className="review-card-tag warning">Probable Duplicate</span>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#4B5563', background: '#FFFFFF', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
              <div style={{ fontWeight: '600', marginBottom: '2px', color: '#374151' }}>Purpose:</div>
              {item.businessPurpose || item.cleanDescription}
            </div>

            <div className="review-card-actions">
              <button
                type="button"
                className="review-action-btn dismiss"
                onClick={() => handleDismiss(item)}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="review-action-btn confirm"
                onClick={() => handleConfirm(item)}
              >
                Confirm & Learn
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StatementReviewQueue;
