import React from 'react';
import { TrendingUp, TrendingDown, Sparkles, ArrowUp, Heart, Users } from 'lucide-react';
import './GivingMomentumStory.css';

export const GivingMomentumStory = ({ 
    momentum = 0, 
    trend = 'rising',
    monthOverMonth = 0,
    story = null
}) => {
    const displayStory = story;
    const TrendIcon = trend === 'rising' ? TrendingUp : TrendingDown;
    const trendColor = trend === 'rising' ? '#1F6F54' : '#B91C1C';
    const trendText = trend === 'rising' ? 'Rising' : 'Declining';

    if (!displayStory) {
        return (
            <div className="giving-momentum-story glass-panel">
                <div className="empty-state" style={{ padding: '48px', textAlign: 'center' }}>
                    <p className="body-text text-muted">Giving momentum data not available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="giving-momentum-story glass-panel">
            {/* Header with Momentum Score */}
            <div className="momentum-header">
                <div className="momentum-badge" style={{ background: `${trendColor}15` }}>
                    <Sparkles size={16} color={trendColor} />
                    <span style={{ color: trendColor }}>Momentum Score: {momentum}</span>
                </div>
                <div className="momentum-trend">
                    <TrendIcon size={20} color={trendColor} />
                    <span style={{ color: trendColor, fontWeight: 700 }}>{trendText}</span>
                </div>
            </div>

            {/* Story Headline */}
            <h3 className="momentum-headline">{displayStory.headline}</h3>

            {/* Narrative Text */}
            <p className="momentum-narrative">{displayStory.narrative}</p>

            {/* Key Highlights */}
            <div className="momentum-highlights">
                {displayStory.highlights.map((highlight, index) => {
                    const Icon = highlight.icon;
                    return (
                        <div key={index} className="momentum-highlight-card">
                            <div className="highlight-icon">
                                <Icon size={18} color="var(--wine)" />
                            </div>
                            <div className="highlight-content">
                                <div className="highlight-label">{highlight.label}</div>
                                <div className="highlight-value">
                                    {highlight.value}
                                    <span className="highlight-trend" style={{ 
                                        color: highlight.trend.startsWith('+') ? '#1F6F54' : '#B91C1C' 
                                    }}>
                                        {highlight.trend}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Month-over-Month Growth Indicator */}
            <div className="momentum-growth-bar">
                <div className="growth-bar-header">
                    <span className="body-text" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Month-over-Month Growth
                    </span>
                    <span style={{ 
                        fontSize: '16px', 
                        fontWeight: 800, 
                        color: monthOverMonth > 0 ? '#1F6F54' : '#B91C1C' 
                    }}>
                        {monthOverMonth > 0 ? '+' : ''}{monthOverMonth}%
                    </span>
                </div>
                <div className="growth-bar-track">
                    <div 
                        className="growth-bar-fill"
                        style={{ 
                            width: `${Math.min(Math.abs(monthOverMonth) * 3, 100)}%`,
                            background: monthOverMonth > 0 ? '#1F6F54' : '#B91C1C'
                        }}
                    />
                </div>
            </div>
        </div>
    );
};
