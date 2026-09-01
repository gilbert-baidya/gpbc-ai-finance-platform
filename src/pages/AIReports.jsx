import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, ShieldAlert, Sparkles, Mail, FileText, Download, MessageSquare, Loader } from 'lucide-react';
import { gasFetch } from '../api/gasFetch';
import { errorToast } from '../utils/toast';

/**
 * AIReports - AI-Powered Ministry Analytics Dashboard
 * Executive-level insights for church finance and giving trends
 */
export default function AIReports() {
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [declining, setDeclining] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    loadRealAI();
  }, []);

  const loadRealAI = async () => {
    setLoading(true);
    try {
      // Load all AI data in parallel
      const [health, forecastData, declineData, dashboard] = await Promise.all([
        gasFetch('getMinistryHealthScore').catch(() => null),
        gasFetch('forecastGivingTrend').catch(() => null),
        gasFetch('detectDecliningGivers').catch(() => ({ declining: [] })),
        gasFetch('getDashboardSummary').catch(() => null)
      ]);

      setHealthScore(health);
      setForecast(forecastData);
      setDeclining(declineData?.declining || []);
      setDashboardData(dashboard);

      // Generate chart data from forecast or dashboard
      if (forecastData?.monthlyTrend) {
        setChartData(forecastData.monthlyTrend);
      } else if (dashboard?.monthlyData) {
        setChartData(dashboard.monthlyData);
      }
    } catch (err) {
      console.error('AI load failed', err);
      errorToast('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-gradient-to-br from-amber-50 via-white to-emerald-50">
        <div className="text-center">
          <Loader size={48} className="animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  // Calculate metrics from real data
  const totalGiving = dashboardData?.totalContributions 
    ? `$${parseFloat(dashboardData.totalContributions).toLocaleString()}`
    : '$0';
  
  const growthRate = forecast?.growthRate 
    ? `${forecast.growthRate > 0 ? '+' : ''}${forecast.growthRate.toFixed(1)}%`
    : 'N/A';
  
  const activeGivers = dashboardData?.totalMembers || '0';
  
  const riskLevel = healthScore?.level || 'UNKNOWN';

  return (
    <div className="p-8 space-y-8 bg-gradient-to-br from-amber-50 via-white to-emerald-50 min-h-screen">
      
      {/* PAGE HEADER */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl shadow-lg">
          <Sparkles size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            AI Insight Reports
          </h1>
          <p className="text-gray-500 mt-1">
            AI-powered ministry and giving intelligence
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Giving" 
          value={totalGiving} 
          subtitle="This Month"
          icon={<BarChart3 />} 
          color="blue"
        />
        <SummaryCard 
          title="Growth" 
          value={growthRate} 
          subtitle="vs Last Month"
          icon={<TrendingUp />} 
          color="green"
        />
        <SummaryCard 
          title="Active Givers" 
          value={activeGivers} 
          subtitle="Members"
          icon={<Users />} 
          color="purple"
        />
        <SummaryCard 
          title="Risk Level" 
          value={riskLevel} 
          subtitle={healthScore?.message || "System Status"}
          icon={<ShieldAlert />} 
          color="emerald"
        />
      </div>

      {/* MAIN GRID - Chart + AI Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* CHART SECTION */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Giving Trend
              </h2>
              <p className="text-sm text-gray-500 mt-1">Last 6 Months</p>
            </div>
            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
              {forecast?.trend === 'up' ? '↑ Trending Up' : 
               forecast?.trend === 'down' ? '↓ Trending Down' : 
               '→ Steady'}
            </div>
          </div>

          {/* Real Chart with Data */}
          <div className="h-72 flex items-center justify-center">
            {chartData.length > 0 ? (
              <div className="w-full h-full flex items-end justify-around gap-4 px-4">
                {chartData.slice(-6).map((item, index) => (
                  <ChartBar 
                    key={index}
                    height={`${Math.min(100, (item.amount / Math.max(...chartData.map(d => d.amount)) * 100))}%`}
                    label={item.month || item.name}
                    value={`$${(item.amount / 1000).toFixed(1)}K`}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No chart data available</p>
            )}
          </div>
        </div>

        {/* AI INSIGHTS PANEL */}
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl shadow-lg p-6 border border-amber-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Sparkles size={20} className="text-amber-600" />
            </div>
            <h2 className="font-semibold text-gray-800">
              AI Ministry Insights
            </h2>
          </div>

          <ul className="space-y-4">
            {healthScore?.insights && healthScore.insights.length > 0 ? (
              healthScore.insights.map((insight, index) => (
                <InsightItem 
                  key={index}
                  text={insight.text || insight}
                  sentiment={insight.sentiment || 'neutral'}
                />
              ))
            ) : (
              <>
                <InsightItem 
                  text={forecast?.message || "Analyzing giving patterns..."}
                  sentiment="neutral"
                />
                {declining.length > 0 && (
                  <InsightItem 
                    text={`${declining.length} member${declining.length > 1 ? 's' : ''} showing declining giving trend`}
                    sentiment="warning"
                  />
                )}
                {dashboardData && (
                  <InsightItem 
                    text={`${dashboardData.totalMembers || 0} active members in database`}
                    sentiment="positive"
                  />
                )}
              </>
            )}
          </ul>

          <div className="mt-6 pt-4 border-t border-amber-200">
            <p className="text-xs text-gray-500">
              💡 AI suggestions updated daily
            </p>
          </div>
        </div>
      </div>

      {/* SMART ACTIONS PANEL */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h2 className="font-semibold text-gray-800">
            Smart Actions
          </h2>
          <span className="text-xs text-gray-400 ml-2">AI-Recommended</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <ActionBtn 
            text="Thank You Campaign" 
            icon={<Mail size={18} />}
            color="amber"
          />
          <ActionBtn 
            text="Export Annual Report" 
            icon={<Download size={18} />}
            color="blue"
          />
          <ActionBtn 
            text="Bulk Tax Letters" 
            icon={<FileText size={18} />}
            color="emerald"
          />
          <ActionBtn 
            text="Send SMS Reminder" 
            icon={<MessageSquare size={18} />}
            color="purple"
          />
        </div>
      </div>

      {/* FOOTER NOTE */}
      <div className="text-center text-sm text-gray-400 pb-4">
        <p>✨ Powered by AI Analytics Engine • Data refreshes every hour</p>
      </div>

    </div>
  );
}

/* ===========================
   COMPONENT LIBRARY
   =========================== */

/**
 * SummaryCard - Executive summary metric card
 */
function SummaryCard({ title, value, subtitle, icon, color }) {
  const colorClasses = {
    blue: 'from-blue-400 to-blue-500',
    green: 'from-green-400 to-green-500',
    purple: 'from-purple-400 to-purple-500',
    emerald: 'from-emerald-400 to-emerald-500',
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-100 group">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 text-gray-800 group-hover:scale-105 transition-transform">
            {value}
          </p>
          <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-md`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ChartBar - Dynamic chart bar for real-time data visualization
 */
function ChartBar({ height, label, value }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2">
      <div className="w-full flex flex-col items-center justify-end" style={{ height: '240px' }}>
        <div 
          className="w-full bg-gradient-to-t from-amber-400 to-amber-300 rounded-t-lg hover:from-amber-500 hover:to-amber-400 transition-all duration-300 shadow-md flex items-end justify-center pb-2"
          style={{ height }}
        >
          <span className="text-xs font-semibold text-white">{value}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-gray-600">{label}</span>
    </div>
  );
}

/**
 * InsightItem - AI insight bullet point
 */
function InsightItem({ text, sentiment }) {
  const sentimentStyles = {
    positive: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    neutral: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const sentimentIcons = {
    positive: '✅',
    warning: '⚠️',
    neutral: '💡',
  };

  return (
    <li className={`flex items-start gap-3 p-3 rounded-xl border ${sentimentStyles[sentiment]} transition-all hover:scale-[1.02]`}>
      <span className="text-lg">{sentimentIcons[sentiment]}</span>
      <span className="text-sm font-medium leading-relaxed">{text}</span>
    </li>
  );
}

/**
 * ActionBtn - Smart action button
 */
function ActionBtn({ text, icon, color }) {
  const colorClasses = {
    amber: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    blue: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200',
    emerald: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
    purple: 'bg-purple-500 hover:bg-purple-600 shadow-purple-200',
  };

  return (
    <button className={`
      w-full px-5 py-4 rounded-xl text-white font-medium
      ${colorClasses[color]}
      shadow-lg hover:shadow-xl
      transition-all duration-300
      hover:scale-105
      flex items-center justify-center gap-2
      group
    `}>
      <span className="group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <span className="text-sm">{text}</span>
    </button>
  );
}
