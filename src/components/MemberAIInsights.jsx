import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Loader } from 'lucide-react';
import { usePredictiveGiving, useDonorJourney } from '../hooks/usePhase4AI';
import './MemberAIInsights.css';

/**
 * MemberAIInsights - Member-Level AI Intelligence Panel
 * Phase 4: Shows predictive giving and donor journey for individual members
 * 
 * Features:
 * - Giving predictions (next 3 months)
 * - Donor journey stage
 * - Decline risk indicator
 * - Consistency score
 * - Engagement momentum
 * 
 * Usage: <MemberAIInsights memberId="M001" />
 */
export default function MemberAIInsights({ memberId }) {
  const prediction = usePredictiveGiving(memberId, 3);
  const journey = useDonorJourney(memberId);

  const isLoading = prediction.loading || journey.loading;
  const hasError = prediction.error || journey.error;

  if (!memberId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="member-ai-insights loading">
        <Loader size={20} className="animate-spin" />
        <span>Loading AI insights...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="member-ai-insights error">
        <AlertTriangle size={18} />
        <span>AI insights temporarily unavailable</span>
      </div>
    );
  }

  if (!prediction.data && !journey.data) {
    return null;
  }

  return (
    <div className="member-ai-insights">
      
      {/* DONOR JOURNEY STAGE */}
      {journey.data && (
        <div className="ai-insight-section">
          <h4 className="ai-insight-title">Donor Journey</h4>
          <div className="journey-stage-display">
            <span className={`journey-stage-badge stage-${journey.data.journeyStage?.toLowerCase().replace(/\s+/g, '-')}`}>
              {journey.data.journeyStage}
            </span>
            <div className="journey-momentum">
              {getMomentumIcon(journey.data.engagementMomentum)}
              <span className="journey-momentum-label">{journey.data.engagementMomentum}</span>
            </div>
          </div>
          {journey.data.insights && (
            <p className="ai-insight-text">{journey.data.insights}</p>
          )}
        </div>
      )}

      {/* PREDICTIVE GIVING */}
      {prediction.data && (
        <div className="ai-insight-section">
          <h4 className="ai-insight-title">Giving Prediction (Next 3 Months)</h4>
          
          {/* Key Metrics */}
          <div className="prediction-metrics">
            <div className="prediction-metric">
              <span className="metric-label">Decline Risk</span>
              <span className={`metric-value risk-${getRiskLevel(prediction.data.declineRisk)}`}>
                {prediction.data.declineRisk}%
              </span>
            </div>
            <div className="prediction-metric">
              <span className="metric-label">Consistency</span>
              <span className="metric-value">
                {prediction.data.consistencyScore}/100
              </span>
            </div>
            <div className="prediction-metric">
              <span className="metric-label">Frequency</span>
              <span className="metric-value">
                {prediction.data.givingFrequency}
              </span>
            </div>
          </div>

          {/* Monthly Predictions */}
          {prediction.data.predictions && prediction.data.predictions.length > 0 && (
            <div className="prediction-timeline">
              {prediction.data.predictions.map((pred, idx) => (
                <div key={idx} className="prediction-month">
                  <div className="prediction-month-label">{pred.month}</div>
                  <div className="prediction-amount-range">
                    <span className="amount-low">${pred.predictedAmountLow}</span>
                    <span className="amount-expected">${pred.predictedAmountExpected}</span>
                    <span className="amount-high">${pred.predictedAmountHigh}</span>
                  </div>
                  <div className="prediction-probability">
                    {Math.round(pred.probability * 100)}% confidence
                  </div>
                </div>
              ))}
            </div>
          )}

          {prediction.data.insights && (
            <p className="ai-insight-text">{prediction.data.insights}</p>
          )}
        </div>
      )}

      {/* LAST GIFT INFO */}
      {prediction.data && (
        <div className="ai-insight-section compact">
          <div className="last-gift-info">
            <span>Last Gift: ${prediction.data.lastGiftAmount} on {formatDate(prediction.data.lastGiftDate)}</span>
            <span>Total Given: ${prediction.data.totalGiven?.toLocaleString()}</span>
          </div>
        </div>
      )}

    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getMomentumIcon(momentum) {
  if (momentum === 'Positive') return <TrendingUp size={16} className="text-green-600" />;
  if (momentum === 'Negative') return <TrendingDown size={16} className="text-red-600" />;
  return <Minus size={16} className="text-gray-600" />;
}

function getRiskLevel(riskPercentage) {
  if (riskPercentage < 20) return 'low';
  if (riskPercentage < 50) return 'medium';
  return 'high';
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
