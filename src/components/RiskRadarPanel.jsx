import React from 'react';
import { AlertTriangle, TrendingDown, Shield, Info } from 'lucide-react';
import './RiskRadarPanel.css';

export const RiskRadarPanel = ({ risks = [] }) => {
    const displayRisks = risks;

    const getSeverityConfig = (severity) => {
        const configs = {
            critical: { color: '#B91C1C', label: 'Critical', icon: AlertTriangle },
            high: { color: '#D97706', label: 'High', icon: TrendingDown },
            medium: { color: '#D4AF37', label: 'Medium', icon: Info },
            low: { color: '#1F6F54', label: 'Low', icon: Shield }
        };
        return configs[severity] || configs.medium;
    };

    return (
        <div className="risk-radar-panel glass-panel">
            <div className="risk-radar-header">
                <div>
                    <h3 className="section-title text-wine">Risk Radar Panel</h3>
                    <p className="body-text text-muted" style={{ marginTop: '4px' }}>
                        Proactive alerts and mitigation strategies
                    </p>
                </div>
                <div className="risk-count-badge">
                    <AlertTriangle size={16} color="#D97706" />
                    <span>{displayRisks.length} Active Alerts</span>
                </div>
            </div>

            {displayRisks.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                    <p className="body-text text-muted">No active risks detected</p>
                </div>
            ) : (
                <div className="risk-list">
                    {displayRisks.map((risk, index) => {
                    const config = getSeverityConfig(risk.severity);
                    const Icon = config.icon;

                    return (
                        <div key={index} className="risk-card">
                            {/* Severity Indicator */}
                            <div className="risk-severity-bar" style={{ background: config.color }} />

                            <div className="risk-content">
                                {/* Header with Severity Badge */}
                                <div className="risk-header">
                                    <div className="risk-severity-badge" style={{ background: `${config.color}15` }}>
                                        <Icon size={14} color={config.color} />
                                        <span style={{ color: config.color }}>{config.label}</span>
                                    </div>
                                    <div className="risk-category">{risk.category}</div>
                                </div>

                                {/* Title */}
                                <h4 className="risk-title">{risk.title}</h4>

                                {/* Description */}
                                <p className="risk-description">{risk.description}</p>

                                {/* Mitigation */}
                                <div className="risk-mitigation">
                                    <div className="mitigation-label">
                                        <Shield size={14} color="#1F6F54" />
                                        <span>Recommended Action</span>
                                    </div>
                                    <p className="mitigation-text">{risk.mitigation}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
                </div>
            )}

            {/* Summary Footer */}
            <div className="risk-summary-footer">
                <div className="summary-stat">
                    <span className="summary-label">Critical</span>
                    <span className="summary-value" style={{ color: '#B91C1C' }}>
                        {displayRisks.filter(r => r.severity === 'critical').length}
                    </span>
                </div>
                <div className="summary-stat">
                    <span className="summary-label">High</span>
                    <span className="summary-value" style={{ color: '#D97706' }}>
                        {displayRisks.filter(r => r.severity === 'high').length}
                    </span>
                </div>
                <div className="summary-stat">
                    <span className="summary-label">Medium</span>
                    <span className="summary-value" style={{ color: '#D4AF37' }}>
                        {displayRisks.filter(r => r.severity === 'medium').length}
                    </span>
                </div>
                <div className="summary-stat">
                    <span className="summary-label">Low</span>
                    <span className="summary-value" style={{ color: '#1F6F54' }}>
                        {displayRisks.filter(r => r.severity === 'low').length}
                    </span>
                </div>
            </div>
        </div>
    );
};
