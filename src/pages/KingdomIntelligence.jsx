import React, { useState } from 'react';
import './KingdomIntelligence.css';
import { useKingdomHealthMetrics } from '../hooks/usePhase6GlobalIntelligence';
import { useTenant } from '../context/TenantContext';
import {
  Globe, TrendingUp, DollarSign, Target, AlertTriangle, Award,
  Loader, RefreshCw, Download, Users, MapPin, Zap, Shield,
  Heart, MessageCircle, FileText, BarChart3, Calendar, CheckCircle
} from 'lucide-react';
import { successToast, errorToast } from '../utils/toast';

/**
 * KINGDOM INTELLIGENCE DASHBOARD
 * Phase 6: Global Kingdom Intelligence Network
 * 
 * Shows:
 * - Global Church Growth Heatmap
 * - Regional Giving Stability Index
 * - Ministry Expansion Opportunity Radar
 * - Global Mission Impact Score
 * - Grant Opportunity Pipeline Meter
 * 
 * Modes: Church Leader, Network Admin, Board Presentation
 */
const KingdomIntelligence = () => {
  const { tenant } = useTenant();
  const [viewMode, setViewMode] = useState('church-leader'); // 'church-leader' | 'network-admin' | 'board'
  const [refreshing, setRefreshing] = useState(false);

  const kingdom = useKingdomHealthMetrics(tenant?.id);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await kingdom.refresh();
      successToast('Kingdom intelligence refreshed');
    } catch (error) {
      errorToast('Failed to refresh kingdom intelligence');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = () => {
    window.print();
  };

  // Calculate Kingdom Health Score (0-100)
  const calculateKingdomScore = (data) => {
    if (!data.globalTrends || !data.givingForecast) return 0;

    const globalHealth = data.globalTrends.networkHealthScore || 50;
    const givingStability = data.givingForecast.stabilityIndex || 50;
    const grantPipeline = data.grantOpportunities?.topMatches?.length || 0;
    const missionImpact = data.missionForecast?.globalImpactScore || 50;

    // Weighted calculation
    const score = (
      globalHealth * 0.30 +
      givingStability * 0.25 +
      Math.min(grantPipeline * 5, 100) * 0.20 +
      missionImpact * 0.25
    );

    return Math.round(score);
  };

  const kingdomScore = kingdom.data ? calculateKingdomScore(kingdom.data) : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 60) return '#3b82f6'; // Blue
    if (score >= 40) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getScoreStatus = (score) => {
    if (score >= 80) return 'Thriving';
    if (score >= 60) return 'Healthy';
    if (score >= 40) return 'Growing';
    return 'Needs Attention';
  };

  if (kingdom.loading) {
    return (
      <div className="kingdom-intelligence-loading">
        <Loader size={48} className="animate-spin" />
        <p>Loading kingdom intelligence...</p>
      </div>
    );
  }

  if (kingdom.error) {
    return (
      <div className="kingdom-intelligence-error">
        <AlertTriangle size={48} color="#ef4444" />
        <h3>Unable to Load Kingdom Intelligence</h3>
        <p>{kingdom.error}</p>
        <button onClick={handleRefresh} className="kingdom-btn-primary">
          <RefreshCw size={20} />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="kingdom-intelligence-dashboard">
      {/* Header */}
      <div className="kingdom-header">
        <div className="kingdom-header-content">
          <div className="kingdom-header-icon">
            <Globe size={32} color="white" />
          </div>
          <div>
            <h1 className="kingdom-title">Kingdom Intelligence Network</h1>
            <p className="kingdom-subtitle">Global Church + Grant + Mission AI</p>
          </div>
        </div>
        <div className="kingdom-header-actions">
          <div className="mode-switcher">
            <button
              className={`mode-btn ${viewMode === 'church-leader' ? 'active' : ''}`}
              onClick={() => setViewMode('church-leader')}
            >
              Church Leader
            </button>
            <button
              className={`mode-btn ${viewMode === 'network-admin' ? 'active' : ''}`}
              onClick={() => setViewMode('network-admin')}
            >
              Network Admin
            </button>
            <button
              className={`mode-btn ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              Board View
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="kingdom-btn-secondary"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={handleExport} className="kingdom-btn-primary no-print">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Kingdom Hero - Global Health Score */}
      <div className="kingdom-hero">
        <div className="kingdom-score-display">
          <div className="kingdom-score-circle">
            <svg className="kingdom-score-svg" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="12"
              />
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="white"
                strokeWidth="12"
                strokeDasharray={`${(kingdomScore / 100) * 534} 534`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
              />
            </svg>
            <div className="kingdom-score-inner">
              <div className="kingdom-score-value">{kingdomScore}</div>
              <div className="kingdom-score-label">Kingdom Health</div>
              <div className="kingdom-score-status">{getScoreStatus(kingdomScore)}</div>
            </div>
          </div>
        </div>

        <div className="kingdom-quick-metrics">
          <QuickMetric
            icon={<Users size={24} />}
            label="Network Churches"
            value={kingdom.data.globalTrends?.totalChurches || 0}
          />
          <QuickMetric
            icon={<TrendingUp size={24} />}
            label="Global Growth Rate"
            value={`${kingdom.data.globalTrends?.networkGrowthRate || 0}%`}
          />
          <QuickMetric
            icon={<Award size={24} />}
            label="Active Grants"
            value={kingdom.data.grantOpportunities?.topMatches?.length || 0}
          />
          <QuickMetric
            icon={<MapPin size={24} />}
            label="Mission Regions"
            value={kingdom.data.missionForecast?.activeMissionRegions || 0}
          />
        </div>
      </div>

      {/* Main Grid */}
      <div className={`kingdom-grid ${viewMode === 'board' ? 'board-mode' : ''}`}>
        {/* Global Church Growth Heatmap */}
        <GlobalChurchGrowthPanel data={kingdom.data.globalTrends} />

        {/* Regional Giving Stability Index */}
        <RegionalGivingStabilityPanel data={kingdom.data.givingForecast} />

        {/* Grant Opportunity Pipeline */}
        <GrantOpportunityPipelinePanel data={kingdom.data.grantOpportunities} />

        {/* Global Mission Impact Score */}
        <GlobalMissionImpactPanel data={kingdom.data.missionForecast} />

        {/* Ministry Success Patterns */}
        <MinistryPatternsPanel data={kingdom.data.ministryPatterns} />

        {/* Crisis Response Alerts */}
        {kingdom.data.crisisAlerts?.activeAlerts?.length > 0 && (
          <CrisisResponsePanel data={kingdom.data.crisisAlerts} />
        )}
      </div>

      {/* Data Privacy Banner */}
      <div className="kingdom-privacy-banner">
        <Shield size={24} />
        <div>
          <strong>Data Privacy:</strong> All network intelligence is anonymized. 
          No church member data, donor identities, or contribution details are shared across churches. 
          Only aggregated trends and benchmarks are displayed for kingdom intelligence.
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const QuickMetric = ({ icon, label, value }) => (
  <div className="kingdom-quick-metric">
    <div className="kingdom-quick-metric-icon">{icon}</div>
    <div className="kingdom-quick-metric-content">
      <div className="kingdom-quick-metric-label">{label}</div>
      <div className="kingdom-quick-metric-value">{value}</div>
    </div>
  </div>
);

const GlobalChurchGrowthPanel = ({ data }) => (
  <div className="kingdom-card">
    <div className="kingdom-card-header">
      <div className="kingdom-card-icon-header">
        <Globe size={24} color="#3b82f6" />
        <h2>Global Church Growth</h2>
      </div>
      <div className="status-badge optimal">Network-Wide</div>
    </div>
    <div className="kingdom-card-body">
      {!data ? (
        <p className="kingdom-empty">No global trend data available</p>
      ) : (
        <>
          <div className="kingdom-metrics-grid">
            <div className="kingdom-metric">
              <span className="metric-label">Network Health Score</span>
              <span className="metric-value">{data.networkHealthScore || 0}/100</span>
            </div>
            <div className="kingdom-metric">
              <span className="metric-label">Total Churches</span>
              <span className="metric-value">{data.totalChurches || 0}</span>
            </div>
            <div className="kingdom-metric">
              <span className="metric-label">Network Growth Rate</span>
              <span className="metric-value">{data.networkGrowthRate || 0}%</span>
            </div>
            <div className="kingdom-metric">
              <span className="metric-label">Avg Attendance</span>
              <span className="metric-value">{data.avgAttendance || 0}</span>
            </div>
          </div>

          {data.regionalBreakdown && data.regionalBreakdown.length > 0 && (
            <div className="regional-breakdown">
              <h4>Regional Performance</h4>
              {data.regionalBreakdown.map((region, idx) => (
                <div key={idx} className="region-item">
                  <div className="region-header">
                    <MapPin size={16} />
                    <span className="region-name">{region.region}</span>
                    <span className="region-growth">{region.growthRate}%</span>
                  </div>
                  <div className="region-bar">
                    <div
                      className="region-bar-fill"
                      style={{ width: `${Math.min(Math.abs(region.growthRate) * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.insights && data.insights.length > 0 && (
            <div className="kingdom-insights">
              <h4>Network Insights</h4>
              <ul>
                {data.insights.map((insight, idx) => (
                  <li key={idx}>
                    <CheckCircle size={16} />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

const RegionalGivingStabilityPanel = ({ data }) => (
  <div className="kingdom-card">
    <div className="kingdom-card-header">
      <div className="kingdom-card-icon-header">
        <DollarSign size={24} color="#10b981" />
        <h2>Regional Giving Stability</h2>
      </div>
      <div className="status-badge good">
        {data?.stabilityIndex ? `${data.stabilityIndex}/100` : 'N/A'}
      </div>
    </div>
    <div className="kingdom-card-body">
      {!data ? (
        <p className="kingdom-empty">No giving forecast data available</p>
      ) : (
        <>
          <div className="kingdom-metrics-grid">
            <div className="kingdom-metric">
              <span className="metric-label">Stability Index</span>
              <span className="metric-value">{data.stabilityIndex || 0}/100</span>
            </div>
            <div className="kingdom-metric">
              <span className="metric-label">Next Quarter Forecast</span>
              <span className="metric-value">${(data.nextQuarterForecast || 0).toLocaleString()}</span>
            </div>
            <div className="kingdom-metric">
              <span className="metric-label">Growth Trend</span>
              <span className="metric-value">{data.growthTrend || 'N/A'}</span>
            </div>
          </div>

          {data.seasonalPatterns && data.seasonalPatterns.length > 0 && (
            <div className="seasonal-patterns">
              <h4>Seasonal Giving Patterns</h4>
              {data.seasonalPatterns.map((pattern, idx) => (
                <div key={idx} className="pattern-item">
                  <Calendar size={16} />
                  <span>{pattern.season}: {pattern.variance > 0 ? '+' : ''}{pattern.variance}%</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

const GrantOpportunityPipelinePanel = ({ data }) => (
  <div className="kingdom-card">
    <div className="kingdom-card-header">
      <div className="kingdom-card-icon-header">
        <Award size={24} color="#f59e0b" />
        <h2>Grant Opportunity Pipeline</h2>
      </div>
      <div className="status-badge review">
        {data?.topMatches?.length || 0} Matches
      </div>
    </div>
    <div className="kingdom-card-body">
      {!data || !data.topMatches || data.topMatches.length === 0 ? (
        <p className="kingdom-empty">No grant opportunities found</p>
      ) : (
        <>
          <div className="grant-pipeline-summary">
            <div className="pipeline-stat">
              <Target size={20} />
              <div>
                <div className="pipeline-stat-label">Top Matches</div>
                <div className="pipeline-stat-value">{data.topMatches.length}</div>
              </div>
            </div>
            <div className="pipeline-stat">
              <DollarSign size={20} />
              <div>
                <div className="pipeline-stat-label">Total Potential</div>
                <div className="pipeline-stat-value">
                  ${data.totalPotentialFunding?.toLocaleString() || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="grant-list">
            <h4>Top Grant Opportunities</h4>
            {data.topMatches.slice(0, 5).map((grant, idx) => (
              <div key={idx} className="grant-item">
                <div className="grant-rank">#{idx + 1}</div>
                <div className="grant-content">
                  <div className="grant-name">{grant.grantName}</div>
                  <div className="grant-details">
                    Amount: ${grant.maxAmount?.toLocaleString() || 'N/A'} | 
                    Match Score: {grant.matchScore || 0}/100 | 
                    Deadline: {grant.applicationDeadline || 'Open'}
                  </div>
                </div>
                <div className={`grant-probability ${grant.successProbability >= 70 ? 'high' : grant.successProbability >= 40 ? 'medium' : 'low'}`}>
                  {grant.successProbability || 0}%
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  </div>
);

const GlobalMissionImpactPanel = ({ data }) => (
  <div className="kingdom-card">
    <div className="kingdom-card-header">
      <div className="kingdom-card-icon-header">
        <MapPin size={24} color="#8b5cf6" />
        <h2>Global Mission Impact</h2>
      </div>
      <div className="status-badge optimal">
        {data?.globalImpactScore ? `${data.globalImpactScore}/100` : 'N/A'}
      </div>
    </div>
    <div className="kingdom-card-body">
      {!data ? (
        <p className="kingdom-empty">No mission forecast data available</p>
      ) : (
        <>
          <div className="kingdom-metrics-grid">
            <div className="kingdom-metric">
              <span className="metric-label">Global Impact Score</span>
              <span className="metric-value">{data.globalImpactScore || 0}/100</span>
            </div>
            <div className="kingdom-metric">
              <span className="metric-label">Active Mission Regions</span>
              <span className="metric-value">{data.activeMissionRegions || 0}</span>
            </div>
            <div className="kingdom-metric">
              <span className="metric-label">Mission ROI</span>
              <span className="metric-value">{data.missionROI || 0}x</span>
            </div>
          </div>

          {data.highImpactRegions && data.highImpactRegions.length > 0 && (
            <div className="mission-regions">
              <h4>High Impact Mission Regions</h4>
              {data.highImpactRegions.map((region, idx) => (
                <div key={idx} className="mission-region-item">
                  <MapPin size={16} />
                  <span className="mission-region-name">{region.region}</span>
                  <span className="mission-impact-score">{region.impactScore}/100</span>
                </div>
              ))}
            </div>
          )}

          {data.expansionRecommendations && data.expansionRecommendations.length > 0 && (
            <div className="mission-recommendations">
              <h4>Expansion Recommendations</h4>
              <ul>
                {data.expansionRecommendations.map((rec, idx) => (
                  <li key={idx}>
                    <Zap size={16} />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

const MinistryPatternsPanel = ({ data }) => (
  <div className="kingdom-card">
    <div className="kingdom-card-header">
      <div className="kingdom-card-icon-header">
        <BarChart3 size={24} color="#06b6d4" />
        <h2>Ministry Success Patterns</h2>
      </div>
      <div className="status-badge good">Network-Wide</div>
    </div>
    <div className="kingdom-card-body">
      {!data ? (
        <p className="kingdom-empty">No ministry pattern data available</p>
      ) : (
        <>
          {data.topPerformingModels && data.topPerformingModels.length > 0 && (
            <div className="ministry-models">
              <h4>Top Performing Ministry Models</h4>
              {data.topPerformingModels.map((model, idx) => (
                <div key={idx} className="ministry-model-item">
                  <div className="model-rank">#{idx + 1}</div>
                  <div className="model-content">
                    <div className="model-name">{model.ministryType}</div>
                    <div className="model-stats">
                      Success Rate: {model.successRate}% | 
                      Avg Growth: {model.avgGrowth}% | 
                      Churches Using: {model.churchCount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {data.emergingTrends && data.emergingTrends.length > 0 && (
            <div className="emerging-trends">
              <h4>Emerging Ministry Trends</h4>
              <ul>
                {data.emergingTrends.map((trend, idx) => (
                  <li key={idx}>
                    <TrendingUp size={16} />
                    {trend}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

const CrisisResponsePanel = ({ data }) => (
  <div className="kingdom-card kingdom-card-full">
    <div className="kingdom-card-header">
      <div className="kingdom-card-icon-header">
        <AlertTriangle size={24} color="#ef4444" />
        <h2>Crisis Response Coordination</h2>
      </div>
      <div className="status-badge action">
        {data.activeAlerts?.length || 0} Active Alerts
      </div>
    </div>
    <div className="kingdom-card-body">
      {!data.activeAlerts || data.activeAlerts.length === 0 ? (
        <p className="kingdom-success">
          <CheckCircle size={20} />
          No active crisis alerts. Network operating normally.
        </p>
      ) : (
        <div className="crisis-alerts-grid">
          {data.activeAlerts.map((alert, idx) => (
            <div key={idx} className={`crisis-alert-item severity-${alert.severity}`}>
              <div className="crisis-alert-header">
                <AlertTriangle size={20} />
                <span className="crisis-region">{alert.region}</span>
                <span className="crisis-severity">{alert.severity}</span>
              </div>
              <div className="crisis-alert-description">
                {alert.description}
              </div>
              {alert.recommendedAction && (
                <div className="crisis-alert-action">
                  <strong>Recommended Action:</strong> {alert.recommendedAction}
                </div>
              )}
              {alert.fundingNeed && (
                <div className="crisis-funding-need">
                  <DollarSign size={16} />
                  Estimated Need: ${alert.fundingNeed.toLocaleString()}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default KingdomIntelligence;
