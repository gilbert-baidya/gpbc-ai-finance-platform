import React, { useState, useEffect } from 'react';
import { 
  Brain, TrendingUp, AlertTriangle, Target, Lightbulb, 
  Calendar, Shield, Activity, Loader, RefreshCw, Download,
  ChevronRight, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import {
  useMinistryForecast,
  useMinistryRecommendations,
  useFinancialRiskMonitor,
  useOutreachOpportunities,
  useEngagementIndicators
} from '../hooks/usePhase4AI';
import { errorToast, successToast } from '../utils/toast';
import './PastoralIntelligence.css';

/**
 * PastoralIntelligence - Executive AI Dashboard
 * Phase 4: Autonomous Church Intelligence
 * 
 * Features:
 * - Church Momentum Score
 * - Ministry Health Forecast (3-month, 6-month)
 * - Giving Prediction Curve
 * - Financial Risk Alerts (GREEN/YELLOW/RED)
 * - AI Ministry Recommendations
 * - Outreach Opportunity Calendar
 * - Spiritual Engagement Indicators (Ethical)
 * 
 * Design: Executive/Board friendly, printable reports
 * Ethics: Advisory only, no personal spiritual judgement
 */
export default function PastoralIntelligence() {
  const [refreshing, setRefreshing] = useState(false);

  const forecast = useMinistryForecast();
  const recommendations = useMinistryRecommendations();
  const riskMonitor = useFinancialRiskMonitor();
  const opportunities = useOutreachOpportunities();
  const engagement = useEngagementIndicators();

  const isLoading = 
    forecast.loading || 
    recommendations.loading || 
    riskMonitor.loading || 
    opportunities.loading || 
    engagement.loading;

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        forecast.refresh(),
        recommendations.refresh(),
        riskMonitor.refresh(),
        opportunities.refresh(),
        engagement.refresh()
      ]);
      successToast('Intelligence data refreshed');
    } catch (err) {
      errorToast('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportReport = () => {
    window.print();
  };

  if (isLoading && !forecast.data) {
    return (
      <div className="pastoral-intelligence-loading">
        <Loader size={48} className="animate-spin text-indigo-600" />
        <p className="mt-4 text-gray-600">Loading Intelligence Dashboard...</p>
      </div>
    );
  }

  // Calculate Church Momentum Score (0-100)
  const churchMomentum = calculateChurchMomentum(
    forecast.data,
    riskMonitor.data,
    engagement.data
  );

  return (
    <div className="pastoral-intelligence-dashboard">
      
      {/* HEADER */}
      <div className="pastoral-header">
        <div className="pastoral-header-content">
          <div className="pastoral-header-icon">
            <Brain size={32} className="text-white" />
          </div>
          <div>
            <h1 className="pastoral-title">Pastoral Intelligence</h1>
            <p className="pastoral-subtitle">
              AI-Powered Strategic Decision Dashboard • Phase 4 Autonomous Intelligence
            </p>
          </div>
        </div>
        <div className="pastoral-header-actions no-print">
          <button 
            onClick={handleRefreshAll} 
            disabled={refreshing}
            className="pastoral-btn-secondary"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh Data
          </button>
          <button 
            onClick={handleExportReport}
            className="pastoral-btn-primary"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* MOMENTUM SCORE HERO */}
      <div className="momentum-hero">
        <div className="momentum-score-circle">
          <div className="momentum-score-value">{churchMomentum}</div>
          <div className="momentum-score-label">Church Momentum</div>
        </div>
        <div className="momentum-insights">
          <MomentumInsight 
            label="Ministry Health"
            value={forecast.data?.threeMonthScore || 'N/A'}
            trend={forecast.data?.trend || 'stable'}
          />
          <MomentumInsight 
            label="Financial Risk"
            value={riskMonitor.data?.level || 'UNKNOWN'}
            trend={getRiskTrend(riskMonitor.data?.level)}
          />
          <MomentumInsight 
            label="Engagement"
            value={engagement.data?.stabilityIndex || 'N/A'}
            trend={engagement.data?.trend || 'stable'}
          />
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="pastoral-grid">
        
        {/* FINANCIAL RISK ALERTS */}
        <div className="pastoral-card pastoral-card-full">
          <div className="pastoral-card-header">
            <div className="pastoral-card-icon-header">
              <Shield className="text-red-500" />
              <h2>Financial Risk Monitor</h2>
            </div>
            <RiskLevelBadge level={riskMonitor.data?.level || 'UNKNOWN'} />
          </div>
          <div className="pastoral-card-body">
            {riskMonitor.error ? (
              <div className="pastoral-error">{riskMonitor.error}</div>
            ) : (
              <RiskAlertPanel data={riskMonitor.data} />
            )}
          </div>
        </div>

        {/* MINISTRY FORECAST */}
        <div className="pastoral-card">
          <div className="pastoral-card-header">
            <div className="pastoral-card-icon-header">
              <TrendingUp className="text-blue-500" />
              <h2>Ministry Health Forecast</h2>
            </div>
          </div>
          <div className="pastoral-card-body">
            {forecast.error ? (
              <div className="pastoral-error">{forecast.error}</div>
            ) : (
              <ForecastPanel data={forecast.data} />
            )}
          </div>
        </div>

        {/* AI MINISTRY RECOMMENDATIONS */}
        <div className="pastoral-card">
          <div className="pastoral-card-header">
            <div className="pastoral-card-icon-header">
              <Lightbulb className="text-amber-500" />
              <h2>AI Ministry Recommendations</h2>
            </div>
          </div>
          <div className="pastoral-card-body">
            {recommendations.error ? (
              <div className="pastoral-error">{recommendations.error}</div>
            ) : (
              <RecommendationsPanel data={recommendations.data} />
            )}
          </div>
        </div>

        {/* OUTREACH OPPORTUNITY CALENDAR */}
        <div className="pastoral-card pastoral-card-full">
          <div className="pastoral-card-header">
            <div className="pastoral-card-icon-header">
              <Calendar className="text-green-500" />
              <h2>Outreach Opportunity Calendar</h2>
            </div>
          </div>
          <div className="pastoral-card-body">
            {opportunities.error ? (
              <div className="pastoral-error">{opportunities.error}</div>
            ) : (
              <OpportunityCalendar data={opportunities.data} />
            )}
          </div>
        </div>

        {/* ENGAGEMENT INDICATORS */}
        <div className="pastoral-card">
          <div className="pastoral-card-header">
            <div className="pastoral-card-icon-header">
              <Activity className="text-purple-500" />
              <h2>Engagement Indicators</h2>
            </div>
          </div>
          <div className="pastoral-card-body">
            {engagement.error ? (
              <div className="pastoral-error">{engagement.error}</div>
            ) : (
              <EngagementPanel data={engagement.data} />
            )}
          </div>
        </div>

      </div>

      {/* ETHICS DISCLAIMER */}
      <div className="pastoral-ethics-banner">
        <Shield size={18} />
        <span>
          <strong>Data Ethics:</strong> This AI system is advisory only. 
          No personal spiritual judgements are made. Data is used solely for ministry 
          stewardship planning and financial sustainability.
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function MomentumInsight({ label, value, trend }) {
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  
  return (
    <div className="momentum-insight">
      <div className="momentum-insight-label">{label}</div>
      <div className="momentum-insight-value">
        <span>{value}</span>
        <span className={`momentum-trend ${trendColor}`}>{trendIcon}</span>
      </div>
    </div>
  );
}

function RiskLevelBadge({ level }) {
  const config = {
    'GREEN': { bg: 'bg-green-100', text: 'text-green-800', label: 'Low Risk' },
    'YELLOW': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Moderate Risk' },
    'RED': { bg: 'bg-red-100', text: 'text-red-800', label: 'High Risk' },
    'UNKNOWN': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' }
  };
  
  const style = config[level] || config.UNKNOWN;
  
  return (
    <span className={`risk-badge ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function RiskAlertPanel({ data }) {
  if (!data) {
    return <div className="pastoral-empty">No risk data available</div>;
  }

  const alerts = data.alerts || [];
  
  return (
    <div className="risk-alert-panel">
      {data.narrative && (
        <div className="risk-narrative">{data.narrative}</div>
      )}
      
      {alerts.length > 0 ? (
        <div className="risk-alerts-list">
          {alerts.map((alert, idx) => (
            <div key={idx} className="risk-alert-item">
              <div className="risk-alert-header">
                <AlertTriangle size={18} className="text-red-500" />
                <strong>{alert.type}</strong>
              </div>
              <p className="risk-alert-description">{alert.description}</p>
              {alert.suggestedAction && (
                <div className="risk-alert-action">
                  <ChevronRight size={16} />
                  <span>Suggested: {alert.suggestedAction}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="pastoral-success">
          <CheckCircle size={24} className="text-green-500" />
          <span>No financial risks detected</span>
        </div>
      )}
    </div>
  );
}

function ForecastPanel({ data }) {
  if (!data) {
    return <div className="pastoral-empty">No forecast data available</div>;
  }

  return (
    <div className="forecast-panel">
      <div className="forecast-metrics">
        <div className="forecast-metric">
          <div className="forecast-metric-label">3-Month Sustainability</div>
          <div className="forecast-metric-value">{data.threeMonthScore || 'N/A'}</div>
        </div>
        <div className="forecast-metric">
          <div className="forecast-metric-label">6-Month Risk</div>
          <div className="forecast-metric-value">{data.sixMonthRisk || 'N/A'}</div>
        </div>
        <div className="forecast-metric">
          <div className="forecast-metric-label">Growth Momentum</div>
          <div className="forecast-metric-value">{data.growthMomentum || 'N/A'}</div>
        </div>
      </div>
      
      {data.insights && (
        <div className="forecast-insights">
          <p>{data.insights}</p>
        </div>
      )}
    </div>
  );
}

function RecommendationsPanel({ data }) {
  if (!data || data.length === 0) {
    return <div className="pastoral-empty">No recommendations at this time</div>;
  }

  return (
    <div className="recommendations-list">
      {data.map((rec, idx) => (
        <div key={idx} className="recommendation-item">
          <div className="recommendation-header">
            <Target size={18} className="text-amber-500" />
            <strong>{rec.title || 'Recommendation'}</strong>
          </div>
          <p className="recommendation-description">{rec.description}</p>
          {rec.priority && (
            <span className={`recommendation-priority priority-${rec.priority.toLowerCase()}`}>
              {rec.priority}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function OpportunityCalendar({ data }) {
  if (!data || data.length === 0) {
    return <div className="pastoral-empty">No opportunities identified</div>;
  }

  return (
    <div className="opportunity-calendar">
      {data.map((opp, idx) => (
        <div key={idx} className="opportunity-item">
          <div className="opportunity-date">
            <div className="opportunity-month">{opp.month || 'TBD'}</div>
            <div className="opportunity-score">Score: {opp.score || 'N/A'}</div>
          </div>
          <div className="opportunity-details">
            <h3>{opp.type || 'Opportunity'}</h3>
            <p>{opp.description}</p>
            {opp.reasoning && (
              <div className="opportunity-reasoning">
                <ChevronRight size={16} />
                <span>{opp.reasoning}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EngagementPanel({ data }) {
  if (!data) {
    return <div className="pastoral-empty">No engagement data available</div>;
  }

  return (
    <div className="engagement-panel">
      <div className="engagement-score-display">
        <div className="engagement-score-large">{data.stabilityIndex || 'N/A'}</div>
        <div className="engagement-score-label">Engagement Stability Index</div>
      </div>
      
      <div className="engagement-metrics">
        {data.attendanceRate && (
          <div className="engagement-metric">
            <span>Attendance Participation</span>
            <strong>{data.attendanceRate}</strong>
          </div>
        )}
        {data.volunteerFrequency && (
          <div className="engagement-metric">
            <span>Volunteer Activity</span>
            <strong>{data.volunteerFrequency}</strong>
          </div>
        )}
        {data.givingConsistency && (
          <div className="engagement-metric">
            <span>Giving Consistency</span>
            <strong>{data.givingConsistency}</strong>
          </div>
        )}
      </div>

      {data.insights && (
        <div className="engagement-insights">
          <p>{data.insights}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateChurchMomentum(forecast, risk, engagement) {
  // Simple momentum calculation (0-100)
  let score = 50; // Base score

  // Ministry Health (0-35 points)
  if (forecast?.threeMonthScore) {
    const health = parseFloat(forecast.threeMonthScore);
    if (!isNaN(health)) {
      score += (health / 100) * 35;
    }
  }

  // Risk Level (0-25 points)
  if (risk?.level) {
    if (risk.level === 'GREEN') score += 25;
    else if (risk.level === 'YELLOW') score += 15;
    else if (risk.level === 'RED') score += 5;
  }

  // Engagement (0-25 points)
  if (engagement?.stabilityIndex) {
    const eng = parseFloat(engagement.stabilityIndex);
    if (!isNaN(eng)) {
      score += (eng / 100) * 25;
    }
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}

function getRiskTrend(level) {
  if (level === 'GREEN') return 'stable';
  if (level === 'YELLOW') return 'down';
  if (level === 'RED') return 'down';
  return 'stable';
}
