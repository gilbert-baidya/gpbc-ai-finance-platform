/**
 * PHASE 6: GLOBAL KINGDOM INTELLIGENCE NETWORK HOOKS
 * Multi-Church + Grant + Global Mission AI
 * 
 * CRITICAL PRINCIPLE:
 * Each Church Owns Its Data - Only Aggregated + Anonymous Intelligence Is Shared Network-Wide
 * 
 * ETHICAL CONSTRAINTS:
 * - NO cross-church member data sharing
 * - NO donor identity sharing across churches
 * - NO personal contribution details in global aggregates
 * - ONLY anonymous trend data and benchmarks
 * 
 * AI MUST NEVER:
 * - Share church member data globally
 * - Share donor identity across network
 * - Share contribution details
 * - Recommend church comparison rankings (only benchmark ranges)
 * - Auto apply for grants
 * - Auto send global messaging
 * 
 * AI MAY:
 * - Share anonymous kingdom trends
 * - Recommend grant opportunities
 * - Forecast global ministry needs
 * - Suggest global mission investment opportunities
 */

import { useState, useEffect } from 'react';
import { gasFetch } from '../api/gasFetch';

/**
 * 1. useGlobalChurchTrends - Multi-church aggregated intelligence
 * Analyzes anonymous monthly giving totals, attendance trends, ministry growth signals
 * across entire church network. Returns regional church health trends, giving seasonality
 * intelligence, ministry growth benchmarks WITHOUT revealing individual church identities.
 */
export const useGlobalChurchTrends = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGlobalTrends = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('GlobalChurchAggregationEngine', {
        // No tenantId required - this is global aggregated data
        includeRegionalBreakdown: true,
        analysisMonths: 12
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load global church trends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalTrends();
  }, []);

  return { data, loading, error, refresh: fetchGlobalTrends };
};

/**
 * 2. useGlobalGivingForecast - Global giving trend intelligence
 * Analyzes multi-church monthly totals, economic indicators, seasonal faith calendar.
 * Returns next quarter global giving projection, regional faith economy trends,
 * seasonal giving pattern intelligence.
 */
export const useGlobalGivingForecast = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGivingForecast = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('getGlobalGivingTrend', {
        forecastQuarters: 2,
        includeEconomicIndicators: true,
        includeSeasonalPatterns: true
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load global giving forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGivingForecast();
  }, []);

  return { data, loading, error, refresh: fetchGivingForecast };
};

/**
 * 3. useGrantOpportunities - Grant discovery and matching intelligence
 * Analyzes church size, ministry focus areas, community demographics, prior grant success.
 * Returns top matching grants, grant success probability score, suggested application windows,
 * auto-draft grant budget templates. DRAFTS ONLY - human review required before submission.
 */
export const useGrantOpportunities = (tenantId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGrantOpportunities = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('GrantDiscoveryAI', {
        tenantId,
        topMatches: 10,
        includeSuccessProbability: true,
        includeDraftTemplates: true
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load grant opportunities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchGrantOpportunities();
    }
  }, [tenantId]);

  return { data, loading, error, refresh: fetchGrantOpportunities };
};

/**
 * 4. useMissionImpactForecast - Global mission field impact forecasting
 * Analyzes mission investment history, mission region growth data, conversion/engagement signals,
 * local partner church growth metrics. Returns mission investment ROI forecast, high impact
 * mission regions, mission risk alerts, recommended mission expansion zones.
 */
export const useMissionImpactForecast = (tenantId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMissionForecast = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('MissionImpactForecastAI', {
        tenantId,
        forecastMonths: 12,
        includeRiskAnalysis: true,
        includeExpansionRecommendations: true
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load mission impact forecast');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchMissionForecast();
    }
  }, [tenantId]);

  return { data, loading, error, refresh: fetchMissionForecast };
};

/**
 * 5. useKingdomHealthMetrics - Load all kingdom intelligence metrics in parallel
 * Aggregates global church trends, giving forecast, grant opportunities, mission forecast
 * in a single parallel load for the Kingdom Intelligence Dashboard.
 */
export const useKingdomHealthMetrics = (tenantId) => {
  const [data, setData] = useState({
    globalTrends: null,
    givingForecast: null,
    grantOpportunities: null,
    missionForecast: null,
    ministryPatterns: null,
    crisisAlerts: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const [globalTrends, givingForecast, grantOpportunities, missionForecast, ministryPatterns, crisisAlerts] = await Promise.all([
        gasFetch('GlobalChurchAggregationEngine', { analysisMonths: 12 }),
        gasFetch('getGlobalGivingTrend', { forecastQuarters: 2 }),
        gasFetch('GrantDiscoveryAI', { tenantId, topMatches: 10 }),
        gasFetch('MissionImpactForecastAI', { tenantId, forecastMonths: 12 }),
        gasFetch('MinistryPatternLearningAI', { analysisMonths: 12 }),
        gasFetch('CrisisResponseCoordinationAI', { tenantId })
      ]);

      setData({
        globalTrends: globalTrends.data,
        givingForecast: givingForecast.data,
        grantOpportunities: grantOpportunities.data,
        missionForecast: missionForecast.data,
        ministryPatterns: ministryPatterns.data,
        crisisAlerts: crisisAlerts.data
      });
    } catch (err) {
      setError(err.message || 'Failed to load kingdom health metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchAllMetrics();
    }
  }, [tenantId]);

  return { data, loading, error, refresh: fetchAllMetrics };
};

/**
 * 6. useMinistryPatterns - Cross-church ministry success pattern learning
 * Analyzes anonymous ministry performance data, event impact data, outreach conversion trends,
 * volunteer sustainability patterns. Returns top performing ministry models globally,
 * emerging ministry trends, declining ministry early warnings.
 */
export const useMinistryPatterns = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMinistryPatterns = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('MinistryPatternLearningAI', {
        analysisMonths: 12,
        includeEmergingTrends: true,
        includeDeclineWarnings: true
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load ministry patterns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMinistryPatterns();
  }, []);

  return { data, loading, error, refresh: fetchMinistryPatterns };
};

/**
 * 7. useCrisisResponse - Crisis/disaster response coordination intelligence
 * Analyzes regional crisis alerts, church resource availability, mission partner locations,
 * relief funding availability. Returns church network response plan, resource allocation
 * recommendation, rapid relief funding need estimate.
 */
export const useCrisisResponse = (tenantId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCrisisResponse = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('CrisisResponseCoordinationAI', {
        tenantId,
        includeNetworkResources: true,
        includeFundingEstimates: true
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load crisis response intelligence');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchCrisisResponse();
    }
  }, [tenantId]);

  return { data, loading, error, refresh: fetchCrisisResponse };
};

/**
 * 8. useGlobalPrayerMap - Global prayer + need intelligence map (ETHICAL)
 * Analyzes anonymous prayer need categories, regional crisis indicators, mission region need signals.
 * Returns prayer heat map, urgent global need alerts, mission support priority signals.
 * RULE: NO personal prayer details, ONLY category + region.
 */
export const useGlobalPrayerMap = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrayerMap = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('GlobalPrayerNeedsMap', {
        // No personal details - only anonymous categories and regions
        includeCategoryBreakdown: true,
        includeUrgentAlerts: true,
        includeMissionPriorities: true
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load global prayer map');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrayerMap();
  }, []);

  return { data, loading, error, refresh: fetchPrayerMap };
};

/**
 * 9. useNetworkChurchComparison - Anonymized church benchmarking
 * Compares local church performance against network benchmarks WITHOUT revealing
 * individual church identities. Returns percentile rankings, benchmark ranges,
 * growth opportunity insights.
 */
export const useNetworkChurchComparison = (tenantId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNetworkComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('getNetworkChurchBenchmarks', {
        tenantId,
        includePeerGroup: true,  // Churches of similar size
        includeRegionalComparison: true,
        includeGrowthOpportunities: true
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load network comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) {
      fetchNetworkComparison();
    }
  }, [tenantId]);

  return { data, loading, error, refresh: fetchNetworkComparison };
};

/**
 * 10. useGrantApplicationDraft - Generate auto-draft grant applications
 * Creates draft grant application with budget template, program description,
 * impact metrics based on church's historical data.
 * DRAFTS ONLY - human review required before submission.
 */
export const useGrantApplicationDraft = (tenantId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateDraft = async (grantId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await gasFetch('generateGrantApplicationDraft', {
        tenantId,
        grantId,
        includeBudgetTemplate: true,
        includeProgramDescription: true,
        includeImpactMetrics: true
      });

      setData(response.data);
    } catch (err) {
      setError(err.message || 'Failed to generate grant application draft');
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, generateDraft };
};
