import React, { useState } from 'react';
import {
  Command, DollarSign, TrendingUp, Users, Target, AlertOctagon,
  Loader, RefreshCw, Download, Calendar, BarChart3, Activity,
  CheckCircle, AlertTriangle, Info, Zap, Shield
} from 'lucide-react';
import { useOperationsMetrics } from '../hooks/usePhase5Operations';
import { successToast, errorToast } from '../utils/toast';
import './OperationsCommandCenter.css';

/**
 * OperationsCommandCenter - Church Operations Command Center
 * Phase 5: Autonomous Church Operations Dashboard
 * 
 * Features:
 * - Financial Stability Meter
 * - Ministry Growth Map
 * - Volunteer Load Map
 * - Risk Radar
 * - Opportunity Alerts
 * - Budget Balance Indicator
 * 
 * Modes:
 * - Executive Simple Mode (default)
 * - Board Presentation Mode
 * - Print Report Mode
 * 
 * Ethics: AI RECOMMENDS - HUMANS APPROVE
 */
export default function OperationsCommandCenter() {
  const [viewMode, setViewMode] = useState('executive'); // 'executive' | 'board' | 'print'
  const [refreshing, setRefreshing] = useState(false);

  const operations = useOperationsMetrics();

  const isLoading = operations.loading;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await operations.refresh();
      successToast('Operations data refreshed');
    } catch (err) {
      errorToast('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  if (isLoading && !operations.data) {
    return (
      <div className="operations-loading">
        <Loader size={48} className="animate-spin text-blue-600" />
        <p className="mt-4 text-gray-600">Loading Operations Command Center...</p>
      </div>
    );
  }

  // Calculate operational health score (0-100)
  const operationsScore = calculateOperationsScore(operations.data);

  return (
    <div className="operations-command-center">
      
      {/* HEADER */}
      <div className="operations-header">
        <div className="operations-header-content">
          <div className="operations-header-icon">
            <Command size={32} className="text-white" />
          </div>
          <div>
            <h1 className="operations-title">Operations Command Center</h1>
            <p className="operations-subtitle">
              Phase 5: Self-Optimizing Ministry System • AI Recommends, Humans Approve
            </p>
          </div>
        </div>
        <div className="operations-header-actions no-print">
          <div className="mode-switcher">
            <button
              className={`mode-btn ${viewMode === 'executive' ? 'active' : ''}`}
              onClick={() => setViewMode('executive')}
            >
              Executive
            </button>
            <button
              className={`mode-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              Board
            </button>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="operations-btn-secondary"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={handleExport}
            className="operations-btn-primary"
          >
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* OPERATIONS HEALTH HERO */}
      <div className="operations-hero">
        <div className="operations-score-display">
          <div className="operations-score-circle">
            <svg viewBox="0 0 200 200" className="operations-score-svg">
              <circle cx="100" cy="100" r="90" fill="none" stroke="#e5e7eb" strokeWidth="12" />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={getScoreColor(operationsScore)}
                strokeWidth="12"
                strokeDasharray={`${(operationsScore / 100) * 565} 565`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="operations-score-inner">
              <div className="operations-score-value">{operationsScore}</div>
              <div className="operations-score-label">Operational Health</div>
            </div>
          </div>
        </div>
        <div className="operations-quick-metrics">
          <QuickMetric
            icon={<DollarSign size={24} />}
            label="Financial Stability"
            value={operations.data?.financial?.stabilityScore || 'N/A'}
            status={getStabilityStatus(operations.data?.financial?.stabilityScore)}
          />
          <QuickMetric
            icon={<TrendingUp size={24} />}
            label="Ministry Growth"
            value={operations.data?.ministry?.growthIndex || 'N/A'}
            status={getGrowthStatus(operations.data?.ministry?.growthIndex)}
          />
          <QuickMetric
            icon={<Users size={24} />}
            label="Volunteer Load"
            value={operations.data?.volunteer?.loadIndex || 'N/A'}
            status={getLoadStatus(operations.data?.volunteer?.loadIndex)}
          />
        </div>
      </div>

      {/* MAIN GRID */}
      <div className={`operations-grid ${viewMode === 'board' ? 'board-mode' : ''}`}>
        
        {/* FINANCIAL OPTIMIZATION */}
        <div className="operations-card">
          <div className="operations-card-header">
            <div className="operations-card-icon-header">
              <DollarSign className="text-green-600" />
              <h2>Financial Flow Optimization</h2>
            </div>
            <StatusBadge status={operations.data?.financial?.status || 'unknown'} />
          </div>
          <div className="operations-card-body">
            {operations.error ? (
              <div className="operations-error">{operations.error}</div>
            ) : (
              <FinancialOptimizationPanel data={operations.data?.financial} />
            )}
          </div>
        </div>

        {/* MINISTRY RESOURCE ALLOCATION */}
        <div className="operations-card">
          <div className="operations-card-header">
            <div className="operations-card-icon-header">
              <Target className="text-purple-600" />
              <h2>Ministry Resource Allocation</h2>
            </div>
          </div>
          <div className="operations-card-body">
            <MinistryAllocationPanel data={operations.data?.ministry} />
          </div>
        </div>

        {/* VOLUNTEER DEPLOYMENT */}
        <div className="operations-card">
          <div className="operations-card-header">
            <div className="operations-card-icon-header">
              <Users className="text-blue-600" />
              <h2>Volunteer Deployment Intelligence</h2>
            </div>
          </div>
          <div className="operations-card-body">
            <VolunteerDeploymentPanel data={operations.data?.volunteer} />
          </div>
        </div>

        {/* OUTREACH IMPACT */}
        <div className="operations-card">
          <div className="operations-card-header">
            <div className="operations-card-icon-header">
              <Zap className="text-amber-600" />
              <h2>Outreach Impact Optimization</h2>
            </div>
          </div>
          <div className="operations-card-body">
            <OutreachImpactPanel data={operations.data?.outreach} />
          </div>
        </div>

        {/* BUDGET BALANCING */}
        <div className="operations-card operations-card-full">
          <div className="operations-card-header">
            <div className="operations-card-icon-header">
              <BarChart3 className="text-indigo-600" />
              <h2>Budget Self-Balancing Recommendations</h2>
            </div>
          </div>
          <div className="operations-card-body">
            <BudgetBalancingPanel data={operations.data?.budget} />
          </div>
        </div>

        {/* RISK RADAR */}
        <div className="operations-card operations-card-full">
          <div className="operations-card-header">
            <div className="operations-card-icon-header">
              <AlertOctagon className="text-red-600" />
              <h2>Risk Radar</h2>
            </div>
          </div>
          <div className="operations-card-body">
            <RiskRadarPanel data={operations.data} />
          </div>
        </div>

      </div>

      {/* AI ETHICS BANNER */}
      <div className="operations-ethics-banner">
        <Shield size={18} />
        <span>
          <strong>Operational Ethics:</strong> This system provides recommendations only. 
          AI prepares and suggests - humans review and approve all actions. No automated 
          spending, messaging, or ministry decisions are made without explicit approval.
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function QuickMetric({ icon, label, value, status }) {
  const statusColors = {
    'excellent': 'text-green-600',
    'good': 'text-blue-600',
    'caution': 'text-yellow-600',
    'alert': 'text-red-600',
    'unknown': 'text-gray-600'
  };

  return (
    <div className="quick-metric">
      <div className={`quick-metric-icon ${statusColors[status]}`}>
        {icon}
      </div>
      <div className="quick-metric-content">
        <div className="quick-metric-label">{label}</div>
        <div className="quick-metric-value">{value}</div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    'optimal': { bg: 'bg-green-100', text: 'text-green-800', label: 'Optimal' },
    'good': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Good' },
    'review': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Review' },
    'action': { bg: 'bg-red-100', text: 'text-red-800', label: 'Action Required' },
    'unknown': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' }
  };

  const style = config[status] || config.unknown;

  return (
    <span className={`status-badge ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
}

function FinancialOptimizationPanel({ data }) {
  if (!data) {
    return <div className="operations-empty">No optimization data available</div>;
  }

  return (
    <div className="financial-optimization-panel">
      <div className="optimization-metrics">
        <div className="optimization-metric">
          <span className="metric-label">Stability Score</span>
          <span className="metric-value">{data.stabilityScore || 'N/A'}/100</span>
        </div>
        <div className="optimization-metric">
          <span className="metric-label">Reserve Safety</span>
          <span className="metric-value">{data.reserveMonths || 'N/A'} months</span>
        </div>
        <div className="optimization-metric">
          <span className="metric-label">Cash Flow Trend</span>
          <span className="metric-value">{data.cashFlowTrend || 'N/A'}</span>
        </div>
      </div>

      {data.recommendations && data.recommendations.length > 0 && (
        <div className="optimization-recommendations">
          <h4>AI Recommendations (Human Approval Required):</h4>
          <ul className="recommendations-list">
            {data.recommendations.map((rec, idx) => (
              <li key={idx} className="recommendation-item">
                <Info size={16} className="text-blue-500" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MinistryAllocationPanel({ data }) {
  if (!data) {
    return <div className="operations-empty">No ministry data available</div>;
  }

  return (
    <div className="ministry-allocation-panel">
      {data.priorities && data.priorities.length > 0 && (
        <div className="priority-list">
          <h4>Investment Priority Ranking:</h4>
          {data.priorities.map((priority, idx) => (
            <div key={idx} className="priority-item">
              <div className="priority-rank">#{idx + 1}</div>
              <div className="priority-content">
                <strong>{priority.ministry}</strong>
                <span className="priority-reason">{priority.reason}</span>
              </div>
              <div className="priority-score">{priority.score}/100</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VolunteerDeploymentPanel({ data }) {
  if (!data) {
    return <div className="operations-empty">No volunteer data available</div>;
  }

  return (
    <div className="volunteer-deployment-panel">
      <div className="volunteer-metrics">
        <div className="volunteer-metric">
          <span>Load Index</span>
          <strong>{data.loadIndex || 'N/A'}</strong>
        </div>
        <div className="volunteer-metric">
          <span>Burnout Alerts</span>
          <strong className="text-red-600">{data.burnoutAlerts || 0}</strong>
        </div>
      </div>

      {data.recommendations && data.recommendations.length > 0 && (
        <div className="volunteer-recommendations">
          {data.recommendations.map((rec, idx) => (
            <div key={idx} className="volunteer-rec-item">
              <AlertTriangle size={16} className="text-amber-500" />
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OutreachImpactPanel({ data }) {
  if (!data) {
    return <div className="operations-empty">No outreach data available</div>;
  }

  return (
    <div className="outreach-impact-panel">
      {data.topImpact && data.topImpact.length > 0 && (
        <div className="top-impact-list">
          <h4>Top 5 Highest Impact Outreach:</h4>
          {data.topImpact.map((item, idx) => (
            <div key={idx} className="impact-item">
              <div className="impact-rank">#{idx + 1}</div>
              <div className="impact-content">
                <strong>{item.type}</strong>
                <span>ROI: {item.roi}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetBalancingPanel({ data }) {
  if (!data) {
    return <div className="operations-empty">No budget data available</div>;
  }

  return (
    <div className="budget-balancing-panel">
      <div className="budget-projections">
        <div className="budget-projection">
          <span>Income Forecast (3-mo)</span>
          <strong>${data.incomeForecast?.toLocaleString() || 'N/A'}</strong>
        </div>
        <div className="budget-projection">
          <span>Expense Forecast (3-mo)</span>
          <strong>${data.expenseForecast?.toLocaleString() || 'N/A'}</strong>
        </div>
        <div className="budget-projection">
          <span>Safe Expansion Budget</span>
          <strong>${data.safeExpansion?.toLocaleString() || 'N/A'}</strong>
        </div>
      </div>

      {data.adjustments && data.adjustments.length > 0 && (
        <div className="budget-adjustments">
          <h4>AI Budget Adjustment Suggestions:</h4>
          <ul className="adjustments-list">
            {data.adjustments.map((adj, idx) => (
              <li key={idx}>{adj}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function RiskRadarPanel({ data }) {
  const allRisks = [];

  // Collect risks from all sources
  if (data?.financial?.risks) allRisks.push(...data.financial.risks);
  if (data?.ministry?.risks) allRisks.push(...data.ministry.risks);
  if (data?.volunteer?.risks) allRisks.push(...data.volunteer.risks);

  if (allRisks.length === 0) {
    return (
      <div className="operations-success">
        <CheckCircle size={32} className="text-green-500" />
        <span>No operational risks detected</span>
      </div>
    );
  }

  return (
    <div className="risk-radar-panel">
      <div className="risk-alerts-grid">
        {allRisks.map((risk, idx) => (
          <div key={idx} className={`risk-alert-item severity-${risk.severity?.toLowerCase() || 'medium'}`}>
            <div className="risk-alert-header">
              <AlertTriangle size={18} />
              <strong>{risk.type || 'Risk Alert'}</strong>
              <span className="risk-severity">{risk.severity}</span>
            </div>
            <p className="risk-alert-description">{risk.description}</p>
            {risk.action && (
              <div className="risk-alert-action">
                <span>→ Recommended: {risk.action}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateOperationsScore(data) {
  if (!data) return 50;

  let score = 0;
  let factors = 0;

  if (data.financial?.stabilityScore) {
    score += parseFloat(data.financial.stabilityScore) * 0.35;
    factors++;
  }

  if (data.ministry?.growthIndex) {
    score += parseFloat(data.ministry.growthIndex) * 0.25;
    factors++;
  }

  if (data.volunteer?.loadIndex) {
    const loadScore = 100 - Math.abs(parseFloat(data.volunteer.loadIndex) - 50);
    score += loadScore * 0.20;
    factors++;
  }

  if (data.outreach?.effectivenessScore) {
    score += parseFloat(data.outreach.effectivenessScore) * 0.20;
    factors++;
  }

  return factors > 0 ? Math.round(score) : 50;
}

function getScoreColor(score) {
  if (score >= 80) return '#10b981';
  if (score >= 60) return '#3b82f6';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function getStabilityStatus(score) {
  if (!score) return 'unknown';
  const val = parseFloat(score);
  if (val >= 80) return 'excellent';
  if (val >= 60) return 'good';
  if (val >= 40) return 'caution';
  return 'alert';
}

function getGrowthStatus(index) {
  if (!index) return 'unknown';
  if (index === 'High' || index > 70) return 'excellent';
  if (index === 'Medium' || index > 40) return 'good';
  return 'caution';
}

function getLoadStatus(index) {
  if (!index) return 'unknown';
  const val = typeof index === 'number' ? index : 50;
  if (val >= 40 && val <= 60) return 'good'; // Optimal range
  if (val < 30 || val > 80) return 'alert';
  return 'caution';
}
