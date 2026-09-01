import React from 'react';
import { Target, DollarSign, Calendar, TrendingUp, AlertCircle } from 'lucide-react';
import './MinistryOpportunityHighlights.css';

export const MinistryOpportunityHighlights = ({ opportunities = [] }) => {
    const displayOpportunities = opportunities;

    const getPriorityColor = (priority) => {
        if (priority === 'urgent') return '#B91C1C';
        if (priority === 'high') return '#D4AF37';
        return '#2B4C7E';
    };

    const getPriorityLabel = (priority) => {
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    };

    return (
        <div className="ministry-opportunities-container">
            <div className="opportunities-header">
                <h3 className="section-title text-wine">Ministry Opportunity Highlights</h3>
                <p className="body-text text-muted" style={{ marginTop: '4px' }}>
                    Active initiatives with funding status and impact projections
                </p>
            </div>

            {displayOpportunities.length === 0 ? (
                <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                    <p className="body-text text-muted">No ministry opportunities currently available</p>
                </div>
            ) : (
                <div className="opportunities-grid">
                    {displayOpportunities.map((opportunity, index) => {
                    const fundingPercent = (opportunity.fundingCurrent / opportunity.fundingGoal) * 100;
                    const priorityColor = getPriorityColor(opportunity.priority);

                    return (
                        <div key={index} className="opportunity-card glass-panel">
                            {/* Priority Badge */}
                            <div className="opportunity-priority" style={{ background: `${priorityColor}15` }}>
                                <AlertCircle size={14} color={priorityColor} />
                                <span style={{ color: priorityColor }}>
                                    {getPriorityLabel(opportunity.priority)} Priority
                                </span>
                            </div>

                            {/* Title & Description */}
                            <h4 className="opportunity-title">{opportunity.title}</h4>
                            <p className="opportunity-description">{opportunity.description}</p>

                            {/* Impact Metric */}
                            <div className="opportunity-impact">
                                <Target size={16} color="#1F6F54" />
                                <span>{opportunity.impact}</span>
                            </div>

                            {/* Funding Progress */}
                            <div className="funding-section">
                                <div className="funding-header">
                                    <div className="funding-label">
                                        <DollarSign size={14} />
                                        <span>Funding Progress</span>
                                    </div>
                                    <span className="funding-percent">{Math.round(fundingPercent)}%</span>
                                </div>
                                
                                <div className="funding-bar">
                                    <div 
                                        className="funding-bar-fill"
                                        style={{ 
                                            width: `${fundingPercent}%`,
                                            background: fundingPercent >= 90 ? '#1F6F54' : '#4A0E1A'
                                        }}
                                    />
                                </div>

                                <div className="funding-amounts">
                                    <span className="funding-current">
                                        ${opportunity.fundingCurrent.toLocaleString()}
                                    </span>
                                    <span className="funding-goal">
                                        of ${opportunity.fundingGoal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Deadline */}
                            <div className="opportunity-deadline">
                                <Calendar size={14} color="var(--text-muted)" />
                                <span>Target: {opportunity.deadline}</span>
                            </div>
                        </div>
                    );
                })}
                </div>
            )}
        </div>
    );
};
